import { apiClient } from './client';

// Matches backend/src/controllers/company.controller.js exactly.
function getCurrent() {
  return apiClient.get('/company/current');
}

export const companyApi = { getCurrent };
