import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsApi, analysisApi } from '../utils/api';

const PHOTO_ANGLES = [
  { value: 'front', label: '📷 Фасад' },
  { value: 'left', label: '⬅️ Лево' },
  { value: 'right', label: '➡️ Право' },
  { value: 'top', label: '⬆️ Верх' },
  { value: 'bottom', label: '⬇️ Низ' },
];

export default function UploadPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'photos' | 'audio'>('photos');
  const [selectedAngle, setSelectedAngle] = useState('front');
  const [uploadedPhotos, setUploadedPhotos] = useState<{ angle: string; name: string }[]>([]);
  const [uploadedAudio, setUploadedAudio] = useState<{ type: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    setLoading(true);
    try {
      if (activeTab === 'photos') {
        await projectsApi.uploadPhoto(projectId, selectedAngle, file);
        setUploadedPhotos((prev) => [...prev, { angle: selectedAngle, name: file.name }]);
      } else {
        await projectsApi.uploadAudio(projectId, 'random', file);
        setUploadedAudio((prev) => [...prev, { type: 'random', name: file.name }]);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка загрузки');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startAnalysis = async () => {
    if (!projectId) return;
    setAnalyzing(true);
    try {
      await analysisApi.start(projectId);
      navigate(`/projects/${projectId}/analysis`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка запуска анализа');
      setAnalyzing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !fileInputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInputRef.current.files = dt.files;
    fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/projects')}>← Проекты</button>
        <h1 style={styles.headerTitle}>📤 Загрузка данных</h1>
      </header>

      <div style={styles.content}>
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'photos' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('photos')}
          >
            📷 Фото ({uploadedPhotos.length})
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'audio' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('audio')}
          >
            🎤 Аудио ({uploadedAudio.length})
          </button>
        </div>

        {activeTab === 'photos' && (
          <>
            <div style={styles.angles}>
              {PHOTO_ANGLES.map((a) => (
                <button
                  key={a.value}
                  style={{
                    ...styles.angleBtn,
                    ...(selectedAngle === a.value ? styles.angleBtnActive : {}),
                  }}
                  onClick={() => setSelectedAngle(a.value)}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <div
              style={styles.dropZone}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <div style={styles.dropZoneContent}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📤</div>
                <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                  {loading ? 'Загрузка...' : 'Нажмите или перетащите фото'}
                </p>
                <p style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
                  Угол: {PHOTO_ANGLES.find((a) => a.value === selectedAngle)?.label}
                </p>
              </div>
            </div>

            {uploadedPhotos.length > 0 && (
              <div style={styles.fileList}>
                <h4>✅ Загружено:</h4>
                {uploadedPhotos.map((p, i) => (
                  <div key={i} style={styles.fileItem}>
                    📷 {p.name} — {PHOTO_ANGLES.find((a) => a.value === p.angle)?.label}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'audio' && (
          <>
            <div
              style={styles.dropZone}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <div style={styles.dropZoneContent}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎤</div>
                <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                  {loading ? 'Загрузка...' : 'Нажмите или перетащите аудио'}
                </p>
              </div>
            </div>

            {uploadedAudio.length > 0 && (
              <div style={styles.fileList}>
                <h4>✅ Загружено:</h4>
                {uploadedAudio.map((a, i) => (
                  <div key={i} style={styles.fileItem}>🎤 {a.name}</div>
                ))}
              </div>
            )}
          </>
        )}

        <button
          style={{
            ...styles.analyzeBtn,
            ...(analyzing ? { opacity: 0.6 } : {}),
          }}
          onClick={startAnalysis}
          disabled={analyzing || (uploadedPhotos.length === 0 && uploadedAudio.length === 0)}
        >
          {analyzing ? '🔬 Запуск анализа...' : '🔬 Запустить AI анализ'}
        </button>
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
  content: { padding: '40px', maxWidth: '800px', margin: '0 auto' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
  tab: {
    padding: '12px 24px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
  },
  tabActive: {
    borderColor: '#2563eb',
    background: '#eff6ff',
    color: '#2563eb',
  },
  angles: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  angleBtn: {
    padding: '8px 14px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
  },
  angleBtnActive: {
    borderColor: '#2563eb',
    background: '#eff6ff',
    color: '#2563eb',
  },
  dropZone: {
    border: '3px dashed #d1d5db',
    borderRadius: '16px',
    padding: '60px 40px',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#fafafa',
    transition: 'all 0.2s',
  },
  dropZoneContent: { pointerEvents: 'none' as any },
  fileList: {
    marginTop: '24px',
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
  },
  fileItem: {
    padding: '8px 0',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #f0f0f0',
  },
  analyzeBtn: {
    width: '100%',
    padding: '16px',
    marginTop: '24px',
    fontSize: '16px',
    fontWeight: 700,
    background: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
};
