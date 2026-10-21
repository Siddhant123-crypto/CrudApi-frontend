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
import { NotificationService } from '../services/NotificationService';
import { NotificationSendRequest } from '../types';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { PrimaryButton } from '../components/ui/Buttons';

export const CustomerMessageFarmerScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const route = useRoute<any>();
  const preSelectedId = route.params?.preSelectedFarmerId;
  const preSelectedName = route.params?.preSelectedFarmerName;
  const [recipient, setRecipient] = useState<'ALL' | 'SPECIFIC'>(preSelectedId ? 'SPECIFIC' : 'ALL');
  const [specificUserId, setSpecificUserId] = useState<string>(preSelectedId || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const titleInputRef = useRef<TextInput>(null);
  const messageInputRef = useRef<TextInput>(null);
  
  const [farmersList, setFarmersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(route.params?.preSelectedFarmerName || '');
  useEffect(() => {
    if (recipient === 'SPECIFIC') {
      fetchFarmers();
    }
  }, [recipient]);
  const fetchFarmers = async () => {
    setFetchingUsers(true);
    try {
      const response = await api.get('/user/getAll');
      const allUsers = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      const farmers = allUsers.filter((u: any) => u.role === 'FARMER');
      setFarmersList(farmers);
    } catch (error) {
      console.log('Failed to fetch farmers:', error);
      Alert.alert('Error', 'Failed to load farmers list.');
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
      Alert.alert('Error', 'Title and message are required.');
      return;
    }
    if (recipient === 'SPECIFIC' && !specificUserId) {
      Alert.alert('Error', 'Please select a specific farmer.');
      return;
    }
    setLoading(true);
    try {
      const senderName = user?.name || user?.email || 'A Customer';
      const formattedMessage = `From: ${senderName}\n\n${currentMessage.trim()}`;
      const payload: NotificationSendRequest = {
        receiverType: 'FARMER',
        receiverId: recipient === 'ALL' ? undefined : specificUserId,
        title: currentTitle.trim(),
        message: formattedMessage,
        notificationType: 'CUSTOMER',
      };
      await NotificationService.sendNotification(payload);
      Alert.alert('Success', 'Your message send successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
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
  return (
    <PageBackground style={styles.safeArea}>
      <ThemedHeader
        variant="inner"
        title={preSelectedName || 'Message Farmer'}
        subtitle={preSelectedName ? 'Farmer' : undefined}
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Text style={styles.label}>Receiver</Text>
        <View style={styles.rowSelector}>
          <TouchableOpacity
            style={[styles.selectorBtn, recipient === 'ALL' && styles.selectorBtnActive]}
            onPress={() => setRecipient('ALL')}
          >
            <Text style={[styles.selectorText, recipient === 'ALL' && styles.selectorTextActive]}>
              All Farmers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorBtn, recipient === 'SPECIFIC' && styles.selectorBtnActive]}
            onPress={() => setRecipient('SPECIFIC')}
          >
            <Text style={[styles.selectorText, recipient === 'SPECIFIC' && styles.selectorTextActive]}>
              Select Farmer
            </Text>
          </TouchableOpacity>
        </View>
        {recipient === 'SPECIFIC' && (
          <View style={styles.specificUserContainer}>
            {fetchingUsers ? (
              <ActivityIndicator size="small" color="#1E3A8A" />
            ) : farmersList.length === 0 ? (
              <Text style={styles.infoText}>No farmers found.</Text>
            ) : (
              <View>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search farmers..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.usersScroll}>
                  {farmersList
                    .filter(user =>
                      (user.name || user.email || 'Unknown').toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((user) => {
                      const uId = user.userId || user.farmerId || user.id;
                      const isSelected = specificUserId === uId;
                      return (
                        <TouchableOpacity
                          key={uId}
                          style={[styles.userCard, isSelected && styles.userCardSelected]}
                          onPress={() => setSpecificUserId(uId)}
                        >
                          <Ionicons name="person-circle-outline" size={32} color={isSelected ? "#FFF" : "#6B7280"} />
                          <Text style={[styles.userName, isSelected && { color: '#FFF' }]} numberOfLines={1}>
                            {user.name || user.email || 'Unknown'}
                          </Text>
                        </TouchableOpacity>
                      );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        )}
        <View style={styles.readOnlyContainer}>
          <Text style={styles.label}>Notification Type</Text>
          <View style={styles.readOnlyBadge}>
            <Text style={styles.readOnlyBadgeText}>CUSTOMER</Text>
          </View>
        </View>
        <Text style={styles.label}>Title</Text>
        <TextInput
          ref={titleInputRef}
          style={styles.input}
          placeholder="e.g., Order Inquiry"
          value={title}
          onChangeText={handleTitleChange}
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.label}>Message</Text>
        <TextInput
          ref={messageInputRef}
          style={[styles.input, styles.textArea]}
          placeholder="Enter your message here..."
          value={message}
          onChangeText={handleMessageChange}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#9CA3AF"
        />
        <PrimaryButton
          title="Send Message"
          loading={loading}
          onPress={handleSend}
          style={{ marginTop: 28, marginBottom: 40 }}
        />
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color="#2E7D4F" />
            </View>
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>Message sent successfully</Text>
          </View>
        </View>
      </Modal>
    </PageBackground>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  label: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#3B1A0E',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  rowSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFFDF8',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    alignItems: 'center',
  },
  selectorBtnActive: {
    backgroundColor: '#FFF1E3',
    borderColor: '#B8470F',
  },
  selectorText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: '#8A6F5C',
  },
  selectorTextActive: {
    fontFamily: THEME.fonts.bold,
    color: '#B8470F',
  },
  readOnlyContainer: {
    marginTop: 8,
  },
  readOnlyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1E3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2B27D',
  },
  readOnlyBadgeText: {
    fontFamily: THEME.fonts.bold,
    color: '#B8470F',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    borderRadius: 16,
    padding: 16,
    fontFamily: THEME.fonts.regular,
    fontSize: 15,
    color: '#3B1A0E',
  },
  textArea: {
    height: 140,
  },
  specificUserContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  infoText: {
    fontFamily: THEME.fonts.medium,
    color: '#8A6F5C',
    fontSize: 14,
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF8',
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: '#3B1A0E',
    padding: 0,
  },
  usersScroll: {
    flexDirection: 'row',
  },
  userCard: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    width: 104,
    alignItems: 'center',
  },
  userCardSelected: {
    backgroundColor: '#B8470F',
    borderColor: '#B8470F',
  },
  userName: {
    marginTop: 8,
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12,
    color: '#3B1A0E',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    width: '80%',
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E1CF',
    shadowColor: 'rgba(90,40,15,0.15)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontFamily: THEME.fonts.serif,
    fontSize: 22,
    color: '#3B1A0E',
    marginBottom: 8,
  },
  successModalMessage: {
    fontFamily: THEME.fonts.regular,
    fontSize: 15,
    color: '#7A6350',
    textAlign: 'center',
  },
});
export default CustomerMessageFarmerScreen;
