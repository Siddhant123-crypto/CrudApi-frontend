import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

interface SupportMessage {
  supportMessageId: string;
  senderId: string;
  senderType: 'FARMER' | 'ADMIN' | 'CUSTOMER';
  message: string;
  isRead?: boolean;
  createdAt: string;
}

export const FarmerSupportChatScreen = () => {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotification();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [supportRequestId, setSupportRequestId] = useState<string | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const toggleSelection = (id: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    checkActiveSupportRequest();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (supportRequestId) {
      interval = setInterval(() => {
        fetchMessages(supportRequestId, false);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [supportRequestId]);

  const checkActiveSupportRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get('/support');
      if (response.data && response.data.data) {
        const requests = response.data.data;
        const activeReq = requests.find((r: any) => r.status === 'OPEN' || r.status === 'IN_PROGRESS');
        
        if (activeReq) {
          setSupportRequestId(activeReq.supportRequestId);
          fetchMessages(activeReq.supportRequestId, true);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching support requests:', error);
      Alert.alert('Error', 'Could not fetch support history.');
      setLoading(false);
    }
  };

  const fetchMessages = async (reqId: string, showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await api.get(`/support/${reqId}/messages`);
      if (response.data && response.data.data) {
        setMessages(response.data.data);
        
        // Mark messages as read
        try {
          await api.put(`/support/${reqId}/messages/read`);
        } catch (e) {
          console.log('Failed to mark messages as read', e);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    let currentReqId = supportRequestId;
    setSending(true);

    try {
      // If no active request exists, create one first
      if (!currentReqId) {
        const createRes = await api.post('/support', {
          subject: 'Account Blocked - Admin Support',
          description: inputText.trim(),
        });
        
        if (createRes.data && createRes.data.data) {
          currentReqId = createRes.data.data.supportRequestId;
          setSupportRequestId(currentReqId);
        } else {
          throw new Error('Failed to create support request');
        }
      }

      // Send the message
      const sendRes = await api.post(`/support/${currentReqId}/messages`, {
        message: inputText.trim(),
      });

      if (sendRes.data && sendRes.data.data) {
        const newMsg = sendRes.data.data;
        setMessages(prev => {
          if (prev.some(m => m.supportMessageId === newMsg.supportMessageId)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        setInputText('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const confirmDeleteSelected = () => {
    Alert.alert(
      "Delete Message",
      `Are you sure you want to delete ${selectedMessageIds.length > 1 ? 'these messages' : 'this message'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: handleDeleteSelected, style: "destructive" }
      ]
    );
  };

  const handleDeleteSelected = async () => {
    const idsToDelete = [...selectedMessageIds];
    setSelectedMessageIds([]);
    setMessages(prev => prev.filter(m => !idsToDelete.includes(m.supportMessageId)));
    
    try {
      if (supportRequestId && idsToDelete.length > 0) {
        await Promise.allSettled(
          idsToDelete.map(id => api.delete(`/support/${supportRequestId}/messages/${id}`))
        );
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  const renderMessage = ({ item }: { item: SupportMessage }) => {
    const isMe = item.senderType === 'FARMER';
    
    return (
      <TouchableOpacity 
        onLongPress={() => toggleSelection(item.supportMessageId)}
        onPress={() => {
          if (selectedMessageIds.length > 0) {
            toggleSelection(item.supportMessageId);
          }
        }}
        activeOpacity={0.9}
        style={[
          styles.messageBubble, 
          isMe ? styles.myMessage : styles.adminMessage,
          selectedMessageIds.includes(item.supportMessageId) && styles.selectedMessage
        ]}
      >
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.adminMessageText]}>
          {item.message}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
          <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.adminTimeText, { marginTop: 0 }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && (
            <>
              <Text style={[styles.statusText, item.isRead ? styles.readStatus : styles.sentStatus]}>
                {item.isRead ? ' ✓✓' : ' ✓'}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      {selectedMessageIds.length > 0 ? (
        <View style={[styles.header, styles.headerSelected]}>
          <TouchableOpacity onPress={() => setSelectedMessageIds([])} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedMessageIds.length} Selected</Text>
          <TouchableOpacity onPress={confirmDeleteSelected} style={{ marginLeft: 'auto', padding: 4 }}>
            <Ionicons name="trash" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contact Admin</Text>
          </View>
          <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}


      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.supportMessageId}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          // Removed onContentSizeChange to prevent jumping when selecting messages
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No previous conversation.</Text>
              <Text style={styles.emptySubText}>Send a message to start chatting with Admin.</Text>
            </View>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F1E6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#7C3AED',
    borderBottomWidth: 1,
    borderBottomColor: '#6D28D9',
  },
  headerSelected: {
    backgroundColor: '#6D28D9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3E8FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoPopupText: {
    color: '#4B5563',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  modalGotItBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalGotItText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  selectedMessage: {
    backgroundColor: '#4C1D95', // Darker purple for high contrast
    opacity: 0.7,               // Noticeable opacity change
  },
  adminMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  adminMessageText: {
    color: '#1F2937',
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  adminTimeText: {
    color: '#9CA3AF',
  },
  statusText: {
    fontSize: 11,
    marginLeft: 4,
  },
  sentStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  readStatus: {
    color: '#34D399', // A distinct color for read, or just white
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'android' ? 45 : 30, // Increased padding to move chat section up
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});

export default FarmerSupportChatScreen;
