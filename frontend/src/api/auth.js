import { apiClient } from './client';

// Matches backend/src/controllers/auth.controller.js exactly.

function signup({ companyName, name, email, password }) {
  return apiClient.post('/auth/signup', { companyName, name, email, password });
}

function login({ email, password }) {
  return apiClient.post('/auth/login', { email, password });
}

function changePassword({ currentPassword, newPassword }) {
  return apiClient.post('/auth/change-password', { currentPassword, newPassword });
}

export const authApi = { signup, login, changePassword };
