/**
 * Типы для экспертного дашборда
 */

export interface Defect {
  id: string;
  defect_type: string;
  severity: 'critical' | 'warning' | 'info';
  confidence: number;
  measured_value_mm: number | null;
  threshold_mm: number | null;
  regulation_refs: string[];
  bbox: { x: number; y: number; w: number; h: number } | null;
  ai_verdict: string | null;
  expert_verdict: string | null;
  expert_adjusted_value_mm: number | null;
  expert_notes: string | null;
  user_disputed: boolean;
}

export interface Project {
  id: string;
  title: string | null;
  room_type: string;
  surface_type: string;
  status: string;
  created_at: string;
  calibration_valid: boolean;
  photos: Photo[];
  defects: Defect[];
}

export interface Photo {
  id: string;
  original_url: string;
  angle: string;
  quality_passed: boolean;
}

export interface QueueItem {
  id: string;
  project_id: string;
  priority: number;
  sla_deadline: string;
  status: string;
  assigned_at: string | null;
}

export interface AuthState {
  token: string | null;
  user: { id: string; name: string; user_type: string } | null;
  isAuthenticated: boolean;
  isTestMode: boolean;
  setToken: (token: string, user: any) => void;
  logout: () => void;
  enableTestMode: () => void;
}
