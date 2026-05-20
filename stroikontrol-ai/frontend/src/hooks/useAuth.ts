/**
 * Zustand store для аутентификации
 */

import { create } from 'zustand';
import type { AuthState } from '../types';

const TEST_USER = {
  id: 'test-user-1',
  phone: '+79990000000',
  name: 'Демо Эксперт',
  user_type: 'expert',
  avatar_url: null,
  consent_given: true,
  tariff: 'B2B_PRO',
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),
  isTestMode: localStorage.getItem('test_mode') === 'true',

  setToken: (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isTestMode: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('test_mode');
    set({ token: null, user: null, isAuthenticated: false, isTestMode: false });
  },

  enableTestMode: () => {
    localStorage.setItem('token', 'test-token-demo');
    localStorage.setItem('user', JSON.stringify(TEST_USER));
    localStorage.setItem('test_mode', 'true');
    set({
      token: 'test-token-demo',
      user: TEST_USER,
      isAuthenticated: true,
      isTestMode: true,
    });
  },
}));
