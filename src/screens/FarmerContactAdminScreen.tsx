import React, { useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NotificationService } from '../services/NotificationService';
import { NotificationSendRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FARMER_THEME } from '../constants/farmerTheme';

export const FarmerContactAdminScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const titleInputRef = useRef<TextInput>(null);
  const messageInputRef = useRef<TextInput>(null);
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
    setLoading(true);
    try {
      const senderName = user?.name || user?.email || 'A Farmer';
      const formattedMessage = `From: ${senderName}\n\n${currentMessage.trim()}`;
      const payload: NotificationSendRequest = {
        receiverType: 'ADMIN',
        receiverId: undefined,
        title: currentTitle.trim(),
        message: formattedMessage,
        notificationType: 'ADMIN',
      };
      await NotificationService.sendNotification(payload);
      Alert.alert('Success', 'Your message send successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <FarmerPageBackground>
      <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
      <FarmerHeader
        variant="inner"
        title="Contact Admin"
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
        <View style={styles.adminProfileCard}>
          <View style={styles.adminAvatarContainer}>
            <Ionicons name="shield-checkmark" size={30} color="#FFFFFF" />
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>System Administrator</Text>
            <Text style={styles.adminRole}>Support & Verification</Text>
          </View>
        </View>
        <Text style={styles.label}>Title</Text>
        <TextInput
          ref={titleInputRef}
          style={styles.input}
          placeholder="e.g., Verification Issue"
          value={title}
          onChangeText={handleTitleChange}
          placeholderTextColor="#7D8D81"
        />
        <Text style={styles.label}>Message</Text>
        <TextInput
          ref={messageInputRef}
          style={[styles.input, styles.textArea]}
          placeholder="Please describe your issue in detail..."
          value={message}
          onChangeText={handleMessageChange}
          multiline
          numberOfLines={6}
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
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send Message</Text>
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
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>Message sent successfully</Text>
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
  label: {
    fontSize: 13,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 8,
    letterSpacing: 0.3,
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
    marginBottom: 16,
  },
  textArea: {
    height: 140,
    marginBottom: 0,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '82%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#E5EFE3',
    ...FARMER_THEME.shadows.card,
  },
  successIconContainer: {
    marginBottom: 14,
    backgroundColor: '#DDF3E4',
    borderRadius: 40,
    padding: 8,
  },
  successModalTitle: {
    fontSize: 22,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 6,
  },
  successModalMessage: {
    fontSize: 14,
    color: '#5C6B60',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FARMER_THEME.fonts.regular,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
  },
});
export default FarmerContactAdminScreen;
