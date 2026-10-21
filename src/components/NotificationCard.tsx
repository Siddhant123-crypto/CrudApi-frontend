import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationResponse, NotificationType } from '../types';
import { THEME } from '../constants/theme';
import { FARMER_THEME } from '../constants/farmerTheme';
import { ADMIN_THEME, AdminFonts } from '../constants/adminTheme';

interface Props {
  notification: NotificationResponse;
  onPress: (notification: NotificationResponse) => void;
  onDelete?: (notification: NotificationResponse) => void;
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
}

export const getFarmerNotificationIcon = (notification: NotificationResponse) => {
  const text = (notification.title + ' ' + notification.message).toLowerCase();
  if (text.includes('pay') || text.includes('paid') || text.includes('cod') || text.includes('refund')) {
    return { name: 'cash-outline', color: '#C98A1B', bg: '#FFF0CC' };
  }
  if (notification.type === 'ORDER' || text.includes('order')) {
    return { name: 'cube-outline', color: '#17663F', bg: '#DDF3E4' };
  }
  if (
    notification.type === 'CUSTOMER' ||
    notification.type === 'FARMER' ||
    text.includes('from:') ||
    text.includes('message') ||
    text.includes('chat')
  ) {
    return { name: 'chatbubbles-outline', color: '#1F7F78', bg: '#D7F0EC' };
  }
  if (text.includes('alert') || text.includes('warn') || text.includes('cancel') || text.includes('reject')) {
    return { name: 'alert-circle-outline', color: '#C0392B', bg: '#FDE6E2' };
  }
  return { name: 'notifications-outline', color: '#17663F', bg: '#DDF3E4' };
};

export const getAdminNotificationIcon = (notification: NotificationResponse) => {
  const text = ((notification.title || '') + ' ' + (notification.message || '')).toLowerCase();
  if (text.includes('pay') || text.includes('paid') || text.includes('cod') || text.includes('refund')) {
    return { name: 'cash-outline', color: '#C98A1B', bg: '#FFF1D2' };
  }
  if (notification.type === 'ORDER' || text.includes('order')) {
    return { name: 'cube-outline', color: '#4F5BD5', bg: '#E8EBFF' };
  }
  if (
    notification.type === 'CUSTOMER' ||
    notification.type === 'FARMER' ||
    notification.type === 'ADMIN' ||
    text.includes('user') ||
    text.includes('chat') ||
    text.includes('from:')
  ) {
    return { name: 'person-outline', color: '#1F8F89', bg: '#D9F3F1' };
  }
  if (
    text.includes('alert') ||
    text.includes('warn') ||
    text.includes('cancel') ||
    text.includes('reject') ||
    text.includes('fail')
  ) {
    return { name: 'alert-circle-outline', color: '#D64545', bg: '#FDE7E7' };
  }
  return { name: 'notifications-outline', color: '#4F5BD5', bg: '#E8EBFF' };
};

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

