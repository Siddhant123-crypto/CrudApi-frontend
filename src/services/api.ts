import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── IMPORTANT: Change this IP to match your computer's local IP ─────────────
// Run `ipconfig` on Windows → find "IPv4 Address" under your active adapter
// The phone MUST be on the SAME WiFi as this computer
export const BASE_URL = 'http://172.16.20.219:8080';
// ─────────────────────────────────────────────────────────────────────────────

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000; // 1 second between retries

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s default; overridden per-call for uploads
});

// ─── Request Interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('userToken');

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Only log in dev; remove or gate behind __DEV__ for production
    if (__DEV__) {
      console.log('=================================');
      console.log('API REQUEST');
      console.log('METHOD:', config.method?.toUpperCase());
      console.log('URL:', `${config.baseURL}${config.url}`);
      console.log('TOKEN:', token ? `YES (${token.length} chars)` : 'NO');
    }

    return config;
  },
  error => Promise.reject(error),
);

// ─── Response Interceptor: logging + retry on network error ──────────────────
api.interceptors.response.use(
  response => {
    if (__DEV__) {
      console.log('=================================');
      console.log('API RESPONSE');
      console.log('STATUS:', response.status);
      console.log('URL:', response.config.url);
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number };

    if (__DEV__) {
      console.log('=================================');
      console.log('API ERROR');
      console.log('MESSAGE:', error?.message);
      console.log('CODE:', error?.code);
      console.log('URL:', error?.config?.url);
      console.log('BASE URL:', error?.config?.baseURL);
      console.log('STATUS:', error?.response?.status);
      console.log('DATA:', error?.response?.data);
    }

    // ── Auto-retry only for genuine network errors (not 4xx/5xx) ─────────────
    const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
    const retryCount = config._retryCount ?? 0;

    if (isNetworkError && retryCount < MAX_RETRIES && config) {
      config._retryCount = retryCount + 1;
      console.log(`[API] Network error on ${config.url} — retrying (${config._retryCount}/${MAX_RETRIES})...`);
      await sleep(RETRY_DELAY_MS * config._retryCount); // exponential backoff
      return api(config);
    }

    // After all retries exhausted, throw a friendlier error
    if (isNetworkError) {
      const friendlyError: any = new Error(
        'Cannot reach the server. Make sure:\n' +
        '1. Spring Boot backend is running\n' +
        '2. Your phone is on the same WiFi as this PC\n' +
        `3. BASE_URL is correct: ${BASE_URL}`
      );
      friendlyError.code = 'SERVER_UNREACHABLE';
      friendlyError.originalError = error;
      return Promise.reject(friendlyError);
    }

    return Promise.reject(error);
  },
);

export default api;