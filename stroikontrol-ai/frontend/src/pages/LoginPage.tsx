import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { authApi } from '../utils/api';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      await authApi.login(phone, code);
      setStep('code');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(phone, code);
      const { access_token, user } = res.data;
      setToken(access_token, user);
      navigate('/queue');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>СтройКонтроль AI</h1>
        <p style={styles.subtitle}>Экспертный дашборд</p>
        
        {error && <div style={styles.error}>{error}</div>}
        
        {step === 'phone' ? (
          <>
            <input
              style={styles.input}
              placeholder="+7 (999) 000-00-00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button style={styles.button} onClick={handleSendCode} disabled={loading}>
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </>
        ) : (
          <>
            <input
              style={styles.input}
              placeholder="Код из SMS"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <button style={styles.button} onClick={handleVerify} disabled={loading}>
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button style={styles.link} onClick={() => setStep('phone')}>
              Изменить номер
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: '#fff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px',
  },
  input: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '16px',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 600,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  link: {
    width: '100%',
    padding: '12px',
    marginTop: '12px',
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '14px',
  },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
};