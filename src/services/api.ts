import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Alert, NativeModules, Platform } from 'react-native';
import {
  clearStoredAuthTokens,
  getAccessToken,
  getRefreshToken,
  getSessionEpoch,
  invalidateSessionEpoch,
  isSessionLoggedOutInMemory,
  saveAuthTokens,
  setInMemoryAccessToken,
} from './tokenStorage';

// ============================================================================
// BACKEND SERVER IP CONFIGURATION
//
// PRODUCTION: Set EXPO_PUBLIC_API_URL=https://your-render-service.onrender.com
//             in your .env / EAS secrets. Leave MANUAL_SERVER_IP as ''.
//
// LOCAL DEV:  Fill in your current LAN IP below and leave EXPO_PUBLIC_API_URL unset.
//             When you switch Wi-Fi, update this IP.
//
export const MANUAL_SERVER_IP: string = ''; // <-- Set your local IPv4 here for LAN dev (leave '' for production)
export const SERVER_PORT = '8080';
export const PRODUCTION_BACKEND_URL = 'https://farm2home-backend-vjo8.onrender.com';
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
  // 1. Explicit local developer override (ONLY when MANUAL_SERVER_IP is manually set)
  if (__DEV__ && MANUAL_SERVER_IP && MANUAL_SERVER_IP.trim() !== '') {
    return `http://${MANUAL_SERVER_IP.trim()}:${SERVER_PORT}`;
  }

  // 2. Production / EAS / .env EXPO_PUBLIC_API_URL takes first priority
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl && envUrl !== '') {
    return envUrl;
  }

  // 3. By default always use the live production Render backend
  return PRODUCTION_BACKEND_URL;
};

export let BASE_URL = resolveBaseUrl();

export const resolveMediaUrl = (path?: string | null): string | null => {
  if (!path || path === 'null' || path.trim() === '') return null;
  const activeBase = resolveBaseUrl();

  // If path is already a full URL:
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // 1. Never rewrite HTTPS URLs (Cloudinary, AWS S3, Render, CDN, etc.)
    if (path.startsWith('https://')) {
      return path;
    }

    // 2. Protect external CDN URLs even if HTTP
    const isExternalCdn =
      path.includes('cloudinary.com') ||
      path.includes('amazonaws.com') ||
      path.includes('cdn.') ||
      path.includes('storage.googleapis.com');

    if (isExternalCdn) {
      return path;
    }

    // 3. Always rewrite localhost, 127.0.0.1, or 10.0.2.2 so media stays reachable on phone
    const isLocalOrLoopback = /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)/i.test(path);
    if (isLocalOrLoopback) {
      const urlMatch = path.match(/^(http:\/\/[^/]+)(\/.*)?$/i);
      if (urlMatch) {
        const pathSuffix = urlMatch[2] ?? '';
        return `${activeBase}${pathSuffix}`;
      }
    }

    // 4. In dev mode, rewrite local LAN URLs so media stays reachable on phone
    if (__DEV__) {
      const isLan = /^http:\/\/(172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)/i.test(path);
      if (isLan) {
        const urlMatch = path.match(/^(http:\/\/[^/]+)(\/.*)?$/i);
        if (urlMatch) {
          const pathSuffix = urlMatch[2] ?? '';
          return `${activeBase}${pathSuffix}`;
        }
      }
    }

    // Return external URL as-is
    return path;
  }

  const normalized = path.replace(/\\/g, '/');
  const uploadsIdx = normalized.indexOf('uploads/');
  if (uploadsIdx !== -1) {
    return `${activeBase}/${normalized.substring(uploadsIdx)}`;
  }
  const cleanPath = normalized.startsWith('/') ? normalized.slice(1) : normalized;
  if (cleanPath.startsWith('user/') || cleanPath.startsWith('product/') || cleanPath.startsWith('farmer/')) {
    return `${activeBase}/${cleanPath}`;
  }
  return `${activeBase}/uploads/${cleanPath}`;
};

let hasWarmedUp = false;
export const warmUpBackend = async (): Promise<void> => {
  if (hasWarmedUp) return;
  hasWarmedUp = true;
  try {
    const healthUrl = `${resolveBaseUrl()}/health`;
    if (__DEV__) {
      console.log(`[API] Triggering backend warm-up ping to ${healthUrl}`);
    }
    await axios.get(healthUrl, { timeout: 15000 });
    if (__DEV__) {
      console.log('[API] Backend warm-up ping acknowledged.');
    }
  } catch {
    // Silent non-blocking catch — server will spin up on its own
  }
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000,
  headers: {
    Accept: 'application/json',
  },
});

// In-memory auth token cache to avoid SecureStore read races right after login
let activeAuthToken: string | null = null;
let lastLoginTimestamp = 0;
const POST_LOGIN_401_GRACE_MS = 8000;
let refreshInFlight: Promise<string | null> | null = null;

