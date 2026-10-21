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
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NotificationService } from '../services/NotificationService';
import { NotificationResponse } from '../types';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationGroupCard, NotificationGroup } from '../components/NotificationGroupCard';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { ThemedEmptyState } from '../components/ui/ThemedEmptyState';
import { THEME } from '../constants/theme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerEmptyState } from '../components/farmer/FarmerUI';
import { FARMER_THEME } from '../constants/farmerTheme';

// Admin theme imports
import { AdminPageBackground } from '../components/admin/AdminPageBackground';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminEmptyState } from '../components/admin/AdminEmptyState';
import { ADMIN_THEME, AdminFonts } from '../constants/adminTheme';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const { refreshUnreadCount, markAllAsRead: contextMarkAllAsRead } = useNotification();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const data = await NotificationService.getNotifications();
      setNotifications(data || []);
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
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.log('Failed to mark all as read:', error);
    }
  };

  const isFarmer = user?.role === 'FARMER';
  const isAdmin = user?.role === 'ADMIN';

  const handleNotificationPress = (notification: NotificationResponse) => {
    if (
      isAdmin &&
      notification.type === 'ADMIN' &&
      notification.senderType === 'FARMER' &&
      notification.senderId
    ) {
      navigation.navigate('AdminSupportChatScreen', {
        farmerId: notification.senderId,
        farmerName: 'Farmer',
      });
    } else if (
      !isAdmin &&
      notification.type === 'ADMIN' &&
      notification.title === 'Admin Support Reply'
    ) {
      navigation.navigate('FarmerSupportChatScreen');
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
    notifications.forEach((notif) => {
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
            unreadCount: notif.isRead ? 0 : 1,
          });
        }
      } else {
        individualItems.push(notif);
      }
    });
    const allItems: any[] = [...individualItems];
    groups.forEach((group) => {
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
      Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setNotifications((prev) =>
                prev.filter((n) => n.notificationId !== notification.notificationId)
              );
              const api = (await import('../services/api')).default;
              await api.delete(`/notifications/${notification.notificationId}`);
            } catch (error) {
              console.log('Failed to delete notification:', error);
              fetchNotifications();
            }
          },
        },
      ]);
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

  // Customer Theme View (100% UNTOUCHED)
  if (!isFarmer && !isAdmin) {
    const now = new Date();
    const todayItems: any[] = [];
    const earlierItems: any[] = [];
    displayItems.forEach((item) => {
      const d = new Date(item.isGroup ? item.latestNotification.createdAt : item.createdAt);
      if (!isNaN(d.getTime()) && d.toDateString() === now.toDateString()) {
        todayItems.push(item);
      } else {
        earlierItems.push(item);
      }
    });

    const sectionedData: any[] = [];
    if (todayItems.length > 0) {
      sectionedData.push({ type: 'header', title: 'TODAY' });
      todayItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
    }
    if (earlierItems.length > 0) {
      sectionedData.push({ type: 'header', title: 'EARLIER' });
      earlierItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
      <PageBackground style={{ flex: 1 }}>
        <ThemedHeader
          variant="inner"
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
          onBackPress={() => navigation.goBack()}
          rightAction={
            notifications.some((n) => !n.isRead) ? (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.customerMarkReadBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.customerMarkReadText}>Mark read</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        <View style={{ flex: 1 }}>
          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#E07B39" />
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
              data={sectionedData}
              keyExtractor={(item, index) =>
                item.type === 'header'
                  ? `header-${item.title}`
                  : item.data.isGroup
                  ? `group-${item.data.id}`
                  : item.data.notificationId
              }
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <View style={styles.customerSectionHeaderRow}>
                      <Text style={styles.customerSectionHeaderText}>{item.title}</Text>
                      <View style={styles.customerSectionHeaderLine} />
                    </View>
                  );
                }
                if (item.data.isGroup) {
                  return (
                    <NotificationGroupCard
                      group={item.data}
                      onPress={handleGroupPress}
                      variant="customer"
                    />
                  );
                }
                return (
                  <NotificationCard
                    notification={item.data}
                    onPress={handleNotificationPress}
                    onDelete={handleNotificationDelete}
                    variant="customer"
                  />
                );
              }}
              contentContainerStyle={
                sectionedData.length === 0 ? styles.flex1 : styles.customerListContent
              }
              ListEmptyComponent={
                <ThemedEmptyState
                  icon={
                    <Ionicons name="notifications-outline" size={44} color={THEME.colors.accent} />
                  }
                  title="You're all caught up"
                  subtitle="No new notifications right now."
                />
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#E07B39']}
                  tintColor="#E07B39"
                />
              }
            />
          )}
        </View>
      </PageBackground>
    );
  }

  // Farmer Theme View (100% UNTOUCHED)
  if (isFarmer) {
    const now = new Date();
    const todayItems: any[] = [];
    const earlierItems: any[] = [];
    displayItems.forEach((item) => {
      const d = new Date(item.isGroup ? item.latestNotification.createdAt : item.createdAt);
      if (!isNaN(d.getTime()) && d.toDateString() === now.toDateString()) {
        todayItems.push(item);
      } else {
        earlierItems.push(item);
      }
    });

    const sectionedData: any[] = [];
    if (todayItems.length > 0) {
      sectionedData.push({ type: 'header', title: 'TODAY' });
      todayItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
    }
    if (earlierItems.length > 0) {
      sectionedData.push({ type: 'header', title: 'EARLIER' });
      earlierItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
      <FarmerPageBackground>
        <FarmerHeader
          variant="inner"
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
          onBackPress={() => navigation.goBack()}
          rightComponent={
            notifications.some((n) => !n.isRead) ? (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.farmerMarkReadBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.farmerMarkReadText}>Mark read</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        <View style={{ flex: 1 }}>
          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={FARMER_THEME.colors.emeraldPrimary} />
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: FARMER_THEME.colors.emeraldPrimary },
                ]}
                onPress={fetchNotifications}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={sectionedData}
              keyExtractor={(item, index) =>
                item.type === 'header'
                  ? `header-${item.title}`
                  : item.data.isGroup
                  ? `group-${item.data.id}`
                  : item.data.notificationId
              }
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <View style={styles.farmerSectionHeaderRow}>
                      <Text style={styles.farmerSectionHeaderText}>{item.title}</Text>
                      <View style={styles.farmerSectionHeaderLine} />
                    </View>
                  );
                }
                if (item.data.isGroup) {
                  return (
                    <NotificationGroupCard
                      group={item.data}
                      onPress={handleGroupPress}
                      variant="farmer"
                    />
                  );
                }
                return (
                  <NotificationCard
                    notification={item.data}
                    onPress={handleNotificationPress}
                    onDelete={handleNotificationDelete}
                    variant="farmer"
                  />
                );
              }}
              contentContainerStyle={
                sectionedData.length === 0 ? styles.flex1 : styles.farmerListContent
              }
              ListEmptyComponent={
                <FarmerEmptyState
                  icon={
                    <Ionicons
                      name="notifications-outline"
                      size={44}
                      color={FARMER_THEME.colors.emeraldPrimary}
                    />
                  }
                  title="You're all caught up"
                  subtitle="No new notifications right now."
                />
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[FARMER_THEME.colors.emeraldPrimary]}
                  tintColor={FARMER_THEME.colors.emeraldPrimary}
                />
              }
            />
          )}
        </View>
      </FarmerPageBackground>
    );
  }

  // Admin screen path (Restyled to Admin Theme)
  const now = new Date();
  const todayItems: any[] = [];
  const earlierItems: any[] = [];
  displayItems.forEach((item) => {
    const d = new Date(item.isGroup ? item.latestNotification.createdAt : item.createdAt);
    if (!isNaN(d.getTime()) && d.toDateString() === now.toDateString()) {
      todayItems.push(item);
    } else {
      earlierItems.push(item);
    }
  });

  const sectionedData: any[] = [];
  if (todayItems.length > 0) {
    sectionedData.push({ type: 'header', title: 'TODAY' });
    todayItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
  }
  if (earlierItems.length > 0) {
    sectionedData.push({ type: 'header', title: 'EARLIER' });
    earlierItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All updates'}
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={styles.adminHeaderActions}>
            {notifications.some((n) => !n.isRead) && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.adminMarkReadBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.adminMarkReadText}>Mark read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminMessageHistory')}
              style={styles.adminHistoryBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.mainContent}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F5BD5" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.adminErrorText}>{error}</Text>
            <TouchableOpacity style={styles.adminRetryButton} onPress={fetchNotifications}>
              <Text style={styles.adminRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sectionedData}
            keyExtractor={(item, index) =>
              item.type === 'header'
                ? `header-${item.title}`
                : item.data.isGroup
                ? `group-${item.data.id}`
                : item.data.notificationId
            }
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <View style={styles.adminSectionHeaderRow}>
                    <Text style={styles.adminSectionHeaderText}>{item.title}</Text>
                    <View style={styles.adminSectionHeaderLine} />
                  </View>
                );
              }
              if (item.data.isGroup) {
                return (
                  <NotificationGroupCard
                    group={item.data}
                    onPress={handleGroupPress}
                    variant="admin"
                  />
                );
              }
              return (
                <NotificationCard
                  notification={item.data}
                  onPress={handleNotificationPress}
                  onDelete={handleNotificationDelete}
                  variant="admin"
                />
              );
            }}
            contentContainerStyle={
              sectionedData.length === 0 ? styles.flex1 : styles.adminListContent
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <AdminEmptyState
                title="No Notifications"
                message="You're all caught up. No new notifications right now."
                icon={<Ionicons name="notifications-outline" size={40} color="#4F5BD5" />}
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F5BD5']}
                tintColor="#4F5BD5"
              />
            }
          />
        )}
      </View>
    </AdminPageBackground>
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
  customerMarkReadBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  customerMarkReadText: {
    color: '#FFFFFF',
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12,
  },
  customerListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 130,
  },
  customerSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  customerSectionHeaderText: {
    fontSize: 11,
    fontFamily: THEME.fonts.bold,
    letterSpacing: 1.8,
    color: '#C25A14',
    marginRight: 10,
  },
  customerSectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0E1CF',
  },
  farmerSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  farmerSectionHeaderText: {
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
    letterSpacing: 1.8,
    color: '#17663F',
    textTransform: 'uppercase',
  },
  farmerSectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCE8DF',
    marginLeft: 12,
  },
  farmerMarkReadBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  farmerMarkReadText: {
    color: '#FFFFFF',
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 12,
  },
  farmerListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Admin Branch Styles
  adminHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminMarkReadBtn: {
    backgroundColor: 'rgba(231, 192, 106, 0.2)',
    borderWidth: 1,
    borderColor: '#E7C06A',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
  },
  adminMarkReadText: {
    color: '#E7C06A',
    fontFamily: AdminFonts.bold,
    fontSize: 11.5,
  },
  adminHistoryBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  adminSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  adminSectionHeaderText: {
    fontFamily: AdminFonts.bold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: '#4F5BD5',
    textTransform: 'uppercase',
    marginRight: 10,
  },
  adminSectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEF0F7',
  },
  adminErrorText: {
    fontFamily: AdminFonts.medium,
    fontSize: 14,
    color: ADMIN_THEME.colors.statusError,
    marginBottom: 16,
    textAlign: 'center',
  },
  adminRetryButton: {
    backgroundColor: '#4F5BD5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  adminRetryText: {
    fontFamily: AdminFonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default NotificationsScreen;
