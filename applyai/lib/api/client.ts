import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'applyai_token';

/**
 * Prefer EXPO_PUBLIC_API_BASE_URL exactly as set:
 * - Physical device + USB (`adb reverse tcp:4000`): http://127.0.0.1:4000/api/v1
 * - Physical device on Wi‑Fi: http://YOUR_PC_LAN_IP:4000/api/v1
 * - Android emulator: http://10.0.2.2:4000/api/v1
 * Do not rewrite localhost → 10.0.2.2; that breaks real phones.
 */
function resolveApiBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';
}

const baseURL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL,
  timeout: 30_000,
});

if (__DEV__) {
  console.log('[api] baseURL =', baseURL);
}

export async function setApiToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getApiToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use(async (config) => {
  const token = await getApiToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);
