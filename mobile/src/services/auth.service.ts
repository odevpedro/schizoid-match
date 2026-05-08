import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { DEMO_TOKEN, mockUser } from './mock-data';

export interface AuthResult {
  access_token: string;
  user: { id: string; email: string; name?: string };
}

const DEMO_EMAIL = 'demo@wellmatch.app';
const DEMO_PASSWORD = 'demo123';

export const authService = {
  async login(email: string, password: string): Promise<AuthResult> {
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      await AsyncStorage.setItem('@wellmatch:token', DEMO_TOKEN);
      return { access_token: DEMO_TOKEN, user: mockUser };
    }
    const result = await api.post<AuthResult>('/auth/login', { email, password });
    await AsyncStorage.setItem('@wellmatch:token', (result as any).access_token);
    return result as any;
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    birthdate?: string;
    locationRegion?: string;
  }): Promise<AuthResult> {
    const result = await api.post<AuthResult>('/auth/register', data);
    await AsyncStorage.setItem('@wellmatch:token', (result as any).access_token);
    return result as any;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('@wellmatch:token');
  },

  async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem('@wellmatch:token');
  },
};
