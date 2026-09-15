import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationResponse, NotificationType } from '../types';
interface Props {
  notification: NotificationResponse;
  onPress: (notification: NotificationResponse) => void;
  onDelete?: (notification: NotificationResponse) => void;
}
export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'ORDER':
      return { name: 'cube-outline', color: '#3B82F6', bg: '#EFF6FF' };
    case 'PRODUCT':
      return { name: 'pricetag-outline', color: '#10B981', bg: '#ECFDF5' };
    case 'FARMER':
      return { name: 'leaf-outline', color: '#2D983A', bg: '#F0FDF4' };
    case 'CUSTOMER':
      return { name: 'person-outline', color: '#8B5CF6', bg: '#F5F3FF' };
    case 'ADMIN':
      return { name: 'shield-checkmark-outline', color: '#F59E0B', bg: '#FFFBEB' };
    case 'SYSTEM':
    default:
      return { name: 'information-circle-outline', color: '#6B7280', bg: '#F3F4F6' };
  }
};
export const formatNotificationDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Recently';
  }
};
export const NotificationCard = ({ notification, onPress, onDelete }: Props) => {
  const iconConfig = getNotificationIcon(notification.type);
  return (
    <TouchableOpacity
      style={[
        styles.card,
        !notification.isRead && styles.unreadCard
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
        <Ionicons name={iconConfig.name as any} size={24} color={iconConfig.color} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !notification.isRead && styles.unreadTitle]} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={[styles.message, !notification.isRead && styles.unreadMessage]} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
      <View style={styles.rightActionContainer}>
        <Text style={styles.dateText}>{formatNotificationDate(notification.createdAt)}</Text>
        <View style={styles.rightActionBottom}>
          {!notification.isRead && <View style={styles.unreadDot} />}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(notification);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#4B5563',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 12,
  },
  rightActionContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  rightActionBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});
