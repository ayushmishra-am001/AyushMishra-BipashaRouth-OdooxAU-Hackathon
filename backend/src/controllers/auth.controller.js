const bcrypt = require('bcrypt');
const pool = require('../config/db');
const userModel = require('../models/user.model');
const leaveModel = require('../models/leave.model');
const { generateEmployeeCode } = require('../utils/employeeCode');
const { generateVerificationCode } = require('../utils/generatePassword');
const { isValidEmail, isValidPassword } = require('../utils/validators');
const { signToken } = require('../utils/token');
const { todayString } = require('../utils/dateHelpers');

const PASSWORD_RULE_MESSAGE = 'Password must be at least 8 characters and include an uppercase letter and a number';

async function signup(req, res) {
  const { companyName, name, email, password, logoUrl } = req.body;

  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ error: 'companyName, name, email and password are all required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const joinYear = new Date().getFullYear();
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || firstName;

    const employeeCode = generateEmployeeCode({ companyName, firstName, lastName, joinYear, serial: 1 });
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const user = await userModel.createCompanyWithAdmin(client, {
      companyName,
      name,
      email,
      passwordHash,
      employeeCode,
      dateOfJoining: todayString(),
      logoUrl: logoUrl || null,
      verificationCode,
    });

    // Every company needs at least the standard leave types to exist before
    // anyone can file a leave request against them.
    await leaveModel.createDefaultTypesForCompany(client, user.company_id);

    await client.query('COMMIT');

    // Requirement 3.1.1: email verification is required before the account
    // can sign in. This stack has no SMTP/third-party mail service (see
    // README - local-only, hackathon build), so the code is returned here
    // and shown directly on the confirmation screen instead of emailed -
    // the same on-screen-instead-of-emailed pattern already used for
    // employee temp passwords in users.controller.js.
    res.status(201).json({
      verificationRequired: true,
      email: user.email,
      devVerificationCode: verificationCode,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function verifyEmail(req, res) {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'email and code are required' });
  }

  const user = await userModel.verifyEmailByCode(email, code);
  if (!user) {
    return res.status(400).json({ error: 'Invalid or already-used verification code' });
  }

  const token = signToken({ id: user.id, companyId: user.company_id, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeCode: user.employee_code,
      mustChangePassword: user.must_change_password,
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await userModel.findByEmail(email);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.email_verified) {
    return res.status(403).json({ error: 'Please verify your email before signing in.', code: 'EMAIL_NOT_VERIFIED' });
  }

  const token = signToken({ id: user.id, companyId: user.company_id, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeCode: user.employee_code,
      mustChangePassword: user.must_change_password,
    },
  });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  }

  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await userModel.updatePasswordHash(user.id, newHash);

  res.json({ success: true });
}

module.exports = { signup, login, verifyEmail, changePassword };
