/**
 * Zustand store for authentication state
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  phone: string;
  name: string | null;
  user_type: 'customer' | 'foreman' | 'expert' | 'admin';
  avatar_url: string | null;
  consent_given: boolean;
  tariff: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isTestMode: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
  enableTestMode: () => Promise<void>;
}

const TEST_USER: User = {
  id: 'test-user-1',
  phone: '+79990000000',
  name: 'Демо Пользователь',
  user_type: 'customer',
  avatar_url: null,
  consent_given: true,
  tariff: 'PRO',
};

const TOKEN_KEY = 'auth_token';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isTestMode: false,

  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, isAuthenticated: true });
  },

  setUser: (user: User) => {
    set({ user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null, isAuthenticated: false, isTestMode: false });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        set({ token, isAuthenticated: true });
        // TODO: validate token + fetch user
      }
    } finally {
      set({ isLoading: false });
    }
  },

  enableTestMode: async () => {
    set({
      token: 'test-token-demo',
      user: TEST_USER,
      isAuthenticated: true,
      isTestMode: true,
      isLoading: false,
    });
  },
}));
