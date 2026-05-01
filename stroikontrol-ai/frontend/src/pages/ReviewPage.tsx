import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi, defectsApi } from '../utils/api';
import type { Project, Defect, Photo } from '../types';

export default function ReviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [verdict, setVerdict] = useState('confirmed');
  const [adjustedValue, setAdjustedValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (projectId) loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await projectsApi.get(projectId!);
      setProject(res.data);
    } catch (e) {
      alert('Не удалось загрузить проект');
      navigate('/queue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDefect) return;
    setSaving(true);
    try {
      await defectsApi.submitReview(
        selectedDefect.id,
        verdict,
        adjustedValue ? parseFloat(adjustedValue) : undefined,
        notes || undefined
      );
      alert('Вердикт сохранён');
      setSelectedDefect(null);
      loadProject();
    } catch (e) {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'critical': return '#dc2626';
      case 'warning': return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  const getSeverityLabel = (s: string) => {
    switch (s) {
      case 'critical': return 'Критический';
      case 'warning': return 'Предупреждение';
      default: return 'Информация';
    }
  };

  if (loading) return <div style={styles.loading}>Загрузка...</div>;
  if (!project) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/queue')}>← Назад</button>
        <h1 style={styles.title}>Проверка проекта</h1>
        <span style={styles.projectInfo}>{project.room_type} — {project.surface_type}</span>
      </header>

      <div style={styles.layout}>
        {/* Photos */}
        <div style={styles.photosPanel}>
          <h2 style={styles.panelTitle}>Фотографии</h2>
          <div style={styles.photosGrid}>
            {project.photos?.map((photo: Photo) => (
              <div key={photo.id} style={styles.photoCard}>
                <div style={styles.photoPlaceholder}>
                  <span style={styles.photoAngle}>{photo.angle}</span>
                </div>
                <p style={styles.photoMeta}>Quality: {photo.quality_passed ? '✅' : '❌'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Defects List */}
        <div style={styles.defectsPanel}>
          <h2 style={styles.panelTitle}>Дефекты ({project.defects?.length || 0})</h2>
          <div style={styles.defectsList}>
            {project.defects?.map((defect: Defect) => (
              <div
                key={defect.id}
                style={{
                  ...styles.defectCard,
                  borderColor: getSeverityColor(defect.severity),
                  background: selectedDefect?.id === defect.id ? '#eff6ff' : '#fff',
                }}
                onClick={() => {
                  setSelectedDefect(defect);
                  setVerdict(defect.expert_verdict || 'confirmed');
                  setAdjustedValue(defect.expert_adjusted_value_mm?.toString() || '');
                  setNotes(defect.expert_notes || '');
                }}
              >
                <div style={styles.defectHeader}>
                  <span style={{ ...styles.severityBadge, background: getSeverityColor(defect.severity) }}>
                    {getSeverityLabel(defect.severity)}
                  </span>
                  <span style={styles.confidence}>AI: {(defect.confidence * 100).toFixed(0)}%</span>
                </div>
                <p style={styles.defectType}>{defect.defect_type}</p>
                {defect.measured_value_mm && (
                  <p style={styles.measurement}>Измерено: {defect.measured_value_mm} мм</p>
                )}
                {defect.expert_verdict && (
                  <p style={styles.expertVerdict}>Эксперт: {defect.expert_verdict}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Review Form */}
        {selectedDefect && (
          <div style={styles.reviewPanel}>
            <h2 style={styles.panelTitle}>Вынести вердикт</h2>
            <div style={styles.form}>
              <label style={styles.label}>Вердикт</label>
              <select style={styles.select} value={verdict} onChange={(e) => setVerdict(e.target.value)}>
                <option value="confirmed">✅ Подтвердить дефект</option>
                <option value="rejected">❌ Отклонить (ложное срабатывание)</option>
                <option value="adjusted">📝 Скорректировать</option>
              </select>

              {verdict === 'adjusted' && (
                <>
                  <label style={styles.label}>Скорректированное значение (мм)</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.1"
                    value={adjustedValue}
                    onChange={(e) => setAdjustedValue(e.target.value)}
                    placeholder="Например: 2.5"
                  />
                </>
              )}

              <label style={styles.label}>Комментарий</label>
              <textarea
                style={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ваш комментарий..."
                rows={4}
              />

              <button style={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить вердикт'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f5f5f5' },
  loading: { textAlign: 'center', padding: '60px', fontSize: '18px' },
  header: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '16px 40px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  title: { fontSize: '20px', fontWeight: 700 },
  projectInfo: { marginLeft: 'auto', color: '#aaa', fontSize: '14px' },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 400px',
    gap: '24px',
    padding: '24px 40px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  panelTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1a1a2e' },
  photosPanel: { background: '#fff', borderRadius: '12px', padding: '24px' },
  photosGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  photoCard: { border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' },
  photoPlaceholder: {
    height: '120px',
    background: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAngle: { color: '#666', fontSize: '12px', textTransform: 'uppercase' },
  photoMeta: { padding: '8px', fontSize: '12px', color: '#666' },
  defectsPanel: { background: '#fff', borderRadius: '12px', padding: '24px' },
  defectsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  defectCard: {
    border: '2px solid',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  defectHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  severityBadge: { color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 },
  confidence: { fontSize: '12px', color: '#666' },
  defectType: { fontSize: '14px', fontWeight: 500, marginBottom: '4px' },
  measurement: { fontSize: '13px', color: '#666' },
  expertVerdict: { fontSize: '12px', color: '#2563eb', marginTop: '4px' },
  reviewPanel: { background: '#fff', borderRadius: '12px', padding: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#374151' },
  select: { padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' },
  textarea: { padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' },
  submitBtn: {
    padding: '12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
};
