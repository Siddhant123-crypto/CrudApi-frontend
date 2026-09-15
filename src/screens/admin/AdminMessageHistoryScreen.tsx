import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NotificationService } from '../../services/NotificationService';
import { MainStackParamList } from '../../navigation/AppNavigator';
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
export default function AdminMessageHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchHistory = async () => {
    try {
      setError(null);
      const data = await NotificationService.getSentNotifications();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch message history:', err);
      setError('Could not load message history.');
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
                setHistory(prev => prev.filter(n => n.notificationId !== item.notificationId));
                const { api } = await import('../../services/api');
                await api.delete(`/notifications/${item.notificationId}`);
              } catch (error) {
                console.log('Failed to delete message:', error);
                fetchHistory();
              }
            }
          }
        ]
      );
    });
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
    const canChat = !isBroadcast && (item.receiverType === 'CUSTOMER' || item.receiverType === 'FARMER');
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AdminMessageHistoryDetail', { notification: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.receiverName}>{item.receiverName || 'Unknown'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.receiverType || 'BROADCAST'}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteMessage(item)} style={{ marginLeft: 12, padding: 4 }}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.messageTitle}>{item.title}</Text>
        <Text style={styles.messageBody} numberOfLines={2}>{item.message}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>{displayTime}</Text>
          {canChat && (
            <TouchableOpacity onPress={() => handleChat(item)} style={styles.chatButton}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message History</Text>
      </View>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbox-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No sent messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.notificationId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17212F',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiverName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  messageBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#17212F',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#17212F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 12,
  },
});
