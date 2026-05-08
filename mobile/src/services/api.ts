import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'http://localhost:3001' : 'https://api.wellmatch.app';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@wellmatch:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('@wellmatch:token');
    }
    return Promise.reject(error);
  },
);
