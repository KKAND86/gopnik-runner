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
  sendOtp: (phone: string) =>
    api.post('/auth/otp/send', { phone }),
  login: (phone: string, code: string) =>
    api.post('/auth/otp/verify', { phone, code }),
  me: () => api.get('/auth/me'),
};

// Projects
export const projectsApi = {
  list: () => api.get('/projects'),
  create: (data: any) => api.post('/projects', data),
  get: (id: string) => api.get(`/projects/${id}`),
  calibrate: (id: string, data: any) => api.patch(`/projects/${id}/calibration`, data),
  uploadPhoto: (id: string, angle: string, file: File) => {
    const form = new FormData();
    form.append('angle', angle);
    form.append('file', file);
    return api.post(`/projects/${id}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAudio: (id: string, sampleType: string, file: File, gridX?: number, gridY?: number) => {
    const form = new FormData();
    form.append('sample_type', sampleType);
    form.append('file', file);
    if (gridX !== undefined) form.append('grid_x', String(gridX));
    if (gridY !== undefined) form.append('grid_y', String(gridY));
    return api.post(`/projects/${id}/audio`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Analysis
export const analysisApi = {
  start: (projectId: string) => api.post('/analysis/start', { project_id: projectId }),
  status: (projectId: string) => api.get(`/analysis/${projectId}`),
};

// Reports
export const reportsApi = {
  export: (projectId: string, format: 'pdf' | 'json' = 'pdf') =>
    api.post('/reports/export', { project_id: projectId, format }),
  dispute: (projectId: string, defectId: string, reason: string) =>
    api.post(`/reports/${projectId}/dispute`, { defect_id: defectId, reason }),
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

export default api;