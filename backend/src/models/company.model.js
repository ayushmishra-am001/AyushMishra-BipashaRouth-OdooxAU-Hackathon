const pool = require('../config/db');

async function findById(companyId) {
  const result = await pool.query('SELECT id, name, logo_url FROM companies WHERE id = $1', [companyId]);
  return result.rows[0] || null;
}

module.exports = { findById };
