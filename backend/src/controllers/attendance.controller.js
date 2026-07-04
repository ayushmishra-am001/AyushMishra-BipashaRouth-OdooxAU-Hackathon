const attendanceModel = require('../models/attendance.model');
const { isValidDateString } = require('../utils/validators');
const { todayString } = require('../utils/dateHelpers');

const STANDARD_WORK_HOURS = 8;
const HALF_DAY_THRESHOLD_HOURS = 4;

function isPrivileged(role) {
  return role === 'admin' || role === 'hr';
}

function mapRecord(row) {
  return {
    date: row.date,
    checkIn: row.check_in,
    checkOut: row.check_out,
    workHours: row.work_hours !== null ? Number(row.work_hours) : null,
    extraHours: row.extra_hours !== null ? Number(row.extra_hours) : null,
    status: row.status,
  };
}

async function checkIn(req, res) {
  const userId = req.user.id;
  const today = todayString();

  const existing = await attendanceModel.findByUserAndDate(userId, today);
  if (existing) {
    if (existing.check_out) {
      return res.status(400).json({ error: 'You have already completed attendance for today' });
    }
    return res.status(400).json({ error: 'You are already checked in' });
  }

  const row = await attendanceModel.createCheckIn(userId, today);
  res.status(201).json(mapRecord(row));
}

async function checkOut(req, res) {
  const userId = req.user.id;
  const today = todayString();

  const existing = await attendanceModel.findByUserAndDate(userId, today);
  if (!existing || !existing.check_in) {
    return res.status(400).json({ error: 'You need to check in before checking out' });
  }
  if (existing.check_out) {
    return res.status(400).json({ error: 'You have already checked out today' });
  }

  const row = await attendanceModel.completeCheckOut(existing.id, STANDARD_WORK_HOURS, HALF_DAY_THRESHOLD_HOURS);
  res.json(mapRecord(row));
}

async function list(req, res) {
  const today = todayString();
  const from = req.query.from || today;
  const to = req.query.to || from;

  if (!isValidDateString(from) || !isValidDateString(to)) {
    return res.status(400).json({ error: 'from/to must be in YYYY-MM-DD format' });
  }

  const targetUserId = req.query.userId ? parseInt(req.query.userId, 10) : req.user.id;

  if (targetUserId !== req.user.id && !isPrivileged(req.user.role)) {
    return res.status(403).json({ error: 'You can only view your own attendance' });
  }

  const rows = await attendanceModel.listForUser(targetUserId, from, to);
  res.json(rows.map(mapRecord));
}

async function companyForDate(req, res) {
  const date = req.query.date || todayString();

  if (!isValidDateString(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  }

  const rows = await attendanceModel.listForCompanyOnDate(req.user.companyId, date);
  res.json(
    rows.map((row) => ({
      userId: row.user_id,
      name: row.name,
      checkIn: row.check_in,
      checkOut: row.check_out,
      workHours: row.work_hours !== null ? Number(row.work_hours) : null,
      extraHours: row.extra_hours !== null ? Number(row.extra_hours) : null,
      status: row.status,
    }))
  );
}

module.exports = { checkIn, checkOut, list, companyForDate };
