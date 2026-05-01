/**
 * Auth Screen — Phone + OTP login
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { authApi } from '@api/client';
import { useAuthStore } from '@store/authStore';

export function AuthScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const { setToken, setUser, enableTestMode } = useAuthStore();

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('7') && digits.length === 11) {
      return `+${digits}`;
    }
    if (digits.length === 10) {
      return `+7${digits}`;
    }
    return raw;
  };

  const handleSendOTP = async () => {
    const formatted = formatPhone(phone);
    if (!/^\+7\d{10}$/.test(formatted)) {
      Alert.alert('Ошибка', 'Введите номер в формате +7XXXXXXXXXX');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOTP(formatted);
      setStep('otp');
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.detail || 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const formatted = formatPhone(phone);
    if (code.length !== 6) {
      Alert.alert('Ошибка', 'Код должен содержать 6 цифр');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOTP(formatted, code);
      const { access_token, user } = res.data;
      await setToken(access_token);
      setUser(user);
    } catch (e: any) {
      Alert.alert('Ошибка', e.response?.data?.detail || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    await enableTestMode();
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>СтройКонтроль AI</Text>
        <Text style={styles.subtitle}>
          {step === 'phone' ? 'Войдите по номеру телефона' : `Код отправлен на ${formatPhone(phone)}`}
        </Text>

        {step === 'phone' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="+7 (999) 000-00-00"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={16}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Получить код</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestLogin}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>🔓 Демо-вход (без SMS)</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="000000"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Войти</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.link}>Изменить номер</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  testButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  testButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});
