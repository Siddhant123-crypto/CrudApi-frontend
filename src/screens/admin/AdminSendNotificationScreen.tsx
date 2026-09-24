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
  KeyboardAvoidingView
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NotificationService } from '../../services/NotificationService';
import { NotificationType, NotificationSendRequest } from '../../types';
import api from '../../services/api';
const NOTIFICATION_TYPES: NotificationType[] = ['SYSTEM', 'ORDER', 'PRODUCT', 'CUSTOMER', 'FARMER', 'ADMIN'];
const RECEIVER_TYPES = ['CUSTOMER', 'FARMER'];
export const AdminSendNotificationScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [receiverType, setReceiverType] = useState<'CUSTOMER'|'FARMER'>('CUSTOMER');
  const [recipient, setRecipient] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [specificUserId, setSpecificUserId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('SYSTEM');
  const [usersList, setUsersList] = useState<any[]>([]);
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
      setUsersList(Array.isArray(response.data) ? response.data : (response.data?.data || []));
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
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Send notification error:', error);
      Alert.alert('Error', 'Failed to send notification.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Notification</Text>
        <View style={{ width: 24 }} />
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
        <Text style={styles.label}>Send To (Role)</Text>
        <View style={styles.rowSelector}>
          {RECEIVER_TYPES.map(rt => (
            <TouchableOpacity
              key={rt}
              style={[styles.selectorBtn, receiverType === rt && styles.selectorBtnActive]}
              onPress={() => {
                setReceiverType(rt as any);
                setSpecificUserId('');
              }}
            >
              <Text style={[styles.selectorText, receiverType === rt && styles.selectorTextActive]}>
                {rt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Recipient</Text>
        <View style={styles.rowSelector}>
          <TouchableOpacity
            style={[styles.selectorBtn, recipient === 'ALL' && styles.selectorBtnActive]}
            onPress={() => setRecipient('ALL')}
          >
            <Text style={[styles.selectorText, recipient === 'ALL' && styles.selectorTextActive]}>
              All {receiverType}s
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorBtn, recipient === 'SPECIFIC' && styles.selectorBtnActive]}
            onPress={() => setRecipient('SPECIFIC')}
          >
            <Text style={[styles.selectorText, recipient === 'SPECIFIC' && styles.selectorTextActive]}>
              Specific {receiverType}
            </Text>
          </TouchableOpacity>
        </View>
        {recipient === 'SPECIFIC' && (
          <View style={styles.specificUserContainer}>
            {fetchingUsers ? (
              <ActivityIndicator size="small" color="#2D983A" />
            ) : usersList.length === 0 ? (
              <Text style={styles.infoText}>No {receiverType.toLowerCase()}s found.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.usersScroll}>
                {usersList.map((user) => {
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
            )}
          </View>
        )}
        <Text style={styles.label}>Notification Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {NOTIFICATION_TYPES.map(nt => (
            <TouchableOpacity
              key={nt}
              style={[styles.typeBtn, type === nt && styles.typeBtnActive]}
              onPress={() => setType(nt)}
            >
              <Text style={[styles.typeText, type === nt && styles.typeTextActive]}>{nt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Order Update"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter detailed message..."
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
            <Text style={styles.sendButtonText}>Send Notification</Text>
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
    backgroundColor: '#E6F4EA',
    borderColor: '#2D983A',
  },
  selectorText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectorTextActive: {
    color: '#2D983A',
    fontWeight: '700',
  },
  typeScroll: {
    flexDirection: 'row',
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  typeBtnActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  typeText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 120,
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
    backgroundColor: '#2D983A',
    borderColor: '#2D983A',
  },
  userName: {
    marginTop: 8,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#2D983A',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
export default AdminSendNotificationScreen;
