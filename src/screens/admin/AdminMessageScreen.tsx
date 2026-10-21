import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Keyboard,
  NativeModules,
  findNodeHandle,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationService } from '../../services/NotificationService';
import { NotificationSendRequest } from '../../types';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminCard } from '../../components/admin/AdminCard';
import { AdminInput } from '../../components/admin/AdminInput';
import { AdminChip } from '../../components/admin/AdminChip';
import { AdminBadge } from '../../components/admin/StatusBadge';
import { AdminListRow } from '../../components/admin/AdminListRow';
import { AdminPrimaryButton } from '../../components/admin/AdminButtons';
import { AdminStickyBar } from '../../components/admin/AdminStickyBar';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { CheckIcon, SearchIcon } from '../../components/admin/AdminIcons';

export const AdminMessageScreen: React.FC = () => {
  console.log('MSG_SCREEN_V3 mount');

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const route = useRoute<any>();
  const preSelectedId = route.params?.preSelectedUserId;
  const preSelectedName = route.params?.preSelectedUserName;
  const preSelectedRole = route.params?.preSelectedRole;
  const preSelectedEmail = route.params?.preSelectedUserEmail;

  // Render counter
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`[MSG_SCREEN] render count: ${renderCount.current}`);

  useEffect(() => {
    console.log('[MSG_SCREEN] mounted successfully');
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      console.log(`[KEYBOARD] keyboardDidShow height: ${e.endCoordinates.height}`);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      console.log('[KEYBOARD] keyboardDidHide');
    });
    return () => {
      console.log('MSG_SCREEN_V3 unmount');
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [recipient, setRecipient] = useState<'ALL' | 'SPECIFIC'>(
    preSelectedId ? 'SPECIFIC' : 'ALL'
  );
  const [specificUserId, setSpecificUserId] = useState<string>(preSelectedId || '');

  // Consolidated form state with functional updater
  const [form, setForm] = useState({ title: '', message: '' });

  const titleInputRef = useRef<TextInput>(null);
  const messageInputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState(preSelectedName || '');
  const [customersList, setCustomersList] = useState<any[]>([]);

  useEffect(() => {
    if (recipient === 'SPECIFIC') {
      fetchCustomers();
    }
  }, [recipient]);

  const fetchCustomers = async () => {
    setFetchingUsers(true);
    try {
      const response = await api.get('/user/getAll');
      const allUsers = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      const validUsers = allUsers.filter((u: any) => {
        if (preSelectedRole) return u.role === preSelectedRole;
        return u.role === 'CUSTOMER' || u.role === 'FARMER';
      });
      setCustomersList(validUsers);

      if (preSelectedEmail) {
        const matchedUser = validUsers.find((u: any) => u.email === preSelectedEmail);
        if (matchedUser) {
          setSpecificUserId(matchedUser.userId || matchedUser.id);
          setRecipient('SPECIFIC');
        }
      }
    } catch (error) {
      console.log('Failed to fetch customers:', error);
      Alert.alert('Error', 'Failed to load customers list.');
    } finally {
      setFetchingUsers(false);
    }
  };

  const titleRef = useRef(form.title);
  const messageRef = useRef(form.message);

  const handleTitleChange = useCallback((t: string) => {
    setForm((prev) => (prev.title === t ? prev : { ...prev, title: t }));
    titleRef.current = t;
  }, []);

  const handleMessageChange = useCallback((m: string) => {
    setForm((prev) => (prev.message === m ? prev : { ...prev, message: m }));
    messageRef.current = m;
  }, []);

  const handleRecipientAll = useCallback(() => {
    Keyboard.dismiss();
    setRecipient('ALL');
  }, []);

  const handleRecipientSpecific = useCallback(() => {
    Keyboard.dismiss();
    setRecipient('SPECIFIC');
  }, []);

  const handleTitleSubmit = useCallback(() => {
    messageInputRef.current?.focus();
  }, []);

  const handleSelectUser = useCallback((uId: string) => {
    Keyboard.dismiss();
    setSpecificUserId(uId);
  }, []);

  const handleSend = async () => {
    const reactTitle = (titleRef.current || form.title || '').trim();
    let currentTitle = reactTitle;
    const reactMessage = (messageRef.current || form.message || '').trim();
    let currentMessage = reactMessage;

    if (Platform.OS === 'android') {
      const { TextInputCommiter } = NativeModules;
      if (TextInputCommiter) {
        try {
          if (titleInputRef.current) {
            const titleTag = findNodeHandle(titleInputRef.current);
            if (titleTag) {
              const t = await TextInputCommiter.getAndCommitText(titleTag);
              if (t && t.trim().length > currentTitle.length) currentTitle = t.trim();
            }
          }
          if (messageInputRef.current) {
            const msgTag = findNodeHandle(messageInputRef.current);
            if (msgTag) {
              const m = await TextInputCommiter.getAndCommitText(msgTag);
              if (m && m.trim().length > currentMessage.length) currentMessage = m.trim();
            }
          }
        } catch (e) {
          console.warn('Failed to get native text:', e);
        }
      }
    }

    if (!currentTitle.trim() || !currentMessage.trim()) {
      Alert.alert('Error', 'Title and message are required.');
      return;
    }
    if (recipient === 'SPECIFIC' && !specificUserId) {
      Alert.alert('Error', 'Please select a specific customer.');
      return;
    }

    setLoading(true);
    try {
      const senderName = user?.name || user?.email || 'Admin Support';
      const formattedMessage = `From: ${senderName}\n\n${currentMessage.trim()}`;
      const payload: NotificationSendRequest = {
        receiverType: specificUserId
          ? customersList.find((u) => (u.userId || u.id) === specificUserId)?.role ||
            preSelectedRole ||
            'CUSTOMER'
          : preSelectedRole || 'CUSTOMER',
        receiverId: recipient === 'ALL' ? undefined : specificUserId,
        title: currentTitle.trim(),
        message: formattedMessage,
        notificationType: 'ADMIN',
      };

      await NotificationService.sendNotification(payload);
      Alert.alert('Success', 'Your message was sent successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Send message error:', error);
      setTimeout(() => {
        Alert.alert('Error', 'Failed to send message.');
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customersList;
    return customersList.filter((u) => {
      const nameMatch = (u.name || '').toLowerCase().includes(q);
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      return nameMatch || emailMatch;
    });
  }, [customersList, searchQuery]);

  const screenTitle =
    preSelectedRole === 'FARMER'
      ? 'Message Farmer'
      : preSelectedRole === 'CUSTOMER'
      ? 'Message Customer'
      : 'Message User';

  const audienceAllLabel = `All ${
    preSelectedRole === 'FARMER'
      ? 'Farmers'
      : preSelectedRole === 'CUSTOMER'
      ? 'Customers'
      : 'Users'
  }`;

  const audienceSpecificLabel = `Select ${
    preSelectedRole === 'FARMER'
      ? 'Farmer'
      : preSelectedRole === 'CUSTOMER'
      ? 'Customer'
      : 'User'
  }`;

  return (
    <AdminPageBackground>
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AdminHeader
          variant="inner"
          title={screenTitle}
          titleAlign="left"
          titleSize={25}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.formBody}>
          {/* Receiver Section */}
          <View style={styles.sectionHeaderWrapper}>
            <Text style={styles.sectionHeaderTitle}>RECIPIENT AUDIENCE</Text>
            <View style={styles.sectionHeaderDivider} />
          </View>

          <AdminCard style={styles.card}>
            {preSelectedId ? (
              <View style={styles.preSelectedRow}>
                <View style={styles.preSelectedInfo}>
                  <Text style={styles.preSelectedLabel}>Target Recipient</Text>
                  <Text style={styles.preSelectedName}>
                    {preSelectedName || 'Selected User'}
                  </Text>
                </View>
                <AdminBadge label={preSelectedRole || 'USER'} variant="info" size="small" />
              </View>
            ) : (
              <>
                <View style={styles.chipsRow}>
                  <AdminChip
                    label={audienceAllLabel}
                    active={recipient === 'ALL'}
                    onPress={handleRecipientAll}
                    style={styles.flex1}
                  />
                  <AdminChip
                    label={audienceSpecificLabel}
                    active={recipient === 'SPECIFIC'}
                    onPress={handleRecipientSpecific}
                    style={styles.flex1}
                  />
                </View>

                {recipient === 'SPECIFIC' && (
                  <View style={styles.userSelectionContainer}>
                    <AdminInput
                      placeholder="Search recipient by name or email..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      leftIcon={<SearchIcon size={16} color="#8A93AB" />}
                      containerStyle={styles.searchContainer}
                    />

                    {fetchingUsers ? (
                      <ActivityIndicator size="small" color="#4F5BD5" style={styles.loaderSpacing} />
                    ) : filteredCustomers.length === 0 ? (
                      <Text style={styles.noUsersText}>No matching recipients found.</Text>
                    ) : (
                      <View style={styles.usersList}>
                        {filteredCustomers.slice(0, 10).map((cust) => {
                          const uId = cust.userId || cust.id;
                          const isSelected = specificUserId === uId;
                          return (
                            <AdminListRow
                              key={uId}
                              title={cust.name || 'Unnamed User'}
                              subtitle={cust.email}
                              avatarText={cust.name || cust.email || 'U'}
                              badgeLabel={cust.role}
                              showChevron={false}
                              onPress={() => handleSelectUser(uId)}
                              rightElement={
                                isSelected ? (
                                  <View style={styles.selectedRadioActive}>
                                    <CheckIcon size={12} color="#FFFFFF" strokeWidth={2.4} />
                                  </View>
                                ) : (
                                  <View style={styles.selectedRadioInactive} />
                                )
                              }
                              style={[
                                styles.userRow,
                                isSelected && styles.userRowSelected,
                              ]}
                            />
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </AdminCard>

          {/* Message Content Section */}
          <View style={styles.sectionHeaderWrapper}>
            <Text style={styles.sectionHeaderTitle}>MESSAGE DETAILS</Text>
            <View style={styles.sectionHeaderDivider} />
          </View>

          <AdminCard style={styles.card}>
            <View style={styles.typeBadgeRow}>
              <Text style={styles.fieldLabel}>Notification Channel</Text>
              <AdminBadge label="ADMIN" variant="info" size="small" />
            </View>

            <AdminInput
              ref={titleInputRef}
              label="Subject / Title"
              required
              placeholder="e.g. Important Account Update"
              value={form.title}
              onChangeText={handleTitleChange}
              returnKeyType="next"
              onSubmitEditing={handleTitleSubmit}
              autoCapitalize="sentences"
            />

            <AdminInput
              ref={messageInputRef}
              label="Message Body"
              required
              placeholder="Type your message to the recipient(s)..."
              value={form.message}
              onChangeText={handleMessageChange}
              multiline
              blurOnSubmit={false}
              returnKeyType="default"
              autoCapitalize="sentences"
              containerStyle={styles.messageInputContainer}
            />
          </AdminCard>
        </View>
      </KeyboardAwareScrollView>

      {/* Sticky bar that rides smoothly on top of keyboard with KeyboardStickyView */}
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <AdminStickyBar>
          <AdminPrimaryButton
            title="Send Message"
            onPress={handleSend}
            loading={loading}
          />
        </AdminStickyBar>
      </KeyboardStickyView>
    </AdminPageBackground>
  );
};

export default AdminMessageScreen;

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  formBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  preSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preSelectedInfo: {
    flex: 1,
  },
  preSelectedLabel: {
    fontFamily: AdminFonts.medium,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.inkMuted,
    marginBottom: 2,
  },
  preSelectedName: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: ADMIN_THEME.colors.ink,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  flex1: {
    flex: 1,
  },
  userSelectionContainer: {
    marginTop: 12,
  },
  searchContainer: {
    marginBottom: 12,
  },
  loaderSpacing: {
    marginVertical: 12,
  },
  noUsersText: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.inkMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  usersList: {
    maxHeight: 280,
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
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F7',
  },
  fieldLabel: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
  },
  messageInputContainer: {
    marginBottom: 0,
  },
});
