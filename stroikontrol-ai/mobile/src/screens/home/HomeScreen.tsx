/**
 * Home Screen — Project list + FAB to create new
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { projectsApi } from '@api/client';
import { useAuthStore } from '@store/authStore';

interface ProjectItem {
  id: string;
  title: string | null;
  room_type: string;
  surface_type: string;
  status: string;
  created_at: string;
  report_pdf_url: string | null;
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectsApi.list();
      return res.data as { items: ProjectItem[]; total: number };
    },
  });

  // Refetch when screen comes back into focus (hardware back button, swipe back)
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const renderItem = ({ item }: { item: ProjectItem }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => {
        if (item.status === 'completed') {
          navigation.navigate('Report', { projectId: item.id });
        } else {
          navigation.navigate('Camera', { projectId: item.id, step: 'photos' });
        }
      }}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectTitle}>
          {item.title || `${item.room_type} — ${item.surface_type}`}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.projectDate}>
        {new Date(item.created_at).toLocaleDateString('ru-RU')}
      </Text>
      {item.report_pdf_url && (
        <Text style={styles.reportLink}>📄 Отчет готов</Text>
      )}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => {
          Alert.alert(
            'Удалить проект?',
            `Вы уверены, что хотите удалить «${item.title || item.room_type}»?`,
            [
              { text: 'Отмена', style: 'cancel' },
              {
                text: 'Удалить',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await projectsApi.deleteProject(item.id);
                    // Invalidate cache to refresh list
                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                    Alert.alert('Удалено', 'Проект удален');
                  } catch (e: any) {
                    Alert.alert('Ошибка', 'Не удалось удалить проект');
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={styles.deleteBtnText}>🗑️ Удалить</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Привет, {user?.name || 'строитель'}!
        </Text>
        <Text style={styles.subtitle}>Ваши проекты</Text>
        {user?.user_type === 'expert' && (
          <TouchableOpacity
            style={styles.expertBtn}
            onPress={() => navigation.navigate('ExpertQueue')}
          >
            <Text style={styles.expertBtnText}>👁️ Очередь на проверку</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Нет проектов</Text>
            <Text style={styles.emptySubtext}>Нажмите + чтобы начать</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProjectCreate')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: '#9CA3AF',
    calibration: '#F59E0B',
    capturing: '#3B82F6',
    analyzing: '#8B5CF6',
    human_review: '#EF4444',
    completed: '#10B981',
    error: '#EF4444',
  };

  const labels: Record<string, string> = {
    draft: 'Черновик',
    calibration: 'Калибровка',
    capturing: 'Съемка',
    analyzing: 'Анализ',
    human_review: 'На проверке',
    completed: 'Готово',
    error: 'Ошибка',
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[status] || '#9CA3AF' }]}>
      <Text style={styles.badgeText}>{labels[status] || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  projectDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  reportLink: {
    fontSize: 13,
    color: '#2563EB',
    marginTop: 8,
  },
  deleteBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  expertBtn: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  expertBtnText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },
});
