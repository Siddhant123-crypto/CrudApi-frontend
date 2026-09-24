import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NotificationService } from '../services/NotificationService';
import { NotificationResponse } from '../types';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationGroupCard, NotificationGroup } from '../components/NotificationGroupCard';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const { refreshUnreadCount, markAllAsRead: contextMarkAllAsRead } = useNotification();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const fetchNotifications = async () => {
    try {
      const data = await NotificationService.getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setNotifications([]);
      } else {
        setError('Failed to load notifications. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      refreshUnreadCount();
    }, [])
  );
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
    refreshUnreadCount();
  };
  const handleMarkAllAsRead = async () => {
    try {
      await contextMarkAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.log('Failed to mark all as read:', error);
    }
  };
  const handleNotificationPress = (notification: NotificationResponse) => {
    if (isAdmin && notification.type === 'ADMIN' && notification.senderType === 'FARMER' && notification.senderId) {
      navigation.navigate('AdminSupportChatScreen', { farmerId: notification.senderId, farmerName: 'Farmer' });
    } else {
      navigation.navigate('NotificationDetail', { notification });
    }
  };
  const handleGroupPress = (group: NotificationGroup) => {
    navigation.navigate('NotificationThread', { group });
  };
  const getGroupedItems = () => {
    const groups = new Map<string, NotificationGroup>();
    const individualItems: any[] = [];
    notifications.forEach(notif => {
      const match = notif.message.match(/^From:\s(.*?)\n\n/);
      if (match && match[1]) {
        const senderName = match[1].trim();
        const groupId = notif.senderId || senderName;
        if (groups.has(groupId)) {
          const group = groups.get(groupId)!;
          group.notifications.push(notif);
          if (!notif.isRead) group.unreadCount++;
          const currentLatest = new Date(group.latestNotification.createdAt).getTime();
          const notifTime = new Date(notif.createdAt).getTime();
          if (notifTime > currentLatest) {
            group.latestNotification = notif;
          }
        } else {
          groups.set(groupId, {
            id: groupId,
            isGroup: true,
            senderName,
            senderId: notif.senderId,
            notifications: [notif],
            latestNotification: notif,
            unreadCount: notif.isRead ? 0 : 1
          });
        }
      } else {
        individualItems.push(notif);
      }
    });
    const allItems: any[] = [...individualItems];
    groups.forEach(group => {
      allItems.push(group);
    });
    allItems.sort((a, b) => {
      const timeA = new Date(a.isGroup ? a.latestNotification.createdAt : a.createdAt).getTime();
      const timeB = new Date(b.isGroup ? b.latestNotification.createdAt : b.createdAt).getTime();
      return timeB - timeA;
    });
    return allItems;
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
                fetchNotifications();
              }
            }
          }
        ]
      );
    });
  };
  const displayItems = getGroupedItems();
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>You're all caught up</Text>
      <Text style={styles.emptySubtitle}>No new notifications right now.</Text>
    </View>
  );
  const isFarmer = user?.role === 'FARMER';
  const isAdmin = user?.role === 'ADMIN';
  const headerBgColor = isAdmin ? '#17212F' : (isFarmer ? '#1E5631' : '#1E3A8A');
  const headerTextColor = '#FFFFFF';
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
      <View style={[styles.header, { backgroundColor: headerBgColor, borderBottomColor: headerBgColor }]}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={headerTextColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTextColor }]}>Notifications</Text>
        </View>
        <View style={styles.headerRightContainer}>
          {notifications.some(n => !n.isRead) && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerRight}>
              <Text style={[styles.markAllText, { color: headerTextColor }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {isAdmin && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation.navigate('AdminSendNotification')} style={[styles.historyIconBtn, { marginRight: 12 }]}>
                <Ionicons name="chatbubbles-outline" size={24} color={headerTextColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowHistoryDropdown(true)} style={styles.historyIconBtn}>
                <Ionicons name="time-outline" size={24} color={headerTextColor} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      {/* Admin History Dropdown */}
      {showHistoryDropdown && (
        <Modal transparent visible={showHistoryDropdown} onRequestClose={() => setShowHistoryDropdown(false)}>
          <TouchableWithoutFeedback onPress={() => setShowHistoryDropdown(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowHistoryDropdown(false);
                    navigation.navigate('AdminMessageHistory');
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#1E293B" style={{marginRight: 8}} />
                  <Text style={styles.dropdownItemText}>Message History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
      <View style={styles.mainContent}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2D983A" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={displayItems}
            keyExtractor={(item, index) => item.isGroup ? `group-${item.id}` : item.notificationId}
            renderItem={({ item }) => {
              if (item.isGroup) {
                return <NotificationGroupCard group={item} onPress={handleGroupPress} />;
              }
              return (
                <NotificationCard
                  notification={item}
                  onPress={handleNotificationPress}
                  onDelete={handleNotificationDelete}
                />
              );
            }}
            contentContainerStyle={displayItems.length === 0 ? styles.flex1 : styles.listContent}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D983A']} />
            }
          />
        )}
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
  mainContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  headerRight: {
    paddingVertical: 4,
  },
  markAllText: {
    color: '#2D983A',
    fontWeight: '600',
    fontSize: 14,
  },
  headerRightPlaceholder: {
    width: 80,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  flex1: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2D983A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconBtn: {
    marginLeft: 16,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 60 : 100, // Adjust based on header height
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    minWidth: 160,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
});
export default NotificationsScreen;
