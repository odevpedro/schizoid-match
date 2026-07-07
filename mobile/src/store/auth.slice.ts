import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { onboardingService } from '../services/onboarding.service';
import { DEMO_TOKEN, mockUser } from '../services/mock-data';
import { User } from '../types/user.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  onboardingCompleted: false,

  login: async (email, password) => {
    const result = await authService.login(email, password);
    set({ user: result.user as any, token: result.access_token, isAuthenticated: true });
    await get().checkOnboardingStatus();
  },

  register: async (data) => {
    const result = await authService.register(data);
    set({ user: result.user as any, token: result.access_token, isAuthenticated: true });
    await get().checkOnboardingStatus();
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, isAuthenticated: false, onboardingCompleted: false });
  },

  restoreSession: async () => {
    const token = await authService.getStoredToken();
    if (token === DEMO_TOKEN) {
      set({ token, user: mockUser, isAuthenticated: true, isLoading: false, onboardingCompleted: true });
    } else if (token) {
      set({ token, isAuthenticated: true, isLoading: false });
      try {
        const status = await onboardingService.getStatus();
        set({ onboardingCompleted: status.completed });
      } catch {
        set({ onboardingCompleted: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  checkOnboardingStatus: async () => {
    const token = get().token;
    if (token === DEMO_TOKEN) {
      set({ onboardingCompleted: true });
      return;
    }
    try {
      const status = await onboardingService.getStatus();
      set({ onboardingCompleted: status.completed });
    } catch {
      set({ onboardingCompleted: false });
    }
  },

  setOnboardingCompleted: (completed: boolean) => {
    set({ onboardingCompleted: completed });
  },
}));
