import React, {createContext, useState, useEffect, useContext, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User} from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (updatedData: Partial<User>) => Promise<void>;
  isLoggedIn: boolean;
  initialAuthRoute: 'Welcome' | 'RoleSelection';
  setInitialAuthRoute: (route: 'Welcome' | 'RoleSelection') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialAuthRoute, setInitialAuthRoute] = useState<'Welcome' | 'RoleSelection'>('Welcome');

  // Load persisted user on app start
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token?: string) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      if (token) {
        await AsyncStorage.setItem('userToken', token);
      }

      setInitialAuthRoute('Welcome');
      setUser(userData);
    } catch (error) {
      console.log('Error saving user data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
      setInitialAuthRoute('RoleSelection');
      setUser(null);
    } catch (error) {
      console.log('Error during logout:', error);
    }
  };

  const updateUserData = async (updatedData: Partial<User>) => {
    try {
      if (user) {
        const merged = {...user, ...updatedData};
        await AsyncStorage.setItem('userData', JSON.stringify(merged));
        setUser(merged);
      }
    } catch (error) {
      console.log('Error updating user data:', error);
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
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
