import { create } from 'zustand';
import type { User } from '../types/user';
import { CURRENT_USER } from '../services/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: CURRENT_USER,
  isAuthenticated: true,
  token: 'mock-jwt-token-2026',

  login: async (username: string, _password: string, token: string) => {
    set({
      user: CURRENT_USER,
      isAuthenticated: true,
      token,
    });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, token: null });
  },
}));
