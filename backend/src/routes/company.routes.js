const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth.middleware');
const companyController = require('../controllers/company.controller');

router.get('/current', authenticate, asyncHandler(companyController.getCurrentCompany));

module.exports = router;
