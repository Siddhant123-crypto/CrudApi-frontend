import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { setUnauthorizedHandler, setAuthToken } from '../services/api';
import { clearChatTimestampOnLogout } from '../services/aiService';
import { getCurrentUserProfile } from '../services/userService';
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    userData: User,
    token?: string,
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
      const storedToken =
        await AsyncStorage.getItem(
          'userToken',
        );
      console.log(
        'APP START - USER:',
        storedUser ? 'YES' : 'NO',
      );
      console.log(
        'APP START - TOKEN:',
        storedToken ? 'YES' : 'NO',
      );
      if (storedUser && storedToken) {
        setAuthToken(storedToken, false);
        const rawParsed = JSON.parse(storedUser);
        const normalizedRole =
          typeof rawParsed?.role === 'string' && rawParsed.role.toUpperCase() === 'CUSTOMER'
            ? 'USER'
            : rawParsed?.role;
        const parsedUser = { ...rawParsed, role: normalizedRole };
        setUser(parsedUser);
        console.log(
          'Stored login restored successfully',
        );

        // Seamless background refresh from /user/me to sync profilePhoto and latest details.
        // Admins live in a separate `admin` table, so /user/me would always 404 for them — skip it.
        const isAdminSession = String(parsedUser?.role || '').toUpperCase() === 'ADMIN';
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
        await AsyncStorage.removeItem(
          'userData',
        );
        await AsyncStorage.removeItem(
          'userToken',
        );
        setUser(null);
      }
    } catch (error) {
      console.log(
        'Error loading stored user:',
        error,
      );
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (
    userData: User,
    token?: string,
  ) => {
    try {
      console.log(
        'AUTH LOGIN STARTED',
      );
      console.log(
        'USER:',
        userData,
      );
      console.log(
        'TOKEN EXISTS:',
        token ? 'YES' : 'NO',
      );
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(userData),
      );
      if (token) {
        setAuthToken(token, true);
        await AsyncStorage.setItem(
          'userToken',
          token,
        );
      }
      const savedToken =
        await AsyncStorage.getItem(
          'userToken',
        );
      console.log(
        'SAVED USER TOKEN:',
        savedToken ? 'YES' : 'NO',
      );
      console.log(
        'TOKEN LENGTH:',
        savedToken
          ? savedToken.length
          : 0,
      );
      setUser(userData);
      setInitialAuthRoute(
        'Welcome',
      );

      // Immediately sync latest profilePhoto & IDs from /user/me after login (non-admin)
      const isAdminSession = String(userData?.role || '').toUpperCase() === 'ADMIN';
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

      console.log(
        'AUTH LOGIN SUCCESSFUL',
      );
    } catch (error) {
      console.log(
        'Error saving login:',
        error,
      );
      throw error;
    }
  };
  const logout = async () => {
    const prevUserId = user?.userId;
    try {
      // Clear in-memory token and unmount authenticated screens immediately
      // so background intervals stop before AsyncStorage cleanup completes.
      setAuthToken(null);
      setUser(null);
      setInitialAuthRoute(
        'NewUserLogin',
      );
      await clearChatTimestampOnLogout(prevUserId);
      await AsyncStorage.multiRemove([
        'userData',
        'userToken',
      ]);
      
      console.log(
        'LOGOUT SUCCESSFUL',
      );
    } catch (error) {
      console.log(
        'Logout error:',
        error,
      );
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
      console.log(
        'USER DATA UPDATED',
      );
    } catch (error) {
      console.log(
        'Error updating user:',
        error,
      );
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
