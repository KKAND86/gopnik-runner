import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../utils/api';

const ROOM_TYPES = [
  { value: 'bathroom', label: '🚿 Ванная' },
  { value: 'kitchen', label: '🍳 Кухня' },
  { value: 'hallway', label: '🚪 Прихожая' },
  { value: 'living_room', label: '🛋️ Гостиная' },
  { value: 'bedroom', label: '🛏️ Спальня' },
  { value: 'balcony', label: '🌿 Балкон' },
];

const SURFACE_TYPES = [
  { value: 'wall', label: '🧱 Стена' },
  { value: 'floor', label: '🏗️ Пол' },
  { value: 'ceiling', label: '☁️ Потолок' },
];

export default function ProjectCreatePage() {
  const [title, setTitle] = useState('');
  const [roomType, setRoomType] = useState('bathroom');
  const [surfaceType, setSurfaceType] = useState('wall');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Введите название проекта');
      return;
    }
    setLoading(true);
    try {
      const res = await projectsApi.create({
        title: title.trim(),
        room_type: roomType,
        surface_type: surfaceType,
        address: address.trim() || undefined,
      });
      navigate(`/projects/${res.data.id}/upload`);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Ошибка создания проекта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/projects')}>
          ← Назад
        </button>
        <h1 style={styles.headerTitle}>🆕 Новый проект</h1>
      </header>

      <div style={styles.content}>
        <div style={styles.card}>
          <label style={styles.label}>Название проекта</label>
          <input
            style={styles.input}
            placeholder="Например: Ванная — кафель на стене"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label style={styles.label}>Тип помещения</label>
          <div style={styles.options}>
            {ROOM_TYPES.map((rt) => (
              <button
                key={rt.value}
                style={{
                  ...styles.optionBtn,
                  ...(roomType === rt.value ? styles.optionBtnActive : {}),
                }}
                onClick={() => setRoomType(rt.value)}
              >
                {rt.label}
              </button>
            ))}
          </div>

          <label style={styles.label}>Тип поверхности</label>
          <div style={styles.options}>
            {SURFACE_TYPES.map((st) => (
              <button
                key={st.value}
                style={{
                  ...styles.optionBtn,
                  ...(surfaceType === st.value ? styles.optionBtnActive : {}),
                }}
                onClick={() => setSurfaceType(st.value)}
              >
                {st.label}
              </button>
            ))}
          </div>

          <label style={styles.label}>Адрес (необязательно)</label>
          <input
            style={styles.input}
            placeholder="Город, улица, дом"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button
            style={{
              ...styles.submitBtn,
              ...(loading ? { opacity: 0.6 } : {}),
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Создание...' : '✅ Создать проект'}
          </button>
        </div>
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
  content: { padding: '40px', maxWidth: '600px', margin: '0 auto' },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
    marginTop: '20px',
  },
  input: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  options: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  optionBtn: {
    padding: '10px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  optionBtnActive: {
    borderColor: '#2563eb',
    background: '#eff6ff',
    color: '#2563eb',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    marginTop: '24px',
    fontSize: '16px',
    fontWeight: 700,
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
};
