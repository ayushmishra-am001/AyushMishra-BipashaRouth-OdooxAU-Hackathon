const pool = require('../config/db');
const leaveModel = require('../models/leave.model');
const attendanceModel = require('../models/attendance.model');
const { isValidDateString } = require('../utils/validators');
const { daysBetweenInclusive, todayString } = require('../utils/dateHelpers');

function isPrivileged(role) {
  return role === 'admin' || role === 'hr';
}

// Unpaid leave has no balance to track against - matched by name since the
// schema doesn't flag a leave type as "unlimited" any other way.
function isUnpaidType(leaveType) {
  return leaveType.name.toLowerCase().includes('unpaid');
}

function mapRequest(row) {
  return {
    id: row.id,
    leaveTypeId: row.leave_type_id,
    leaveTypeName: row.leave_type_name,
    startDate: row.start_date,
    endDate: row.end_date,
    remarks: row.remarks,
    attachmentUrl: row.attachment_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function listLeaveTypes(req, res) {
  const rows = await leaveModel.listTypesForCompany(req.user.companyId);
  res.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      allocatedDays: row.default_allocation_days,
    }))
  );
}

// Admin/HR "Allocation" tab (wireframe: Time Off | Allocation). Lets them
// change how many days a leave type grants company-wide going forward, and
// optionally back-fills that into every employee's current-year balance -
// see leaveModel.syncCurrentYearAllocations for the "never lowers, never
// overwrites a bigger manual balance" rule that makes that safe to do by
// default instead of behind a separate confirmation step.
async function updateAllocation(req, res) {
  const leaveTypeId = parseInt(req.params.id, 10);
  const { allocatedDays, applyToCurrentYear } = req.body;

  const parsed = Number(allocatedDays);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return res.status(400).json({ error: 'allocatedDays must be a non-negative number' });
  }

  const existing = await leaveModel.findTypeById(leaveTypeId, req.user.companyId);
  if (!existing) {
    return res.status(404).json({ error: 'Leave type not found' });
  }

  const updated = await leaveModel.updateDefaultAllocation(leaveTypeId, req.user.companyId, parsed);

  if (applyToCurrentYear) {
    const currentYear = new Date().getFullYear();
    await leaveModel.syncCurrentYearAllocations(leaveTypeId, req.user.companyId, parsed, currentYear);
  }

  res.json({ id: updated.id, name: updated.name, allocatedDays: updated.default_allocation_days });
}

async function listBalances(req, res) {
  const targetUserId = req.query.userId ? parseInt(req.query.userId, 10) : req.user.id;

  if (targetUserId !== req.user.id && !isPrivileged(req.user.role)) {
    return res.status(403).json({ error: 'You can only view your own leave balances' });
  }

  const year = new Date().getFullYear();
  const rows = await leaveModel.listBalancesForUser(targetUserId, req.user.companyId, year);

  res.json(
    rows.map((row) => ({
      leaveTypeId: row.leave_type_id,
      name: row.name,
      allocatedDays: Number(row.allocated_days),
      usedDays: Number(row.used_days),
      remainingDays: Number(row.allocated_days) - Number(row.used_days),
    }))
  );
}

