import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  unreadCount: number;
  adminSupportUnreadCount: number;
  adminSupportUnassignedCount: number;
  adminSupportUserCounts: Record<string, number>;
  blockedFarmerUnreadCount: number;
  hasNewAdminGroupMsg: boolean;
  farmerNewOrdersCount: number;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  decrementUnread: () => void;
  markAdminGroupAsRead: () => Promise<void>;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminSupportUnreadCount, setAdminSupportUnreadCount] = useState(0);
  const [adminSupportUnassignedCount, setAdminSupportUnassignedCount] = useState(0);
  const [adminSupportUserCounts, setAdminSupportUserCounts] = useState<Record<string, number>>({});
  const [blockedFarmerUnreadCount, setBlockedFarmerUnreadCount] = useState(0);
  const [hasNewAdminGroupMsg, setHasNewAdminGroupMsg] = useState(false);
  const [farmerNewOrdersCount, setFarmerNewOrdersCount] = useState(0);
  const { user } = useAuth();

  const refreshUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      setAdminSupportUnreadCount(0);
      setAdminSupportUnassignedCount(0);
      setAdminSupportUserCounts({});
      setBlockedFarmerUnreadCount(0);
      setHasNewAdminGroupMsg(false);
      setFarmerNewOrdersCount(0);
      return;
    }

    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.log('Failed to fetch unread count (could be blocked user)', error);
    }

    if (user?.role === 'FARMER') {
      try {
        const { default: api } = await import('../services/api');
        const countRes = await api.get('/order/farmer/new-orders-count');
        if (countRes.data !== undefined) {
          setFarmerNewOrdersCount(countRes.data);
        }
      } catch (e) {
        console.log('Failed to fetch farmer new orders count', e);
      }
    }

    if (user?.role === 'ADMIN') {
      try {
        const { default: api } = await import('../services/api');
        const adminSupportRes = await api.get('/support/admin/unread-counts');
        if (adminSupportRes.data && adminSupportRes.data.data) {
          const countsData = adminSupportRes.data.data;
          setAdminSupportUnreadCount(countsData.myAssignedCount || 0);
          setAdminSupportUnassignedCount(countsData.unassignedCount || 0);
          setAdminSupportUserCounts(countsData.userCounts || {});
          setBlockedFarmerUnreadCount(countsData.blockedFarmerCount || 0);
        }

        // Fetch Admin Group messages to check for new messages
        const groupRes = await api.get('/admin/group/messages');
        let messages = groupRes.data;
        if (messages && !Array.isArray(messages)) {
          messages = messages.data || messages.response || [];
        }
        if (Array.isArray(messages) && messages.length > 0) {
          const latestMsg = messages[messages.length - 1];
          const latestMsgId = latestMsg.id;
          const senderId = latestMsg.senderAdminId;
          const lastReadMsgId = await AsyncStorage.getItem(`lastReadAdminGroupMsgId_${user.email}`);
          // If the latest message is different from the last read message, and it's not our own message
          if (latestMsgId && latestMsgId !== lastReadMsgId && senderId?.toLowerCase() !== user.userId?.toLowerCase()) {
            setHasNewAdminGroupMsg(true);
          } else {
            setHasNewAdminGroupMsg(false);
          }
        }
      } catch (e) {
        console.log('Failed to fetch admin support counts or group messages', e);
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

  const markAdminGroupAsRead = async () => {
    try {
      const { default: api } = await import('../services/api');
      const groupRes = await api.get('/admin/group/messages');
      let messages = groupRes.data;
      if (messages && !Array.isArray(messages)) {
        messages = messages.data || messages.response || [];
      }
      if (Array.isArray(messages) && messages.length > 0) {
        const latestMsgId = messages[messages.length - 1].id;
        if (latestMsgId && user?.email) {
          await AsyncStorage.setItem(`lastReadAdminGroupMsgId_${user.email}`, latestMsgId);
          setHasNewAdminGroupMsg(false);
        }
      }
    } catch (e) {
      console.error('Error marking admin group as read:', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        adminSupportUnreadCount,
        adminSupportUnassignedCount,
        adminSupportUserCounts,
        blockedFarmerUnreadCount,
        hasNewAdminGroupMsg,
        farmerNewOrdersCount,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        decrementUnread,
        markAdminGroupAsRead,
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
