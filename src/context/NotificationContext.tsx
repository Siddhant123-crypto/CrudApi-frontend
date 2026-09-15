import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from './AuthContext';
interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  decrementUnread: () => void;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
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
  };
  useEffect(() => {
    refreshUnreadCount();
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
