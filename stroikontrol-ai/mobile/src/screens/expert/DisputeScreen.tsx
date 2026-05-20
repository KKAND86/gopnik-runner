import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { reportsApi } from '@api/client';

export function DisputeScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { projectId, defectId, defectType } = route?.params || {};

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Ошибка', 'Опишите причину оспаривания');
      return;
    }

    setLoading(true);
    try {
      await reportsApi.dispute(projectId, defectId, reason.trim());
      Alert.alert('✅ Отправлено', 'Ваше оспаривание принято на рассмотрение', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.detail || 'Не удалось отправить');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚠️ Оспорить дефект</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Тип дефекта</Text>
          <View style={styles.defectBadge}>
            <Text style={styles.defectText}>{defectType || 'Неизвестный'}</Text>
          </View>

          <Text style={styles.label}>ID дефекта</Text>
          <Text style={styles.defectId}>{defectId}</Text>

          <Text style={styles.label}>Опишите причину оспаривания</Text>
          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={6}
            placeholder="Например: дефект находится в пределах допустимого отклонения по СНиП..."
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>📤 Отправить оспаривание</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1A1A2E',
    padding: 20,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  defectBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  defectText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },
  defectId: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
