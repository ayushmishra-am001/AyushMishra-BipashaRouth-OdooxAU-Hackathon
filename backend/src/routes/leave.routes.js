const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const leaveController = require('../controllers/leave.controller');

// NOTE: this router is mounted at app root ('/') in app.js because the contract
// uses mixed top-level paths (/leave-types, /leave-balances, /leave-requests)
// instead of one shared prefix. That means we can't put a blanket
// `router.use(authenticate)` at the top like the other route files do - it
// would run for every request in the app, not just these routes. So
// `authenticate` is listed explicitly on each route below instead.

router.get('/leave-types', authenticate, asyncHandler(leaveController.listLeaveTypes));
router.get('/leave-balances', authenticate, asyncHandler(leaveController.listBalances));

router.post('/leave-requests', authenticate, asyncHandler(leaveController.createLeaveRequest));
router.get(
  '/leave-requests/company',
  authenticate,
  requireRole('admin', 'hr'),
  asyncHandler(leaveController.listCompanyRequests)
);
router.get('/leave-requests', authenticate, asyncHandler(leaveController.listMyRequests));
router.put(
  '/leave-requests/:id/approve',
  authenticate,
  requireRole('admin', 'hr'),
  asyncHandler(leaveController.approve)
);
router.put(
  '/leave-requests/:id/reject',
  authenticate,
  requireRole('admin', 'hr'),
  asyncHandler(leaveController.reject)
);

module.exports = router;
