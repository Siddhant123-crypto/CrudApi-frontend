import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCESS_TOKEN_KEY,
  LOGGED_OUT_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
  createAuthSessionController,
  createTokenStore,
  isJwtExpired,
  type AsyncStorageLike,
  type AuthRouteTarget,
  type SecureStoreLike,
  type SessionUser,
} from './authSessionCore.ts';

const LEGACY_TOKEN_KEY = 'userToken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOBILE_ROOT = path.resolve(__dirname, '../..');

function createPersistentDeviceDisk() {
  const secureMap = new Map<string, string>();
  const asyncMap = new Map<string, string>();

  const secureStore: SecureStoreLike = {
    async getItemAsync(key: string) {
      return secureMap.has(key) ? secureMap.get(key)! : null;
    },
    async setItemAsync(key: string, value: string) {
      secureMap.set(key, value);
    },
    async deleteItemAsync(key: string) {
      secureMap.delete(key);
    },
  };

  const asyncStorage: AsyncStorageLike = {
    async getItem(key: string) {
      return asyncMap.has(key) ? asyncMap.get(key)! : null;
    },
    async setItem(key: string, value: string) {
      asyncMap.set(key, value);
    },
    async removeItem(key: string) {
      asyncMap.delete(key);
    },
    async multiRemove(keys: string[]) {
      for (const k of keys) {
        asyncMap.delete(k);
      }
    },
  };

  return { secureMap, asyncMap, secureStore, asyncStorage };
}

function bootAppProcess(
  disk: ReturnType<typeof createPersistentDeviceDisk>,
  options?: {
    postBackendLogout?: (access: string | null, refresh: string | null) => Promise<void>;
    fetchCurrentProfile?: () => Promise<any>;
    clearChatHistoryOnLogout?: (userId?: string | null) => Promise<void>;
  },
) {
  let currentUser: SessionUser | null = null;
  let initialRoute: AuthRouteTarget = 'Welcome';
  let activeInMemoryToken: string | null = null;
  let sseStopped = 0;

  const tokenStore = createTokenStore({
    secureStore: disk.secureStore,
    asyncStorage: disk.asyncStorage,
    legacyTokenKey: LEGACY_TOKEN_KEY,
  });

  const controller = createAuthSessionController({
    tokenStore,
    asyncStorage: disk.asyncStorage,
    setAuthToken: (t) => {
      activeInMemoryToken = t;
    },
    postBackendLogout:
      options?.postBackendLogout ?? (async () => {}),
    fetchCurrentProfile: options?.fetchCurrentProfile,
    clearChatHistoryOnLogout: options?.clearChatHistoryOnLogout,
    refreshBeforeRestore: (options as any)?.refreshBeforeRestore,
    stopSse: () => {
      sseStopped += 1;
    },
    onUserState: (u) => {
      currentUser = u;
    },
    onInitialAuthRoute: (r) => {
      initialRoute = r;
    },
  });

  return {
    tokenStore,
    controller,
    getState: () => ({
      currentUser,
      initialRoute,
      activeInMemoryToken,
      sseStopped,
    }),
  };
}

