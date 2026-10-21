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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { adminSupportService, SupportRequestResponse } from '../../services/adminSupportService';
import { AdminPageBackground } from '../../components/admin/AdminPageBackground';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';

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
  const insets = useSafeAreaInsets();
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
    setSelectedMessageIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
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
    if (isKeyboardVisible && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [isKeyboardVisible, messages.length]);

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
        return;
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

    let currentReqId = supportRequestId;
    if (!currentReqId) {
      Alert.alert(
        'Notice',
        'The farmer must initiate a support request first before you can reply.'
      );
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
        setMessages((prev) => {
          if (prev.some((m) => m.supportMessageId === newMsg.supportMessageId)) {
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
      'Delete Message',
      `Are you sure you want to delete ${
        selectedMessageIds.length > 1 ? 'these messages' : 'this message'
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: handleDeleteSelected, style: 'destructive' },
      ]
    );
  };

  const handleDeleteSelected = async () => {
    const idsToDelete = [...selectedMessageIds];
    setSelectedMessageIds([]);
    setMessages((prev) => prev.filter((m) => !idsToDelete.includes(m.supportMessageId)));

    try {
      if (supportRequestId && idsToDelete.length > 0) {
        await Promise.allSettled(
          idsToDelete.map((id) => api.delete(`/admin/support/${supportRequestId}/messages/${id}`))
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
      setSupportRequest((prev) =>
        prev ? { ...prev, assignedAdminId: user?.userId || '' } : prev
      );
    } catch (error: any) {
      console.error('Assignment error:', error);
      Alert.alert(
        'Assignment Failed',
        error?.response?.data?.message || 'Conversation may have been assigned to another admin.'
      );
      checkActiveSupportRequest();
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = () => {
    if (!supportRequestId) {
      Alert.alert('No Active Request', 'The farmer has not opened an active support request yet.');
      return;
    }
    Alert.alert('Resolve Conversation', 'Are you sure you want to resolve this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        style: 'default',
        onPress: async () => {
          try {
            setLoading(true);
            await adminSupportService.resolveSupportRequest(supportRequestId);
            Alert.alert('Success', 'Conversation resolved successfully.');
            navigation.goBack();
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not resolve the conversation.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleReopen = () => {
    if (!supportRequestId) return;
    Alert.alert('Reopen Conversation', 'Are you sure you want to reopen this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reopen',
        style: 'default',
        onPress: async () => {
          try {
            setLoading(true);
            await adminSupportService.reopenSupportRequest(supportRequestId);
            if (user?.userId) {
              await adminSupportService.transferSupportRequest(supportRequestId, user.userId);
            }
            setSupportRequest((prev) =>
              prev
                ? { ...prev, status: 'IN_PROGRESS', assignedAdminId: user?.userId || '' }
                : prev
            );
            Alert.alert('Success', 'Conversation reopened and moved to your chats.');
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not reopen the conversation.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
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

  const renderMessage = ({ item, index }: { item: SupportMessage; index: number }) => {
    const isMe = item.senderType === 'ADMIN';
    const prevItem = index > 0 ? messages[index - 1] : null;
    const isDifferentDay =
      !prevItem ||
      new Date(item.createdAt).toDateString() !== new Date(prevItem.createdAt).toDateString();
    const isSelected = selectedMessageIds.includes(item.supportMessageId);

    return (
      <View>
        {isDifferentDay && (
          <View style={styles.dateSeparatorContainer}>
            <View style={styles.dateSeparatorChip}>
              <Text style={styles.dateSeparatorText}>{formatDateLabel(item.createdAt)}</Text>
            </View>
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
          style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.otherBubbleWrapper]}
        >
          {isMe ? (
            <LinearGradient
              colors={['#1F2F6B', '#0B1326']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={[styles.myBubble, isSelected && styles.selectedBubble]}
            >
              <Text style={styles.myBubbleText}>{item.message}</Text>
              <View style={styles.metaTimeRow}>
                <Text style={styles.myTimeText}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={[styles.statusText, item.isRead ? styles.readStatus : styles.sentStatus]}>
                  {item.isRead ? ' ✓✓' : ' ✓'}
                </Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.otherBubble, isSelected && styles.selectedBubble]}>
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
    );
  };

  const getSubtitle = () => {
    if (!supportRequest) return undefined;
    if (supportRequest.status === 'RESOLVED') return 'Resolved conversation';
    if (supportRequest.assignedAdminId === user?.userId) return 'Assigned to you';
    if (
      supportRequest.assignedAdminId &&
      supportRequest.assignedAdminId !== 'null' &&
      supportRequest.assignedAdminId !== user?.userId
    )
      return 'Assigned to other admin';
    return 'Unassigned';
  };

  const renderHeaderRight = () => {
    if (selectedMessageIds.length > 0) {
      return (
        <TouchableOpacity
          onPress={confirmDeleteSelected}
          style={styles.headerActionBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#D64545" />
        </TouchableOpacity>
      );
    }

    if (supportRequest?.status === 'RESOLVED') {
      return (
        <TouchableOpacity
          onPress={handleReopen}
          style={styles.reopenActionBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={13} color="#FFFFFF" />
          <Text style={styles.statusActionBtnText}>Reopen</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={handleResolve}
        style={styles.resolveActionBtn}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
        <Text style={styles.statusActionBtnText}>Resolve</Text>
      </TouchableOpacity>
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
          titleAlign="left"
          title={
            selectedMessageIds.length > 0
              ? `${selectedMessageIds.length} Selected`
              : farmerName || 'Support'
          }
          subtitle={selectedMessageIds.length > 0 ? 'Tap trash to delete' : getSubtitle()}
          onBack={() => {
            if (selectedMessageIds.length > 0) {
              setSelectedMessageIds([]);
            } else {
              navigation.goBack();
            }
          }}
          rightAction={renderHeaderRight()}
        />

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F5BD5" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.supportMessageId}
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
                <Text style={styles.emptyText}>No active support conversation.</Text>
                <Text style={styles.emptySubText}>
                  The farmer has not opened a support request yet.
                </Text>
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
                : Math.max(insets.bottom, 16) + 8,
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
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE7E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#34D399',
    gap: 5,
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  reopenActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FBBF24',
    gap: 5,
    elevation: 3,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  statusActionBtnText: {
    fontFamily: AdminFonts.bold,
    fontSize: 12.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
  bubbleWrapper: {
    maxWidth: '80%',
    marginBottom: 10,
  },
  myBubbleWrapper: {
    alignSelf: 'flex-end',
  },
  otherBubbleWrapper: {
    alignSelf: 'flex-start',
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
  selectedBubble: {
    borderWidth: 2,
    borderColor: '#E7C06A',
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
  statusText: {
    fontFamily: AdminFonts.bold,
    fontSize: 10,
    marginLeft: 4,
  },
  sentStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  readStatus: {
    color: '#E7C06A',
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
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7F8FD',
    borderWidth: 1.5,
    borderColor: '#E3E7F2',
    paddingHorizontal: 16,
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

export default AdminSupportChatScreen;
