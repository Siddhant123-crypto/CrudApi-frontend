import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationResponse } from '../types';
import { formatNotificationDate } from './NotificationCard';
import { THEME } from '../constants/theme';
import { FARMER_THEME } from '../constants/farmerTheme';
import { ADMIN_THEME, AdminFonts } from '../constants/adminTheme';

export interface NotificationGroup {
  id: string;
  isGroup: true;
  senderName: string;
  senderId?: string;
  notifications: NotificationResponse[];
  latestNotification: NotificationResponse;
  unreadCount: number;
}

interface Props {
  group: NotificationGroup;
  onPress: (group: NotificationGroup) => void;
  variant?: 'default' | 'customer' | 'farmer' | 'admin';
}

export const NotificationGroupCard = ({ group, onPress, variant = 'default' }: Props) => {
  const { latestNotification, senderName, unreadCount } = group;
  let cleanMessage = latestNotification.message;
  const match = cleanMessage.match(/^From:\s.*?\n\n(.*)/s);
  if (match && match[1]) {
    cleanMessage = match[1];
  }

  if (variant === 'admin') {
    return (
      <TouchableOpacity
        style={[
          styles.adminCard,
          unreadCount > 0 && styles.adminUnreadCard,
        ]}
        onPress={() => onPress(group)}
        activeOpacity={0.8}
      >
        <View style={styles.adminIconContainer}>
          <Ionicons name="chatbubbles-outline" size={22} color="#1F8F89" />
        </View>
        <View style={styles.adminContentContainer}>
          <View style={styles.adminHeaderRow}>
            <Text style={styles.adminTitle} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={styles.adminDateText}>{formatNotificationDate(latestNotification.createdAt)}</Text>
          </View>
          <Text style={styles.adminMessage} numberOfLines={2}>
            {cleanMessage}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'farmer') {
    return (
      <TouchableOpacity
        style={[
          styles.farmerCard,
          unreadCount > 0 && styles.farmerUnreadCard
        ]}
        onPress={() => onPress(group)}
        activeOpacity={0.8}
      >
        <View style={styles.farmerIconContainer}>
          <Ionicons name="chatbubbles-outline" size={24} color="#1F7F78" />
        </View>
        <View style={styles.farmerContentContainer}>
          <View style={styles.farmerHeaderRow}>
            <Text style={styles.farmerTitle} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={styles.farmerDateText}>{formatNotificationDate(latestNotification.createdAt)}</Text>
          </View>
          <Text style={styles.farmerMessage} numberOfLines={2}>
            {cleanMessage}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.farmerBadge}>
            <Text style={styles.farmerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'customer') {
    return (
      <TouchableOpacity
        style={[
          styles.customerCard,
          unreadCount > 0 && styles.customerUnreadCard
        ]}
        onPress={() => onPress(group)}
        activeOpacity={0.8}
      >
        <View style={styles.customerIconContainer}>
          <Ionicons name="chatbubbles-outline" size={22} color="#B8470F" />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.customerHeaderRow}>
            <Text style={styles.customerTitle} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={styles.customerDateText}>{formatNotificationDate(latestNotification.createdAt)}</Text>
          </View>
          <Text style={styles.customerMessage} numberOfLines={2}>
            {cleanMessage}
          </Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.customerBadge}>
            <Text style={styles.customerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Default look
  return (
    <TouchableOpacity
      style={[
        styles.card,
        unreadCount > 0 && styles.unreadCard
      ]}
      onPress={() => onPress(group)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
        <Ionicons name="chatbubbles-outline" size={24} color="#6B7280" />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, unreadCount > 0 && styles.unreadTitle]} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={styles.dateText}>{formatNotificationDate(latestNotification.createdAt)}</Text>
        </View>
        <Text style={[styles.message, unreadCount > 0 && styles.unreadMessage]} numberOfLines={2}>
          {cleanMessage}
        </Text>
      </View>
      {unreadCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
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
    fontWeight: '600',
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
  badgeContainer: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Customer Theme Styles
  customerCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0E1CF',
    marginBottom: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(90,40,15,1)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.09,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  customerUnreadCard: {
    borderWidth: 1.5,
    borderColor: '#F2B27D',
  },
  customerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFE3DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  customerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerTitle: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: '#3B1A0E',
    flex: 1,
    marginRight: 8,
  },
  customerDateText: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.medium,
    color: '#8A6F5C',
  },
  customerMessage: {
    fontSize: 13,
    fontFamily: THEME.fonts.regular,
    color: '#7A6350',
    lineHeight: 18,
  },
  customerBadge: {
    backgroundColor: '#FFF1E3',
    borderRadius: 12,
    minWidth: 26,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    paddingHorizontal: 8,
  },
  customerBadgeText: {
    color: '#B8470F',
    fontSize: 12,
    fontFamily: THEME.fonts.bold,
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
    backgroundColor: '#D7F0EC',
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
  farmerDateText: {
    fontSize: 11.5,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#6B7A6F',
  },
  farmerMessage: {
    fontSize: 13,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#5C6B60',
    lineHeight: 18,
  },
  farmerBadge: {
    backgroundColor: '#F5C84B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#082419',
  },
  farmerBadgeText: {
    color: '#082419',
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
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
    backgroundColor: '#D9F3F1',
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
  adminDateText: {
    fontSize: 11.5,
    fontFamily: AdminFonts.regular,
    color: '#8A93AB',
  },
  adminMessage: {
    fontSize: 13,
    fontFamily: AdminFonts.regular,
    color: '#5B6580',
    lineHeight: 18,
  },
  adminBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E7C06A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  adminBadgeText: {
    color: '#0B1326',
    fontSize: 10.5,
    fontFamily: AdminFonts.bold,
  },
});
