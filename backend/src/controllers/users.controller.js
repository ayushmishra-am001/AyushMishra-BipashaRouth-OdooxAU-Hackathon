const bcrypt = require('bcrypt');
const pool = require('../config/db');
const userModel = require('../models/user.model');
const { generateEmployeeCode } = require('../utils/employeeCode');
const { generateTempPassword } = require('../utils/generatePassword');
const { isValidEmail, isValidDateString } = require('../utils/validators');

const ASSIGNABLE_ROLES = ['hr', 'employee'];

async function createEmployee(req, res) {
  const { name, email, role, designation, department, dateOfJoining } = req.body;

  if (!name || !email || !role || !dateOfJoining) {
    return res.status(400).json({ error: 'name, email, role and dateOfJoining are required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (!isValidDateString(dateOfJoining)) {
    return res.status(400).json({ error: 'dateOfJoining must be a valid date in YYYY-MM-DD format' });
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ASSIGNABLE_ROLES.join(', ')}` });
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the company row first so concurrent createEmployee calls for the
    // same company serialize here instead of both computing the same
    // "next serial" and colliding on the employee_code unique constraint.
    await userModel.lockCompanyForSerial(client, req.user.companyId);

    const companyResult = await client.query('SELECT name FROM companies WHERE id = $1', [req.user.companyId]);
    const companyName = companyResult.rows[0] ? companyResult.rows[0].name : null;
    if (!companyName) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Company not found' });
    }

    const joinYear = new Date(dateOfJoining).getFullYear();
    const serial = await userModel.getNextSerialForYear(client, req.user.companyId, joinYear);

    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;
    const employeeCode = generateEmployeeCode({ companyName, firstName, lastName, joinYear, serial });

    const user = await userModel.createEmployee(client, {
      companyId: req.user.companyId,
      name,
      email,
      passwordHash,
      employeeCode,
      role,
      designation,
      department,
      dateOfJoining,
    });

    await client.query('COMMIT');

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeCode: user.employee_code,
        role: user.role,
      },
      tempPassword,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createEmployee };
