const pool = require('../config/db');

async function findByUserAndDate(userId, date) {
  const result = await pool.query(
    `SELECT id, check_in, check_out, work_hours, extra_hours, status
     FROM attendance WHERE user_id = $1 AND date = $2`,
    [userId, date]
  );
  return result.rows[0] || null;
}

async function createCheckIn(userId, date) {
  const result = await pool.query(
    `INSERT INTO attendance (user_id, date, check_in, status)
     VALUES ($1, $2, LOCALTIME, 'present')
     RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') AS date,
               TO_CHAR(check_in, 'HH24:MI') AS check_in, check_out,
               work_hours, extra_hours, status`,
    [userId, date]
  );
  return result.rows[0];
}

async function completeCheckOut(attendanceId, standardWorkHours, halfDayThresholdHours) {
  const result = await pool.query(
    `UPDATE attendance
     SET check_out = LOCALTIME,
         work_hours = ROUND((EXTRACT(EPOCH FROM (LOCALTIME - check_in)) / 3600.0)::numeric, 2),
         extra_hours = GREATEST(
           ROUND((EXTRACT(EPOCH FROM (LOCALTIME - check_in)) / 3600.0)::numeric, 2) - $2,
           0
         ),
         status = CASE
           WHEN EXTRACT(EPOCH FROM (LOCALTIME - check_in)) / 3600.0 < $3 THEN 'half_day'
           ELSE 'present'
         END
     WHERE id = $1
     RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') AS date,
               TO_CHAR(check_in, 'HH24:MI') AS check_in,
               TO_CHAR(check_out, 'HH24:MI') AS check_out,
               work_hours, extra_hours, status`,
    [attendanceId, standardWorkHours, halfDayThresholdHours]
  );
  return result.rows[0];
}

async function listForUser(userId, from, to) {
  const result = await pool.query(
    `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date,
            TO_CHAR(check_in, 'HH24:MI') AS check_in,
            TO_CHAR(check_out, 'HH24:MI') AS check_out,
            work_hours, extra_hours, status
     FROM attendance
     WHERE user_id = $1 AND date BETWEEN $2 AND $3
     ORDER BY date ASC`,
    [userId, from, to]
  );
  return result.rows;
}

async function listForCompanyOnDate(companyId, date) {
  const result = await pool.query(
    `SELECT u.id AS user_id, u.name,
            TO_CHAR(a.check_in, 'HH24:MI') AS check_in,
            TO_CHAR(a.check_out, 'HH24:MI') AS check_out,
            a.work_hours, a.extra_hours,
            COALESCE(a.status, 'absent') AS status
     FROM users u
     LEFT JOIN attendance a ON a.user_id = u.id AND a.date = $2
     WHERE u.company_id = $1 AND u.role = 'employee' AND u.status = 'active'
     ORDER BY u.name ASC`,
    [companyId, date]
  );
  return result.rows;
}

module.exports = {
  findByUserAndDate,
  createCheckIn,
  completeCheckOut,
  listForUser,
  listForCompanyOnDate,
};
