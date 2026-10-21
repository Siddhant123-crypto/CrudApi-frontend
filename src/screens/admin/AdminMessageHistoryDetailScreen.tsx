import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminBadge } from '../../components/admin/StatusBadge';
import { AdminPrimaryButton, AdminOutlineButton } from '../../components/admin/AdminButtons';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { formatNotificationDate } from '../../components/NotificationCard';
import { ClockIcon } from '../../components/admin/AdminIcons';

export const AdminMessageHistoryDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const notification = route.params?.notification;

  if (!notification) {
    return (
      <AdminPageBackground>
        <AdminHeader
          variant="inner"
          title="Message Details"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <AdminCard style={styles.errorCard}>
            <Text style={styles.errorText}>Message details not found.</Text>
            <AdminOutlineButton
              title="Go Back"
              onPress={() => navigation.goBack()}
              style={{ marginTop: 14 }}
            />
          </AdminCard>
        </View>
      </AdminPageBackground>
    );
  }

  let actualMessage = notification.message || '';
  if (actualMessage.startsWith('From: ')) {
    const parts = actualMessage.split('\n\n');
    if (parts.length >= 2) {
      actualMessage = parts.slice(1).join('\n\n').trim();
    }
  }

  const receiverName =
    notification.receiverName ||
    'All ' +
      (notification.receiverType === 'FARMER'
        ? 'Farmers'
        : notification.receiverType === 'CUSTOMER'
        ? 'Customers'
        : 'Users');
  const isBroadcast = !notification.receiverId;
  const canChat =
    !isBroadcast &&
    (notification.receiverType === 'CUSTOMER' || notification.receiverType === 'FARMER');

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title="Sent Message Detail"
        subtitle={notification.receiverType || 'Direct Notification'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AdminCard style={styles.card}>
          {/* Header Row: Recipient & Date */}
          <View style={styles.headerRow}>
            <View style={styles.recipientInfo}>
              <Text style={styles.fieldLabel}>SENT TO</Text>
              <Text style={styles.recipientName}>{receiverName}</Text>
            </View>
            <AdminBadge
              label={notification.receiverType || (isBroadcast ? 'BROADCAST' : 'USER')}
              variant={isBroadcast ? 'info' : 'neutral'}
              size="small"
            />
          </View>

          <View style={styles.dateRow}>
            <ClockIcon size={14} color="#8A93AB" />
            <Text style={styles.dateText}>
              {formatNotificationDate(notification.createdAt)}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Subject & Reply Button */}
          <View style={styles.titleSection}>
            <View style={styles.titleWrapper}>
              <Text style={styles.fieldLabel}>SUBJECT</Text>
              <Text style={styles.subjectText}>{notification.title}</Text>
            </View>
            {canChat && (
              <AdminPrimaryButton
                title="Reply"
                icon={<Ionicons name="chatbubble-ellipses" size={15} color="#FFFFFF" />}
                onPress={() => {
                  navigation.navigate('AdminMessage', {
                    preSelectedUserId: notification.receiverId,
                    preSelectedUserName: notification.receiverName,
                    preSelectedRole: notification.receiverType,
                  });
                }}
                style={styles.replyButton}
              />
            )}
          </View>

          <View style={styles.divider} />

          {/* Message Content */}
          <View style={styles.messageBox}>
            <Text style={styles.fieldLabel}>MESSAGE BODY</Text>
            <Text style={styles.messageBodyText}>{actualMessage}</Text>
          </View>
        </AdminCard>
      </ScrollView>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: ADMIN_THEME.colors.ink,
  },
  card: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipientInfo: {
    flex: 1,
    marginRight: 10,
  },
  fieldLabel: {
    fontFamily: AdminFonts.bold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: '#4F5BD5',
    marginBottom: 4,
  },
  recipientName: {
    fontFamily: AdminFonts.bold,
    fontSize: 16,
    color: ADMIN_THEME.colors.ink,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dateText: {
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: ADMIN_THEME.colors.inkMuted,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF0F7',
    marginVertical: 14,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  subjectText: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 14.5,
    color: ADMIN_THEME.colors.ink,
    marginTop: 2,
  },
  replyButton: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  messageBox: {
    marginTop: 2,
  },
  messageBodyText: {
    fontFamily: AdminFonts.regular,
    fontSize: 14,
    color: ADMIN_THEME.colors.ink,
    lineHeight: 22,
    marginTop: 4,
  },
});

export default AdminMessageHistoryDetailScreen;
