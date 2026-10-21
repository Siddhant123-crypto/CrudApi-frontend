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
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  getAdminGroupMessages,
  sendAdminGroupMessage,
  getAvailableAdmins,
  deleteAdminGroupMessage,
} from '../../services/adminService';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';

interface AdminGroupMessage {
  id: string;
  senderAdminId: string;
  message: string;
  createdAt: string;
}

export const AdminGroupChatScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
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
      () => {
        setKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    const interval = setInterval(() => {
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
          console.warn('Failed to get native text:', e);
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
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
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

    Alert.alert(title, msgText, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMessage(message.id),
      },
    ]);
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteAdminGroupMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Could not delete message.');
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderMessage = ({ item, index }: { item: AdminGroupMessage; index: number }) => {
    const isMe = item.senderAdminId === user?.userId;
    const senderName = isMe ? 'You' : adminsMap[item.senderAdminId] || 'Admin';
    const prevItem = index > 0 ? messages[index - 1] : null;
    const isDifferentDay =
      !prevItem ||
      new Date(item.createdAt).toDateString() !== new Date(prevItem.createdAt).toDateString();

    return (
      <View>
        {isDifferentDay && (
          <View style={styles.dateSeparatorContainer}>
            <View style={styles.dateSeparatorChip}>
              <Text style={styles.dateSeparatorText}>{formatDateLabel(item.createdAt)}</Text>
            </View>
          </View>
        )}

        <View
          style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}
        >
          {!isMe && <Text style={styles.senderNameText}>{senderName}</Text>}
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => handleLongPressMessage(item)}
            style={styles.bubbleTouch}
          >
            {isMe ? (
              <LinearGradient
                colors={['#1F2F6B', '#0B1326']}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.myBubble}
              >
                <Text style={styles.myBubbleText}>{item.message}</Text>
                <View style={styles.metaTimeRow}>
                  <Text style={styles.myTimeText}>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.otherBubble}>
                <Text style={styles.otherBubbleText}>{item.message}</Text>
                <View style={styles.metaTimeRow}>
                  <Text style={styles.otherTimeText}>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <AdminPageBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <AdminHeader
          variant="inner"
          title="Admin Group"
          subtitle="Internal team communication"
          onBack={() => navigation.goBack()}
        />

        {loading && messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F5BD5" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            onLayout={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#C9CEF5" />
                <Text style={styles.emptyText}>No messages yet.</Text>
                <Text style={styles.emptySubText}>Start the conversation with other admins.</Text>
              </View>
            }
          />
        )}

        {/* Input Bar above Keyboard */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: isKeyboardVisible
                ? 10
                : Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 10,
            },
          ]}
        >
          <TextInput
            ref={textInputRef}
            style={styles.input}
            value={inputText}
            placeholder="Type your message..."
            placeholderTextColor="#8A93AB"
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
              colors={ADMIN_THEME.colors.navyGradient}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.sendGradient}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#E7C06A" />
              ) : (
                <Ionicons name="send" size={17} color="#E7C06A" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateSeparatorChip: {
    backgroundColor: '#E8EBFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateSeparatorText: {
    fontFamily: AdminFonts.bold,
    fontSize: 11,
    color: '#4F5BD5',
  },
  messageWrapper: {
    maxWidth: '80%',
    marginBottom: 10,
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
  },
  senderNameText: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 11.5,
    color: '#4F5BD5',
    marginBottom: 4,
    marginLeft: 6,
  },
  bubbleTouch: {
    width: '100%',
  },
  myBubble: {
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E7F2',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    ...ADMIN_THEME.shadows.card,
  },
  myBubbleText: {
    fontFamily: AdminFonts.regular,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  otherBubbleText: {
    fontFamily: AdminFonts.regular,
    fontSize: 14,
    color: '#0B1326',
    lineHeight: 20,
  },
  metaTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  myTimeText: {
    fontFamily: AdminFonts.regular,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    fontFamily: AdminFonts.regular,
    fontSize: 10.5,
    color: '#8A93AB',
  },
  emptyText: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 15,
    color: ADMIN_THEME.colors.ink,
    marginTop: 12,
  },
  emptySubText: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E3E7F2',
    alignItems: 'center',
    ...ADMIN_THEME.shadows.stickyBar,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    backgroundColor: '#F7F8FD',
    borderWidth: 1.5,
    borderColor: '#E3E7F2',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: AdminFonts.regular,
    fontSize: 14,
    color: '#0B1326',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginLeft: 10,
    overflow: 'hidden',
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

export default AdminGroupChatScreen;