for (const roleCase of [
  {
    label: 'CUSTOMER',
    userData: { userId: 'cust-1', name: 'Customer One', email: 'cust1@farm2home.com', role: 'USER' },
    expectedRole: 'USER',
  },
  {
    label: 'FARMER',
    userData: { farmerId: 'farm-1', name: 'Farmer One', email: 'farmer1@farm2home.com', role: 'FARMER' },
    expectedRole: 'FARMER',
  },
  {
    label: 'ADMIN',
    userData: { userId: 'admin-1', name: 'Admin One', email: 'admin@farm2home.com', role: 'ADMIN' },
    expectedRole: 'ADMIN',
  },
]) {
  test(`${roleCase.label}: Login -> Logout -> Tokens & userData deleted -> App Restart stays on Login Screen`, async () => {
    const disk = createPersistentDeviceDisk();
    let backendLogoutCalls = 0;
    const process1 = bootAppProcess(disk, {
      postBackendLogout: async (acc, ref) => {
        backendLogoutCalls += 1;
        assert.equal(acc, `acc-${roleCase.label}`);
        assert.equal(ref, `ref-${roleCase.label}`);
      },
    });

    await process1.controller.login(roleCase.userData, `acc-${roleCase.label}`, `ref-${roleCase.label}`);
    assert.equal(process1.getState().currentUser?.role, roleCase.expectedRole);
    assert.equal(disk.secureMap.get(ACCESS_TOKEN_KEY), `acc-${roleCase.label}`);
    assert.equal(disk.secureMap.get(REFRESH_TOKEN_KEY), `ref-${roleCase.label}`);
    assert.ok(disk.asyncMap.has(USER_DATA_KEY));

    await process1.controller.logout(roleCase.userData.userId);
    assert.equal(backendLogoutCalls, 1);
    assert.equal(process1.getState().currentUser, null);
    assert.equal(process1.getState().activeInMemoryToken, null);
    assert.equal(process1.getState().initialRoute, 'NewUserLogin');
    assert.equal(process1.getState().sseStopped, 1);

    // SecureStore & AsyncStorage MUST be completely wiped
    assert.equal(disk.secureMap.get(ACCESS_TOKEN_KEY) ?? null, null);
    assert.equal(disk.secureMap.get(REFRESH_TOKEN_KEY) ?? null, null);
    assert.equal(disk.asyncMap.has(USER_DATA_KEY), false);
    assert.equal(disk.asyncMap.has(LEGACY_TOKEN_KEY), false);
    assert.equal(disk.asyncMap.get(LOGGED_OUT_KEY), 'true');

    // Cold restart with completely fresh process reading the same persistent disk
    const process2 = bootAppProcess(disk);
    const restored = await process2.controller.restoreSession();
    assert.equal(restored.authenticated, false);
    assert.equal(restored.user, null);
    assert.equal(process2.getState().currentUser, null);
    assert.equal(process2.getState().initialRoute, 'NewUserLogin');
    assert.equal(process2.getState().activeInMemoryToken, null);
  });

  test(`${roleCase.label}: Valid session WITHOUT logout restores cleanly after App Restart`, async () => {
    const disk = createPersistentDeviceDisk();
    const process1 = bootAppProcess(disk);
    await process1.controller.login(roleCase.userData, `valid-acc-${roleCase.label}`, `valid-ref-${roleCase.label}`);

    const process2 = bootAppProcess(disk);
    const restored = await process2.controller.restoreSession();
    assert.equal(restored.authenticated, true);
    assert.equal(restored.user?.role, roleCase.expectedRole);
    assert.equal(process2.getState().currentUser?.role, roleCase.expectedRole);
    assert.equal(process2.getState().activeInMemoryToken, `valid-acc-${roleCase.label}`);
  });
}

test('Logout succeeds locally even when access token is expired, refresh token is expired, or backend logout API fails/offline', async () => {
  const disk = createPersistentDeviceDisk();
  const process1 = bootAppProcess(disk, {
    postBackendLogout: async () => {
      throw new Error('503 Network Unavailable / Expired Token');
    },
  });

  await process1.controller.login(
    { userId: 'cust-exp', name: 'Expired User', role: 'CUSTOMER' },
    'expired.jwt.access',
    'expired-refresh-token',
  );

  // Must NOT throw even though backend logout rejected
  await process1.controller.logout('cust-exp');
  assert.equal(process1.getState().currentUser, null);
  assert.equal(disk.secureMap.get(ACCESS_TOKEN_KEY) ?? null, null);
  assert.equal(disk.secureMap.get(REFRESH_TOKEN_KEY) ?? null, null);
  assert.equal(disk.asyncMap.has(USER_DATA_KEY), false);

  const process2 = bootAppProcess(disk);
  const restored = await process2.controller.restoreSession();
  assert.equal(restored.authenticated, false);
  assert.equal(process2.getState().initialRoute, 'NewUserLogin');
});

