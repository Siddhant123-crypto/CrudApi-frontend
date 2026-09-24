import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from './AuthContext';
interface NotificationContextType {
  unreadCount: number;
  adminSupportUnreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  decrementUnread: () => void;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminSupportUnreadCount, setAdminSupportUnreadCount] = useState(0);
  const { user } = useAuth();
  const refreshUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.log('Failed to fetch unread count (could be blocked user)', error);
    }

    if (user?.role === 'ADMIN') {
      try {
        const { default: api } = await import('../services/api');
        const adminSupportRes = await api.get('/support/admin/unread-counts');
        if (adminSupportRes.data && adminSupportRes.data.data) {
          const counts = adminSupportRes.data.data;
          const sum = Object.values(counts).reduce((a: any, b: any) => a + b, 0) as number;
          setAdminSupportUnreadCount(sum);
        }
      } catch (e) {
        console.log('Failed to fetch admin support counts', e);
      }
    }
  };
  useEffect(() => {
    refreshUnreadCount();
    
    // Set up polling for notifications
    const intervalId = setInterval(() => {
      refreshUnreadCount();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [user]);
  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      decrementUnread();
    } catch (error) {
      console.error('Error marking read:', error);
      throw error;
    }
  };
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all read:', error);
      throw error;
    }
  };
  const decrementUnread = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };
  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        adminSupportUnreadCount,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        decrementUnread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
