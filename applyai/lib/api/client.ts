import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/lib/firebase/config';

const TOKEN_KEY = 'applyai_token';

/**
 * Hosted API (Firebase). Override with EXPO_PUBLIC_API_BASE_URL if needed.
 */
function resolveApiBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  return 'https://petcare-9f4e6.web.app/api/v1';
}

const baseURL = resolveApiBaseUrl();
let memoryToken: string | null = null;

export const api = axios.create({
  baseURL,
  timeout: 30_000,
});

export function getApiBaseUrl(): string {
  return baseURL;
}

function applyAuthHeader(config: InternalAxiosRequestConfig, token: string) {
  const value = `Bearer ${token}`;
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }
  if (typeof config.headers.set === 'function') {
    config.headers.set('Authorization', value);
    config.headers.set('X-Firebase-Authorization', value);
  } else {
    const headers = config.headers as unknown as Record<string, string>;
    headers.Authorization = value;
    headers['X-Firebase-Authorization'] = value;
  }
}

function syncAxiosDefaults(token: string | null) {
  if (token) {
    const value = `Bearer ${token}`;
    api.defaults.headers.common.Authorization = value;
    api.defaults.headers.common['X-Firebase-Authorization'] = value;
  } else {
    delete api.defaults.headers.common.Authorization;
    delete api.defaults.headers.common['X-Firebase-Authorization'];
  }
}

export async function setApiToken(token: string | null) {
  memoryToken = token;
  syncAxiosDefaults(token);
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function getApiToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  memoryToken = await AsyncStorage.getItem(TOKEN_KEY);
  return memoryToken;
}

export async function ensureApiToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(forceRefresh);
      await setApiToken(token);
      return token;
    } catch (e) {
      console.warn('[api] getIdToken failed', e);
    }
  }
  return getApiToken();
}

api.interceptors.request.use(async (config) => {
  const token = await ensureApiToken();
  if (token) applyAuthHeader(config, token);
  // Let the runtime set multipart boundary — a preset Content-Type breaks Android uploads.
  const body = config.data as { _parts?: unknown } | FormData | undefined;
  const isFormData =
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (body != null && typeof body === 'object' && Array.isArray((body as { _parts?: unknown })._parts));
  if (isFormData && config.headers && typeof config.headers.delete === 'function') {
    config.headers.delete('Content-Type');
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const token = await ensureApiToken(true);
      if (token) {
        applyAuthHeader(original, token);
        return api.request(original);
      }
    }
    const message =
      error.response?.data?.error?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);
