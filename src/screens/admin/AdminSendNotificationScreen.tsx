import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NotificationService } from '../../services/NotificationService';
import { NotificationType, NotificationSendRequest } from '../../types';
import api from '../../services/api';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminInput } from '../../components/admin/AdminInput';
import { AdminChip } from '../../components/admin/AdminChip';
import { AdminListRow } from '../../components/admin/AdminListRow';
import { AdminPrimaryButton } from '../../components/admin/AdminButtons';
import { AdminStickyBar } from '../../components/admin/AdminStickyBar';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { CheckIcon, SearchIcon } from '../../components/admin/AdminIcons';

const NOTIFICATION_TYPES: NotificationType[] = [
  'SYSTEM',
  'ORDER',
  'PRODUCT',
  'CUSTOMER',
  'FARMER',
  'ADMIN',
];
const RECEIVER_TYPES: Array<'CUSTOMER' | 'FARMER'> = ['CUSTOMER', 'FARMER'];

export const AdminSendNotificationScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [receiverType, setReceiverType] = useState<'CUSTOMER' | 'FARMER'>('CUSTOMER');
  const [recipient, setRecipient] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [specificUserId, setSpecificUserId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('SYSTEM');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (recipient === 'SPECIFIC') {
      fetchUsers();
    }
  }, [recipient, receiverType]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const endpoint = receiverType === 'CUSTOMER' ? '/admin/customers' : '/admin/farmers';
      const response = await api.get(endpoint);
      setUsersList(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error) {
      console.log('Failed to fetch users:', error);
      Alert.alert('Error', `Failed to load ${receiverType.toLowerCase()}s list.`);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Title and message are required.');
      return;
    }
    if (recipient === 'SPECIFIC' && !specificUserId) {
      Alert.alert('Error', `Please select a specific ${receiverType.toLowerCase()}.`);
      return;
    }

    setLoading(true);
    try {
      const payload: NotificationSendRequest = {
        receiverType,
        receiverId: recipient === 'ALL' ? undefined : specificUserId,
        title: title.trim(),
        message: message.trim(),
        type,
      };

      await NotificationService.sendNotification(payload);
      Alert.alert('Success', 'Notification sent successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Send notification error:', error);
      Alert.alert('Error', 'Failed to send notification.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const nameMatch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  const renderSectionHeader = (label: string) => (
    <View style={styles.sectionHeaderWrapper}>
      <Text style={styles.sectionHeaderTitle}>{label}</Text>
      <View style={styles.sectionHeaderDivider} />
    </View>
  );

  return (
    <AdminPageBackground>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AdminHeader
          variant="inner"
          title="Send Notification"
          subtitle="System & push alerts dispatch"
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Target Audience Section */}
          {renderSectionHeader('TARGET AUDIENCE')}
          <AdminCard style={styles.card}>
            <Text style={styles.fieldLabel}>Receiver Role</Text>
            <View style={styles.chipsRow}>
              {RECEIVER_TYPES.map((rt) => (
                <AdminChip
                  key={rt}
                  label={rt === 'CUSTOMER' ? 'Customers' : 'Farmers'}
                  active={receiverType === rt}
                  onPress={() => {
                    setReceiverType(rt);
                    setSpecificUserId('');
                  }}
                  style={styles.flex1}
                />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Audience Scope</Text>
            <View style={styles.chipsRow}>
              <AdminChip
                label={`All ${receiverType === 'CUSTOMER' ? 'Customers' : 'Farmers'}`}
                active={recipient === 'ALL'}
                onPress={() => setRecipient('ALL')}
                style={styles.flex1}
              />
              <AdminChip
                label={`Specific ${receiverType === 'CUSTOMER' ? 'Customer' : 'Farmer'}`}
                active={recipient === 'SPECIFIC'}
                onPress={() => setRecipient('SPECIFIC')}
                style={styles.flex1}
              />
            </View>

            {recipient === 'SPECIFIC' && (
              <View style={styles.specificPicker}>
                <AdminInput
                  placeholder={`Search ${receiverType.toLowerCase()} by name or email...`}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  leftIcon={<SearchIcon size={16} color="#8A93AB" />}
                  containerStyle={{ marginBottom: 10 }}
                />

                {fetchingUsers ? (
                  <ActivityIndicator size="small" color="#4F5BD5" style={{ marginVertical: 12 }} />
                ) : filteredUsers.length === 0 ? (
                  <Text style={styles.emptyText}>No users found.</Text>
                ) : (
                  <View style={styles.usersList}>
                    {filteredUsers.slice(0, 8).map((u) => {
                      const uId = u.userId || u.id;
                      const isSelected = specificUserId === uId;
                      return (
                        <AdminListRow
                          key={uId}
                          title={u.name || 'User'}
                          subtitle={u.email}
                          avatarText={u.name || u.email || 'U'}
                          showChevron={false}
                          onPress={() => setSpecificUserId(uId)}
                          rightElement={
                            isSelected ? (
                              <View style={styles.selectedRadioActive}>
                                <CheckIcon size={12} color="#FFFFFF" strokeWidth={2.4} />
                              </View>
                            ) : (
                              <View style={styles.selectedRadioInactive} />
                            )
                          }
                          style={[styles.userRow, isSelected && styles.userRowSelected]}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </AdminCard>

          {/* Notification Category */}
          {renderSectionHeader('NOTIFICATION TYPE')}
          <AdminCard style={styles.card}>
            <View style={styles.typeChipsGrid}>
              {NOTIFICATION_TYPES.map((t) => (
                <AdminChip
                  key={t}
                  label={t}
                  active={type === t}
                  onPress={() => setType(t)}
                  style={styles.typeChipItem}
                />
              ))}
            </View>
          </AdminCard>

          {/* Content Section */}
          {renderSectionHeader('CONTENT')}
          <AdminCard style={styles.card}>
            <AdminInput
              label="Notification Title"
              required
              placeholder="e.g. Scheduled Platform Maintenance"
              value={title}
              onChangeText={setTitle}
            />

            <AdminInput
              label="Message Body"
              required
              placeholder="Enter notification message details..."
              value={message}
              onChangeText={setMessage}
              multiline
              containerStyle={{ marginBottom: 0 }}
            />
          </AdminCard>
        </ScrollView>

        <AdminStickyBar>
          <AdminPrimaryButton
            title="Dispatch Notification"
            onPress={handleSend}
            loading={loading}
          />
        </AdminStickyBar>
      </KeyboardAvoidingView>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeaderWrapper: {
    marginBottom: 8,
    marginTop: 6,
  },
  sectionHeaderTitle: {
    fontFamily: AdminFonts.bold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: '#4F5BD5',
    marginBottom: 6,
  },
  sectionHeaderDivider: {
    height: 1,
    backgroundColor: '#EEF0F7',
    marginBottom: 4,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  fieldLabel: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  specificPicker: {
    marginTop: 14,
  },
  emptyText: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.inkMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  usersList: {
    maxHeight: 260,
  },
  userRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  userRowSelected: {
    backgroundColor: '#E8EBFF',
  },
  selectedRadioActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4F5BD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioInactive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C9CEF5',
  },
  typeChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChipItem: {
    marginBottom: 4,
  },
});

export default AdminSendNotificationScreen;