export const setAuthToken = (token: string | null, markFreshLogin = false) => {
  activeAuthToken = token;
  setInMemoryAccessToken(token);
  if (token && markFreshLogin) {
    lastLoginTimestamp = Date.now();
    isHandling401 = false;
  } else if (!token) {
    lastLoginTimestamp = 0;
    refreshInFlight = null;
  }
};

export const refreshAccessTokenSingleFlight = async (): Promise<string | null> => {
  if (isSessionLoggedOutInMemory()) {
    return null;
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }
  const startEpoch = getSessionEpoch();
  refreshInFlight = (async () => {
    try {
      if (isSessionLoggedOutInMemory() || getSessionEpoch() !== startEpoch) {
        return null;
      }
      const refreshToken = await getRefreshToken();
      if (!refreshToken || isSessionLoggedOutInMemory() || getSessionEpoch() !== startEpoch) {
        return null;
      }
      const activeBase = resolveBaseUrl();
      const resp = await axios.post(
        `${activeBase}/auth/refresh`,
        { refreshToken },
        { timeout: 15000, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } }
      );
      if (isSessionLoggedOutInMemory() || getSessionEpoch() !== startEpoch) {
        return null;
      }
      const newAccess = resp?.data?.accessToken;
      const newRefresh = resp?.data?.refreshToken;
      if (newAccess && typeof newAccess === 'string') {
        const saved = await saveAuthTokens(newAccess, newRefresh ?? refreshToken, startEpoch);
        if (!saved || isSessionLoggedOutInMemory() || getSessionEpoch() !== startEpoch) {
          return null;
        }
        setAuthToken(newAccess, true);
        return newAccess;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
};

export const hasActiveAuthToken = (): boolean => Boolean(activeAuthToken);

export const isAuthOrCanceledError = (err: any): boolean =>
  Boolean(
    axios.isCancel(err) ||
      err?.code === 'ERR_CANCELED' ||
      err?._isStaleAuth === true ||
      err?.response?.status === 401
  );

api.interceptors.request.use(
  async config => {
    if (__DEV__) {
      const activeBase = resolveBaseUrl();
      BASE_URL = activeBase;
      config.baseURL = activeBase;
    }
    const url = config?.url || '';
    const isAuthPublicCall =
      url.startsWith('/auth/') ||
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/forgot-password') ||
      url.includes('/reset-password') ||
      url === '/health';
    if (isSessionLoggedOutInMemory() && !isAuthPublicCall) {
      return Promise.reject(new axios.CanceledError('Skipped request after logout'));
    }
    const token =
      activeAuthToken || (isSessionLoggedOutInMemory() ? null : await getAccessToken());
    if (token && !activeAuthToken && !isSessionLoggedOutInMemory()) {
      activeAuthToken = token;
    }
    if (!token) {
      const isStrictAuthPoll =
        url.includes('/support/admin/') ||
        url.includes('/notifications/unread/count') ||
        url.includes('/order/farmer/new-orders-count') ||
        url.includes('/admin/group/messages') ||
        (url.startsWith('/admin/') && !url.startsWith('/admin/auth/'));
      if (isStrictAuthPoll) {
        return Promise.reject(new axios.CanceledError('Skipped unauthenticated request after logout'));
      }
    }
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
    const isCanceled = axios.isCancel(error) || error?.code === 'ERR_CANCELED';

    // 0. Canceled requests are intentional lifecycle events (e.g. navigation, unmount, abort) — do not log as errors
    if (isCanceled) {
      return Promise.reject(error);
    }

    // 1. Network / transient rate-limit (429 / 503) / transient login 500-502 retry handling
    const isAuthLifecycleEndpoint = Boolean(
      (config as any)?._skipRetry ||
      config?.url?.includes('/auth/logout') ||
      config?.url?.includes('/auth/refresh')
    );
    const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
    const isLoginEndpoint = Boolean(
      config?.url?.includes('/newuser/login') ||
      config?.url?.includes('/farmer/login') ||
      config?.url?.includes('/user/login') ||
      config?.url?.includes('/admin/auth/login') ||
      config?.url?.includes('/auth/google')
    );
    const isRateLimitOrUnavailable = status === 429 || status === 502 || status === 503 || (isLoginEndpoint && status === 500);
    const retryCount = config?._retryCount ?? 0;
    if (!isAuthLifecycleEndpoint && (isNetworkError || isRateLimitOrUnavailable) && retryCount < MAX_RETRIES && config) {
      config._retryCount = retryCount + 1;
      const retryAfterHeader = Number(error?.response?.headers?.['retry-after']);
      const delayMs = isRateLimitOrUnavailable
        ? Math.min(Math.max((Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader * 1000 : 2000 * config._retryCount), 1500), 6000)
        : RETRY_DELAY_MS * config._retryCount;
      if (__DEV__) {
        console.log(`[API] Transient ${status || error.code} on ${config.url} — auto-retrying (${config._retryCount}/${MAX_RETRIES}) in ${delayMs}ms...`);
      }
      await sleep(delayMs);
      return api(config);
    }

    // Log genuine unhandled API errors in DEV (suppressing noisy background heartbeat polls & stale post-logout 401s)
    const reqAuthHeader = String(
      config?.headers?.['Authorization'] || config?.headers?.Authorization || ''
    );
    const reqToken = reqAuthHeader.startsWith('Bearer ')
      ? reqAuthHeader.slice(7).trim()
      : '';
    const currentTokenSnapshot =
      activeAuthToken || (status === 401 && !isSessionLoggedOutInMemory() ? await getAccessToken() : null);
    const isStaleOrUnauth401 =
      status === 401 && (!reqToken || Boolean(currentTokenSnapshot && reqToken !== currentTokenSnapshot));

    if (__DEV__) {
      const isSilentBackground = Boolean(
        isStaleOrUnauth401 ||
        config?.url?.includes('/notifications/unread/count') ||
        config?.url?.includes('/order/farmer/new-orders-count') ||
        config?.url?.includes('/support/admin/unread-counts') ||
        config?.url?.includes('/admin/group/messages')
      );
      const isAuthPath = Boolean(
        config?.url?.includes('/auth/') ||
        config?.url?.includes('/login') ||
        config?.url?.includes('/register') ||
        config?.url?.includes('/reset-password')
      );
      if (!isSilentBackground) {
        console.log('=================================');
        console.log('API ERROR');
        console.log('MESSAGE:', error?.message);
        console.log('CODE:', error?.code);
        console.log('URL:', error?.config?.url);
        console.log('BASE URL:', error?.config?.baseURL);
        console.log('STATUS:', status);
        if (!isAuthPath) {
          console.log('DATA:', error?.response?.data);
        }
      }
    }

    // 2. HTTP 401: Handle concurrent refresh races cleanly and rotate via single-flight refresh
    if (status === 401) {
      const currentToken = currentTokenSnapshot;
      const msSinceLogin = Date.now() - lastLoginTimestamp;
      const isBackgroundPoll = Boolean(
        config?.url?.includes('/notifications/unread/count') ||
        config?.url?.includes('/order/farmer/new-orders-count') ||
        config?.url?.includes('/support/admin/') ||
        config?.url?.includes('/admin/group/messages') ||
        config?.url?.includes('/farmer/notifications') ||
        config?.url?.includes('/shorts')
      );

      // Unauthenticated request or no active token left -> stale auth
      if (!reqToken || !currentToken) {
        (error as any)._isStaleAuth = true;
        return Promise.reject(error);
      }

      // Another in-flight refresh already updated activeAuthToken -> retry once with the fresh token
      if (reqToken !== currentToken) {
        if (!(config as any)?._staleRetry && config) {
          (config as any)._staleRetry = true;
          if (config.headers) {
            config.headers['Authorization'] = `Bearer ${currentToken}`;
          }
          return api(config);
        }
        (error as any)._isStaleAuth = true;
        return Promise.reject(error);
      }

      // Attempt refresh-token rotation once via single-flight before clearing session (BUG-M02 / BUG-03A)
      const refreshAttempted = (config as any)?._refreshAttempted;
      const isRefreshCall = Boolean(config?.url?.includes('/auth/refresh') || config?.url?.includes('/auth/logout'));
      if (!refreshAttempted && !isRefreshCall && config) {
        (config as any)._refreshAttempted = true;
        const rotatedToken = await refreshAccessTokenSingleFlight();
        if (rotatedToken) {
          if (config.headers) {
            config.headers['Authorization'] = `Bearer ${rotatedToken}`;
          }
          return api(config);
        }
      }

      // Still inside post-login grace window for a background poll? Reject silently instead of kicking user back to login
      if (isBackgroundPoll && msSinceLogin < POST_LOGIN_401_GRACE_MS * 2) {
        if (__DEV__) {
          console.log('[API] Suppressing auto-logout on background poll 401 shortly after login:', config?.url);
        }
        return Promise.reject(error);
      }

      if (!isHandling401) {
        isHandling401 = true;
        if (__DEV__) {
          console.log('[API] 401 Unauthorized received — clearing secure auth storage and resetting session');
        }
        try {
          invalidateSessionEpoch();
          activeAuthToken = null;
          lastLoginTimestamp = 0;
          refreshInFlight = null;
          await clearStoredAuthTokens(true);
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

    // 3. HTTP 403 on an authenticated request: Do NOT auto-logout, show ONE debounced friendly message
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
                  invalidateSessionEpoch();
                  setAuthToken(null);
                  await clearStoredAuthTokens(true);
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

