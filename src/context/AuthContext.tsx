import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import api, { setUnauthorizedHandler, setAuthToken } from '../services/api';
import {
  clearStoredAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
} from '../services/tokenStorage';
import { clearChatTimestampOnLogout } from '../services/aiService';
import { getCurrentUserProfile } from '../services/userService';
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
    useState<'Welcome' | 'RoleSelection' | 'NewUserLogin'>(
      'Welcome',
    );
  useEffect(() => {
    loadStoredUser();
    setUnauthorizedHandler(() => {
      setUser(null);
      setInitialAuthRoute('NewUserLogin');
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);
  const loadStoredUser = async () => {
    try {
      const storedUser =
        await AsyncStorage.getItem(
          'userData',
        );
      const storedToken = await getAccessToken();
      if (__DEV__) {
        console.log('APP START - USER:', storedUser ? 'YES' : 'NO');
        console.log('APP START - TOKEN:', storedToken ? 'YES' : 'NO');
      }
      if (storedUser && storedToken) {
        const rawParsed = JSON.parse(storedUser);
        const rawRole = typeof rawParsed?.role === 'string' ? rawParsed.role.trim().toUpperCase() : '';
        const normalizedRole: 'USER' | 'FARMER' | 'ADMIN' | null =
          rawRole === 'CUSTOMER' || rawRole === 'USER'
            ? 'USER'
            : rawRole === 'FARMER'
              ? 'FARMER'
              : rawRole === 'ADMIN'
                ? 'ADMIN'
                : null;
        if (!normalizedRole) {
          await clearStoredAuthTokens();
          setAuthToken(null);
          setUser(null);
          return;
        }
        setAuthToken(storedToken, false);
        const parsedUser = { ...rawParsed, role: normalizedRole };
        setUser(parsedUser);
        if (__DEV__) {
          console.log('Stored login restored cleanly');
        }

        // Seamless background refresh from /user/me to sync profilePhoto and latest details.
        // Admins live in a separate `admin` table, so /user/me would always 404 for them — skip it.
        const isAdminSession = parsedUser.role === 'ADMIN';
        if (!isAdminSession) getCurrentUserProfile().then(meData => {
          const profile = meData?.response || meData;
          if (profile && (profile.profilePhoto !== parsedUser.profilePhoto || profile.name !== parsedUser.name || profile.farmerId !== parsedUser.farmerId)) {
            const { role: _ignoredRole, ...safeProfile } = profile;
            const merged = { ...parsedUser, ...safeProfile, role: parsedUser.role };
            setUser(merged);
            AsyncStorage.setItem('userData', JSON.stringify(merged)).catch(() => {});
          }
        }).catch(() => {});
      } else {
        await clearStoredAuthTokens();
        setUser(null);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.log('Error loading stored user:', error?.message);
      }
      await clearStoredAuthTokens().catch(() => {});
      setUser(null);
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
      const rawRole = typeof userData?.role === 'string' ? userData.role.trim().toUpperCase() : '';
      const normalizedRole: 'USER' | 'FARMER' | 'ADMIN' | null =
        rawRole === 'CUSTOMER' || rawRole === 'USER'
          ? 'USER'
          : rawRole === 'FARMER'
            ? 'FARMER'
            : rawRole === 'ADMIN'
              ? 'ADMIN'
              : null;
      if (!normalizedRole) {
        throw new Error('Invalid or missing user role');
      }
      const sanitizedUser: User = { ...userData, role: normalizedRole };
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(sanitizedUser),
      );
      if (token) {
        setAuthToken(token, true);
        await saveAuthTokens(token, refreshToken);
      }
      setUser(sanitizedUser);
      setInitialAuthRoute(
        'Welcome',
      );

      // Immediately sync latest profilePhoto & IDs from /user/me after login (non-admin)
      const isAdminSession = sanitizedUser.role === 'ADMIN';
      if (!isAdminSession && token) {
        getCurrentUserProfile()
          .then((meData) => {
            const profile = meData?.response || meData;
            if (profile) {
              const { role: _ignoredRole, ...safeProfile } = profile;
              setUser((prev) => {
                if (!prev) return prev;
                const merged: User = {
                  ...prev,
                  ...safeProfile,
                  profilePhoto: safeProfile.profilePhoto || prev.profilePhoto,
                  name: safeProfile.name || prev.name,
                  role: prev.role,
                };
                AsyncStorage.setItem('userData', JSON.stringify(merged)).catch(() => {});
                return merged;
              });
            }
          })
          .catch(() => {});
      }

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
    const prevUserId = user?.userId;
    const [accessTokenSnapshot, refreshTokenSnapshot] = await Promise.all([
      getAccessToken().catch(() => null),
      getRefreshToken().catch(() => null),
    ]);
    // Clear in-memory token and unmount authenticated screens immediately
    // so background intervals stop before network/storage cleanup completes.
    setAuthToken(null);
    setUser(null);
    setInitialAuthRoute('NewUserLogin');

    try {
      // Best-effort server-side refresh-token family revocation (works even with expired access JWT)
      if (refreshTokenSnapshot || accessTokenSnapshot) {
        await api
          .post(
            '/auth/logout',
            { refreshToken: refreshTokenSnapshot || undefined },
            {
              timeout: 4000,
              ...(accessTokenSnapshot
                ? { headers: { Authorization: `Bearer ${accessTokenSnapshot}` } }
                : {}),
            },
          )
          .catch(() => {});
      }
      if (__DEV__) {
        console.log('LOGOUT SUCCESSFUL');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.log('Logout error:', error?.message);
      }
    } finally {
      await clearChatTimestampOnLogout(prevUserId).catch(() => {});
      await clearStoredAuthTokens().catch(() => {});
    }
  };
  const updateUserData = async (
    updatedData: Partial<User>,
  ) => {
    try {
      setUser((prev) => {
        if (!prev) {
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
        AsyncStorage.setItem(
          'userData',
          JSON.stringify(mergedUser),
        ).catch(() => {});
        return mergedUser;
      });
    } catch (error: any) {
      if (__DEV__) {
        console.log('Error updating user:', error?.message);
      }
    }
  };
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
