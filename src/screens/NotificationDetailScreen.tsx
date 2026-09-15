import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getNotificationIcon, formatNotificationDate } from '../components/NotificationCard';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { NotificationResponse } from '../types';
const NotificationDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const notification: NotificationResponse = route.params?.notification;
  const { markAsRead } = useNotification();
  const { user } = useAuth();
  useEffect(() => {
    if (notification && !notification.isRead) {
      markAsRead(notification.notificationId).catch(err => console.log('Error marking read silently:', err));
    }
  }, [notification]);
  const isFarmer = user?.role === 'FARMER';
  const isAdmin = user?.role === 'ADMIN';
  const headerBgColor = isAdmin ? '#17212F' : (isFarmer ? '#1E5631' : '#1E3A8A');
  const headerTextColor = '#FFFFFF';
  if (!notification) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
        <View style={[styles.header, { backgroundColor: headerBgColor, borderBottomColor: headerBgColor }]}>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={headerTextColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: headerTextColor }]}>Error</Text>
          </View>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Notification details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }
  let senderName = '';
  let actualMessage = notification.message;
  if (actualMessage.startsWith('From: ')) {
    const parts = actualMessage.split('\n\n');
    if (parts.length >= 2) {
      senderName = parts[0].replace('From: ', '').trim();
      actualMessage = parts.slice(1).join('\n\n').trim();
    }
  }
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
      <View style={[styles.header, { backgroundColor: headerBgColor, borderBottomColor: headerBgColor }]}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={headerTextColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTextColor }]}>Notification</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {senderName ? (
            <View style={styles.senderRow}>
              <View style={styles.senderLeft}>
                <Text style={styles.senderLabel}>From:</Text>
                <Text style={styles.senderName}>{senderName}</Text>
              </View>
              <View style={styles.dateRight}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text style={styles.dateText}>{formatNotificationDate(notification.createdAt)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.dateRowOnly}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.dateText}>{formatNotificationDate(notification.createdAt)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{notification.title}</Text>
            {(() => {
              const senderType = notification.senderType;
              const isCustomer = !isAdmin && !isFarmer;
              const canReply = () => {
                if (!notification.senderId && senderType !== 'ADMIN') return false;
                if (isCustomer && senderType === 'FARMER') return true;
                if (isFarmer && senderType === 'CUSTOMER') return true;
                if (isFarmer && senderType === 'ADMIN') return true;
                if (isAdmin && senderType === 'CUSTOMER') return true;
                if (isAdmin && senderType === 'FARMER') return true;
                return false;
              };
              if (!canReply()) return null;
              return (
                <TouchableOpacity
                  style={styles.replyBtn}
                  onPress={() => {
                    if (isCustomer && senderType === 'FARMER') {
                      navigation.navigate('CustomerMessageFarmer', {
                        preSelectedFarmerId: notification.senderId,
                        preSelectedFarmerName: senderName || 'Farmer'
                      });
                    } else if (isFarmer && senderType === 'CUSTOMER') {
                      navigation.navigate('FarmerMessageCustomer', {
                        preSelectedCustomerId: notification.senderId,
                        preSelectedCustomerName: senderName || 'Customer',
                        preSelectedRole: 'CUSTOMER'
                      });
                    } else if (isFarmer && senderType === 'ADMIN') {
                      navigation.navigate('FarmerContactAdmin');
                    } else if (isAdmin) {
                      navigation.navigate('AdminMessage', {
                        preSelectedUserId: notification.senderId,
                        preSelectedUserName: senderName || 'User',
                        preSelectedRole: senderType
                      });
                    }
                  }}
                >
                  <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              );
            })()}
          </View>
          <View style={[styles.messageBox, { borderLeftColor: headerBgColor }]}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.message}>{actualMessage}</Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightPlaceholder: {
    width: 24,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  replyBtn: {
    backgroundColor: '#8B5CF6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  senderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  senderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRowOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  senderLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 6,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  messageBox: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    width: '100%',
  },
  messageLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
});
export default NotificationDetailScreen;
