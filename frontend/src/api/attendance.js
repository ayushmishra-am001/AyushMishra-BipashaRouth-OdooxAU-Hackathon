import { apiClient } from './client';

// Matches backend/src/controllers/attendance.controller.js exactly.

function checkIn() {
  return apiClient.post('/attendance/check-in');
}

function checkOut() {
  return apiClient.post('/attendance/check-out');
}

// userId omitted -> defaults to the logged-in user server-side.
// from/to omitted -> defaults to today server-side.
function list({ userId, from, to } = {}) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiClient.get(`/attendance${qs ? `?${qs}` : ''}`);
}

// admin/hr only - every employee's record for one day.
function companyForDate(date) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  return apiClient.get(`/attendance/company?${params.toString()}`);
}

export const attendanceApi = { checkIn, checkOut, list, companyForDate };
