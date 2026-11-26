import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'farm2home_access_token';
const REFRESH_TOKEN_KEY = 'farm2home_refresh_token';
const LEGACY_TOKEN_KEY = 'userToken';

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;

async function safeSecureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function safeSecureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Best-effort secure persistence; in-memory token cache remains active
  }
}

async function safeSecureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Best-effort deletion
  }
}

/**
 * Reads the stored JWT access token from Expo SecureStore.
 * One-time transparent migration: if a legacy plaintext 'userToken' exists in AsyncStorage,
 * moves it into SecureStore and removes the AsyncStorage copy immediately.
 */
export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const secureToken = await safeSecureGet(ACCESS_TOKEN_KEY);
  if (secureToken) {
    cachedAccessToken = secureToken;
    // Ensure any stale legacy plaintext copy is wiped
    AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
    return secureToken;
  }

  // Migrate legacy plaintext AsyncStorage token on upgrade, then delete plaintext key
  try {
    const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacyToken) {
      await safeSecureSet(ACCESS_TOKEN_KEY, legacyToken);
      await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
      cachedAccessToken = legacyToken;
      return legacyToken;
    }
  } catch {
    // Ignore storage read fallback failure
  }
  return null;
}

export async function getRefreshToken(): Promise<string | null> {
  if (cachedRefreshToken) {
    return cachedRefreshToken;
  }
  const token = await safeSecureGet(REFRESH_TOKEN_KEY);
  if (token) {
    cachedRefreshToken = token;
  }
  return token;
}

export async function saveAuthTokens(accessToken: string, refreshToken?: string | null): Promise<void> {
  cachedAccessToken = accessToken;
  await safeSecureSet(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken !== undefined) {
    if (refreshToken) {
      cachedRefreshToken = refreshToken;
      await safeSecureSet(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      cachedRefreshToken = null;
      await safeSecureDelete(REFRESH_TOKEN_KEY);
    }
  }
  // Never leave a second plaintext token copy in AsyncStorage
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
}

export function setInMemoryAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

export async function clearStoredAuthTokens(): Promise<void> {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  await Promise.allSettled([
    safeSecureDelete(ACCESS_TOKEN_KEY),
    safeSecureDelete(REFRESH_TOKEN_KEY),
    AsyncStorage.multiRemove([LEGACY_TOKEN_KEY, 'userData']),
  ]);
}
