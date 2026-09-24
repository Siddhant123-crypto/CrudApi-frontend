import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NotificationService } from '../services/NotificationService';
import { NotificationSendRequest } from '../types';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
export const CustomerMessageFarmerScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const route = useRoute<any>();
  const preSelectedId = route.params?.preSelectedFarmerId;
  const [recipient, setRecipient] = useState<'ALL' | 'SPECIFIC'>(preSelectedId ? 'SPECIFIC' : 'ALL');
  const [specificUserId, setSpecificUserId] = useState<string>(preSelectedId || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
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
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
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
      const formattedMessage = `From: ${senderName}\n\n${message.trim()}`;
      const payload: NotificationSendRequest = {
        receiverType: 'FARMER',
        receiverId: recipient === 'ALL' ? undefined : specificUserId,
        title: title.trim(),
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Farmer</Text>
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
          style={styles.input}
          placeholder="e.g., Order Inquiry"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter your message here..."
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
    paddingBottom: 24,
    backgroundColor: '#1E3A8A',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 16,
  },
  rowSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  selectorBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1E3A8A',
  },
  selectorText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectorTextActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  readOnlyContainer: {
    marginTop: 8,
  },
  readOnlyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  readOnlyBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
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
  },
  textArea: {
    height: 140,
  },
  specificUserContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  infoText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  usersScroll: {
    flexDirection: 'row',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 100,
    alignItems: 'center',
  },
  userCardSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  userName: {
    marginTop: 8,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
});
export default CustomerMessageFarmerScreen;
