import { apiClient } from './client';

// Matches backend/src/controllers/leave.controller.js exactly.

function listTypes() {
  return apiClient.get('/leave-types');
}

// userId omitted -> defaults to the logged-in user server-side.
function listBalances(userId) {
  const qs = userId ? `?userId=${userId}` : '';
  return apiClient.get(`/leave-balances${qs}`);
}

function createRequest(payload) {
  return apiClient.post('/leave-requests', payload);
}

// Always the caller's own requests - there's no userId param on this one,
// the company-wide equivalent below is a separate endpoint.
function listMyRequests() {
  return apiClient.get('/leave-requests');
}

// admin/hr only.
function listCompanyRequests(status) {
  const qs = status ? `?status=${status}` : '';
  return apiClient.get(`/leave-requests/company${qs}`);
}

function approve(id) {
  return apiClient.put(`/leave-requests/${id}/approve`);
}

function reject(id) {
  return apiClient.put(`/leave-requests/${id}/reject`);
}

export const leaveApi = { listTypes, listBalances, createRequest, listMyRequests, listCompanyRequests, approve, reject };
