// services/api.js — Axios instance with JWT interceptors and auto-refresh
import axios from 'axios';
import API_BASE_URL from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
});

function emitAuthEvent(eventName, detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

// ── Request interceptor — attach Bearer token ─────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('idle_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — auto-refresh on 401 ───────────────
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;

      if (!refreshPromise) {
        const refreshToken = localStorage.getItem('idle_refresh');
        if (!refreshToken) {
          localStorage.clear();
          emitAuthEvent('idle:auth-cleared');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        }).then(({ data }) => {
          const newToken = data.access_token;
          localStorage.setItem('idle_token', newToken);
          emitAuthEvent('idle:token-updated', { token: newToken });
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          refreshPromise = null;
          return newToken;
        }).catch((refreshError) => {
          refreshPromise = null;
          localStorage.clear();
          emitAuthEvent('idle:auth-cleared');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        });
      }

      try {
        const token = await refreshPromise;
        original.headers['Authorization'] = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
