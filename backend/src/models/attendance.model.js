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
  // ON CONFLICT handles the case where a row for today already exists with no
  // check_in - e.g. an approved-leave placeholder written by markLeaveDates.
  // Someone who shows up despite being marked on leave should still be able
  // to check in normally instead of getting stuck behind their own leave row.
  const result = await pool.query(
    `INSERT INTO attendance (user_id, date, check_in, status)
     VALUES ($1, $2, LOCALTIME, 'present')
     ON CONFLICT (user_id, date) DO UPDATE
       SET check_in = LOCALTIME, status = 'present'
     RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') AS date,
               TO_CHAR(check_in, 'HH24:MI') AS check_in, check_out,
               work_hours, extra_hours, status`,
    [userId, date]
  );
  return result.rows[0];
}

// Writes/overwrites a 'leave' placeholder row for every date in an approved
// request's range, so the directory's on_leave status dot (Step 6) and the
// attendance list's leave status (Step 7) actually reflect approved leave -
// both were reading attendance.status = 'leave' but nothing ever set it.
// Runs inside the approval transaction (client passed in) so it can't ever
// commit half-done. Skips any date that already has a real check_in, so this
// can never clobber a day the person actually worked.
async function markLeaveDates(client, userId, startDate, endDate) {
  await client.query(
    `INSERT INTO attendance (user_id, date, status)
     SELECT $1, gs::date, 'leave'
     FROM generate_series($2::date, $3::date, INTERVAL '1 day') AS gs
     ON CONFLICT (user_id, date) DO UPDATE
       SET status = 'leave'
       WHERE attendance.check_in IS NULL`,
    [userId, startDate, endDate]
  );
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
  markLeaveDates,
  completeCheckOut,
  listForUser,
  listForCompanyOnDate,
};
