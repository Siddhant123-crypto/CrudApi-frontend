import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatNotificationDate } from '../../components/NotificationCard';
const AdminMessageHistoryDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const notification = route.params?.notification;
  const headerBgColor = '#17212F';
  const headerTextColor = '#FFFFFF';
  if (!notification) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
        <View style={[styles.header, { backgroundColor: headerBgColor }]}>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={headerTextColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: headerTextColor }]}>Error</Text>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Message details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }
  let actualMessage = notification.message;
  if (actualMessage.startsWith('From: ')) {
    const parts = actualMessage.split('\n\n');
    if (parts.length >= 2) {
      actualMessage = parts.slice(1).join('\n\n').trim();
    }
  }
  const receiverName = notification.receiverName || 'All ' + (notification.receiverType === 'FARMER' ? 'Farmers' : notification.receiverType === 'CUSTOMER' ? 'Customers' : 'Users');
  const isBroadcast = !notification.receiverId;
  const canChat = !isBroadcast && (notification.receiverType === 'CUSTOMER' || notification.receiverType === 'FARMER');
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor="#17212F" />
      <View style={[styles.header, { backgroundColor: headerBgColor }]}>
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={headerTextColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: headerTextColor }]}>Sent Message Detail</Text>
        </View>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.senderRow}>
            <View style={styles.senderLeft}>
              <Text style={styles.senderLabel}>Sent To:</Text>
              <Text style={styles.senderName}>{receiverName}</Text>
            </View>
            <View style={styles.dateRight}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.dateText}>{formatNotificationDate(notification.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{notification.title}</Text>
            {canChat && (
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => {
                  navigation.navigate('AdminMessage', {
                    preSelectedUserId: notification.receiverId,
                    preSelectedUserName: notification.receiverName,
                    preSelectedRole: notification.receiverType,
                  });
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.messageBox}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
    paddingBottom: 24,
    backgroundColor: '#17212F',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  chatBtn: {
    backgroundColor: '#17212F',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17212F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    borderLeftColor: '#17212F',
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
export default AdminMessageHistoryDetailScreen;
