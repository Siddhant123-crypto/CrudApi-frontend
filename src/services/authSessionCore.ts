export const ACCESS_TOKEN_KEY = 'farm2home_access_token';
export const REFRESH_TOKEN_KEY = 'farm2home_refresh_token';
export const USER_DATA_KEY = 'userData';
export const LOGGED_OUT_KEY = 'farm2home_logged_out';

export type AllowedAppRole = 'USER' | 'FARMER' | 'ADMIN';

export interface SecureStoreLike {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

export interface AsyncStorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
}

export function normalizeAllowedRole(role: unknown): AllowedAppRole | null {
  if (typeof role !== 'string') {
    return null;
  }
  const upper = role.trim().toUpperCase();
  if (upper === 'CUSTOMER' || upper === 'USER') {
    return 'USER';
  }
  if (upper === 'FARMER') {
    return 'FARMER';
  }
  if (upper === 'ADMIN') {
    return 'ADMIN';
  }
  return null;
}

export interface TokenStore {
  getSessionEpoch: () => number;
  isLoggedOutInMemory: () => boolean;
  isLoggedOutPersisted: () => Promise<boolean>;
  beginLoginSession: () => number;
  invalidateSessionEpoch: () => number;
  snapshotAndInvalidateForLogout: () => Promise<{
    epoch: number;
    accessToken: string | null;
    refreshToken: string | null;
  }>;
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  saveAuthTokens: (
    accessToken: string,
    refreshToken?: string | null,
    expectedEpoch?: number,
  ) => Promise<boolean>;
  setInMemoryAccessToken: (token: string | null) => void;
  clearStoredAuthTokens: (preserveLoggedOutMarker?: boolean) => Promise<void>;
}

