import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  getNotificationIcon,
  formatNotificationDate,
  getCustomerNotificationIcon,
  getFarmerNotificationIcon,
} from '../components/NotificationCard';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { NotificationResponse } from '../types';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { PrimaryButton } from '../components/ui/Buttons';
import { Card } from '../components/ui/Card';
import { THEME } from '../constants/theme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerDeepButton } from '../components/farmer/FarmerButtons';
import { FARMER_THEME } from '../constants/farmerTheme';

// Admin theme imports
import { AdminPageBackground } from '../components/admin/AdminPageBackground';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminCard } from '../components/admin/AdminCard';
import { AdminBadge } from '../components/admin/StatusBadge';
import { AdminPrimaryButton, AdminOutlineButton } from '../components/admin/AdminButtons';
import { ADMIN_THEME, AdminFonts } from '../constants/adminTheme';
import { ClockIcon } from '../components/admin/AdminIcons';

const NotificationDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const notification: NotificationResponse = route.params?.notification;
  const { markAsRead } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    if (notification && !notification.isRead) {
      markAsRead(notification.notificationId).catch((err) =>
        console.log('Error marking read silently:', err)
      );
    }
  }, [notification]);

  const isFarmer = user?.role === 'FARMER';
  const isAdmin = user?.role === 'ADMIN';

  if (!notification) {
    if (isAdmin) {
      return (
        <AdminPageBackground>
          <AdminHeader
            variant="inner"
            title="Notification"
            onBack={() => navigation.goBack()}
          />
          <View style={styles.centerContainer}>
            <AdminCard style={styles.adminErrorCard}>
              <Text style={styles.adminErrorText}>Notification details not found.</Text>
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

    const headerBgColor = isFarmer ? '#1E5631' : '#1E3A8A';
    const headerTextColor = '#FFFFFF';
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBgColor }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: headerBgColor, borderBottomColor: headerBgColor },
          ]}
        >
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={headerTextColor} />
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

  // Customer Theme View (100% UNTOUCHED)
  if (!isFarmer && !isAdmin) {
    const iconConfig = getCustomerNotificationIcon(notification);
    const senderType = notification.senderType;
    const canReply = senderType === 'FARMER' && !!notification.senderId;

    return (
      <PageBackground style={{ flex: 1 }}>
        <ThemedHeader
          variant="inner"
          title="Notification"
          onBackPress={() => navigation.goBack()}
        />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
          <Card style={styles.customerCard}>
            <View style={styles.customerSenderRow}>
              <View style={[styles.customerIconContainer, { backgroundColor: iconConfig.bg }]}>
                <Ionicons name={iconConfig.name as any} size={22} color={iconConfig.color} />
              </View>
              <View style={{ flex: 1 }}>
                {senderName ? (
                  <Text style={styles.customerSenderName}>{senderName}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="time-outline" size={13} color="#8A6F5C" style={{ marginRight: 4 }} />
                  <Text style={styles.customerDateText}>{formatNotificationDate(notification.createdAt)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.customerDivider} />

            <Text style={styles.customerTitle}>{notification.title}</Text>

            <View style={styles.customerMessageBox}>
              <Text style={styles.customerMessageText}>{actualMessage}</Text>
            </View>

            {canReply && (
              <PrimaryButton
                title={`Reply to ${senderName || 'Farmer'}`}
                onPress={() => {
                  navigation.navigate('CustomerMessageFarmer', {
                    preSelectedFarmerId: notification.senderId,
                    preSelectedFarmerName: senderName || 'Farmer',
                  });
                }}
                style={{ marginTop: 20 }}
              />
            )}
          </Card>
        </ScrollView>
      </PageBackground>
    );
  }

  // Farmer Theme View (100% UNTOUCHED)
  if (isFarmer) {
    const iconConfig = getFarmerNotificationIcon(notification);
    const senderType = notification.senderType;
    const canReply =
      (isFarmer && notification.title === 'Farm Verification Update') ||
      (notification.senderId && (senderType === 'CUSTOMER' || senderType === 'ADMIN'));

    return (
      <FarmerPageBackground>
        <FarmerHeader
          variant="inner"
          title="Notification Detail"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView style={styles.content} contentContainerStyle={styles.farmerScrollContent}>
          <FarmerCard style={styles.farmerCard}>
            <View style={styles.farmerSenderRow}>
              <View style={[styles.farmerIconContainer, { backgroundColor: iconConfig.bg }]}>
                <Ionicons name={iconConfig.name as any} size={24} color={iconConfig.color} />
              </View>
              <View style={{ flex: 1 }}>
                {senderName ? <Text style={styles.farmerSenderName}>{senderName}</Text> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons name="time-outline" size={13} color="#6B7A6F" style={{ marginRight: 4 }} />
                  <Text style={styles.farmerDateText}>
                    {formatNotificationDate(notification.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.farmerDivider} />

            <Text style={styles.farmerTitle}>{notification.title}</Text>

            <View style={styles.farmerMessageBox}>
              <Text style={styles.farmerMessageText}>{actualMessage}</Text>
            </View>

            {canReply && (
              <FarmerDeepButton
                title={
                  notification.title === 'Farm Verification Update'
                    ? 'Contact Admin'
                    : `Reply to ${senderName || (senderType === 'ADMIN' ? 'Admin' : 'Customer')}`
                }
                onPress={() => {
                  if (
                    senderType === 'ADMIN' ||
                    notification.title === 'Farm Verification Update'
                  ) {
                    navigation.navigate('FarmerContactAdmin');
                  } else if (senderType === 'CUSTOMER') {
                    navigation.navigate('FarmerMessageCustomer', {
                      preSelectedCustomerId: notification.senderId,
                      preSelectedCustomerName: senderName || 'Customer',
                      preSelectedRole: 'CUSTOMER',
                    });
                  }
                }}
                style={{ marginTop: 20 }}
              />
            )}
          </FarmerCard>
        </ScrollView>
      </FarmerPageBackground>
    );
  }

  // Admin screen path (Restyled to Admin Theme)
  const canAdminReply =
    notification.senderId &&
    (notification.senderType === 'CUSTOMER' || notification.senderType === 'FARMER');

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title="Notification Detail"
        subtitle={notification.type || 'System update'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.adminScrollContent}>
        <AdminCard style={styles.adminCard}>
          <View style={styles.adminSenderRow}>
            <View style={styles.adminSenderLeft}>
              <Text style={styles.adminFieldLabel}>FROM</Text>
              <Text style={styles.adminSenderName}>
                {senderName || (notification.senderType ? `${notification.senderType} Notification` : 'System')}
              </Text>
            </View>
            {notification.senderType && (
              <AdminBadge label={notification.senderType} variant="info" size="small" />
            )}
          </View>

          <View style={styles.adminDateRow}>
            <ClockIcon size={14} color="#8A93AB" />
            <Text style={styles.adminDateText}>
              {formatNotificationDate(notification.createdAt)}
            </Text>
          </View>

          <View style={styles.adminDivider} />

          <View style={styles.adminTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminFieldLabel}>TITLE</Text>
              <Text style={styles.adminTitleText}>{notification.title}</Text>
            </View>
            {canAdminReply && (
              <AdminPrimaryButton
                title="Reply"
                icon={<Ionicons name="chatbubble-ellipses" size={14} color="#FFFFFF" />}
                onPress={() => {
                  navigation.navigate('AdminMessage', {
                    preSelectedUserId: notification.senderId,
                    preSelectedUserName: senderName || 'User',
                    preSelectedRole: notification.senderType,
                  });
                }}
                style={styles.adminReplyBtn}
              />
            )}
          </View>

          <View style={styles.adminDivider} />

          <View style={styles.adminMessageBox}>
            <Text style={styles.adminFieldLabel}>MESSAGE BODY</Text>
            <Text style={styles.adminMessageText}>{actualMessage}</Text>
          </View>
        </AdminCard>
      </ScrollView>
    </AdminPageBackground>
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
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  headerRightPlaceholder: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  content: {
    flex: 1,
  },
  customerCard: {
    padding: 20,
    borderRadius: 20,
  },
  customerSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerSenderName: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: '#2B1E16',
  },
  customerDateText: {
    fontSize: 12,
    fontFamily: THEME.fonts.regular,
    color: '#8D7B6F',
  },
  customerDivider: {
    height: 1,
    backgroundColor: '#EFE3D5',
    marginVertical: 16,
  },
  customerTitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.bold,
    color: '#2B1E16',
    marginBottom: 12,
  },
  customerMessageBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    padding: 16,
  },
  customerMessageText: {
    fontSize: 14,
    fontFamily: THEME.fonts.regular,
    color: '#4A3B32',
    lineHeight: 22,
  },
  farmerScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  farmerCard: {
    padding: 20,
  },
  farmerSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  farmerSenderName: {
    fontSize: 16,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
  },
  farmerDateText: {
    fontSize: 12,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#6B7A6F',
  },
  farmerDivider: {
    height: 1,
    backgroundColor: '#DCE8DF',
    marginVertical: 16,
  },
  farmerTitle: {
    fontSize: 18,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 12,
  },
  farmerMessageBox: {
    backgroundColor: '#F0F6F2',
    borderRadius: 14,
    padding: 16,
  },
  farmerMessageText: {
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.regular,
    color: '#2B4034',
    lineHeight: 22,
  },

  // Admin Styles
  adminScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  adminCard: {
    padding: 18,
  },
  adminErrorCard: {
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  adminErrorText: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: ADMIN_THEME.colors.ink,
  },
  adminSenderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  adminSenderLeft: {
    flex: 1,
    marginRight: 10,
  },
  adminFieldLabel: {
    fontFamily: AdminFonts.bold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    color: '#4F5BD5',
    marginBottom: 4,
  },
  adminSenderName: {
    fontFamily: AdminFonts.bold,
    fontSize: 16,
    color: ADMIN_THEME.colors.ink,
  },
  adminDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  adminDateText: {
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: ADMIN_THEME.colors.inkMuted,
  },
  adminDivider: {
    height: 1,
    backgroundColor: '#EEF0F7',
    marginVertical: 14,
  },
  adminTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  adminTitleText: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 15,
    color: ADMIN_THEME.colors.ink,
    marginTop: 2,
  },
  adminReplyBtn: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  adminMessageBox: {
    marginTop: 2,
  },
  adminMessageText: {
    fontFamily: AdminFonts.regular,
    fontSize: 14,
    color: ADMIN_THEME.colors.ink,
    lineHeight: 22,
    marginTop: 4,
  },
});

export default NotificationDetailScreen;
