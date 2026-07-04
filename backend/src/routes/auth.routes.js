const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

router.post('/signup', asyncHandler(authController.signup));
router.post('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/login', asyncHandler(authController.login));
router.post('/change-password', authenticate, asyncHandler(authController.changePassword));

module.exports = router;
