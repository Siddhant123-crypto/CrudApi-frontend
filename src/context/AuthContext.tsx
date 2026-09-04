import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { User } from '../types';

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

  // --------------------------------------------------
  // LOAD USER ON APP START
  // --------------------------------------------------

  useEffect(() => {
    loadStoredUser();
  }, []);

  // --------------------------------------------------
  // LOAD STORED USER
  // --------------------------------------------------

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

      // User and token both must exist
      if (storedUser && storedToken) {
        const parsedUser =
          JSON.parse(storedUser);

        setUser(parsedUser);

        console.log(
          'Stored login restored successfully',
        );
      } else {
        // Clear incomplete login
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

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

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

      // Save user
      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(userData),
      );

      // Save JWT
      if (token) {
        await AsyncStorage.setItem(
          'userToken',
          token,
        );
      }

      // Verify token
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

      // Update state
      setUser(userData);

      setInitialAuthRoute(
        'Welcome',
      );

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

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(
        'userData',
      );

      await AsyncStorage.removeItem(
        'userToken',
      );

      setUser(null);

      setInitialAuthRoute(
        'RoleSelection',
      );

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

  // --------------------------------------------------
  // UPDATE USER
  // --------------------------------------------------

  const updateUserData = async (
    updatedData: Partial<User>,
  ) => {
    try {
      if (!user) {
        return;
      }

      const mergedUser = {
        ...user,
        ...updatedData,
      };

      await AsyncStorage.setItem(
        'userData',
        JSON.stringify(mergedUser),
      );

      setUser(mergedUser);

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

// --------------------------------------------------
// USE AUTH
// --------------------------------------------------

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