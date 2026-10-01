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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#176B2C" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Admin</Text>
      </View>
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
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
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
          placeholderTextColor="#9CA3AF"
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
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
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
              <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            </View>
            <Text style={styles.successModalTitle}>Success!</Text>
            <Text style={styles.successModalMessage}>Message sent successfully</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
    paddingBottom: 24,
    backgroundColor: '#176B2C',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  adminProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#176B2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  adminRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  textArea: {
    height: 140,
    marginBottom: 0,
  },
  sendButton: {
    backgroundColor: '#176B2C',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
    shadowColor: '#176B2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  successIconContainer: {
    marginBottom: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 50,
    padding: 8,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
export default FarmerContactAdminScreen;