async function createLeaveRequest(req, res) {
  const { leaveTypeId, startDate, endDate, remarks, attachmentUrl } = req.body;

  if (!leaveTypeId || !startDate || !endDate) {
    return res.status(400).json({ error: 'leaveTypeId, startDate and endDate are required' });
  }
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return res.status(400).json({ error: 'startDate/endDate must be in YYYY-MM-DD format' });
  }
  if (startDate > endDate) {
    return res.status(400).json({ error: 'startDate must not be after endDate' });
  }
  if (startDate < todayString()) {
    return res.status(400).json({ error: 'startDate cannot be in the past' });
  }

  const leaveType = await leaveModel.findTypeById(leaveTypeId, req.user.companyId);
  if (!leaveType) {
    return res.status(404).json({ error: 'Leave type not found' });
  }

  const overlapping = await leaveModel.hasOverlappingRequest(req.user.id, startDate, endDate);
  if (overlapping) {
    return res.status(409).json({ error: 'You already have a pending or approved request that overlaps these dates' });
  }

  const requestedDays = daysBetweenInclusive(startDate, endDate);
  const year = new Date(`${startDate}T00:00:00Z`).getFullYear();

  if (!isUnpaidType(leaveType)) {
    await leaveModel.ensureBalancesForYear(req.user.id, req.user.companyId, year);
    const balance = await leaveModel.getBalance(req.user.id, leaveTypeId, year);
    const remaining = Number(balance.allocated_days) - Number(balance.used_days);

    if (requestedDays > remaining) {
      return res.status(400).json({
        error: `Insufficient leave balance. ${remaining} day(s) remaining for ${leaveType.name}.`,
      });
    }
  }

  const created = await leaveModel.createRequest({
    userId: req.user.id,
    leaveTypeId,
    startDate,
    endDate,
    remarks,
    attachmentUrl,
  });

  res.status(201).json({ id: created.id, status: created.status });
}

// Contract documents this as self-only (the company-wide equivalent is the
// separate /leave-requests/company endpoint), so it always reflects the
// caller's own history regardless of any userId query param.
async function listMyRequests(req, res) {
  const rows = await leaveModel.listForUser(req.user.id);
  res.json(rows.map(mapRequest));
}

async function listCompanyRequests(req, res) {
  const { status } = req.query;
  const allowedStatuses = ['pending', 'approved', 'rejected'];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowedStatuses.join(', ')}` });
  }

  const rows = await leaveModel.listForCompany(req.user.companyId, status);
  res.json(
    rows.map((row) => ({
      ...mapRequest(row),
      userId: row.user_id,
      userName: row.user_name,
    }))
  );
}

async function approve(req, res) {
  await reviewRequest(req, res, 'approved');
}

async function reject(req, res) {
  await reviewRequest(req, res, 'rejected');
}

async function reviewRequest(req, res, newStatus) {
  const id = parseInt(req.params.id, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const request = await leaveModel.findRequestByIdForUpdate(client, id);

    if (!request || request.company_id !== req.user.companyId) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found' });
    }
    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `This request has already been ${request.status}` });
    }

    if (newStatus === 'approved' && !isUnpaidType({ name: request.leave_type_name })) {
      const year = new Date(`${request.start_date}T00:00:00Z`).getFullYear();
      const days = daysBetweenInclusive(request.start_date, request.end_date);

      // Re-check balance now, under lock, in case it changed since the request was filed.
      const balance = await leaveModel.getBalanceForUpdate(client, request.user_id, request.leave_type_id, year);
      const remaining = balance ? Number(balance.allocated_days) - Number(balance.used_days) : 0;

      if (days > remaining) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Cannot approve: only ${remaining} day(s) remaining for ${request.leave_type_name}.`,
        });
      }

      await leaveModel.incrementUsedDays(client, request.user_id, request.leave_type_id, year, days);
    }

    const updated = await leaveModel.setStatus(client, id, newStatus, req.user.id);

    // Cross-module link, missing until now: the employee directory (Step 6)
    // and attendance list (Step 7) both read attendance.status = 'leave' to
    // show on_leave, but nothing wrote it. Approving is the one place that
    // should. Rejections intentionally leave attendance untouched.
    if (newStatus === 'approved') {
      await attendanceModel.markLeaveDates(client, request.user_id, request.start_date, request.end_date);
    }

    await client.query('COMMIT');
    res.json({ id: updated.id, status: updated.status });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listLeaveTypes,
  updateAllocation,
  listBalances,
  createLeaveRequest,
  listMyRequests,
  listCompanyRequests,
  approve,
  reject,
};
