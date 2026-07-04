const pool = require('../config/db');
const employeeModel = require('../models/employee.model');
const salaryModel = require('../models/salary.model');

const DEFAULT_PF_RATE = 12.0;
const DEFAULT_PROFESSIONAL_TAX = 200.0;
const ROUNDING_TOLERANCE = 0.01;

function mapStructure(structure, components) {
  const pfRate = Number(structure.pf_rate);

  // PF is contributed by both sides at the same rate, applied to Basic when
  // a "Basic" component exists (the wireframe's worked example), falling
  // back to the full wage otherwise - matches the "Employee: X / Employer: X"
  // two-line PF breakdown in the Salary Info wireframe.
  const basicComponent = components.find((c) => c.name.trim().toLowerCase() === 'basic');
  const pfBase = basicComponent ? Number(basicComponent.computed_amount) : Number(structure.wage_amount);
  const employeePfAmount = Math.round((pfBase * pfRate) / 100);
  const employerPfAmount = employeePfAmount;

  return {
    wageType: structure.wage_type,
    wageAmount: Number(structure.wage_amount),
    workingDaysPerWeek: structure.working_days_per_week,
    pfRate,
    employeePfAmount,
    employerPfAmount,
    professionalTax: Number(structure.professional_tax),
    components: components.map((c) => ({
      id: c.id,
      name: c.name,
      calcType: c.calc_type,
      value: Number(c.value),
      computedAmount: Number(c.computed_amount),
    })),
  };
}

async function getSalary(req, res) {
  const userId = parseInt(req.params.id, 10);

  const employee = await employeeModel.findProfileById(userId, req.user.companyId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const structure = await salaryModel.getStructureByUserId(userId, req.user.companyId);
  if (!structure) {
    return res.status(404).json({ error: 'No salary structure set up for this employee yet' });
  }

  const components = await salaryModel.getComponents(structure.id);
  res.json(mapStructure(structure, components));
}

async function updateSalary(req, res) {
  const userId = parseInt(req.params.id, 10);
  const { wageType, wageAmount, workingDaysPerWeek, components } = req.body;

  const employee = await employeeModel.findProfileById(userId, req.user.companyId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  if (!['monthly', 'yearly'].includes(wageType)) {
    return res.status(400).json({ error: "wageType must be 'monthly' or 'yearly'" });
  }

  const parsedWage = Number(wageAmount);
  if (!Number.isFinite(parsedWage) || parsedWage <= 0) {
    return res.status(400).json({ error: 'wageAmount must be a positive number' });
  }

  if (!Array.isArray(components)) {
    return res.status(400).json({ error: 'components must be an array' });
  }

  const computedComponents = [];
  let total = 0;

  for (const component of components) {
    if (!component.name || !['fixed', 'percentage'].includes(component.calcType)) {
      return res.status(400).json({ error: 'Each component needs a name and a calcType of fixed or percentage' });
    }

    const value = Number(component.value);
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ error: `Invalid value for component "${component.name}"` });
    }

    const computedAmount = component.calcType === 'percentage' ? parsedWage * (value / 100) : value;
    total += computedAmount;
    computedComponents.push({ name: component.name, calcType: component.calcType, value, computedAmount });
  }

  if (total > parsedWage + ROUNDING_TOLERANCE) {
    return res.status(400).json({ error: 'Sum of salary components cannot exceed the defined wage' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const structureId = await salaryModel.upsertStructure(client, userId, {
      wageType,
      wageAmount: parsedWage,
      workingDaysPerWeek: workingDaysPerWeek || 5,
      pfRate: DEFAULT_PF_RATE,
      professionalTax: DEFAULT_PROFESSIONAL_TAX,
    });

    await salaryModel.replaceComponents(client, structureId, computedComponents);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const structure = await salaryModel.getStructureByUserId(userId, req.user.companyId);
  const savedComponents = await salaryModel.getComponents(structure.id);
  res.json(mapStructure(structure, savedComponents));
}

module.exports = { getSalary, updateSalary };
