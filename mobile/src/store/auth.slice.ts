import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { DEMO_TOKEN, mockUser } from '../services/mock-data';
import { User } from '../types/user.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const result = await authService.login(email, password);
    set({ user: result.user as any, token: result.access_token, isAuthenticated: true });
  },

  register: async (data) => {
    const result = await authService.register(data);
    set({ user: result.user as any, token: result.access_token, isAuthenticated: true });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    const token = await authService.getStoredToken();
    if (token === DEMO_TOKEN) {
      set({ token, user: mockUser, isAuthenticated: true, isLoading: false });
    } else if (token) {
      set({ token, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
