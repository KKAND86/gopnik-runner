import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { queueApi } from '@api/client';

interface QueueItem {
  id: string;
  project_id: string;
  project_title: string;
  status: string;
  created_at: string;
  priority: string;
}

export function ExpertQueueScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await queueApi.getQueue();
      setItems(res.data?.items || []);
    } catch (e: any) {
      console.error('Queue load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssign = async (queueId: string) => {
    try {
      await queueApi.assign(queueId);
      // Navigate to the project analysis
      const item = items.find((i) => i.id === queueId);
      if (item) {
        navigation.navigate('Analysis', { projectId: item.project_id });
      }
    } catch (e: any) {
      alert('Ошибка назначения: ' + (e.message || 'неизвестная ошибка'));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Ожидает';
      case 'assigned': return '👁️ Назначено';
      case 'reviewed': return '✅ Проверено';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👁️ Очередь на проверку</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadQueue} />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Загрузка...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Очередь пуста</Text>
            <Text style={styles.emptySub}>Все задачи проверены</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.project_title}</Text>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(item.priority) },
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardMeta}>
                  {getStatusLabel(item.status)} • {' '}
                  {new Date(item.created_at).toLocaleString('ru-RU')}
                </Text>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleAssign(item.id)}
                  disabled={item.status !== 'pending'}
                >
                  <Text style={styles.actionBtnText}>
                    {item.status === 'pending' ? '✋ Взять на проверку' : '👁️ Смотреть'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  list: {
    gap: 12,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
