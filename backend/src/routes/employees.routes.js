const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const employeesController = require('../controllers/employees.controller');
const salaryController = require('../controllers/salary.controller');

router.use(authenticate);

// Directory is visible company-wide (every role sees the card grid, per the
// wireframe) - it only exposes name/code/designation/department/avatar/status,
// nothing sensitive. Salary stays admin/hr-only below.
router.get('/', asyncHandler(employeesController.list));
router.get('/:id', asyncHandler(employeesController.getById));
router.put('/:id', asyncHandler(employeesController.update));
router.get('/:id/salary', requireRole('admin', 'hr'), asyncHandler(salaryController.getSalary));
router.put('/:id/salary', requireRole('admin', 'hr'), asyncHandler(salaryController.updateSalary));

module.exports = router;
