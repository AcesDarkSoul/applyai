import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('applyai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Browser must set multipart boundary for FormData
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const headers = config.headers as { delete?: (k: string) => void } & Record<string, unknown>;
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type');
      headers.delete('content-type');
    } else {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  },
);
