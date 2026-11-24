import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  NativeModules,
  findNodeHandle
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { NotificationService } from '../services/NotificationService';
import { NotificationSendRequest } from '../types';
import api from '../services/api';
import {
  MESSAGING_RECIPIENTS_ENDPOINT,
  MessagingRecipient,
  parseMessagingRecipients,
  filterMessagingRecipients,
  buildFarmerMessagePayload,
} from '../utils/messagingRecipientsUtils';
import { useAuth } from '../context/AuthContext';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FARMER_THEME } from '../constants/farmerTheme';

export const FarmerMessageCustomerScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const route = useRoute<any>();
  const preSelectedId = route.params?.preSelectedCustomerId;
  const preSelectedName = route.params?.preSelectedCustomerName;
  const preSelectedRole = route.params?.preSelectedRole;
  const isAdminMessage = preSelectedRole === 'ADMIN';
  const [recipient, setRecipient] = useState<'SPECIFIC'>('SPECIFIC');
  const [specificUserId, setSpecificUserId] = useState<string>(preSelectedId || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const titleInputRef = useRef<TextInput>(null);
  const messageInputRef = useRef<TextInput>(null);
  
  const [searchQuery, setSearchQuery] = useState(preSelectedName || '');
  const [customersList, setCustomersList] = useState<MessagingRecipient[]>([]);
  useEffect(() => {
    if (recipient === 'SPECIFIC') {
      fetchCustomers();
    }
  }, [recipient]);
  const fetchCustomers = async () => {
    setFetchingUsers(true);
    try {
      const response = await api.get(MESSAGING_RECIPIENTS_ENDPOINT);
      const customers = parseMessagingRecipients(response.data, 'CUSTOMER');
      setCustomersList(customers);
    } catch (error) {
      console.log('Failed to fetch customers:', error);
      Alert.alert(t('common.error', 'Error'), t('support.failedLoadCustomers', 'Failed to load customers list.'));
    } finally {
      setFetchingUsers(false);
    }
  };
  const titleRef = useRef(title);
  const messageRef = useRef(message);

  const handleTitleChange = (t: string) => {
    setTitle(t);
    titleRef.current = t;
  };
  const handleMessageChange = (m: string) => {
    setMessage(m);
    messageRef.current = m;
  };

  const handleSend = async () => {
    const reactTitle = (titleRef.current || title || '').trim();
    let currentTitle = reactTitle;
    const reactMessage = (messageRef.current || message || '').trim();
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
          console.warn("Failed to get native text:", e);
        }
      }
    }

    if (!currentTitle.trim() || !currentMessage.trim()) {
      Alert.alert(t('common.error', 'Error'), t('support.titleAndMessageRequired', 'Title and message are required.'));
      return;
    }
    const senderName = user?.name || user?.email || t('common.farmerRole', 'Farm2Home Producer');
    const formattedMessage = `From: ${senderName}\n\n${currentMessage.trim()}`;
    const built = buildFarmerMessagePayload({
      isAdminMessage,
      specificUserId,
      title: currentTitle,
      formattedMessage,
    });
    if (!built.ok || !built.payload) {
      if (built.errorCode === 'SELECT_CUSTOMER_REQUIRED') {
        Alert.alert(t('common.error', 'Error'), t('support.selectCustomerRequired', 'Please select a specific customer.'));
      } else {
        Alert.alert(t('common.error', 'Error'), t('support.titleAndMessageRequired', 'Title and message are required.'));
      }
      return;
    }
    setLoading(true);
    try {
      const payload: NotificationSendRequest = built.payload;
      await NotificationService.sendNotification(payload);
      Alert.alert(t('common.success', 'Success'), t('support.messageSentSuccess', 'Message sent successfully'), [
        { text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Send message error:', error);
      setTimeout(() => {
        Alert.alert(t('common.error', 'Error'), t('support.failedSendMessage', 'Failed to send message.'));
      }, 100);
    } finally {
      setLoading(false);
    }
  };
  const filteredCustomers = filterMessagingRecipients(customersList, searchQuery);
  return (
    <FarmerPageBackground>
      <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
      <FarmerHeader
        variant="inner"
        title={isAdminMessage ? t('support.messageAdmin', 'Message Admin') : t('support.messageCustomer', 'Message Customer')}
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {isAdminMessage ? (
          <View style={styles.adminProfileCard}>
            <View style={styles.adminAvatarContainer}>
              <Ionicons name="shield-checkmark" size={30} color="#FFFFFF" />
            </View>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{preSelectedName || t('support.systemAdmin', 'System Administrator')}</Text>
              <Text style={styles.adminRole}>{t('support.supportVerification', 'Support & Verification')}</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.label}>{t('support.selectCustomer', 'Select Customer')}</Text>
          </>
        )}
        {!isAdminMessage && recipient === 'SPECIFIC' && (
          <View style={styles.specificUserContainer}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#5C6B60" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('support.searchCustomersPlaceholder', 'Search by name or email...')}
                placeholderTextColor="#7D8D81"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {fetchingUsers ? (
              <ActivityIndicator size="small" color="#1F7A4D" />
            ) : filteredCustomers.length === 0 ? (
              <Text style={styles.infoText}>{t('support.noCustomersFound', 'No customers found.')}</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.usersScroll}>
                {filteredCustomers.map((user) => {
                  const uId = user.userId;
                  const isSelected = specificUserId === uId;
                  return (
                    <TouchableOpacity
                      key={uId}
                      style={[styles.userCard, isSelected && styles.userCardSelected]}
                      onPress={() => setSpecificUserId(uId)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="person-circle-outline" size={32} color={isSelected ? "#FFF" : "#5C6B60"} />
                      <Text style={[styles.userName, isSelected && { color: '#FFF' }]} numberOfLines={1}>
                        {user.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
        {!isAdminMessage && (
          <View style={styles.readOnlyContainer}>
            <Text style={styles.label}>{t('support.notificationType', 'Notification Type')}</Text>
            <View style={styles.readOnlyBadge}>
              <Text style={styles.readOnlyBadgeText}>FARMER</Text>
            </View>
          </View>
        )}
        <Text style={styles.label}>{t('support.title', 'Title')}</Text>
        <TextInput
          ref={titleInputRef}
          style={styles.input}
          placeholder={t('farmer.freshProducePlaceholder', 'e.g., Fresh Produce Available')}
          value={title}
          onChangeText={handleTitleChange}
          placeholderTextColor="#7D8D81"
        />
        <Text style={styles.label}>{t('support.message', 'Message')}</Text>
        <TextInput
          ref={messageInputRef}
          style={[styles.input, styles.textArea]}
          placeholder={t('support.enterMessagePlaceholder', 'Enter your message here...')}
          value={message}
          onChangeText={handleMessageChange}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#7D8D81"
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.sendButtonText}>{t('support.sendMessage', 'Send Message')}</Text>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={56} color="#17663F" />
            </View>
            <Text style={styles.successModalTitle}>{t('common.success', 'Success!')}</Text>
            <Text style={styles.successModalMessage}>{t('support.messageSentSuccess', 'Message sent successfully')}</Text>
          </View>
        </View>
      </Modal>
    </FarmerPageBackground>
  );
};
const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.3,
  },
  rowSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FBFEF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE8DF',
    alignItems: 'center',
    ...FARMER_THEME.shadows.tile,
  },
  selectorBtnActive: {
    backgroundColor: '#DDF3E4',
    borderColor: '#17663F',
    borderWidth: 1.5,
  },
  selectorText: {
    fontSize: 13,
    color: '#5C6B60',
    fontFamily: FARMER_THEME.fonts.medium,
  },
  selectorTextActive: {
    color: '#17663F',
    fontFamily: FARMER_THEME.fonts.bold,
  },
  readOnlyContainer: {
    marginTop: 8,
  },
  readOnlyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DDF3E4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8E2C8',
  },
  readOnlyBadgeText: {
    color: '#17663F',
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
  },
  adminProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5EFE3',
    ...FARMER_THEME.shadows.card,
  },
  adminAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#17663F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 3,
  },
  adminRole: {
    fontSize: 13,
    color: '#5C6B60',
    fontFamily: FARMER_THEME.fonts.regular,
  },
  input: {
    backgroundColor: '#F5FBF7',
    borderWidth: 1.5,
    borderColor: '#D3E5D8',
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: '#1B2A22',
    fontFamily: FARMER_THEME.fonts.regular,
  },
  textArea: {
    height: 130,
  },
  specificUserContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FBF7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D3E5D8',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1B2A22',
  },
  infoText: {
    color: '#5C6B60',
    fontSize: 13,
    fontStyle: 'italic',
  },
  usersScroll: {
    flexDirection: 'row',
  },
  userCard: {
    backgroundColor: '#FBFEF9',
    borderWidth: 1,
    borderColor: '#DCE8DF',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 100,
    alignItems: 'center',
    ...FARMER_THEME.shadows.tile,
  },
  userCardSelected: {
    backgroundColor: '#17663F',
    borderColor: '#17663F',
  },
  userName: {
    marginTop: 6,
    fontSize: 12,
    color: '#1B2A22',
    fontFamily: FARMER_THEME.fonts.medium,
  },
  sendButton: {
    backgroundColor: '#17663F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
    ...FARMER_THEME.shadows.button,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5EFE3',
    ...FARMER_THEME.shadows.card,
  },
  successIconContainer: {
    marginBottom: 14,
  },
  successModalTitle: {
    fontSize: 20,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 6,
  },
  successModalMessage: {
    fontSize: 14,
    color: '#5C6B60',
    textAlign: 'center',
    fontFamily: FARMER_THEME.fonts.regular,
  },
});
export default FarmerMessageCustomerScreen;
