import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { analysisApi, projectsApi } from '@api/client';

interface DefectItem {
  id: string;
  defect_type: string;
  severity: 'critical' | 'warning' | 'info';
  confidence: number;
  measured_value_mm?: number;
  threshold_mm?: number;
  regulation_refs: string[];
  bbox?: { x: number; y: number; w: number; h: number };
}

interface AnalysisData {
  project_id: string;
  status: string;
  scene_type?: string;
  defects: DefectItem[];
  overall_score?: number;
  processing_time_seconds: number;
  human_review_required: boolean;
  recommendation?: string;
  combined?: {
    defect_probability: number;
    debond_probability: number;
    risk_score: number;
    prediction: 'pass' | 'warning' | 'fail';
  };
}

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', bg: '#FEF2F2', label: 'Брак' },
  warning: { color: '#F59E0B', bg: '#FFFBEB', label: 'Проверить' },
  info: { color: '#6B7280', bg: '#F3F4F6', label: 'Обратить внимание' },
};

const DEFECT_NAMES: Record<string, string> = {
  uneven_joint: 'Неровный шов',
  step_height: 'Ступенчатость',
  missing_joint: 'Пропущенный шов',
  chip: 'Скол',
  crack: 'Трещина',
  void: 'Пустота / отслоение',
  ai_detected: 'Обнаружен дефект (AI)',
};

export function AnalysisScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { projectId } = route?.params || {};

  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    startAnalysis();
  }, [projectId]);

  const startAnalysis = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: trigger analysis
      await analysisApi.start(projectId);

      // Step 2: poll for results
      pollStatus();
    } catch (e: any) {
      setError(e.message || 'Ошибка запуска анализа');
      setLoading(false);
    }
  };

  const pollStatus = async () => {
    setPolling(true);
    const maxAttempts = 30;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await analysisApi.status(projectId);
        const result = res.data as AnalysisData;

        if (result.status === 'completed' || result.status === 'human_review') {
          clearInterval(interval);
          setData(result);
          setLoading(false);
          setPolling(false);
          animateProgress(result.overall_score || 0);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError('Анализ занимает слишком долго. Попробуйте позже.');
          setLoading(false);
          setPolling(false);
        }
      } catch (e: any) {
        clearInterval(interval);
        setError(e.message || 'Ошибка получения статуса');
        setLoading(false);
        setPolling(false);
      }
    }, 2000);
  };

  const animateProgress = (score: number) => {
    Animated.timing(progressAnim, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return '#9CA3AF';
    if (score < 30) return '#10B981'; // green
    if (score < 70) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const getVerdictText = (prediction?: string) => {
    switch (prediction) {
      case 'pass': return 'Анализируем: качество в норме';
      case 'warning': return 'Анализируем: требуется проверка';
      case 'fail': return 'Анализируем: обнаружены дефекты';
      default: return '⏳ Анализируем...';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          {polling ? 'Анализируем фото и звук...' : 'Запускаем анализ...'}
        </Text>
        {polling && (
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '60%' }]} />
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={startAnalysis}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const score = data?.combined?.risk_score ?? data?.overall_score ?? 0;
  const prediction = data?.combined?.prediction;
  const defects = data?.defects || [];
  const hasDefects = defects.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Score Card */}
      <View style={[styles.scoreCard, { borderColor: getScoreColor(score) }]}>
        <Text style={styles.scoreLabel}>Рейтинг качества</Text>
        <View style={styles.scoreCircle}>
          <Animated.Text
            style={[
              styles.scoreValue,
              { color: getScoreColor(score) },
            ]}
          >
            {score.toFixed(0)}
          </Animated.Text>
          <Text style={styles.scoreMax}>/ 100</Text>
        </View>
        <Text style={[styles.verdict, { color: getScoreColor(score) }]}>
          {getVerdictText(prediction)}
        </Text>
        {data?.human_review_required && (
          <View style={styles.reviewBadge}>
            <Text style={styles.reviewBadgeText}>На экспертной проверке</Text>
          </View>
        )}
      </View>

      {/* Recommendation */}
      {data?.recommendation && (
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationText}>{data.recommendation}</Text>
        </View>
      )}

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>
            {((data?.combined?.defect_probability || 0) * 100).toFixed(0)}%
          </Text>
          <Text style={styles.metricLabel}>Визуальные дефекты</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>
            {((data?.combined?.debond_probability || 0) * 100).toFixed(0)}%
          </Text>
          <Text style={styles.metricLabel}>Отслоение плитки</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{data?.processing_time_seconds || 0}s</Text>
          <Text style={styles.metricLabel}>Время анализа</Text>
        </View>
      </View>

      {/* Defects List */}
      <Text style={styles.sectionTitle}>
        {hasDefects ? `Обнаружено дефектов: ${defects.length}` : 'Дефекты не обнаружены'}
      </Text>

      {hasDefects ? (
        defects.map((defect) => {
          const sev = SEVERITY_CONFIG[defect.severity] || SEVERITY_CONFIG.info;
          return (
            <View key={defect.id} style={[styles.defectCard, { backgroundColor: sev.bg }]}>
              <View style={styles.defectHeader}>
                <View style={[styles.severityDot, { backgroundColor: sev.color }]} />
                <Text style={[styles.defectType, { color: sev.color }]}>
                  {DEFECT_NAMES[defect.defect_type] || defect.defect_type}
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: sev.color }]}>
                  <Text style={styles.severityBadgeText}>{sev.label}</Text>
                </View>
              </View>

              <View style={styles.defectDetails}>
                <Text style={styles.detailText}>
                  Уверенность: {(defect.confidence * 100).toFixed(0)}%
                </Text>
                {defect.measured_value_mm !== undefined && (
                  <Text style={styles.detailText}>
                    Измерение: {defect.measured_value_mm} мм
                    {defect.threshold_mm ? ` (норма ≤ ${defect.threshold_mm} мм)` : ''}
                  </Text>
                )}
                {defect.regulation_refs?.length > 0 && (
                  <Text style={styles.regText}>
                    Нормативы: {defect.regulation_refs.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyDefects}>
          <Text style={styles.emptyDefectsText}>🎉 Отличный результат!</Text>
          <Text style={styles.emptyDefectsSub}>
            AI не обнаружил дефектов на фото и звуковых записях.
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2563EB' }]}
          onPress={() => navigation.navigate('Report', { projectId })}
        >
          <Text style={styles.actionButtonText}>📄 Отчёт</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F3F4F6' }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={[styles.actionButtonText, { color: '#374151' }]}>🏠 На главную</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  progressBarBg: {
    width: 200,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 20,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  verdict: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewBadge: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewBadgeText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '500',
  },
  recommendationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  recommendationText: {
    fontSize: 15,
    color: '#1E40AF',
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },
  defectCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  defectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  defectType: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  defectDetails: {
    marginLeft: 18,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
  },
  regText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyDefects: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyDefectsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  emptyDefectsSub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
