import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Platform
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationGroup } from '../components/NotificationGroupCard';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { NotificationResponse } from '../types';
const NotificationThreadScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { refreshUnreadCount } = useNotification();
  const group = route.params?.group as NotificationGroup;
  const [notifications, setNotifications] = useState<NotificationResponse[]>(group?.notifications || []);
  useEffect(() => {
    if (group && group.unreadCount > 0) {
      markThreadAsRead();
    }
  }, []);
  const markThreadAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      if (unreadNotifs.length > 0) {
        await Promise.all(unreadNotifs.map(n => NotificationService.markAsRead(n.notificationId)));
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        refreshUnreadCount();
      }
    } catch (error) {
      console.log('Failed to mark thread as read:', error);
    }
  };
  const isAdmin = user?.role === 'ADMIN';

  const handleNotificationPress = (notification: NotificationResponse) => {
    if (isAdmin && notification.type === 'ADMIN' && notification.senderType === 'FARMER' && notification.senderId) {
      navigation.navigate('AdminSupportChatScreen', { farmerId: notification.senderId, farmerName: 'Farmer' });
    } else if (!isAdmin && notification.type === 'ADMIN' && notification.title === 'Admin Support Reply') {
      navigation.navigate('FarmerSupportChatScreen');
    } else {
      navigation.navigate('NotificationDetail', { notification });
    }
  };
  const handleNotificationDelete = (notification: NotificationResponse) => {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setNotifications(prev => prev.filter(n => n.notificationId !== notification.notificationId));
                  const api = (await import('../services/api')).default;
                await api.delete(`/notifications/${notification.notificationId}`);
              } catch (error) {
                console.log('Failed to delete notification:', error);
              }
            }
          }
        ]
      );
    });
  };
  if (!group) return null;
  const isFarmer = user?.role === 'FARMER';
  const headerBgColor = isAdmin ? '#17212F' : (isFarmer ? '#1E5631' : '#1E3A8A');
  const headerTextColor = '#FFFFFF';
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
      <View style={[styles.header, { backgroundColor: headerBgColor }]}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={headerTextColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTextColor }]}>{group.senderName}</Text>
        </View>
      </View>
      <View style={styles.mainContent}>
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={handleNotificationPress}
              onDelete={handleNotificationDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    paddingBottom: 24,
  },
});
export default NotificationThreadScreen;
