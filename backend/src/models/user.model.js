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
async function getNextSerialForYear(companyId, year) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM employee_profiles ep
     JOIN users u ON u.id = ep.user_id
     WHERE u.company_id = $1 AND EXTRACT(YEAR FROM ep.date_of_joining) = $2`,
    [companyId, year]
  );
  return result.rows[0].count + 1;
}

// Runs inside a transaction the caller controls (client passed in).
async function createCompanyWithAdmin(client, { companyName, name, email, passwordHash, employeeCode, dateOfJoining }) {
  const companyResult = await client.query('INSERT INTO companies (name) VALUES ($1) RETURNING id', [companyName]);
  const companyId = companyResult.rows[0].id;

  const userResult = await client.query(
    `INSERT INTO users (company_id, employee_code, name, email, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, $4, $5, 'admin', FALSE)
     RETURNING id, company_id, employee_code, name, email, role`,
    [companyId, employeeCode, name, email, passwordHash]
  );
  const user = userResult.rows[0];

  await client.query(
    `INSERT INTO employee_profiles (user_id, date_of_joining, designation, department)
     VALUES ($1, $2, 'Administrator', 'Management')`,
    [user.id, dateOfJoining]
  );

  return user;
}

async function createEmployee(client, { companyId, name, email, passwordHash, employeeCode, role, designation, department, dateOfJoining }) {
  const userResult = await client.query(
    `INSERT INTO users (company_id, employee_code, name, email, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
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

module.exports = {
  findByEmail,
  findById,
  getNextSerialForYear,
  createCompanyWithAdmin,
  createEmployee,
  updatePasswordHash,
};