test('Rapid logout + immediate process kill before slow backend logout completes still keeps storage wiped on restart', async () => {
  const disk = createPersistentDeviceDisk();
  let backendStarted = false;
  let resolveNeverHangingBackend!: () => void;
  const hangingBackendPromise = new Promise<void>((res) => {
    resolveNeverHangingBackend = res;
  });

  const process1 = bootAppProcess(disk, {
    postBackendLogout: async () => {
      backendStarted = true;
      // Assert persistent storage is ALREADY wiped BEFORE backend call finishes
      assert.equal(disk.secureMap.get(ACCESS_TOKEN_KEY) ?? null, null);
      assert.equal(disk.secureMap.get(REFRESH_TOKEN_KEY) ?? null, null);
      assert.equal(disk.asyncMap.has(USER_DATA_KEY), false);
      assert.equal(disk.asyncMap.get(LOGGED_OUT_KEY), 'true');
      assert.equal(process1.getState().currentUser, null);
      return hangingBackendPromise;
    },
  });

  await process1.controller.login(
    { farmerId: 'farm-rapid', name: 'Rapid Farmer', role: 'FARMER' },
    'rapid-acc',
    'rapid-ref',
  );

  // Start logout (do NOT await backend hanging request — simulate user swiping app from Recent Apps)
  const logoutPromise = process1.controller.logout('farm-rapid');
  // Yield microtasks/storage ops briefly
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(backendStarted, true);

  // App restarted while old process's /auth/logout was aborted by OS kill
  const process2 = bootAppProcess(disk);
  const restored = await process2.controller.restoreSession();
  assert.equal(restored.authenticated, false);
  assert.equal(process2.getState().currentUser, null);
  assert.equal(process2.getState().initialRoute, 'NewUserLogin');

  resolveNeverHangingBackend();
  await logoutPromise;
});

test('Pending refresh token & pending background profile sync finishing AFTER logout cannot resurrect session', async () => {
  const disk = createPersistentDeviceDisk();

  let resolveProfileSync!: (v: any) => void;
  const slowProfilePromise = new Promise<any>((res) => {
    resolveProfileSync = res;
  });

  const process1 = bootAppProcess(disk, {
    fetchCurrentProfile: () => slowProfilePromise,
  });

  await process1.controller.login(
    { userId: 'cust-race', name: 'Race Customer', role: 'USER' },
    'initial-acc',
    'initial-ref',
  );

  const epochBeforeLogout = process1.tokenStore.getSessionEpoch();

  // Execute logout while /user/me profile fetch & refresh are still in flight
  await process1.controller.logout('cust-race');
  assert.equal(process1.getState().currentUser, null);

  // Simulate late completion of a refresh request that started in the old epoch
  const lateSaveAccepted = await process1.tokenStore.saveAuthTokens(
    'resurrected-access',
    'resurrected-refresh',
    epochBeforeLogout,
  );
  assert.equal(lateSaveAccepted, false);
  assert.equal(disk.secureMap.get(ACCESS_TOKEN_KEY) ?? null, null);
  assert.equal(disk.secureMap.get(REFRESH_TOKEN_KEY) ?? null, null);

  // Simulate late completion of slow /user/me fetch
  resolveProfileSync({ response: { name: 'Resurrected', profilePhoto: 'x.jpg', userId: 'cust-race' } });
  await new Promise((r) => setTimeout(r, 15));

  assert.equal(process1.getState().currentUser, null);
  assert.equal(disk.asyncMap.has(USER_DATA_KEY), false);

  const process2 = bootAppProcess(disk);
  const restored = await process2.controller.restoreSession();
  assert.equal(restored.authenticated, false);
});

