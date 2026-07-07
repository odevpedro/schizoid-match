import axios from 'axios';
import { storage } from './storage';

const BASE_URL = __DEV__ ? 'http://10.0.2.2:3001' : 'https://api.wellmatch.app';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('@wellmatch:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.removeItem('@wellmatch:token');
    }
    return Promise.reject(error);
  },
);
