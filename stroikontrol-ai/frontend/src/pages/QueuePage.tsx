import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { queueApi } from '../utils/api';
import type { QueueItem } from '../types';

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const res = await queueApi.getQueue();
      setItems(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (id: string, projectId: string) => {
    try {
      await queueApi.assign(id);
      navigate(`/review/${projectId}`);
    } catch (e) {
      alert('Не удалось назначить задачу');
    }
  };

  const getPriorityColor = (p: number) => {
    if (p >= 5) return '#dc2626';
    if (p >= 3) return '#f59e0b';
    return '#10b981';
  };

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    const mins = Math.floor(diff / 60000);
    if (mins < 0) return 'Просрочено';
    if (mins < 60) return `${mins} мин`;
    return `${Math.floor(mins / 60)}ч ${mins % 60}мин`;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Очередь на проверку</h1>
        <button style={styles.logoutBtn} onClick={logout}>Выйти</button>
      </header>

      <div style={styles.content}>
        {loading ? (
          <div style={styles.loading}>Загрузка...</div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>✅</div>
            <p>Очередь пуста. Все задачи проверены!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {items.map((item) => (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={{ ...styles.priority, background: getPriorityColor(item.priority) }}>
                    Приоритет {item.priority}
                  </span>
                  <span style={styles.sla}>SLA: {getTimeLeft(item.sla_deadline)}</span>
                </div>
                <div style={styles.cardBody}>
                  <p style={styles.projectId}>Проект: {item.project_id.slice(0, 8)}...</p>
                  <p style={styles.status}>Статус: {item.status}</p>
                </div>
                <button
                  style={styles.assignBtn}
                  onClick={() => handleAssign(item.id, item.project_id)}
                >
                  Назначить и проверить
                </button>
              </div>
            ))}
          </div>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: '24px', fontWeight: 700 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '8px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  content: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '60px', fontSize: '18px', color: '#666' },
  empty: { textAlign: 'center', padding: '80px' },
  emptyIcon: { fontSize: '64px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  priority: { color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  sla: { fontSize: '13px', color: '#dc2626', fontWeight: 500 },
  cardBody: { marginBottom: '16px' },
  projectId: { fontSize: '14px', color: '#666', marginBottom: '4px' },
  status: { fontSize: '13px', color: '#999' },
  assignBtn: {
    width: '100%',
    padding: '12px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
