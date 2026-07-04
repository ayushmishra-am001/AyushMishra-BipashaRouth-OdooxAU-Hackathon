const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateEmployeeCode } = require('../utils/employeeCode');
const { generateTempPassword } = require('../utils/generatePassword');

const COMPANY_NAME = 'Demo Company';
const ADMIN_FIRST_NAME = 'System';
const ADMIN_LAST_NAME = 'Admin';
const ADMIN_EMAIL = 'admin@demo.com';

const DEFAULT_LEAVE_TYPES = [
  { name: 'Paid Time Off', default_allocation_days: 24 },
  { name: 'Sick Leave', default_allocation_days: 7 },
  { name: 'Unpaid Leave', default_allocation_days: 0 },
];

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingCompany = await client.query(
      'SELECT id FROM companies WHERE name = $1',
      [COMPANY_NAME]
    );

    if (existingCompany.rows.length > 0) {
      console.log('Seed skipped - demo data already exists.');
      await client.query('ROLLBACK');
      return;
    }

    const companyResult = await client.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING id',
      [COMPANY_NAME]
    );
    const companyId = companyResult.rows[0].id;

    const joinYear = new Date().getFullYear();
    const employeeCode = generateEmployeeCode({
      companyName: COMPANY_NAME,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      joinYear,
      serial: 1,
    });

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const userResult = await client.query(
      `INSERT INTO users (company_id, employee_code, name, email, password_hash, role, must_change_password, email_verified)
       VALUES ($1, $2, $3, $4, $5, 'admin', TRUE, TRUE)
       RETURNING id`,
      [companyId, employeeCode, `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`, ADMIN_EMAIL, passwordHash]
    );
    const adminUserId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO employee_profiles (user_id, date_of_joining, designation, department)
       VALUES ($1, CURRENT_DATE, 'Administrator', 'Management')`,
      [adminUserId]
    );

    for (const leaveType of DEFAULT_LEAVE_TYPES) {
      await client.query(
        'INSERT INTO leave_types (company_id, name, default_allocation_days) VALUES ($1, $2, $3)',
        [companyId, leaveType.name, leaveType.default_allocation_days]
      );
    }

    await client.query('COMMIT');

    console.log('Seed complete.');
    console.log('---------------------------------');
    console.log(`Company:  ${COMPANY_NAME}`);
    console.log(`Login:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${tempPassword}`);
    console.log(`Employee code: ${employeeCode}`);
    console.log('---------------------------------');
    console.log('This account must change its password on first login.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
