const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const attendanceController = require('../controllers/attendance.controller');

router.use(authenticate);

router.post('/check-in', asyncHandler(attendanceController.checkIn));
router.post('/check-out', asyncHandler(attendanceController.checkOut));
router.get('/company', requireRole('admin', 'hr'), asyncHandler(attendanceController.companyForDate));
router.get('/', asyncHandler(attendanceController.list));

module.exports = router;
