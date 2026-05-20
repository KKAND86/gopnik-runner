import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { analysisApi, reportsApi, projectsApi } from '../utils/api';

interface Defect {
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
}

interface AnalysisResult {
  project_id: string;
  status: string;
  scene_type: string;
  defects: Defect[];
  overall_score: number;
  processing_time_seconds: number;
  human_review_required: boolean;
  recommendation: string;
  combined: {
    defect_probability: number;
    debond_probability: number;
    risk_score: number;
    prediction: string;
  };
}

function AnimatedScore({ score, color }: { score: number; color: string }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(score * eased);
      setDisplayScore(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div style={{ ...styles.scoreCircle, borderColor: color }}>
      <div style={{ ...styles.scoreValue, color }}>{displayScore}</div>
      <div style={styles.scoreLabel}>из 100</div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const steps = ['Загрузка', 'AI анализ', 'Проверка', 'Готово'];
  return (
    <div style={styles.progressContainer}>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      <div style={styles.progressSteps}>
        {steps.map((step, i) => (
          <div key={step} style={{
            ...styles.progressStep,
            opacity: progress >= (i + 1) * 25 ? 1 : 0.4,
          }}>
            <div style={{
              ...styles.stepDot,
              background: progress >= (i + 1) * 25 ? '#2563eb' : '#e5e7eb',
              color: progress >= (i + 1) * 25 ? '#fff' : '#6b7280',
            }}>{progress >= (i + 1) * 25 ? '✓' : i + 1}</div>
            <div style={{
              ...styles.stepLabel,
              color: progress >= (i + 1) * 25 ? '#2563eb' : '#6b7280',
              fontWeight: progress >= (i + 1) * 25 ? 600 : 500,
            }}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={styles.skeletonCard}>
      <div style={{ ...styles.skeletonLine, ...styles.skeletonTitle }} />
      <div style={styles.skeletonLine} />
      <div style={{ ...styles.skeletonLine, ...styles.skeletonShort }} />
    </div>
  );
}

export default function AnalysisPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [_project, _setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    loadProject();
    loadAnalysis();
  }, [projectId]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + Math.random() * 8;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [polling]);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      const res = await projectsApi.get(projectId);
      _setProject(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalysis = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await analysisApi.status(projectId);
      setAnalysis(res.data);
      if (res.data.status === 'analyzing') {
        setPolling(true);
        setProgress(25);
        setTimeout(loadAnalysis, 3000);
      } else {
        setPolling(false);
        setProgress(100);
      }
    } catch (e: any) {
      if (e.response?.status === 404) {
        // Analysis not started yet
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#dc2626';
    if (score >= 40) return '#f59e0b';
    return '#10b981';
  };

  const getSeverityLabel = (s: string) => {
    switch (s) {
      case 'critical': return '🔴 Критично';
      case 'warning': return '🟡 Внимание';
      case 'info': return '🔵 Инфо';
      default: return s;
    }
  };

  const generateReport = async () => {
    if (!projectId) return;
    setReporting(true);
    try {
      await reportsApi.export(projectId, 'pdf');
      navigate(`/projects/${projectId}/report`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка создания отчёта');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/projects')}>← Проекты</button>
        <h1 style={styles.headerTitle}>🔬 Результаты анализа</h1>
      </header>

      <div style={styles.content}>
        {loading && polling ? (
          <div style={styles.analyzingState}>
            <div style={styles.pulseIcon}>🔬</div>
            <h2 style={styles.analyzingTitle}>AI анализирует данные...</h2>
            <ProgressBar progress={progress} />
            <p style={styles.analyzingHint}>Анализируем фото и аудио. Это займёт 30-60 секунд.</p>
          </div>
        ) : loading ? (
          <div style={styles.skeletonContainer}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !analysis ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <p>Анализ ещё не запущен</p>
            <button style={styles.actionBtn} onClick={() => navigate(`/projects/${projectId}/upload`)}>
              📤 Загрузить данные и запустить
            </button>
          </div>
        ) : (
          <div style={styles.resultsContainer}>
            {/* Score Card */}
            <div style={styles.scoreCard}>
              <AnimatedScore score={analysis.overall_score} color={getScoreColor(analysis.overall_score)} />
              <div style={styles.scoreInfo}>
                <h2 style={styles.scoreTitle}>
                  {analysis.overall_score >= 70 ? '⚠️ Обнаружены дефекты'
                    : analysis.overall_score >= 40 ? '⚡ Требует внимания'
                    : '✅ Качество в норме'}
                </h2>
                <p style={styles.scoreRecommendation}>{analysis.recommendation}</p>
                <p style={styles.scoreMeta}>⏱️ Время обработки: {analysis.processing_time_seconds}с</p>
              </div>
            </div>

            {/* Probabilities */}
            <div style={styles.probCard}>
              <h3 style={styles.cardTitle}>📊 Вероятности</h3>
              <ProbabilityBar label="Дефекты плитки" value={analysis.combined.defect_probability} color="#dc2626" />
              <ProbabilityBar label="Отслоения" value={analysis.combined.debond_probability} color="#f59e0b" />
              <ProbabilityBar label="Итоговый риск" value={analysis.combined.risk_score / 100} color={getScoreColor(analysis.combined.risk_score)} />
            </div>

            {/* Defects */}
            <h3 style={styles.sectionTitle}>🎯 Найденные дефекты ({analysis.defects.length})</h3>
            {analysis.defects.length === 0 ? (
              <div style={styles.emptyDefects}>
                <div style={styles.emptyIcon}>🎉</div>
                <p>Дефекты не обнаружены!</p>
              </div>
            ) : (
              <div style={styles.defectsList}>
                {analysis.defects.map((d, index) => (
                  <div key={d.id} style={{
                    ...styles.defectCard,
                    borderLeftColor: d.severity === 'critical' ? '#dc2626' : d.severity === 'warning' ? '#f59e0b' : '#3b82f6',
                  }}>
                    <div style={styles.defectHeader}>
                      <span style={styles.defectSeverity}>{getSeverityLabel(d.severity)}</span>
                      <span style={styles.defectConfidence}>Уверенность: {(d.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p style={styles.defectType}><strong>Тип:</strong> {d.defect_type}</p>
                    {d.measured_value_mm !== null && (
                      <p style={styles.defectMeasure}><strong>Измерено:</strong> {d.measured_value_mm}мм{d.threshold_mm && ` (норма: ≤${d.threshold_mm}мм)`}</p>
                    )}
                    {d.regulation_refs.length > 0 && (
                      <p style={styles.defectRefs}>📋 {d.regulation_refs.join(', ')}</p>
                    )}
                    {d.ai_verdict && (
                      <div style={styles.aiVerdict}><strong>AI вердикт:</strong> {d.ai_verdict}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={styles.actionsRow}>
              <button style={{ ...styles.reportBtn, ...(reporting ? { opacity: 0.7, cursor: 'wait' } : {}) }} onClick={generateReport} disabled={reporting}>
                {reporting ? '⏳ Создание...' : '📄 Сформировать отчёт'}
              </button>
              <button style={styles.secondaryBtn} onClick={() => navigate(`/projects/${projectId}/upload`)}>
                📤 Добавить данные
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProbabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(value * 100), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div style={styles.probBar}>
      <div style={styles.probBarHeader}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div style={styles.probBarTrack}>
        <div style={{ ...styles.probBarFill, width: `${width}%`, backgroundColor: color }} />
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
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  headerTitle: { fontSize: '24px', fontWeight: 700, margin: 0 },
  content: { padding: '40px', maxWidth: '900px', margin: '0 auto' },

  // Analyzing state
  analyzingState: {
    textAlign: 'center',
    padding: '60px 20px',
    animation: 'fadeIn 0.5s ease',
  },
  pulseIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    animation: 'pulse 2s infinite',
  },
  analyzingTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '32px',
  },
  analyzingHint: {
    color: '#6b7280',
    fontSize: '14px',
    marginTop: '24px',
  },

  // Progress bar
  progressContainer: { maxWidth: '500px', margin: '0 auto' },
  progressTrack: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
    borderRadius: '4px',
    transition: 'width 0.8s ease',
  },
  progressSteps: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'opacity 0.3s',
  },
  stepDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    transition: 'all 0.3s',
  },
  stepLabel: {
    fontSize: '12px',
    fontWeight: 500,
    transition: 'color 0.3s',
  },

  // Skeleton
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    animation: 'fadeIn 0.3s ease',
  },
  skeletonCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  skeletonLine: {
    height: '16px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '8px',
    marginBottom: '12px',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonTitle: { height: '24px', width: '60%', marginBottom: '16px' },
  skeletonShort: { width: '40%' },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    animation: 'fadeIn 0.5s ease',
  },
  emptyIcon: { fontSize: '64px', marginBottom: '20px' },
  actionBtn: {
    padding: '14px 28px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '15px',
    marginTop: '20px',
    transition: 'all 0.2s',
  },

  // Results
  resultsContainer: { animation: 'fadeIn 0.5s ease' },
  scoreCard: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
    background: '#fff',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    animation: 'slideUp 0.6s ease',
  },
  scoreCircle: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '5px solid #e2e8f0',
    transition: 'border-color 0.5s',
    flexShrink: 0,
  },
  scoreValue: { fontSize: '44px', fontWeight: 800, lineHeight: 1 },
  scoreLabel: { fontSize: '14px', color: '#9ca3af', marginTop: '4px' },
  scoreInfo: { flex: 1 },
  scoreTitle: { margin: '0 0 12px', fontSize: '24px', fontWeight: 700, color: '#1f2937' },
  scoreRecommendation: { margin: '0 0 12px', color: '#6b7280', fontSize: '15px', lineHeight: 1.5 },
  scoreMeta: { margin: 0, color: '#9ca3af', fontSize: '13px' },

  // Probabilities
  probCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '28px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    animation: 'slideUp 0.6s ease 0.1s both',
  },
  cardTitle: { margin: '0 0 20px', fontSize: '18px', fontWeight: 600, color: '#1f2937' },
  probBar: { marginBottom: '16px' },
  probBarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#4b5563',
  },
  probBarTrack: { height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' },
  probBarFill: { height: '100%', borderRadius: '5px', transition: 'width 1s ease' },

  // Defects
  sectionTitle: { margin: '32px 0 20px', fontSize: '20px', fontWeight: 700, color: '#1f2937' },
  defectsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  defectCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderLeft: '4px solid',
  },
  defectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  defectSeverity: { fontWeight: 700, fontSize: '14px' },
  defectConfidence: { fontSize: '13px', color: '#6b7280' },
  defectType: { fontSize: '15px', margin: '8px 0', color: '#374151' },
  defectMeasure: { fontSize: '14px', margin: '4px 0', color: '#4b5563' },
  defectRefs: { fontSize: '13px', color: '#6b7280', margin: '4px 0' },
  aiVerdict: {
    marginTop: '12px',
    padding: '10px 14px',
    background: '#f0f9ff',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0369a1',
  },
  emptyDefects: {
    textAlign: 'center',
    padding: '50px',
    background: '#ecfdf5',
    borderRadius: '16px',
    animation: 'fadeIn 0.5s ease',
  },

  // Actions
  actionsRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '40px',
    justifyContent: 'center',
    animation: 'fadeIn 0.5s ease 0.3s both',
  },
  reportBtn: {
    padding: '16px 36px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '15px',
    transition: 'all 0.2s',
  },
  secondaryBtn: {
    padding: '16px 28px',
    background: '#fff',
    color: '#374151',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '15px',
    transition: 'all 0.2s',
  },
};

// Add keyframes to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `;
  document.head.appendChild(style);
}
