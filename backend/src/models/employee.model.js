const pool = require('../config/db');

async function listByCompany(companyId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.employee_code, ep.designation, ep.department, ep.avatar_url,
            COALESCE(a.status, 'absent') AS attendance_status
     FROM users u
     JOIN employee_profiles ep ON ep.user_id = u.id
     LEFT JOIN attendance a ON a.user_id = u.id AND a.date = CURRENT_DATE
     WHERE u.company_id = $1 AND u.status = 'active'
     ORDER BY u.name`,
    [companyId]
  );
  return result.rows;
}

async function findProfileById(userId, companyId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.employee_code, u.role,
            ep.dob, ep.gender, ep.marital_status, ep.phone, ep.personal_email, ep.blood_group,
            ep.pan_id, ep.aadhaar_number, ep.permanent_address, ep.residing_address, ep.avatar_url,
            ep.designation, ep.department, ep.manager_id, ep.date_of_joining, ep.about, ep.interests
     FROM users u
     JOIN employee_profiles ep ON ep.user_id = u.id
     WHERE u.id = $1 AND u.company_id = $2`,
    [userId, companyId]
  );
  return result.rows[0] || null;
}

async function updateName(userId, name) {
  await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
}

async function updateProfileFields(userId, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;

  const setClauses = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  const values = keys.map((key) => fields[key]);

  await pool.query(`UPDATE employee_profiles SET ${setClauses} WHERE user_id = $1`, [userId, ...values]);
}

module.exports = { listByCompany, findProfileById, updateName, updateProfileFields };