export function createTokenStore(deps: {
  secureStore: SecureStoreLike;
  asyncStorage: AsyncStorageLike;
  legacyTokenKey?: string;
}): TokenStore {
  const { secureStore, asyncStorage, legacyTokenKey } = deps;

  let cachedAccessToken: string | null = null;
  let cachedRefreshToken: string | null = null;
  let sessionEpoch = 0;
  let loggedOutInMemory = false;

  const safeSecureGet = async (key: string): Promise<string | null> => {
    try {
      const value = await secureStore.getItemAsync(key);
      if (!value || value.trim().length === 0) {
        return null;
      }
      return value;
    } catch {
      return null;
    }
  };

  const safeSecureSet = async (key: string, value: string): Promise<void> => {
    try {
      await secureStore.setItemAsync(key, value);
    } catch {
      // Best-effort secure persistence; in-memory token cache remains active
    }
  };

  const safeSecureDeleteVerified = async (key: string): Promise<void> => {
    try {
      await secureStore.deleteItemAsync(key);
    } catch {
      // Best-effort deletion; verify below
    }
    try {
      const remaining = await secureStore.getItemAsync(key);
      if (remaining !== null && remaining !== undefined && remaining !== '') {
        await secureStore.setItemAsync(key, '').catch(() => {});
        await secureStore.deleteItemAsync(key).catch(() => {});
      }
    } catch {
      // Best-effort verification fallback
    }
  };

  const isLoggedOutPersisted = async (): Promise<boolean> => {
    if (loggedOutInMemory) {
      return true;
    }
    try {
      const flag = await asyncStorage.getItem(LOGGED_OUT_KEY);
      return flag === 'true';
    } catch {
      return false;
    }
  };

  const getSessionEpoch = (): number => sessionEpoch;
  const isLoggedOutInMemory = (): boolean => loggedOutInMemory;

  const beginLoginSession = (): number => {
    sessionEpoch += 1;
    loggedOutInMemory = false;
    return sessionEpoch;
  };

  const invalidateSessionEpoch = (): number => {
    sessionEpoch += 1;
    loggedOutInMemory = true;
    cachedAccessToken = null;
    cachedRefreshToken = null;
    return sessionEpoch;
  };

  const snapshotAndInvalidateForLogout = async () => {
    const preAccess = cachedAccessToken;
    const preRefresh = cachedRefreshToken;
    // Synchronously invalidate epoch & caches immediately so no new requests use these tokens
    const epoch = invalidateSessionEpoch();

    const [diskAccess, diskRefresh] = await Promise.all([
      preAccess ? Promise.resolve(preAccess) : safeSecureGet(ACCESS_TOKEN_KEY),
      preRefresh ? Promise.resolve(preRefresh) : safeSecureGet(REFRESH_TOKEN_KEY),
    ]);

    return {
      epoch,
      accessToken: preAccess || diskAccess || null,
      refreshToken: preRefresh || diskRefresh || null,
    };
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (loggedOutInMemory) {
      return null;
    }
    if (cachedAccessToken) {
      return cachedAccessToken;
    }
    if (await isLoggedOutPersisted()) {
      return null;
    }
    const readEpoch = sessionEpoch;
    const secureToken = await safeSecureGet(ACCESS_TOKEN_KEY);
    if (loggedOutInMemory || readEpoch !== sessionEpoch) {
      return null;
    }
    if (secureToken) {
      cachedAccessToken = secureToken;
      if (legacyTokenKey) {
        asyncStorage.removeItem(legacyTokenKey).catch(() => {});
      }
      return secureToken;
    }

    if (legacyTokenKey) {
      try {
        const legacyToken = await asyncStorage.getItem(legacyTokenKey);
        if (loggedOutInMemory || readEpoch !== sessionEpoch) {
          return null;
        }
        if (legacyToken) {
          await safeSecureSet(ACCESS_TOKEN_KEY, legacyToken);
          await asyncStorage.removeItem(legacyTokenKey);
          if (loggedOutInMemory || readEpoch !== sessionEpoch) {
            await safeSecureDeleteVerified(ACCESS_TOKEN_KEY);
            return null;
          }
          cachedAccessToken = legacyToken;
          return legacyToken;
        }
      } catch {
        // Ignore storage fallback error
      }
    }
    return null;
  };

  const getRefreshToken = async (): Promise<string | null> => {
    if (loggedOutInMemory) {
      return null;
    }
    if (cachedRefreshToken) {
      return cachedRefreshToken;
    }
    if (await isLoggedOutPersisted()) {
      return null;
    }
    const readEpoch = sessionEpoch;
    const token = await safeSecureGet(REFRESH_TOKEN_KEY);
    if (loggedOutInMemory || readEpoch !== sessionEpoch) {
      return null;
    }
    if (token) {
      cachedRefreshToken = token;
    }
    return token;
  };

  const saveAuthTokens = async (
    accessToken: string,
    refreshToken?: string | null,
    expectedEpoch?: number,
  ): Promise<boolean> => {
    if (
      loggedOutInMemory ||
      (expectedEpoch !== undefined && expectedEpoch !== sessionEpoch)
    ) {
      return false;
    }
    // If login was called while another caller was not invalidated yet, ensure logged-out flag is cleared first
    await asyncStorage.removeItem(LOGGED_OUT_KEY).catch(() => {});
    if (
      loggedOutInMemory ||
      (expectedEpoch !== undefined && expectedEpoch !== sessionEpoch)
    ) {
      return false;
    }

    cachedAccessToken = accessToken;
    await safeSecureSet(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken !== undefined) {
      if (refreshToken) {
        cachedRefreshToken = refreshToken;
        await safeSecureSet(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        cachedRefreshToken = null;
        await safeSecureDeleteVerified(REFRESH_TOKEN_KEY);
      }
    }
    if (legacyTokenKey) {
      await asyncStorage.removeItem(legacyTokenKey).catch(() => {});
    }

    // Final epoch re-check in case logout executed concurrently during SecureStore I/O
    if (
      loggedOutInMemory ||
      (expectedEpoch !== undefined && expectedEpoch !== sessionEpoch)
    ) {
      await clearStoredAuthTokens(true);
      return false;
    }
    return true;
  };

  const setInMemoryAccessToken = (token: string | null): void => {
    if (loggedOutInMemory && token) {
      return;
    }
    cachedAccessToken = token;
  };

  const clearStoredAuthTokens = async (
    markLoggedOut = true,
  ): Promise<void> => {
    cachedAccessToken = null;
    cachedRefreshToken = null;
    if (markLoggedOut) {
      loggedOutInMemory = true;
    }

    const keysToRemove = legacyTokenKey
      ? [legacyTokenKey, USER_DATA_KEY]
      : [USER_DATA_KEY];
    const ops: Array<Promise<unknown>> = [
      safeSecureDeleteVerified(ACCESS_TOKEN_KEY),
      safeSecureDeleteVerified(REFRESH_TOKEN_KEY),
      asyncStorage.multiRemove(keysToRemove),
      asyncStorage.removeItem(USER_DATA_KEY),
    ];
    if (markLoggedOut) {
      ops.unshift(asyncStorage.setItem(LOGGED_OUT_KEY, 'true'));
    }
    await Promise.allSettled(ops);
  };

  return {
    getSessionEpoch,
    isLoggedOutInMemory,
    isLoggedOutPersisted,
    beginLoginSession,
    invalidateSessionEpoch,
    snapshotAndInvalidateForLogout,
    getAccessToken,
    getRefreshToken,
    saveAuthTokens,
    setInMemoryAccessToken,
    clearStoredAuthTokens,
  };
}

export function decodeJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bytes: number[] = [];
    for (let i = 0; i < padded.length; i += 4) {
      const n1 = chars.indexOf(padded[i]);
      const n2 = chars.indexOf(padded[i + 1]);
      const n3 = padded[i + 2] === '=' ? -1 : chars.indexOf(padded[i + 2]);
      const n4 = padded[i + 3] === '=' ? -1 : chars.indexOf(padded[i + 3]);
      if (n1 < 0 || n2 < 0) return null;
      bytes.push((n1 << 2) | (n2 >> 4));
      if (n3 >= 0) bytes.push(((n2 & 15) << 4) | (n3 >> 2));
      if (n4 >= 0) bytes.push(((n3 & 3) << 6) | n4);
    }
    let jsonStr = '';
    for (const b of bytes) {
      jsonStr += String.fromCharCode(b);
    }
    const payload = JSON.parse(jsonStr);
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(
  token?: string | null,
  bufferMs = 15_000,
): boolean {
  if (!token) {
    return true;
  }
  const expMs = decodeJwtExpiryMs(token);
  if (expMs === null) {
    // Non-JWT / test fixture token: rely on server 401 handling
    return false;
  }
  return Date.now() + bufferMs >= expMs;
}

export interface SessionUser {
  userId?: string;
  farmerId?: string;
  name?: string;
  email?: string;
  role: AllowedAppRole | string;
  profilePhoto?: string;
  [key: string]: any;
}

export type AuthRouteTarget = 'Welcome' | 'RoleSelection' | 'NewUserLogin';

export interface AuthSessionControllerDeps {
  tokenStore: TokenStore;
  asyncStorage: AsyncStorageLike;
  setAuthToken: (token: string | null, markFreshLogin?: boolean) => void;
  postBackendLogout: (
    accessToken: string | null,
    refreshToken: string | null,
  ) => Promise<void>;
  fetchCurrentProfile?: () => Promise<any>;
  clearChatHistoryOnLogout?: (userId?: string | null) => Promise<void>;
  stopSse?: () => void;
  refreshBeforeRestore?: () => Promise<string | null>;
  onUserState: (user: SessionUser | null) => void;
  onInitialAuthRoute: (route: AuthRouteTarget) => void;
  onProfileMerge?: (
    epoch: number,
    merged: SessionUser,
  ) => void;
}

export function createAuthSessionController(deps: AuthSessionControllerDeps) {
  const {
    tokenStore,
    asyncStorage,
    setAuthToken,
    postBackendLogout,
    fetchCurrentProfile,
    clearChatHistoryOnLogout,
    stopSse,
    onUserState,
    onInitialAuthRoute,
  } = deps;

  let logoutInFlight: Promise<void> | null = null;

  const isEpochCurrent = (epoch: number): boolean =>
    !tokenStore.isLoggedOutInMemory() && tokenStore.getSessionEpoch() === epoch;

  const syncProfileSafely = async (baseUser: SessionUser, epoch: number) => {
    if (!fetchCurrentProfile || baseUser.role === 'ADMIN' || !isEpochCurrent(epoch)) {
      return;
    }
    try {
      const meData = await fetchCurrentProfile();
      if (!isEpochCurrent(epoch)) {
        return;
      }
      const profile = meData?.response || meData;
      if (!profile) {
        return;
      }
      const { role: _ignoredRole, ...safeProfile } = profile;
      const merged: SessionUser = {
        ...baseUser,
        ...safeProfile,
        profilePhoto: safeProfile.profilePhoto || baseUser.profilePhoto,
        name: safeProfile.name || baseUser.name,
        role: baseUser.role,
      };
      if (!isEpochCurrent(epoch)) {
        return;
      }
      await asyncStorage.setItem(USER_DATA_KEY, JSON.stringify(merged)).catch(() => {});
      if (!isEpochCurrent(epoch)) {
        await asyncStorage.removeItem(USER_DATA_KEY).catch(() => {});
        return;
      }
      if (deps.onProfileMerge) {
        deps.onProfileMerge(epoch, merged);
      } else {
        onUserState(merged);
      }
    } catch {
      // Background sync is non-fatal
    }
  };

  const restoreSession = async (): Promise<{
    authenticated: boolean;
    user: SessionUser | null;
  }> => {
    const restoreEpoch = tokenStore.getSessionEpoch();
    try {
      const loggedOutPersisted = await tokenStore.isLoggedOutPersisted();
      if (!isEpochCurrent(restoreEpoch) || loggedOutPersisted) {
        if (loggedOutPersisted) {
          await tokenStore.clearStoredAuthTokens(true);
        }
        setAuthToken(null);
        onUserState(null);
        onInitialAuthRoute(loggedOutPersisted ? 'NewUserLogin' : 'Welcome');
        return { authenticated: false, user: null };
      }

      const [storedUser, storedToken] = await Promise.all([
        asyncStorage.getItem(USER_DATA_KEY),
        tokenStore.getAccessToken(),
      ]);

      if (!isEpochCurrent(restoreEpoch)) {
        return { authenticated: false, user: null };
      }

      if (!storedUser || !storedToken) {
        await tokenStore.clearStoredAuthTokens(false);
        setAuthToken(null);
        onUserState(null);
        return { authenticated: false, user: null };
      }

      const rawParsed = JSON.parse(storedUser);
      const normalizedRole = normalizeAllowedRole(rawParsed?.role);
      if (!normalizedRole) {
        await tokenStore.clearStoredAuthTokens(true);
        setAuthToken(null);
        onUserState(null);
        onInitialAuthRoute('NewUserLogin');
        return { authenticated: false, user: null };
      }

      const parsedUser: SessionUser = { ...rawParsed, role: normalizedRole };
      if (!isEpochCurrent(restoreEpoch)) {
        return { authenticated: false, user: null };
      }

      let effectiveToken = storedToken;
      if (isJwtExpired(storedToken, 30_000) && deps.refreshBeforeRestore) {
        const refreshed = await deps.refreshBeforeRestore();
        if (!isEpochCurrent(restoreEpoch)) {
          return { authenticated: false, user: null };
        }
        if (!refreshed) {
          await tokenStore.clearStoredAuthTokens(true);
          setAuthToken(null);
          onUserState(null);
          onInitialAuthRoute('NewUserLogin');
          return { authenticated: false, user: null };
        }
        effectiveToken = refreshed;
      }

      setAuthToken(effectiveToken, isJwtExpired(storedToken, 30_000));
      onUserState(parsedUser);

      // Fire background sync only while restoreEpoch remains active
      void syncProfileSafely(parsedUser, restoreEpoch);
      return { authenticated: true, user: parsedUser };
    } catch {
      await tokenStore.clearStoredAuthTokens(false).catch(() => {});
      setAuthToken(null);
      onUserState(null);
      return { authenticated: false, user: null };
    }
  };

  const login = async (
    userData: SessionUser,
    token?: string,
    refreshToken?: string | null,
  ): Promise<void> => {
    const normalizedRole = normalizeAllowedRole(userData?.role);
    if (!normalizedRole) {
      throw new Error('Invalid or missing user role');
    }
    const loginEpoch = tokenStore.beginLoginSession();
    const sanitizedUser: SessionUser = { ...userData, role: normalizedRole };

    await asyncStorage.removeItem(LOGGED_OUT_KEY).catch(() => {});
    if (!isEpochCurrent(loginEpoch)) {
      return;
    }

    await asyncStorage.setItem(USER_DATA_KEY, JSON.stringify(sanitizedUser));
    if (!isEpochCurrent(loginEpoch)) {
      await tokenStore.clearStoredAuthTokens(true);
      return;
    }

    if (token) {
      setAuthToken(token, true);
      const saved = await tokenStore.saveAuthTokens(token, refreshToken, loginEpoch);
      if (!saved || !isEpochCurrent(loginEpoch)) {
        setAuthToken(null);
        return;
      }
    }

    onUserState(sanitizedUser);
    onInitialAuthRoute('Welcome');

    if (token) {
      void syncProfileSafely(sanitizedUser, loginEpoch);
    }
  };

  const logout = async (currentUserId?: string | null): Promise<void> => {
    if (logoutInFlight) {
      return logoutInFlight;
    }

    logoutInFlight = (async () => {
      let accessSnapshot: string | null = null;
      let refreshSnapshot: string | null = null;
      try {
        stopSse?.();
        const snapshot = await tokenStore.snapshotAndInvalidateForLogout();
        accessSnapshot = snapshot.accessToken;
        refreshSnapshot = snapshot.refreshToken;

        // Immediately clear in-memory token so no new authenticated requests start
        setAuthToken(null);

        // CRITICAL FIX: Wait for ALL SecureStore + AsyncStorage persistence deletions and logged-out flag
        // BEFORE transitioning UI state to the Login screen so killing the app immediately cannot restore an old session.
        await Promise.allSettled([
          tokenStore.clearStoredAuthTokens(true),
          clearChatHistoryOnLogout ? clearChatHistoryOnLogout(currentUserId) : Promise.resolve(),
        ]);

        onUserState(null);
        onInitialAuthRoute('NewUserLogin');

        // Best-effort backend revocation; failures, timeouts, or expired tokens must NEVER block or undo local logout.
        if (refreshSnapshot || accessSnapshot) {
          await postBackendLogout(accessSnapshot, refreshSnapshot).catch(() => {});
        }
      } finally {
        await tokenStore.clearStoredAuthTokens(true).catch(() => {});
        logoutInFlight = null;
      }
    })();

    return logoutInFlight;
  };

  const handleForcedUnauthorized = async (
    currentUserId?: string | null,
  ): Promise<void> => {
    stopSse?.();
    tokenStore.invalidateSessionEpoch();
    setAuthToken(null);
    await Promise.allSettled([
      tokenStore.clearStoredAuthTokens(true),
      clearChatHistoryOnLogout ? clearChatHistoryOnLogout(currentUserId) : Promise.resolve(),
    ]);
    onUserState(null);
    onInitialAuthRoute('NewUserLogin');
  };

  return {
    restoreSession,
    login,
    logout,
    handleForcedUnauthorized,
    isEpochCurrent,
  };
}
