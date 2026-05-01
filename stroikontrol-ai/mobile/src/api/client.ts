/**
 * Axios API client with interceptors + test-mode mocks
 */

import axios from 'axios';
import { useAuthStore } from '@store/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.212:8001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ─── Test-mode in-memory data ───
let testProjects = [
  {
    id: 'demo-1',
    title: 'Ванная — кафель на стене',
    room_type: 'bathroom',
    surface_type: 'wall',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    report_pdf_url: 'https://example.com/demo-report-1.pdf',
  },
  {
    id: 'demo-2',
    title: 'Кухня — плитка на полу',
    room_type: 'kitchen',
    surface_type: 'floor',
    status: 'capturing',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    report_pdf_url: null,
  },
  {
    id: 'demo-3',
    title: 'Прихожая — стена',
    room_type: 'hallway',
    surface_type: 'wall',
    status: 'analyzing',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    report_pdf_url: null,
  },
];

const isTest = () => useAuthStore.getState().isTestMode;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Auth API
export const authApi = {
  sendOTP: (phone: string) =>
    isTest()
      ? Promise.resolve({ data: { success: true } })
      : apiClient.post('/auth/otp/send', { phone }),
  verifyOTP: (phone: string, code: string) =>
    isTest()
      ? Promise.resolve({ data: { access_token: 'test-token', user: useAuthStore.getState().user } })
      : apiClient.post('/auth/otp/verify', { phone, code }),
};

// Projects API
export const projectsApi = {
  list: () =>
    isTest()
      ? delay(400).then(() => ({ data: { items: testProjects, total: testProjects.length } }))
      : apiClient.get('/projects'),
  create: (data: { title?: string; room_type: string; surface_type: string }) => {
    if (isTest()) {
      const newProject = {
        id: `demo-${Date.now()}`,
        ...data,
        title: data.title || `${data.room_type} — ${data.surface_type}`,
        status: 'draft',
        created_at: new Date().toISOString(),
        report_pdf_url: null,
      };
      testProjects.unshift(newProject);
      return delay(300).then(() => ({ data: newProject }));
    }
    return apiClient.post('/projects', data);
  },
  get: (id: string) =>
    isTest()
      ? delay(200).then(() => {
          const p = testProjects.find((x) => x.id === id);
          return { data: p };
        })
      : apiClient.get(`/projects/${id}`),
  calibrate: (id: string, data: any) =>
    isTest()
      ? delay(500).then(() => {
          const p = testProjects.find((x) => x.id === id);
          if (p) p.status = 'capturing';
          return { data: p };
        })
      : apiClient.patch(`/projects/${id}/calibration`, data),
  uploadPhoto: (id: string, angle: string, file: any) => {
    if (isTest()) return delay(600).then(() => ({ data: { success: true, angle } }));
    const form = new FormData();
    form.append('angle', angle);
    form.append('file', file);
    return apiClient.post(`/projects/${id}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAudio: (id: string, sampleType: string, file: any, gridX?: number, gridY?: number) => {
    if (isTest()) return delay(600).then(() => ({ data: { success: true, sampleType, gridX, gridY } }));
    const form = new FormData();
    form.append('sample_type', sampleType);
    form.append('file', file);
    if (gridX !== undefined) form.append('grid_x', String(gridX));
    if (gridY !== undefined) form.append('grid_y', String(gridY));
    return apiClient.post(`/projects/${id}/audio`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Analysis API
export const analysisApi = {
  start: (projectId: string) =>
    isTest()
      ? delay(1500).then(() => {
          const p = testProjects.find((x) => x.id === projectId);
          if (p) p.status = 'analyzing';
          return { data: { status: 'analyzing', projectId } };
        })
      : apiClient.post('/analysis/start', { project_id: projectId }),
  status: (projectId: string) =>
    isTest()
      ? delay(300).then(() => {
          const p = testProjects.find((x) => x.id === projectId);
          // In test mode, immediately return completed results
          const mockResult = {
            project_id: projectId,
            status: 'human_review', // <-- always return final status in test mode
            scene_type: 'bathroom_wall',
            defects: [
              {
                id: 'defect-1',
                defect_type: 'void',
                severity: 'warning',
                confidence: 0.87,
                measured_value_mm: 2.3,
                threshold_mm: 2.0,
                regulation_refs: ['СНиП 3.04.01-87'],
                bbox: { x: 0.2, y: 0.3, w: 0.15, h: 0.1 },
              },
            ],
            overall_score: 42,
            processing_time_seconds: 3.2,
            human_review_required: true,
            recommendation: 'Обнаружены признаки дефектов. Рекомендуется локальная проверка.',
            combined: {
              defect_probability: 0.35,
              debond_probability: 0.48,
              risk_score: 42,
              prediction: 'warning',
            },
          };
          if (p) p.status = 'human_review';
          return { data: mockResult };
        })
      : apiClient.get(`/analysis/${projectId}`),
};

// Reports API
export const reportsApi = {
  export: (projectId: string, format: 'pdf' | 'json' = 'pdf') =>
    isTest()
      ? delay(1000).then(() => {
          const p = testProjects.find((x) => x.id === projectId);
          if (p) {
            p.status = 'completed';
            p.report_pdf_url = 'https://example.com/final-report.pdf';
          }
          return { data: { url: p?.report_pdf_url, format } };
        })
      : apiClient.post('/reports/export', { project_id: projectId, format }),
  dispute: (projectId: string, defectId: string, reason: string) =>
    isTest()
      ? delay(400).then(() => ({ data: { success: true } }))
      : apiClient.post(`/reports/${projectId}/dispute`, { defect_id: defectId, reason }),
};

// Payments API
export const paymentsApi = {
  create: (tariff: string, projectId?: string) =>
    isTest()
      ? delay(500).then(() => ({ data: { payment_url: 'https://yookassa.ru/demo-checkout', tariff, projectId } }))
      : apiClient.post('/payments/create', { tariff, project_id: projectId }),
};