test('Repeated logout is idempotent and handles stubborn SecureStore delete fallback safely', async () => {
  const disk = createPersistentDeviceDisk();
  // Simulate Android keystore glitch where first deleteItemAsync does not clear key until overwritten empty
  const stubbornMap = new Map<string, string>();
  let deleteAttempts = 0;
  disk.secureStore.setItemAsync = async (k, v) => {
    stubbornMap.set(k, v);
  };
  disk.secureStore.getItemAsync = async (k) => stubbornMap.get(k) ?? null;
  disk.secureStore.deleteItemAsync = async (k) => {
    deleteAttempts += 1;
    if (deleteAttempts > 2) {
      stubbornMap.delete(k);
    }
  };

  const process1 = bootAppProcess(disk);
  await process1.controller.login({ userId: 'adm-rep', name: 'Admin', role: 'ADMIN' }, 'adm-acc', 'adm-ref');

  await Promise.all([
    process1.controller.logout('adm-rep'),
    process1.controller.logout('adm-rep'),
  ]);

  assert.equal(process1.getState().currentUser, null);
  assert.equal(await process1.tokenStore.getAccessToken(), null);
  assert.equal(await process1.tokenStore.getRefreshToken(), null);

  const process2 = bootAppProcess(disk);
  const restored = await process2.controller.restoreSession();
  assert.equal(restored.authenticated, false);
  assert.equal(process2.getState().initialRoute, 'NewUserLogin');
});

test('Static wiring check: api.ts enforces sessionEpoch guards and never retries /auth/logout', () => {
  const apiSource = fs.readFileSync(path.join(MOBILE_ROOT, 'src/services/api.ts'), 'utf8');
  assert.match(apiSource, /getSessionEpoch/);
  assert.match(apiSource, /isSessionLoggedOutInMemory/);
  assert.match(apiSource, /invalidateSessionEpoch/);
  assert.match(apiSource, /_skipRetry/);
  assert.match(apiSource, /isJwtExpired/);
});

function buildUnsignedJwt(expOffsetSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const payload = Buffer.from(JSON.stringify({ sub: 'farmer@test.com', role: 'FARMER', exp })).toString('base64url');
  return `${header}.${payload}.sig`;
}

test('isJwtExpired detects expired JWTs vs future JWTs accurately', () => {
  const expired = buildUnsignedJwt(-3600);
  const future = buildUnsignedJwt(900);
  assert.equal(isJwtExpired(expired, 0), true);
  assert.equal(isJwtExpired(future, 15_000), false);
  assert.equal(isJwtExpired('opaque-mock-token', 15_000), false);
});

test('restoreSession proactively refreshes an expired access JWT before mounting UI, and wipes expired refresh sessions', async () => {
  const disk = createPersistentDeviceDisk();
  const expiredJwt = buildUnsignedJwt(-3600);
  const freshJwt = buildUnsignedJwt(900);

  const p1 = bootAppProcess(disk);
  await p1.controller.login({ farmerId: 'f-exp', name: 'Farmer', role: 'FARMER' }, expiredJwt, 'valid-refresh');

  // Restart with valid refresh token -> proactive refresh occurs BEFORE dashboard mounts
  let refreshCalls = 0;
  const p2 = bootAppProcess(disk, {
    refreshBeforeRestore: async () => {
      refreshCalls += 1;
      return freshJwt;
    },
  } as any);
  const restored = await p2.controller.restoreSession();
  assert.equal(refreshCalls, 1);
  assert.equal(restored.authenticated, true);
  assert.equal(p2.getState().activeInMemoryToken, freshJwt);

  // Restart when BOTH access & refresh tokens are expired -> fails cleanly to NewUserLogin with 0 expired dashboard calls
  const p3 = bootAppProcess(disk, {
    refreshBeforeRestore: async () => null,
  } as any);
  const failedRestore = await p3.controller.restoreSession();
  assert.equal(failedRestore.authenticated, false);
  assert.equal(p3.getState().currentUser, null);
  assert.equal(p3.getState().initialRoute, 'NewUserLogin');
  assert.equal(disk.secureMap.get(ACCESS_TOKEN_KEY) ?? null, null);
  assert.equal(disk.secureMap.get(REFRESH_TOKEN_KEY) ?? null, null);
});
