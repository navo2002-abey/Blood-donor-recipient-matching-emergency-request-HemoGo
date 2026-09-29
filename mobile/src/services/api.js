import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getToken } from '../utils/storage';

const getDevHost = () => {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
    Constants.debuggerHost,
  ];

  for (const value of candidates) {
    const match = String(value || '').match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    if (match) {
      return match[1];
    }
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

// Uses the same computer IP as Expo / Metro, so a physical phone can reach the backend.
export const API_BASE_URL = `http://${getDevHost()}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
