import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsApi, reportsApi } from '../utils/api';

interface Defect {
  id: string;
  defect_type: string;
  severity: 'critical' | 'warning' | 'info';
  confidence: number;
  measured_value_mm: number | null;
  threshold_mm: number | null;
  regulation_refs: string[];
  expert_verdict: string | null;
  expert_adjusted_value_mm: number | null;
  expert_notes: string | null;
  user_disputed: boolean;
}

interface Project {
  id: string;
  title: string | null;
  room_type: string;
  surface_type: string;
  status: string;
  created_at: string;
  report_pdf_url: string | null;
  defects: Defect[];
  calibration_valid: boolean;
}

export default function ReportPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputing, setDisputing] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await projectsApi.get(projectId);
      setProject(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async (defectId: string) => {
    if (!projectId || !disputeReason.trim()) return;
    try {
      await reportsApi.dispute(projectId, defectId, disputeReason);
      setDisputing(null);
      setDisputeReason('');
      loadProject();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#10b981',
      human_review: '#f59e0b',
      analyzing: '#3b82f6',
      capturing: '#8b5cf6',
      draft: '#6b7280',
    };
    const labels: Record<string, string> = {
      completed: '✅ Завершён',
      human_review: '👁️ На проверке',
      analyzing: '🔬 Анализ',
      capturing: '📷 Съёмка',
      draft: '📝 Черновик',
    };
    return (
      <span
        style={{
          background: colors[status] || '#6b7280',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { borderLeft: '4px solid #dc2626', background: '#fef2f2' };
      case 'warning':
        return { borderLeft: '4px solid #f59e0b', background: '#fffbeb' };
      default:
        return { borderLeft: '4px solid #3b82f6', background: '#eff6ff' };
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/projects')}>← Проекты</button>
        <h1 style={styles.headerTitle}>📄 Отчёт по проекту</h1>
      </header>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loading}>Загрузка...</div>
        ) : !project ? (
          <div style={styles.empty}>Проект не найден</div>
        ) : (
          <>
            {/* Project Info */}
            <div style={styles.infoCard}>
              <div style={styles.infoHeader}>
                <div>
                  <h2 style={{ margin: '0 0 8px' }}>{project.title || 'Без названия'}</h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    🏠 {project.room_type} • 🎯 {project.surface_type}
                  </p>
                </div>
                {getStatusBadge(project.status)}
              </div>
              <p style={{ margin: '12px 0 0', color: '#999', fontSize: '13px' }}>
                📅 Создан: {new Date(project.created_at).toLocaleString('ru-RU')}
              </p>
              {project.calibration_valid && (
                <p style={{ margin: '4px 0 0', color: '#10b981', fontSize: '13px' }}>
                  ✅ Калибровка пройдена
                </p>
              )}
            </div>

            {/* PDF Download */}
            {project.report_pdf_url && (
              <div style={styles.pdfCard}>
                <h3 style={{ margin: '0 0 12px' }}>📥 PDF Отчёт</h3>
                <a
                  href={project.report_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.pdfLink}
                >
                  Скачать отчёт
                </a>
              </div>
            )}

            {/* Defects Summary */}
            <div style={styles.summaryCard}>
              <h3 style={{ margin: '0 0 16px' }}>📊 Сводка по дефектам</h3>
              <div style={styles.summaryGrid}>
                <div style={styles.summaryItem}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626' }}>
                    {project.defects?.filter((d) => d.severity === 'critical').length || 0}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>🔴 Критичных</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>
                    {project.defects?.filter((d) => d.severity === 'warning').length || 0}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>🟡 Предупреждений</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>
                    {project.defects?.filter((d) => d.severity === 'info').length || 0}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>🔵 Информация</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#6b7280' }}>
                    {project.defects?.length || 0}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>📋 Всего</div>
                </div>
              </div>
            </div>

            {/* Defects List */}
            <h3 style={{ margin: '24px 0 16px', fontSize: '18px' }}>🎯 Детали дефектов</h3>
            {(!project.defects || project.defects.length === 0) ? (
              <div style={styles.emptyDefects}>
                <div style={{ fontSize: '48px' }}>🎉</div>
                <p>Дефекты не обнаружены!</p>
              </div>
            ) : (
              <div style={styles.defectsList}>
                {project.defects.map((d) => (
                  <div key={d.id} style={{ ...styles.defectCard, ...getSeverityStyle(d.severity) }}>
                    <div style={styles.defectHeader}>
                      <div>
                        <strong>
                          {d.severity === 'critical' ? '🔴' : d.severity === 'warning' ? '🟡' : '🔵'} {d.defect_type}
                        </strong>
                        <span style={{ marginLeft: '12px', fontSize: '13px', color: '#666' }}>
                          Уверенность: {(d.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      {d.user_disputed && <span style={styles.disputeBadge}>⚠️ Оспорен</span>}
                    </div>

                    {d.measured_value_mm !== null && (
                      <p style={{ margin: '8px 0', fontSize: '14px' }}>
                        📏 Измерено: <strong>{d.measured_value_mm}мм</strong>
                        {d.threshold_mm && ` (норма: ≤${d.threshold_mm}мм)`}
                      </p>
                    )}

                    {d.regulation_refs.length > 0 && (
                      <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                        📋 Нормативы: {d.regulation_refs.join(', ')}
                      </p>
                    )}

                    {d.expert_verdict && (
                      <div style={styles.expertReview}>
                        <strong>👨‍🔬 Эксперт:</strong> {d.expert_verdict}
                        {d.expert_adjusted_value_mm !== null && (
                          <span> → {d.expert_adjusted_value_mm}мм</span>
                        )}
                        {d.expert_notes && <p style={{ margin: '4px 0 0', fontStyle: 'italic' }}>💬 {d.expert_notes}</p>}
                      </div>
                    )}

                    {!d.user_disputed && (
                      <>
                        {disputing === d.id ? (
                          <div style={styles.disputeForm}>
                            <textarea
                              style={styles.disputeInput}
                              placeholder="Опишите причину оспаривания..."
                              value={disputeReason}
                              onChange={(e) => setDisputeReason(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <button style={styles.disputeSubmit} onClick={() => handleDispute(d.id)}>
                                Отправить
                              </button>
                              <button
                                style={styles.disputeCancel}
                                onClick={() => { setDisputing(null); setDisputeReason(''); }}
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            style={styles.disputeBtn}
                            onClick={() => setDisputing(d.id)}
                          >
                            ⚠️ Оспорить дефект
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f5f5f5' },
  header: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '20px 40px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  headerTitle: { fontSize: '24px', fontWeight: 700 },
  content: { padding: '40px', maxWidth: '900px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '60px' },
  empty: { textAlign: 'center', padding: '80px' },
  infoCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  infoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pdfCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  pdfLink: {
    display: 'inline-block',
    padding: '12px 24px',
    background: '#2563eb',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 600,
  },
  summaryCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  summaryItem: {
    textAlign: 'center',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '12px',
  },
  emptyDefects: {
    textAlign: 'center',
    padding: '40px',
    background: '#ecfdf5',
    borderRadius: '12px',
  },
  defectsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  defectCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  defectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  expertReview: {
    marginTop: '12px',
    padding: '12px',
    background: '#f0fdf4',
    borderRadius: '8px',
    fontSize: '14px',
  },
  disputeBadge: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  disputeBtn: {
    marginTop: '12px',
    padding: '8px 16px',
    background: '#fff',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  disputeForm: { marginTop: '12px' },
  disputeInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  disputeSubmit: {
    padding: '8px 16px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  disputeCancel: {
    padding: '8px 16px',
    background: '#f5f5f5',
    color: '#666',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};
