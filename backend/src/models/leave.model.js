const pool = require('../config/db');

async function listTypesForCompany(companyId) {
  const result = await pool.query(
    `SELECT id, name, default_allocation_days
     FROM leave_types WHERE company_id = $1 ORDER BY id ASC`,
    [companyId]
  );
  return result.rows;
}

// Same defaults seed.js uses for the demo company. Signup doesn't get this for
// free from the schema, so it has to be called explicitly - see auth.controller.js.
const DEFAULT_LEAVE_TYPES = [
  { name: 'Paid Time Off', defaultAllocationDays: 24 },
  { name: 'Sick Leave', defaultAllocationDays: 7 },
  { name: 'Unpaid Leave', defaultAllocationDays: 0 },
];

async function createDefaultTypesForCompany(client, companyId) {
  for (const type of DEFAULT_LEAVE_TYPES) {
    await client.query(
      'INSERT INTO leave_types (company_id, name, default_allocation_days) VALUES ($1, $2, $3)',
      [companyId, type.name, type.defaultAllocationDays]
    );
  }
}

async function findTypeById(leaveTypeId, companyId) {
  const result = await pool.query(
    `SELECT id, name, default_allocation_days
     FROM leave_types WHERE id = $1 AND company_id = $2`,
    [leaveTypeId, companyId]
  );
  return result.rows[0] || null;
}

// Balances are allocated per user/leave_type/year. Nobody creates these rows when
// an employee is hired, so we lazily create them here (allocated_days = the
// leave type's default) the first time a given user/year is looked up. Safe to
// call repeatedly - ON CONFLICT DO NOTHING makes it idempotent.
async function ensureBalancesForYear(userId, companyId, year) {
  await pool.query(
    `INSERT INTO leave_balances (user_id, leave_type_id, year, allocated_days, used_days)
     SELECT $1, lt.id, $3, lt.default_allocation_days, 0
     FROM leave_types lt
     WHERE lt.company_id = $2
     ON CONFLICT (user_id, leave_type_id, year) DO NOTHING`,
    [userId, companyId, year]
  );
}

async function listBalancesForUser(userId, companyId, year) {
  await ensureBalancesForYear(userId, companyId, year);

  const result = await pool.query(
    `SELECT lb.leave_type_id, lt.name, lb.allocated_days, lb.used_days
     FROM leave_balances lb
     JOIN leave_types lt ON lt.id = lb.leave_type_id
     WHERE lb.user_id = $1 AND lb.year = $2
     ORDER BY lt.id ASC`,
    [userId, year]
  );
  return result.rows;
}

async function getBalance(userId, leaveTypeId, year) {
  const result = await pool.query(
    `SELECT allocated_days, used_days
     FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3`,
    [userId, leaveTypeId, year]
  );
  return result.rows[0] || null;
}

// Locks the balance row for the duration of the approval transaction so two
// concurrent approvals can't both pass the "enough balance left" check.
async function getBalanceForUpdate(client, userId, leaveTypeId, year) {
  const result = await client.query(
    `SELECT allocated_days, used_days
     FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3
     FOR UPDATE`,
    [userId, leaveTypeId, year]
  );
  return result.rows[0] || null;
}

async function incrementUsedDays(client, userId, leaveTypeId, year, days) {
  await client.query(
    `UPDATE leave_balances SET used_days = used_days + $4
     WHERE user_id = $1 AND leave_type_id = $2 AND year = $3`,
    [userId, leaveTypeId, year, days]
  );
}

async function createRequest({ userId, leaveTypeId, startDate, endDate, remarks, attachmentUrl }) {
  const result = await pool.query(
    `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, remarks, attachment_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, status`,
    [userId, leaveTypeId, startDate, endDate, remarks || null, attachmentUrl || null]
  );
  return result.rows[0];
}

// Joins to users so callers can check company ownership before acting on a request.
async function findRequestById(id) {
  const result = await pool.query(
    `SELECT lr.id, lr.user_id, lr.leave_type_id, lr.status,
            TO_CHAR(lr.start_date, 'YYYY-MM-DD') AS start_date,
            TO_CHAR(lr.end_date, 'YYYY-MM-DD') AS end_date,
            lt.name AS leave_type_name,
            u.company_id
     FROM leave_requests lr
     JOIN leave_types lt ON lt.id = lr.leave_type_id
     JOIN users u ON u.id = lr.user_id
     WHERE lr.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function findRequestByIdForUpdate(client, id) {
  const result = await client.query(
    `SELECT lr.id, lr.user_id, lr.leave_type_id, lr.status,
            TO_CHAR(lr.start_date, 'YYYY-MM-DD') AS start_date,
            TO_CHAR(lr.end_date, 'YYYY-MM-DD') AS end_date,
            lt.name AS leave_type_name,
            u.company_id
     FROM leave_requests lr
     JOIN leave_types lt ON lt.id = lr.leave_type_id
     JOIN users u ON u.id = lr.user_id
     WHERE lr.id = $1
     FOR UPDATE OF lr`,
    [id]
  );
  return result.rows[0] || null;
}

async function listForUser(userId) {
  const result = await pool.query(
    `SELECT lr.id, lr.leave_type_id, lt.name AS leave_type_name,
            TO_CHAR(lr.start_date, 'YYYY-MM-DD') AS start_date,
            TO_CHAR(lr.end_date, 'YYYY-MM-DD') AS end_date,
            lr.remarks, lr.attachment_url, lr.status, lr.created_at
     FROM leave_requests lr
     JOIN leave_types lt ON lt.id = lr.leave_type_id
     WHERE lr.user_id = $1
     ORDER BY lr.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function listForCompany(companyId, status) {
  const params = [companyId];
  let statusClause = '';
  if (status) {
    params.push(status);
    statusClause = `AND lr.status = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT lr.id, lr.user_id, u.name AS user_name, lr.leave_type_id, lt.name AS leave_type_name,
            TO_CHAR(lr.start_date, 'YYYY-MM-DD') AS start_date,
            TO_CHAR(lr.end_date, 'YYYY-MM-DD') AS end_date,
            lr.remarks, lr.attachment_url, lr.status, lr.created_at
     FROM leave_requests lr
     JOIN leave_types lt ON lt.id = lr.leave_type_id
     JOIN users u ON u.id = lr.user_id
     WHERE u.company_id = $1 ${statusClause}
     ORDER BY lr.created_at DESC`,
    params
  );
  return result.rows;
}

async function setStatus(client, id, status, reviewedBy) {
  const result = await client.query(
    `UPDATE leave_requests
     SET status = $2, reviewed_by = $3, reviewed_at = NOW()
     WHERE id = $1
     RETURNING id, status`,
    [id, status, reviewedBy]
  );
  return result.rows[0];
}

module.exports = {
  listTypesForCompany,
  createDefaultTypesForCompany,
  findTypeById,
  ensureBalancesForYear,
  listBalancesForUser,
  getBalance,
  getBalanceForUpdate,
  incrementUsedDays,
  createRequest,
  findRequestById,
  findRequestByIdForUpdate,
  listForUser,
  listForCompany,
  setStatus,
};
