import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Keyboard, NativeModules, findNodeHandle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getAdminGroupMessages, sendAdminGroupMessage, getAvailableAdmins, deleteAdminGroupMessage } from '../../services/adminService';

interface AdminGroupMessage {
  id: string;
  senderAdminId: string;
  message: string;
  createdAt: string;
}

export const AdminGroupChatScreen = () => {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<AdminGroupMessage[]>([]);
  const [adminsMap, setAdminsMap] = useState<Record<string, string>>({});
  const [inputText, setInputText] = useState('');
  const inputTextRef = useRef('');
  const textInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const isSendingRef = useRef(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const { markAdminGroupAsRead } = useNotification();

  useEffect(() => {
    fetchAdminsAndMessages();
    
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    let interval = setInterval(() => {
      fetchMessages(false);
    }, 5000);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      clearInterval(interval);
    };
  }, []);

  const fetchAdminsAndMessages = async () => {
    try {
      setLoading(true);
      // Fetch admins mapping
      const adminRes = await getAvailableAdmins();
      if (adminRes && adminRes.data) {
        const map: Record<string, string> = {};
        adminRes.data.forEach((admin: any) => {
          map[admin.id] = admin.name;
        });
        setAdminsMap(map);
      }
      
      await fetchMessages(false);
    } catch (error) {
      console.error('Error fetching admins/messages:', error);
      Alert.alert('Error', 'Could not load group chat data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await getAdminGroupMessages();
      // The API returns the list directly in the body (ResponseEntity<List<AdminGroupMessage>>)
      if (response && Array.isArray(response)) {
        setMessages(response);
        markAdminGroupAsRead();
      } else if (response && response.data && Array.isArray(response.data)) {
        setMessages(response.data);
        markAdminGroupAsRead();
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
      if (Platform.OS === 'android') textInputRef.current?.focus(); 
      return;
    }
    
    setSending(true);
    isSendingRef.current = true;

    try {
      const sendRes = await sendAdminGroupMessage(currentInput);

      if (sendRes && sendRes.id) {
        const newMsg = sendRes;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
        setInputText('');
        inputTextRef.current = '';
        textInputRef.current?.clear();
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        if (Platform.OS === 'android') {
          setTimeout(() => textInputRef.current?.focus(), 150); 
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

  const handleLongPressMessage = (message: AdminGroupMessage) => {
    const isMe = message.senderAdminId === user?.userId;
    const title = 'Delete message?';
    const msgText = isMe 
      ? 'This message will be deleted for everyone.'
      : 'This message will only be removed from your chat.';
      
    Alert.alert(
      title,
      msgText,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMessage(message.id)
        }
      ]
    );
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteAdminGroupMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Could not delete message.');
    }
  };

  const renderMessage = ({ item }: { item: AdminGroupMessage }) => {
    const isMe = item.senderAdminId === user?.userId;
    const senderName = isMe ? 'You' : (adminsMap[item.senderAdminId] || 'Admin');
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.adminMessageWrapper]}>
        {!isMe && (
          <Text style={styles.senderNameText}>{senderName}</Text>
        )}
        <TouchableOpacity 
          activeOpacity={0.8}
          onLongPress={() => handleLongPressMessage(item)}
          style={[
            styles.messageBubble, 
            isMe ? styles.myMessage : styles.adminMessage,
          ]}
        >
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.adminMessageText]}>
            {item.message}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
            <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.adminTimeText]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle}>Admin Group</Text>
        </View>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#17212F" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No messages yet.</Text>
              <Text style={styles.emptySubText}>Start the conversation with other admins.</Text>
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
    backgroundColor: '#F8F1E6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#17212F',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  messageWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  adminMessageWrapper: {
    alignSelf: 'flex-start',
  },
  senderNameText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: '#17212F',
    borderBottomRightRadius: 4,
  },
  adminMessage: {
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
    marginTop: 0,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  adminTimeText: {
    color: '#9CA3AF',
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
    backgroundColor: '#F8F1E6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#F5C16C',
  },
  sendButton: {
    backgroundColor: '#F5C16C',
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

export default AdminGroupChatScreen;