export const getCustomerNotificationIcon = (notification: NotificationResponse) => {
  const text = (notification.title + ' ' + notification.message).toLowerCase();
  if (text.includes('deliver')) {
    return { name: 'checkmark-circle-outline', color: '#2E7D4F', bg: '#E3F3E8' };
  }
  if (notification.type === 'ORDER' || text.includes('order')) {
    return { name: 'cube-outline', color: '#D9651B', bg: '#FFE7CC' };
  }
  if (text.includes('offer') || text.includes('discount') || text.includes('sale') || notification.type === 'PRODUCT') {
    return { name: 'pricetag-outline', color: '#F2A31F', bg: '#FFF4DD' };
  }
  if (notification.type === 'CUSTOMER' || notification.type === 'FARMER' || text.includes('from:')) {
    return { name: 'chatbubbles-outline', color: '#B8470F', bg: '#FFE3DC' };
  }
  return { name: 'notifications-outline', color: '#B8470F', bg: '#FFE3DC' };
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

export const NotificationCard = ({ notification, onPress, onDelete, variant = 'default' }: Props) => {
  if (variant === 'admin') {
    const iconConfig = getAdminNotificationIcon(notification);
    return (
      <TouchableOpacity
        style={[
          styles.adminCard,
          !notification.isRead && styles.adminUnreadCard,
        ]}
        onPress={() => onPress(notification)}
        activeOpacity={0.8}
      >
        <View style={[styles.adminIconContainer, { backgroundColor: iconConfig.bg }]}>
          <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
        </View>
        <View style={styles.adminContentContainer}>
          <View style={styles.adminHeaderRow}>
            <Text style={styles.adminTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            <View style={styles.adminTimeRow}>
              <Text style={styles.adminDateText}>{formatNotificationDate(notification.createdAt)}</Text>
              {!notification.isRead && <View style={styles.adminUnreadDot} />}
            </View>
          </View>
          <Text style={styles.adminMessage} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            style={styles.adminDeleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(notification);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#D64545" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'customer') {
    const iconConfig = getCustomerNotificationIcon(notification);
    return (
      <TouchableOpacity
        style={[
          styles.customerCard,
          !notification.isRead && styles.customerUnreadCard
        ]}
        onPress={() => onPress(notification)}
        activeOpacity={0.8}
      >
        <View style={[styles.customerIconContainer, { backgroundColor: iconConfig.bg }]}>
          <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.customerHeaderRow}>
            <Text style={styles.customerTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            <View style={styles.customerTimeRow}>
              <Text style={styles.customerDateText}>{formatNotificationDate(notification.createdAt)}</Text>
              {!notification.isRead && <View style={styles.customerUnreadDot} />}
            </View>
          </View>
          <Text style={styles.customerMessage} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(notification);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#C0392B" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'farmer') {
    const iconConfig = getFarmerNotificationIcon(notification);
    return (
      <TouchableOpacity
        style={[
          styles.farmerCard,
          !notification.isRead && styles.farmerUnreadCard,
        ]}
        onPress={() => onPress(notification)}
        activeOpacity={0.8}
      >
        <View style={[styles.farmerIconContainer, { backgroundColor: iconConfig.bg }]}>
          <Ionicons name={iconConfig.name as any} size={24} color={iconConfig.color} />
        </View>
        <View style={styles.farmerContentContainer}>
          <View style={styles.farmerHeaderRow}>
            <Text style={styles.farmerTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            <View style={styles.farmerTimeRow}>
              <Text style={styles.farmerDateText}>{formatNotificationDate(notification.createdAt)}</Text>
              {!notification.isRead && <View style={styles.farmerUnreadDot} />}
            </View>
          </View>
          <Text style={styles.farmerMessage} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity
            style={styles.farmerDeleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(notification);
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#C0392B" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  // Default look
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#111827',
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadMessage: {
    color: '#374151',
  },
  rightActionContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
    minHeight: 40,
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  rightActionBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginRight: 4,
  },
  deleteButton: {
    padding: 4,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE3D5',
    padding: 14,
    marginBottom: 10,
    ...THEME.shadows.card,
  },
  customerUnreadCard: {
    borderWidth: 1.5,
    borderColor: '#E0B589',
    backgroundColor: '#FDFBF9',
  },
  customerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerTitle: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: '#2B1E16',
    flex: 1,
    marginRight: 8,
  },
  customerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerDateText: {
    fontSize: 11,
    fontFamily: THEME.fonts.regular,
    color: '#8D7B6F',
  },
  customerUnreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F59A4A',
    marginLeft: 6,
  },
  customerMessage: {
    fontSize: 13,
    fontFamily: THEME.fonts.regular,
    color: '#7A6350',
    lineHeight: 18,
    marginTop: 2,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFEF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE8DF',
    padding: 14,
    marginBottom: 10,
    ...FARMER_THEME.shadows.card,
  },
  farmerUnreadCard: {
    borderWidth: 1.5,
    borderColor: '#7CCB9C',
  },
  farmerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  farmerContentContainer: {
    flex: 1,
  },
  farmerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  farmerTitle: {
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    flex: 1,
    marginRight: 8,
  },
  farmerTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerDateText: {
    fontSize: 11.5,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#6B7A6F',
  },
  farmerUnreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F5C84B',
    borderWidth: 1,
    borderColor: '#0F4A31',
    marginLeft: 6,
  },
  farmerMessage: {
    fontSize: 13,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#5C6B60',
    lineHeight: 18,
  },
  farmerDeleteButton: {
    padding: 6,
    marginLeft: 6,
  },
  // Admin Variant Styles
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3E7F2',
    padding: 14,
    marginBottom: 10,
    ...ADMIN_THEME.shadows.card,
  },
  adminUnreadCard: {
    borderWidth: 1.5,
    borderColor: '#C9CEF5',
  },
  adminIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminContentContainer: {
    flex: 1,
  },
  adminHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminTitle: {
    fontSize: 15,
    fontFamily: AdminFonts.bold,
    color: '#0B1326',
    flex: 1,
    marginRight: 8,
  },
  adminTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminDateText: {
    fontSize: 11.5,
    fontFamily: AdminFonts.regular,
    color: '#8A93AB',
  },
  adminUnreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#E7C06A',
    borderWidth: 1.5,
    borderColor: '#C9CEF5',
    marginLeft: 6,
  },
  adminMessage: {
    fontSize: 13,
    fontFamily: AdminFonts.regular,
    color: '#5B6580',
    lineHeight: 18,
  },
  adminDeleteButton: {
    padding: 6,
    marginLeft: 8,
  },
});
