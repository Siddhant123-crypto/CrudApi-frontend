import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ACCESS_TOKEN_KEY,
  LOGGED_OUT_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
  createTokenStore,
} from './authSessionCore';

const LEGACY_TOKEN_KEY = 'userToken';

const tokenStore = createTokenStore({
  secureStore: SecureStore,
  asyncStorage: {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
    multiRemove: (keys: string[]) => AsyncStorage.multiRemove(keys),
  },
  legacyTokenKey: LEGACY_TOKEN_KEY,
});

export { ACCESS_TOKEN_KEY, LEGACY_TOKEN_KEY, LOGGED_OUT_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY };

export const getSessionEpoch = tokenStore.getSessionEpoch;
export const isSessionLoggedOutInMemory = tokenStore.isLoggedOutInMemory;
export const isLoggedOutPersisted = tokenStore.isLoggedOutPersisted;
export const beginLoginSession = tokenStore.beginLoginSession;
export const invalidateSessionEpoch = tokenStore.invalidateSessionEpoch;
export const snapshotAndInvalidateForLogout = tokenStore.snapshotAndInvalidateForLogout;
export const getAccessToken = tokenStore.getAccessToken;
export const getRefreshToken = tokenStore.getRefreshToken;
export const saveAuthTokens = tokenStore.saveAuthTokens;
export const setInMemoryAccessToken = tokenStore.setInMemoryAccessToken;

export async function clearStoredAuthTokens(markLoggedOut = true): Promise<void> {
  await tokenStore.clearStoredAuthTokens(markLoggedOut);
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
}
