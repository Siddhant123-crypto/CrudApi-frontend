import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  NativeModules,
  findNodeHandle,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotification } from '../context/NotificationContext';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FARMER_THEME } from '../constants/farmerTheme';
import api from '../services/api';

interface SupportMessage {
  supportMessageId: string;
  senderId: string;
  senderType: 'FARMER' | 'ADMIN' | 'CUSTOMER';
  message: string;
  isRead?: boolean;
  createdAt: string;
}

const isSameDay = (d1Str?: string, d2Str?: string) => {
  if (!d1Str || !d2Str) return false;
  const d1 = new Date(d1Str);
  const d2 = new Date(d2Str);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const formatDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'TODAY';
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};

export const FarmerSupportChatScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotification();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const inputTextRef = useRef('');
  const textInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const isSendingRef = useRef(false);
  const [supportRequestId, setSupportRequestId] = useState<string | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const toggleSelection = (id: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    checkActiveSupportRequest();
    
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
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
    
    let currentReqId = supportRequestId;
    setSending(true);
    isSendingRef.current = true;

    try {
      if (!currentReqId) {
        const createRes = await api.post('/support', {
          subject: 'Account Blocked - Admin Support',
          description: currentInput,
        });
        
        if (createRes.data && createRes.data.data) {
          currentReqId = createRes.data.data.supportRequestId;
          setSupportRequestId(currentReqId);
        } else {
          throw new Error('Failed to create support request');
        }
      }

      const messageToSend = currentInput;
      if (!messageToSend) return;

      const payload = { message: messageToSend };
      const sendRes = await api.post(`/support/${currentReqId}/messages`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
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

  const renderMessage = ({ item, index }: { item: SupportMessage; index: number }) => {
    const isMe = item.senderType === 'FARMER';
    const showDateChip = index === 0 || !isSameDay(messages[index - 1]?.createdAt, item.createdAt);
    
    return (
      <View>
        {showDateChip && (
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>{formatDateLabel(item.createdAt)}</Text>
          </View>
        )}
        <TouchableOpacity 
          onLongPress={() => toggleSelection(item.supportMessageId)}
          onPress={() => {
            if (selectedMessageIds.length > 0) {
              toggleSelection(item.supportMessageId);
            }
          }}
          activeOpacity={0.9}
          style={{ width: '100%' }}
        >
          {isMe ? (
            <LinearGradient
              colors={['#2FA66B', '#145238']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.myMessage,
                selectedMessageIds.includes(item.supportMessageId) && styles.selectedMessage
              ]}
            >
              <Text style={styles.myMessageText}>{item.message}</Text>
              <View style={styles.timeRow}>
                <Text style={styles.myTimeText}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={[styles.statusText, item.isRead ? styles.readStatus : styles.sentStatus]}>
                  {item.isRead ? ' ✓✓' : ' ✓'}
                </Text>
              </View>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.adminMessage,
                selectedMessageIds.includes(item.supportMessageId) && styles.selectedMessage
              ]}
            >
              <Text style={styles.adminMessageText}>{item.message}</Text>
              <View style={styles.timeRow}>
                <Text style={styles.adminTimeText}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
      {selectedMessageIds.length > 0 ? (
        <LinearGradient
          colors={['#1F7A4D', '#082419']}
          style={styles.selectionHeader}
        >
          <TouchableOpacity onPress={() => setSelectedMessageIds([])} style={styles.selectionBackButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.selectionHeaderTitle}>{selectedMessageIds.length} Selected</Text>
          <TouchableOpacity onPress={confirmDeleteSelected} style={styles.selectionTrashButton}>
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      ) : (
        <FarmerHeader
          variant="inner"
          title="Support Chat"
          onBackPress={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          }
        />
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1F7A4D" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.supportMessageId}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={38} color="#17663F" />
              </View>
              <Text style={styles.emptyText}>No previous conversation.</Text>
              <Text style={styles.emptySubText}>Send a message to start chatting with Admin Support.</Text>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: isKeyboardVisible
              ? 10
              : Math.max(insets.bottom, 20) + 14,
          },
        ]}
      >
        <TextInput
          ref={textInputRef}
          style={styles.input}
          value={inputText}
          placeholder="Type your message..."
          placeholderTextColor="#7D8D81"
          onChangeText={handleTextChange}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={sending}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2FA66B', '#145238']}
            style={styles.sendButtonGradient}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F8F0',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  selectionBackButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  selectionHeaderTitle: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  selectionTrashButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerIconButton: {
    position: 'relative',
    padding: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: FARMER_THEME.colors.harvestGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1F7A4D',
  },
  badgeText: {
    color: '#082419',
    fontSize: 9,
    fontFamily: FARMER_THEME.fonts.bold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DDF3E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginTop: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: '#5C6B60',
    marginTop: 6,
    textAlign: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  dateChip: {
    alignSelf: 'center',
    backgroundColor: '#DDF3E4',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginVertical: 10,
  },
  dateChipText: {
    color: '#17663F',
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
    letterSpacing: 0.5,
  },
  myMessage: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    marginBottom: 8,
  },
  selectedMessage: {
    opacity: 0.75,
    borderWidth: 1.5,
    borderColor: FARMER_THEME.colors.harvestGold,
  },
  adminMessage: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FBFEF9',
    borderWidth: 1,
    borderColor: '#DCE8DF',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    marginBottom: 8,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FARMER_THEME.fonts.regular,
  },
  adminMessageText: {
    color: '#1B2A22',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FARMER_THEME.fonts.regular,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  myTimeText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FARMER_THEME.fonts.regular,
  },
  adminTimeText: {
    fontSize: 10.5,
    color: '#7D8D81',
    fontFamily: FARMER_THEME.fonts.regular,
  },
  statusText: {
    fontSize: 11,
    marginLeft: 4,
  },
  sentStatus: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  readStatus: {
    color: '#F5C84B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FBFEF9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#DCE8DF',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 24,
    backgroundColor: '#F5FBF7',
    borderWidth: 1.5,
    borderColor: '#D3E5D8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1B2A22',
    marginRight: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FarmerSupportChatScreen;
