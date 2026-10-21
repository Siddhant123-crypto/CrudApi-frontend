import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationService } from '../../services/NotificationService';
import api from '../../services/api';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminBadge } from '../../components/admin/StatusBadge';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { MessageIcon } from '../../components/admin/AdminIcons';

export default function AdminMessageHistoryScreen() {
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const data = await NotificationService.getSentNotifications();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to fetch message history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleChat = (item: any) => {
    if (item.receiverId) {
      navigation.navigate('AdminMessage', {
        preSelectedUserId: item.receiverId,
        preSelectedUserName: item.receiverName,
        preSelectedRole: item.receiverType,
      });
    }
  };

  const handleDeleteMessage = (item: any) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this sent message from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setHistory((prev) => prev.filter((n) => n.notificationId !== item.notificationId));
              await api.delete(`/notifications/${item.notificationId}`);
            } catch (error) {
              console.log('Failed to delete message:', error);
              fetchHistory();
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const dateObj = new Date(item.createdAt);
    const dateStr = dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const displayTime = `${dateStr}, ${timeStr}`;
    const isBroadcast = !item.receiverId;
    const canChat =
      !isBroadcast && (item.receiverType === 'CUSTOMER' || item.receiverType === 'FARMER');

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AdminMessageHistoryDetail', { notification: item })}
      >
        <AdminCard style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.receiverName} numberOfLines={1}>
                {item.receiverName || (isBroadcast ? 'All Recipients' : 'Unknown User')}
              </Text>
            </View>
            <View style={styles.rightActionsRow}>
              <AdminBadge
                label={item.receiverType || 'BROADCAST'}
                variant={isBroadcast ? 'info' : 'neutral'}
                size="small"
              />
              <TouchableOpacity
                onPress={() => handleDeleteMessage(item)}
                style={styles.deleteIconBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={17} color="#D64545" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.messageTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.messageBody} numberOfLines={2}>
            {item.message}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.timeText}>{displayTime}</Text>
            {canChat && (
              <TouchableOpacity
                onPress={() => handleChat(item)}
                style={styles.chatButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                <Text style={styles.chatButtonText}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </AdminCard>
      </TouchableOpacity>
    );
  };

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title="Message History"
        subtitle="Sent communications & broadcasts"
        onBack={() => navigation.goBack()}
      />

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F5BD5" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.notificationId || item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F5BD5']}
              tintColor="#4F5BD5"
            />
          }
          ListEmptyComponent={
            <AdminEmptyState
              title="No Message History"
              message="You haven't sent any messages or notifications yet."
              icon={<MessageIcon size={36} color="#4F5BD5" />}
            />
          }
        />
      )}
    </AdminPageBackground>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  historyCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flex: 1,
    marginRight: 10,
  },
  receiverName: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: ADMIN_THEME.colors.ink,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteIconBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FDE7E7',
  },
  messageTitle: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 4,
  },
  messageBody: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.inkMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF0F7',
    paddingTop: 10,
  },
  timeText: {
    fontFamily: AdminFonts.regular,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.inkMuted,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#4F5BD5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  chatButtonText: {
    fontFamily: AdminFonts.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
});
