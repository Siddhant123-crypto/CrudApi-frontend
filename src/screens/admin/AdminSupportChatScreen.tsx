import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Keyboard, NativeModules, findNodeHandle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { adminSupportService, SupportRequestResponse } from '../../services/adminSupportService';

interface SupportMessage {
  supportMessageId: string;
  senderId: string;
  senderType: 'FARMER' | 'ADMIN' | 'CUSTOMER';
  message: string;
  isRead?: boolean;
  createdAt: string;
}

export const AdminSupportChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { farmerId, farmerName } = route.params;

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const inputTextRef = useRef('');
  const textInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const isSendingRef = useRef(false);
  const [supportRequestId, setSupportRequestId] = useState<string | null>(null);
  const [supportRequest, setSupportRequest] = useState<SupportRequestResponse | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();

  const toggleSelection = (id: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    checkActiveSupportRequest();
    
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
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
      
      if (route.params?.supportRequestId) {
        const reqId = route.params.supportRequestId;
        const response = await api.get(`/admin/support/${reqId}`);
        if (response.data && response.data.data) {
          setSupportRequestId(reqId);
          setSupportRequest(response.data.data);
          fetchMessages(reqId, true);
          return;
        }
      }
      
      const response = await api.get(`/admin/support/farmer/${farmerId}/active`);
      if (response.data && response.data.data) {
        const activeReq = response.data.data;
        setSupportRequestId(activeReq.supportRequestId);
        setSupportRequest(activeReq);
        fetchMessages(activeReq.supportRequestId, true);
        return; // Success, exit
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching support request:', error);
      Alert.alert('Error', 'Could not fetch support history.');
      setLoading(false);
    }
  };

  const fetchMessages = async (reqId: string, showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await api.get(`/admin/support/${reqId}/messages`);
      if (response.data && response.data.data) {
        setMessages(response.data.data);

        // Mark messages as read
        try {
          await api.put(`/admin/support/${reqId}/messages/read`);
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

  const handleTextChange = (text: string) => {
    setInputText(text);
    inputTextRef.current = text;
  };

  const sendMessage = async () => {
    if (isSendingRef.current) return;
    
    const reactText = (inputTextRef.current || inputText || '').trim();
    let currentInput = reactText;

    if (Platform.OS === 'android' && textInputRef.current) {
      const { TextInputCommiter } = NativeModules;
      if (TextInputCommiter) {
        try {
          const reactTag = findNodeHandle(textInputRef.current);
          if (reactTag) {
            const nativeText = await TextInputCommiter.getAndCommitText(reactTag);
            // ONLY adopt nativeText if it contains additional uncommitted IME text; NEVER truncate
            if (nativeText && nativeText.trim().length > currentInput.length) {
              currentInput = nativeText.trim();
            }
          }
        } catch (e) {
          console.warn("Failed to get native text:", e);
        }
      }
    }

    currentInput = currentInput.trim();
    if (!currentInput) {
      if (Platform.OS === 'android') textInputRef.current?.focus(); // restore focus if empty
      return;
    }
    
    let currentReqId = supportRequestId;

    if (!currentReqId) {
      Alert.alert('Notice', 'The farmer must initiate a support request first before you can reply.');
      return;
    }

    setSending(true);
    isSendingRef.current = true;

    try {
      const messageToSend = currentInput;
      if (!messageToSend) return;
      
      const payload = { message: messageToSend };
      const sendRes = await api.post(`/admin/support/${currentReqId}/messages`, payload);

      if (sendRes.data && sendRes.data.data) {
        const newMsg = sendRes.data.data;
        setMessages(prev => {
          if (prev.some(m => m.supportMessageId === newMsg.supportMessageId)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        setInputText('');
        inputTextRef.current = '';
        textInputRef.current?.clear();
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        if (Platform.OS === 'android') {
          setTimeout(() => textInputRef.current?.focus(), 150); // restore focus after send
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send message.');
    } finally {
      setSending(false);
      isSendingRef.current = false;
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
          idsToDelete.map(id => api.delete(`/admin/support/${supportRequestId}/messages/${id}`))
        );
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  const handleAssignToMe = async () => {
    if (!supportRequestId) return;
    try {
      setLoading(true);
      await adminSupportService.assignSupportRequest(supportRequestId);
      Alert.alert('Success', 'Conversation assigned to you successfully.');
      setSupportRequest(prev => prev ? { ...prev, assignedAdminId: user?.userId || '' } : prev);
    } catch (error: any) {
      console.error('Assignment error:', error);
      Alert.alert('Assignment Failed', error?.response?.data?.message || 'Conversation may have been assigned to another admin.');
      checkActiveSupportRequest();
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = () => {
    if (!supportRequestId) return;
    Alert.alert(
      "Resolve Conversation",
      "Are you sure you want to resolve this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Resolve", 
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);
              await adminSupportService.resolveSupportRequest(supportRequestId);
              Alert.alert("Success", "Conversation resolved successfully.");
              navigation.goBack();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Could not resolve the conversation.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReopen = () => {
    if (!supportRequestId) return;
    Alert.alert(
      "Reopen Conversation",
      "Are you sure you want to reopen this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reopen", 
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);
              await adminSupportService.reopenSupportRequest(supportRequestId);
              // Force assign to current admin (use transfer as it doesn't fail if already assigned)
              if (user?.userId) {
                await adminSupportService.transferSupportRequest(supportRequestId, user.userId);
              }
              setSupportRequest(prev => prev ? { ...prev, status: 'IN_PROGRESS', assignedAdminId: user?.userId || '' } : prev);
              Alert.alert("Success", "Conversation reopened and moved to your chats.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Could not reopen the conversation.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };


  const renderMessage = ({ item }: { item: SupportMessage }) => {
    const isMe = item.senderType === 'ADMIN';
    
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerTitle}>Support: {farmerName}</Text>
            {supportRequest && supportRequest.status === 'RESOLVED' && (
              <Text style={{ fontSize: 12, color: '#FCD34D' }}>(Resolved)</Text>
            )}
            {supportRequest && supportRequest.assignedAdminId === user?.userId && supportRequest.status !== 'RESOLVED' && (
              <Text style={{ fontSize: 12, color: '#A7F3D0' }}>(Assigned to You)</Text>
            )}
            {supportRequest && supportRequest.assignedAdminId && supportRequest.assignedAdminId !== 'null' && supportRequest.assignedAdminId !== user?.userId && supportRequest.status !== 'RESOLVED' && (
              <Text style={{ fontSize: 12, color: '#FCA5A5' }}>(Assigned to Other Admin)</Text>
            )}
            {supportRequest && (!supportRequest.assignedAdminId || supportRequest.assignedAdminId === 'null') && supportRequest.status !== 'RESOLVED' && (
              <Text style={{ fontSize: 12, color: '#FCD34D' }}>(Unassigned)</Text>
            )}
          </View>
          {supportRequest?.assignedAdminId === user?.userId && supportRequest?.status !== 'RESOLVED' && (
            <TouchableOpacity style={styles.resolveButton} onPress={handleResolve}>
              <Text style={styles.resolveButtonText}>Resolve</Text>
            </TouchableOpacity>
          )}
          {supportRequest?.status === 'RESOLVED' && (
            <TouchableOpacity style={[styles.resolveButton, { backgroundColor: '#3B82F6' }]} onPress={handleReopen}>
              <Text style={styles.resolveButtonText}>Reopen</Text>
            </TouchableOpacity>
          )}
          {supportRequest && (!supportRequest.assignedAdminId || supportRequest.assignedAdminId === 'null') && supportRequest.status !== 'RESOLVED' && (
            <TouchableOpacity style={[styles.resolveButton, { backgroundColor: '#F59E0B' }]} onPress={handleAssignToMe}>
              <Text style={styles.resolveButtonText}>Assign to Me</Text>
            </TouchableOpacity>
          )}
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
              <Text style={styles.emptyText}>No active support conversation.</Text>
              <Text style={styles.emptySubText}>The farmer has not opened a support request yet.</Text>
            </View>
          }
        />
      )}

      <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'ios' ? 30 : (isKeyboardVisible ? 12 : 45) }]}>
        <TextInput
          ref={textInputRef}
          style={styles.input}
          value={inputText}
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          onChangeText={handleTextChange}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={sending}
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#7C3AED',
    borderBottomColor: '#6D28D9',
  },
  headerSelected: {
    backgroundColor: '#6D28D9',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resolveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
    color: 'rgba(23, 33, 47, 0.7)',
  },
  readStatus: {
    color: '#34D399',
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
    maxHeight: 120,
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

export default AdminSupportChatScreen;
