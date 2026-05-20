import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { analysisApi, reportsApi } from '@api/client';

interface DefectItem {
  id: string;
  defect_type: string;
  severity: 'critical' | 'warning' | 'info';
  confidence: number;
  measured_value_mm?: number;
  threshold_mm?: number;
  regulation_refs: string[];
}

interface ReportData {
  project_id: string;
  status: string;
  overall_score?: number;
  defects: DefectItem[];
  recommendation?: string;
  processing_time_seconds: number;
  human_review_required: boolean;
  combined?: {
    defect_probability: number;
    debond_probability: number;
    risk_score: number;
    prediction: 'pass' | 'warning' | 'fail';
  };
}

const DEFECT_NAMES: Record<string, string> = {
  uneven_joint: 'Неровный шов',
  step_height: 'Ступенчатость',
  missing_joint: 'Пропущенный шов',
  chip: 'Скол',
  crack: 'Трещина',
  void: 'Пустота / отслоение',
};

const SEVERITY_LABELS = {
  critical: 'Брак',
  warning: 'Проверить',
  info: 'Обратить внимание',
};

const SEVERITY_COLORS = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#6B7280',
};

export function ReportScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { projectId } = route?.params || {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [projectId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      // Get analysis results
      const res = await analysisApi.status(projectId);
      setData(res.data as ReportData);

      // Try to get PDF URL
      try {
        const reportRes = await reportsApi.export(projectId, 'pdf');
        setPdfUrl(reportRes.data?.url || null);
      } catch {
        setPdfUrl(null);
      }
    } catch (e: any) {
      console.error('Report load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareText = data
      ? `Отчет СтройКонтроль AI\n\nПроект: ${projectId}\nРиск: ${data.overall_score?.toFixed(0)}/100\nРекомендация: ${data.recommendation || '—'}`
      : `Отчет СтройКонтроль AI\nПроект: ${projectId}`;

    try {
      await Share.share({ message: shareText });
    } catch {
      // ignore
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.export(projectId, 'pdf');
      const reportUrl = res.data?.url;
      setPdfUrl(reportUrl || null);

      if (reportUrl) {
        alert(`📄 PDF готов!\n\nОткройте в браузере:\nhttp://192.168.100.212:8001${reportUrl}`);
      }
    } catch (e: any) {
      alert('Ошибка генерации PDF: ' + (e.message || 'неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Загрузка отчета...</Text>
      </View>
    );
  }

  const score = data?.overall_score || 0;
  const prediction = data?.combined?.prediction;
  const defects = data?.defects || [];

  const scoreColor = score < 30 ? '#10B981' : score < 70 ? '#F59E0B' : '#EF4444';
  const verdictText = prediction === 'pass' ? '✅ Качество в норме' : prediction === 'warning' ? '⚠️ Требуется проверка' : prediction === 'fail' ? '❌ Обнаружены дефекты' : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📄 Отчет</Text>
        <Text style={styles.headerId}>Проект: {projectId.slice(0, 8)}</Text>
      </View>

      {/* Score Summary */}
      <View style={[styles.scoreCard, { borderColor: scoreColor }]}>
        <Text style={styles.scoreLabel}>Общий балл риска</Text>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>{score.toFixed(0)}</Text>
        <Text style={[styles.verdict, { color: scoreColor }]}>{verdictText}</Text>
        {data?.human_review_required && (
          <View style={styles.reviewBadge}>
            <Text style={styles.reviewBadgeText}>На экспертной проверке</Text>
          </View>
        )}
      </View>

      {/* Recommendation */}
      {data?.recommendation && (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationTitle}>Рекомендация</Text>
          <Text style={styles.recommendationText}>{data.recommendation}</Text>
        </View>
      )}

      {/* Metrics */}
      <View style={styles.metricsBox}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{data?.processing_time_seconds || 0}s</Text>
          <Text style={styles.metricLabel}>Время анализа</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{defects.length}</Text>
          <Text style={styles.metricLabel}>Дефектов</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{((data?.combined?.defect_probability || 0) * 100).toFixed(0)}%</Text>
          <Text style={styles.metricLabel}>Визуальные</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{((data?.combined?.debond_probability || 0) * 100).toFixed(0)}%</Text>
          <Text style={styles.metricLabel}>Отслоение</Text>
        </View>
      </View>

      {/* Defects Table */}
      {defects.length > 0 && (
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Обнаруженные дефекты</Text>
          {defects.map((d) => (
            <View key={d.id} style={styles.tableRow}>
              <View style={styles.tableRowHeader}>
                <View
                  style={[
                    styles.severityDot,
                    { backgroundColor: SEVERITY_COLORS[d.severity] },
                  ]}
                />
                <Text style={styles.defectName}>{DEFECT_NAMES[d.defect_type] || d.defect_type}</Text>
                <Text
                  style={[
                    styles.severityLabel,
                    { color: SEVERITY_COLORS[d.severity] },
                  ]}
                >
                  {SEVERITY_LABELS[d.severity]}
                </Text>
              </View>
              <Text style={styles.defectDetails}>
                Уверенность: {(d.confidence * 100).toFixed(0)}%
                {d.measured_value_mm !== undefined ? ` • ${d.measured_value_mm} мм` : ''}
                {d.threshold_mm ? ` (норма ≤ ${d.threshold_mm} мм)` : ''}
              </Text>
              {d.regulation_refs?.length > 0 && (
                <Text style={styles.regText}>Нормативы: {d.regulation_refs.join(', ')}</Text>
              )}
              
              {/* Dispute button */}
              <TouchableOpacity
                style={styles.disputeBtn}
                onPress={() =>
                  navigation.navigate('Dispute', {
                    projectId,
                    defectId: d.id,
                    defectType: DEFECT_NAMES[d.defect_type] || d.defect_type,
                  })
                }
              >
                <Text style={styles.disputeBtnText}>⚠️ Оспорить дефект</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {defects.length === 0 && prediction === 'pass' && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>🎉 Дефекты не обнаружены</Text>
          <Text style={styles.emptySub}>Качество укладки соответствует нормативам</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleExportPDF}>
          <Text style={styles.primaryButtonText}>
            {pdfUrl ? '✅ PDF готов' : '📥 Сгенерировать PDF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <Text style={styles.secondaryButtonText}>📤 Поделиться</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryButton}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Text style={styles.tertiaryButtonText}>🏠 На главную</Text>
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
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerId: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    marginVertical: 4,
  },
  verdict: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewBadge: {
    marginTop: 10,
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
  recommendationBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  metricsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  tableSection: {
    marginBottom: 16,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  tableRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  defectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  defectDetails: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 16,
  },
  regText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 16,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tertiaryButtonText: {
    color: '#6B7280',
    fontSize: 15,
  },
  disputeBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  disputeBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
});
