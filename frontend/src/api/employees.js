import { apiClient } from './client';

// Matches backend/src/controllers/employees.controller.js and
// salary.controller.js exactly.

function list() {
  return apiClient.get('/employees');
}

function getById(id) {
  return apiClient.get(`/employees/${id}`);
}

function update(id, fields) {
  return apiClient.put(`/employees/${id}`, fields);
}

function getSalary(id) {
  return apiClient.get(`/employees/${id}/salary`);
}

function updateSalary(id, payload) {
  return apiClient.put(`/employees/${id}/salary`, payload);
}

// Admin/HR only - creates an employee account (see users.controller.js).
function createEmployee(payload) {
  return apiClient.post('/users', payload);
}

export const employeesApi = { list, getById, update, getSalary, updateSalary, createEmployee };
