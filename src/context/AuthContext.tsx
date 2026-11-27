import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import api, { refreshAccessTokenSingleFlight, setUnauthorizedHandler, setAuthToken } from '../services/api';
import {
  ACCESS_TOKEN_KEY,
  LEGACY_TOKEN_KEY,
  LOGGED_OUT_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
  beginLoginSession,
  clearStoredAuthTokens,
  getAccessToken,
  getRefreshToken,
  getSessionEpoch,
  invalidateSessionEpoch,
  isLoggedOutPersisted,
  isSessionLoggedOutInMemory,
  saveAuthTokens,
  snapshotAndInvalidateForLogout,
} from '../services/tokenStorage';
import {
  AuthRouteTarget,
  createAuthSessionController,
  normalizeAllowedRole,
} from '../services/authSessionCore';
import { clearChatTimestampOnLogout } from '../services/aiService';
import { getCurrentUserProfile } from '../services/userService';
import { sseNotificationClient } from '../services/sseNotificationClient';
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    userData: User,
    token?: string,
    refreshToken?: string | null,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (
    updatedData: Partial<User>,
  ) => Promise<void>;
  isLoggedIn: boolean;
  initialAuthRoute:
    | 'Welcome'
    | 'RoleSelection'
    | 'NewUserLogin';
  setInitialAuthRoute: (
    route: 'Welcome' | 'RoleSelection' | 'NewUserLogin',
  ) => void;
}
const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );
export const AuthProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [user, setUser] =
    useState<User | null>(null);
  const [isLoading, setIsLoading] =
    useState<boolean>(true);
  const [initialAuthRoute, setInitialAuthRoute] =
    useState<AuthRouteTarget>('Welcome');
  const userRef = useRef<User | null>(null);

  const setUserSafely = (next: User | null) => {
    userRef.current = next;
    setUser(next);
  };

  const sessionControllerRef = useRef(
    createAuthSessionController({
      tokenStore: {
        getSessionEpoch,
        isLoggedOutInMemory: isSessionLoggedOutInMemory,
        isLoggedOutPersisted,
        beginLoginSession,
        invalidateSessionEpoch,
        snapshotAndInvalidateForLogout,
        getAccessToken,
        getRefreshToken,
        saveAuthTokens,
        setInMemoryAccessToken: () => {},
        clearStoredAuthTokens,
      },
      asyncStorage: {
        getItem: (k) => AsyncStorage.getItem(k),
        setItem: (k, v) => AsyncStorage.setItem(k, v),
        removeItem: (k) => AsyncStorage.removeItem(k),
        multiRemove: (keys) => AsyncStorage.multiRemove(keys),
      },
      setAuthToken,
      postBackendLogout: async (accessTokenSnapshot, refreshTokenSnapshot) => {
        await api.post(
          '/auth/logout',
          { refreshToken: refreshTokenSnapshot || undefined },
          {
            timeout: 2500,
            _skipRetry: true,
            _skipAuthRefresh: true,
            ...(accessTokenSnapshot
              ? { headers: { Authorization: `Bearer ${accessTokenSnapshot}` } }
              : {}),
          } as any,
        );
      },
      fetchCurrentProfile: getCurrentUserProfile,
      clearChatHistoryOnLogout: clearChatTimestampOnLogout,
      stopSse: () => sseNotificationClient.stop(),
      refreshBeforeRestore: refreshAccessTokenSingleFlight,
      onUserState: (nextUser) => setUserSafely(nextUser as User | null),
      onInitialAuthRoute: (route) => setInitialAuthRoute(route),
    }),
  );

  useEffect(() => {
    loadStoredUser();
    setUnauthorizedHandler(() => {
      void sessionControllerRef.current.handleForcedUnauthorized(userRef.current?.userId);
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);
  const loadStoredUser = async () => {
    try {
      const result = await sessionControllerRef.current.restoreSession();
      if (__DEV__) {
        console.log('APP START - SESSION RESTORED:', result.authenticated ? 'YES' : 'NO');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.log('Error loading stored user:', error?.message);
      }
      await clearStoredAuthTokens(false).catch(() => {});
      setUserSafely(null);
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (
    userData: User,
    token?: string,
    refreshToken?: string | null,
  ) => {
    try {
      const normalizedRole = normalizeAllowedRole(userData?.role);
      if (!normalizedRole) {
        throw new Error('Invalid or missing user role');
      }
      await sessionControllerRef.current.login(
        { ...userData, role: normalizedRole },
        token,
        refreshToken,
      );
      if (__DEV__) {
        console.log('AUTH LOGIN SUCCESSFUL');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.log('Error saving login:', error?.message);
      }
      throw error;
    }
  };
  const logout = async () => {
    const prevUserId = userRef.current?.userId;
    try {
      await sessionControllerRef.current.logout(prevUserId);
      if (__DEV__) {
        console.log('LOGOUT SUCCESSFUL');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.log('Logout error:', error?.message);
      }
    } finally {
      await clearChatTimestampOnLogout(prevUserId).catch(() => {});
      await clearStoredAuthTokens(true).catch(() => {});
    }
  };
  const updateUserData = async (
    updatedData: Partial<User>,
  ) => {
    const updateEpoch = getSessionEpoch();
    try {
      setUser((prev) => {
        if (!prev || isSessionLoggedOutInMemory() || getSessionEpoch() !== updateEpoch) {
          return prev;
        }
        const cleanedUpdates: Partial<User> = { ...updatedData };
        if (cleanedUpdates.profilePhoto === undefined) {
          delete cleanedUpdates.profilePhoto;
        }
        const mergedUser: User = {
          ...prev,
          ...cleanedUpdates,
        };
        userRef.current = mergedUser;
        if (!isSessionLoggedOutInMemory() && getSessionEpoch() === updateEpoch) {
          AsyncStorage.setItem(
            USER_DATA_KEY,
            JSON.stringify(mergedUser),
          ).catch(() => {});
        }
        return mergedUser;
      });
    } catch (error: any) {
      if (__DEV__) {
        console.log('Error updating user:', error?.message);
      }
    }
  };
  void ACCESS_TOKEN_KEY;
  void REFRESH_TOKEN_KEY;
  void LEGACY_TOKEN_KEY;
  void LOGGED_OUT_KEY;
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateUserData,
        isLoggedIn: !!user,
        initialAuthRoute,
        setInitialAuthRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth =
  (): AuthContextType => {
    const context =
      useContext(AuthContext);
    if (!context) {
      throw new Error(
        'useAuth must be used within an AuthProvider',
      );
    }
    return context;
  };
export default AuthContext;
