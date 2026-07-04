const pool = require('../config/db');

async function getStructureByUserId(userId, companyId) {
  const result = await pool.query(
    `SELECT ss.* FROM salary_structures ss
     JOIN users u ON u.id = ss.user_id
     WHERE ss.user_id = $1 AND u.company_id = $2`,
    [userId, companyId]
  );
  return result.rows[0] || null;
}

async function getComponents(structureId) {
  const result = await pool.query(
    'SELECT id, name, calc_type, value, computed_amount FROM salary_components WHERE salary_structure_id = $1 ORDER BY id',
    [structureId]
  );
  return result.rows;
}

async function upsertStructure(client, userId, { wageType, wageAmount, workingDaysPerWeek, pfRate, professionalTax }) {
  const existing = await client.query('SELECT id FROM salary_structures WHERE user_id = $1', [userId]);

  if (existing.rows.length > 0) {
    const result = await client.query(
      `UPDATE salary_structures
       SET wage_type = $1, wage_amount = $2, working_days_per_week = $3, pf_rate = $4, professional_tax = $5, updated_at = NOW()
       WHERE user_id = $6
       RETURNING id`,
      [wageType, wageAmount, workingDaysPerWeek, pfRate, professionalTax, userId]
    );
    return result.rows[0].id;
  }

  const result = await client.query(
    `INSERT INTO salary_structures (user_id, wage_type, wage_amount, working_days_per_week, pf_rate, professional_tax)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [userId, wageType, wageAmount, workingDaysPerWeek, pfRate, professionalTax]
  );
  return result.rows[0].id;
}

async function replaceComponents(client, structureId, components) {
  await client.query('DELETE FROM salary_components WHERE salary_structure_id = $1', [structureId]);

  for (const component of components) {
    await client.query(
      `INSERT INTO salary_components (salary_structure_id, name, calc_type, value, computed_amount)
       VALUES ($1, $2, $3, $4, $5)`,
      [structureId, component.name, component.calcType, component.value, component.computedAmount]
    );
  }
}

module.exports = { getStructureByUserId, getComponents, upsertStructure, replaceComponents };
