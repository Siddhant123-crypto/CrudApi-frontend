import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, NativeModules, Platform } from 'react-native';

// ============================================================================
// BACKEND SERVER IP CONFIGURATION
// Jab bhi aapka Wi-Fi badle, bas yahan apna naya IPv4 address change karein:
export const MANUAL_SERVER_IP = '172.16.20.178'; // <-- Yahan apna IPv4 address likhein
export const SERVER_PORT = '8080';
// ============================================================================

const getDevServerHost = (): string | null => {
  try {
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const host = scriptURL.split('://')[1]?.split(':')[0]?.split('/')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch {
    // fallback
  }
  return null;
};

export const resolveBaseUrl = (): string => {
  // 1. Agar aapne MANUAL_SERVER_IP set kiya hai to ye sabse pehle use hoga
  if (MANUAL_SERVER_IP && MANUAL_SERVER_IP.trim() !== '') {
    return `http://${MANUAL_SERVER_IP.trim()}:${SERVER_PORT}`;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (__DEV__) {
    const devHost = getDevServerHost();
    if (devHost) {
      return `http://${devHost}:${SERVER_PORT}`;
    }
  }
  return Platform.OS === 'android' ? `http://10.0.2.2:${SERVER_PORT}` : `http://localhost:${SERVER_PORT}`;
};

export let BASE_URL = resolveBaseUrl();

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  async config => {
    if (__DEV__) {
      const activeBase = resolveBaseUrl();
      BASE_URL = activeBase;
      config.baseURL = activeBase;
    }
    const token = await AsyncStorage.getItem('userToken');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log('=================================');
      console.log('API REQUEST');
      console.log('METHOD:', config.method?.toUpperCase());
      console.log('URL:', `${config.baseURL}${config.url}`);
      console.log('TOKEN PRESENT:', token ? 'YES' : 'NO');
    }
    return config;
  },
  error => Promise.reject(error),
);

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
  unauthorizedHandler = handler;
};

// Guard flags for 401 loop prevention and 403 debounce window
let isHandling401 = false;
let last403AlertTimestamp = 0;
const DEBOUNCE_403_MS = 5000;

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
    const status = error?.response?.status;

    if (__DEV__) {
      console.log('=================================');
      console.log('API ERROR');
      console.log('MESSAGE:', error?.message);
      console.log('CODE:', error?.code);
      console.log('URL:', error?.config?.url);
      console.log('BASE URL:', error?.config?.baseURL);
      console.log('STATUS:', status);
      console.log('DATA:', error?.response?.data);
    }

    // 1. HTTP 401: Clear auth storage and navigate to login exactly once
    if (status === 401) {
      if (!isHandling401) {
        isHandling401 = true;
        if (__DEV__) {
          console.log('[API] 401 Unauthorized received — clearing auth storage and resetting session');
        }
        try {
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          if (unauthorizedHandler) {
            unauthorizedHandler();
          }
        } catch (storageErr) {
          console.error('[API] Error clearing auth storage on 401:', storageErr);
        } finally {
          setTimeout(() => {
            isHandling401 = false;
          }, 3000);
        }
      }
      return Promise.reject(error);
    }

    // 2. HTTP 403 on an authenticated request: Do NOT auto-logout, show ONE debounced friendly message
    const hasAuthHeader = Boolean(
      config?.headers?.['Authorization'] || config?.headers?.Authorization
    );
    if (status === 403 && hasAuthHeader) {
      const now = Date.now();
      if (now - last403AlertTimestamp > DEBOUNCE_403_MS) {
        last403AlertTimestamp = now;
        Alert.alert(
          'Session Expired',
          'Your session may have expired. Please log in again.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Log in',
              onPress: async () => {
                try {
                  await AsyncStorage.multiRemove(['userToken', 'userData']);
                  if (unauthorizedHandler) {
                    unauthorizedHandler();
                  }
                } catch (logoutErr) {
                  console.error('[API] Error clearing auth storage on 403 re-login action:', logoutErr);
                }
              },
            },
          ],
          { cancelable: true }
        );
      }
      return Promise.reject(error);
    }

    // Network retry handling
    const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
    const retryCount = config?._retryCount ?? 0;
    if (isNetworkError && retryCount < MAX_RETRIES && config) {
      config._retryCount = retryCount + 1;
      console.log(`[API] Network error on ${config.url} — retrying (${config._retryCount}/${MAX_RETRIES})...`);
      await sleep(RETRY_DELAY_MS * config._retryCount);
      return api(config);
    }
    if (isNetworkError) {
      const devHint = __DEV__ ? `\nServer: ${BASE_URL}` : '';
      const friendlyError: any = new Error(
        `Could not reach the server. Check your internet connection and try again.${devHint}`
      );
      friendlyError.code = 'SERVER_UNREACHABLE';
      friendlyError.originalError = error;
      return Promise.reject(friendlyError);
    }
    return Promise.reject(error);
  },
);

export default api;
