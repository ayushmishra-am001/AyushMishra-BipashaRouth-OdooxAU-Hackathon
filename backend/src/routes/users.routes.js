const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const usersController = require('../controllers/users.controller');

router.post('/', authenticate, requireRole('admin', 'hr'), asyncHandler(usersController.createEmployee));

module.exports = router;
