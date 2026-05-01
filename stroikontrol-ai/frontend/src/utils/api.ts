/**
 * API клиент для экспертного дашборда
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  login: (phone: string, code: string) =>
    api.post('/auth/otp/verify', { phone, code }),
};

// Queue
export const queueApi = {
  getQueue: () => api.get('/experts/queue'),
  assign: (id: string) => api.post(`/experts/queue/${id}/assign`),
};

// Defects
export const defectsApi = {
  submitReview: (defectId: string, verdict: string, adjustedValue?: number, notes?: string) =>
    api.post(`/experts/defects/${defectId}/review`, {
      verdict,
      adjusted_value_mm: adjustedValue,
      notes,
    }),
};

// Projects
export const projectsApi = {
  get: (id: string) => api.get(`/projects/${id}`),
};
