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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { refreshUnreadCount, markAllAsRead: contextMarkAllAsRead, decrementUnread } = useNotification();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const isSelectionMode = selectedIds.length > 0;

  const fetchNotifications = async () => {
    try {
      let rawData: any;
      if (user?.role === 'FARMER') {
        try {
          rawData = await NotificationService.getFarmerNotifications(0, 50, false);
        } catch {
          rawData = await NotificationService.getNotifications();
        }
      } else {
        rawData = await NotificationService.getNotifications();
      }

      const list = Array.isArray(rawData)
        ? rawData
        : rawData?.content || rawData?.data || [];
      setError(null);

      // When the farmer views the notifications screen, automatically mark unread notifications as read
      const hasUnread = list.some((n: any) => !n.isRead);
      if (hasUnread) {
        setNotifications(list.map((n: any) => ({ ...n, isRead: true })));
        contextMarkAllAsRead().catch(() => {});
      } else {
        setNotifications(list);
      }
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
      setSelectedIds([]);
      fetchNotifications();
      refreshUnreadCount();
    }, [])
  );

  const toggleSelectNotification = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectGroup = (group: NotificationGroup) => {
    const groupIds = group.notifications.map((n) => n.notificationId);
    setSelectedIds((prev) => {
      const allSelected = groupIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !groupIds.includes(id));
      }
      const merged = new Set([...prev, ...groupIds]);
      return Array.from(merged);
    });
  };

  const isGroupSelected = (group: NotificationGroup) =>
    group.notifications.length > 0 &&
    group.notifications.every((n) => selectedIds.includes(n.notificationId));

  const clearSelection = () => setSelectedIds([]);

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0 || deleting) return;
    const count = selectedIds.length;
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        t('notifications.deleteMessageTitle', 'Delete Messages'),
        count === 1
          ? t('notifications.deleteMessageConfirm', 'Are you sure you want to delete this message?')
          : t('notifications.deleteSelectedConfirm', {
              count,
              defaultValue: `Are you sure you want to delete ${count} selected messages?`,
            }),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.delete', 'Delete'),
            style: 'destructive',
            onPress: async () => {
              const idsToDelete = [...selectedIds];
              setDeleting(true);
              try {
                setNotifications((prev) =>
                  prev.filter((n) => !idsToDelete.includes(n.notificationId))
                );
                setSelectedIds([]);
                const api = (await import('../services/api')).default;
                await Promise.allSettled(
                  idsToDelete.map((id) => api.delete(`/notifications/${id}`))
                );
                refreshUnreadCount();
              } catch (err) {
                console.log('Failed to delete selected notifications:', err);
                fetchNotifications();
              } finally {
                setDeleting(false);
              }
            },
          },
        ]
      );
    });
  };

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
    // Mark as read immediately and decrement badge
    if (!notification.isRead) {
      if (isFarmer) {
        NotificationService.markFarmerNotificationAsRead(notification.notificationId).catch(() => {});
      } else {
        NotificationService.markAsRead(notification.notificationId).catch(() => {});
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
        )
      );
      decrementUnread();
    }

    if (isFarmer) {
      if (
        notification.type === 'ORDER_ADDRESS_CHANGED' ||
        notification.notificationType === 'ORDER_ADDRESS_CHANGED' ||
        notification.orderId
      ) {
        if (notification.orderId) {
          navigation.navigate('FarmerOrderDetails', {
            orderId: notification.orderId,
            addressUpdated: true,
            previousAddress: notification.previousAddress,
            newAddress: notification.newAddress,
          });
          return;
        }
      }
    }

    if (
      isAdmin &&
      (notification.title === 'Farmer Self-Deactivated' ||
        notification.message?.toLowerCase().includes('deactivated their account'))
    ) {
      if (notification.senderId) {
        navigation.navigate('AdminFarmerDetails', { farmerId: notification.senderId });
        return;
      }
    }

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
      Alert.alert(
        t('notifications.deleteMessageTitle', 'Delete Message'),
        t('notifications.deleteMessageConfirm', 'Are you sure you want to delete this message?'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.delete', 'Delete'),
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
      <Text style={styles.emptyTitle}>{t('notifications.youreAllCaughtUp', "You're all caught up")}</Text>
      <Text style={styles.emptySubtitle}>{t('notifications.noNewNotifications', 'No new notifications right now.')}</Text>
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
      sectionedData.push({ type: 'header', title: t('notifications.today', 'TODAY') });
      todayItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
    }
    if (earlierItems.length > 0) {
      sectionedData.push({ type: 'header', title: t('notifications.earlier', 'EARLIER') });
      earlierItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
      <PageBackground style={{ flex: 1 }}>
        <ThemedHeader
          variant="inner"
          title={
            isSelectionMode
              ? `${selectedIds.length} ${t('common.selected', 'Selected')}`
              : t('notifications.title', 'Notifications')
          }
          subtitle={
            !isSelectionMode && unreadCount > 0
              ? t('notifications.unreadCount', { count: unreadCount })
              : undefined
          }
          onBackPress={() => {
            if (isSelectionMode) {
              clearSelection();
            } else {
              navigation.goBack();
            }
          }}
          rightAction={
            isSelectionMode ? (
              <TouchableOpacity
                onPress={handleDeleteSelected}
                disabled={deleting}
                style={styles.headerDeleteBtn}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={17} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={styles.headerDeleteText}>{t('common.delete', 'Delete')}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : notifications.some((n) => !n.isRead) ? (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.customerMarkReadBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.customerMarkReadText}>{t('notifications.markRead', 'Mark read')}</Text>
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
                <Text style={styles.retryText}>{t('common.retry', 'Retry')}</Text>
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
                      onPress={(grp) =>
                        isSelectionMode ? toggleSelectGroup(grp) : handleGroupPress(grp)
                      }
                      onLongPress={toggleSelectGroup}
                      isSelected={isGroupSelected(item.data)}
                      selectionMode={isSelectionMode}
                      variant="customer"
                    />
                  );
                }
                return (
                  <NotificationCard
                    notification={item.data}
                    onPress={(notif) =>
                      isSelectionMode
                        ? toggleSelectNotification(notif.notificationId)
                        : handleNotificationPress(notif)
                    }
                    onLongPress={(notif) => toggleSelectNotification(notif.notificationId)}
                    isSelected={selectedIds.includes(item.data.notificationId)}
                    selectionMode={isSelectionMode}
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
                  title={t('notifications.youreAllCaughtUp', "You're all caught up")}
                  subtitle={t('notifications.noNewNotifications', 'No new notifications right now.')}
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
      sectionedData.push({ type: 'header', title: t('notifications.today', 'TODAY') });
      todayItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
    }
    if (earlierItems.length > 0) {
      sectionedData.push({ type: 'header', title: t('notifications.earlier', 'EARLIER') });
      earlierItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
      <FarmerPageBackground>
        <FarmerHeader
          variant="inner"
          title={
            isSelectionMode
              ? `${selectedIds.length} ${t('common.selected', 'Selected')}`
              : t('notifications.title', 'Notifications')
          }
          subtitle={
            !isSelectionMode && unreadCount > 0
              ? t('notifications.unreadCount', { count: unreadCount })
              : undefined
          }
          onBackPress={() => {
            if (isSelectionMode) {
              clearSelection();
            } else {
              navigation.goBack();
            }
          }}
          rightComponent={
            isSelectionMode ? (
              <TouchableOpacity
                onPress={handleDeleteSelected}
                disabled={deleting}
                style={styles.headerDeleteBtn}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={17} color="#FFFFFF" style={{ marginRight: 5 }} />
                    <Text style={styles.headerDeleteText}>{t('common.delete', 'Delete')}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : notifications.some((n) => !n.isRead) ? (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.farmerMarkReadBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.farmerMarkReadText}>{t('notifications.markRead', 'Mark read')}</Text>
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
                <Text style={styles.retryText}>{t('common.retry', 'Retry')}</Text>
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
                      onPress={(grp) =>
                        isSelectionMode ? toggleSelectGroup(grp) : handleGroupPress(grp)
                      }
                      onLongPress={toggleSelectGroup}
                      isSelected={isGroupSelected(item.data)}
                      selectionMode={isSelectionMode}
                      variant="farmer"
                    />
                  );
                }
                return (
                  <NotificationCard
                    notification={item.data}
                    onPress={(notif) =>
                      isSelectionMode
                        ? toggleSelectNotification(notif.notificationId)
                        : handleNotificationPress(notif)
                    }
                    onLongPress={(notif) => toggleSelectNotification(notif.notificationId)}
                    isSelected={selectedIds.includes(item.data.notificationId)}
                    selectionMode={isSelectionMode}
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
                  title={t('notifications.youreAllCaughtUp', "You're all caught up")}
                  subtitle={t('notifications.noNewNotifications', 'No new notifications right now.')}
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
    sectionedData.push({ type: 'header', title: t('notifications.today', 'TODAY') });
    todayItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
  }
  if (earlierItems.length > 0) {
    sectionedData.push({ type: 'header', title: t('notifications.earlier', 'EARLIER') });
    earlierItems.forEach((i) => sectionedData.push({ type: 'item', data: i }));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title={t('notifications.title', 'Notifications')}
        subtitle={unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.allUpdates', 'All updates')}
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={styles.adminHeaderActions}>
            {notifications.some((n) => !n.isRead) && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.adminMarkReadBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.adminMarkReadText}>{t('notifications.markRead', 'Mark read')}</Text>
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
              <Text style={styles.adminRetryText}>{t('common.retry', 'Retry')}</Text>
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
                title={t('notifications.noNotifications', 'No Notifications')}
                message={t('notifications.noNewNotifications', "You're all caught up. No new notifications right now.")}
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
  headerDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  headerDeleteText: {
    color: '#FFFFFF',
    fontFamily: THEME.fonts.bold,
    fontSize: 12.5,
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
