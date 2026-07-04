const pool = require('../config/db');

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// How many employees this company already has who joined in the given year -
// used to pick the next serial number for the employee code.
//
// IMPORTANT: this must be called with a `client` that is inside a transaction
// which has already taken a row lock on the company (see lockCompanyForSerial
// below). Two concurrent employee-creation requests both reading COUNT(*) from
// the plain pool (no lock) can see the same count and generate the same
// employee_code, which then fails on the DB unique constraint - this is
// exactly what was happening before this fix. Requiring a client (not
// defaulting to pool) makes it impossible to call this without a lock.
async function getNextSerialForYear(client, companyId, year) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM employee_profiles ep
     JOIN users u ON u.id = ep.user_id
     WHERE u.company_id = $1 AND EXTRACT(YEAR FROM ep.date_of_joining) = $2`,
    [companyId, year]
  );
  return result.rows[0].count + 1;
}

// Takes a row lock on the company so that only one concurrent request can be
// computing/using a serial number for it at a time. Must be called after
// BEGIN and before getNextSerialForYear, inside the same transaction/client.
// Other transactions calling this for the same companyId will block here
// until the first transaction commits or rolls back, then proceed safely.
async function lockCompanyForSerial(client, companyId) {
  await client.query('SELECT id FROM companies WHERE id = $1 FOR UPDATE', [companyId]);
}

// Runs inside a transaction the caller controls (client passed in).
// Self-signup admin accounts start unverified (email_verified = FALSE) with
// a code the signup controller generates - see auth.controller.js#signup.
async function createCompanyWithAdmin(client, { companyName, name, email, passwordHash, employeeCode, dateOfJoining, logoUrl, verificationCode }) {
  const companyResult = await client.query(
    'INSERT INTO companies (name, logo_url) VALUES ($1, $2) RETURNING id',
    [companyName, logoUrl || null]
  );
  const companyId = companyResult.rows[0].id;

  const userResult = await client.query(
    `INSERT INTO users (company_id, employee_code, name, email, password_hash, role, must_change_password, email_verified, email_verification_code)
     VALUES ($1, $2, $3, $4, $5, 'admin', FALSE, FALSE, $6)
     RETURNING id, company_id, employee_code, name, email, role`,
    [companyId, employeeCode, name, email, passwordHash, verificationCode]
  );
  const user = userResult.rows[0];

  await client.query(
    `INSERT INTO employee_profiles (user_id, date_of_joining, designation, department)
     VALUES ($1, $2, 'Administrator', 'Management')`,
    [user.id, dateOfJoining]
  );

  return user;
}

// Employees are provisioned internally by an already-verified Admin/HR
// officer, so they skip the email-verification step entirely (there is no
// self-registration path for them - see wireframe note in docs).
async function createEmployee(client, { companyId, name, email, passwordHash, employeeCode, role, designation, department, dateOfJoining }) {
  const userResult = await client.query(
    `INSERT INTO users (company_id, employee_code, name, email, password_hash, role, must_change_password, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE)
     RETURNING id, company_id, employee_code, name, email, role`,
    [companyId, employeeCode, name, email, passwordHash, role]
  );
  const user = userResult.rows[0];

  await client.query(
    `INSERT INTO employee_profiles (user_id, date_of_joining, designation, department)
     VALUES ($1, $2, $3, $4)`,
    [user.id, dateOfJoining, designation || null, department || null]
  );

  return user;
}

async function updatePasswordHash(userId, passwordHash) {
  await pool.query(
    'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
    [passwordHash, userId]
  );
}

async function verifyEmailByCode(email, code) {
  const result = await pool.query(
    `UPDATE users SET email_verified = TRUE, email_verification_code = NULL
     WHERE email = $1 AND email_verification_code = $2 AND email_verified = FALSE
     RETURNING id, company_id, employee_code, name, email, role, must_change_password`,
    [email, code]
  );
  return result.rows[0] || null;
}

module.exports = {
  findByEmail,
  findById,
  getNextSerialForYear,
  lockCompanyForSerial,
  createCompanyWithAdmin,
  createEmployee,
  updatePasswordHash,
  verifyEmailByCode,
};
