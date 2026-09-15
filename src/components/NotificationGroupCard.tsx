import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationResponse } from '../types';
import { formatNotificationDate } from './NotificationCard';
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
}
export const NotificationGroupCard = ({ group, onPress }: Props) => {
  const { latestNotification, senderName, unreadCount } = group;
  let cleanMessage = latestNotification.message;
  const match = cleanMessage.match(/^From:\s.*?\n\n(.*)/s);
  if (match && match[1]) {
    cleanMessage = match[1];
  }
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
});
