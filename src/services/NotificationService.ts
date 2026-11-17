import api from './api';
import { NotificationResponse, NotificationSendRequest } from '../types';
export const NotificationService = {
  getNotifications: async (): Promise<NotificationResponse[]> => {
    try {
      const response = await api.get('/notifications');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
  getSentNotifications: async (): Promise<any[]> => {
    try {
      const response = await api.get('/notifications/sent');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
      throw error;
    }
  },
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get('/notifications/unread/count');
      return response.data?.data?.count || 0;
    } catch (error) {
      console.log('Error fetching unread count:', error);
      return 0;
    }
  },
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      try {
        await api.put('/farmer/notifications/read-all');
      } catch (err2) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    }
  },
  getFarmerNotifications: async (page = 0, size = 10, unreadOnly = false): Promise<any> => {
    try {
      const response = await api.get('/farmer/notifications', {
        params: { page, size, unreadOnly },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching farmer notifications:', error);
      throw error;
    }
  },
  markFarmerNotificationAsRead: async (notificationId: string): Promise<void> => {
    try {
      await api.patch(`/farmer/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking farmer notification as read:', error);
      throw error;
    }
  },
  sendNotification: async (request: NotificationSendRequest): Promise<any> => {
    try {
      const response = await api.post('/notifications/send', request);
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
};
