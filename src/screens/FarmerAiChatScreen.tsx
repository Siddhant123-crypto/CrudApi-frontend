import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  BackHandler,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useAuth } from '../context/AuthContext';
import { useAiChat } from '../hooks/useAiChat';
import { useAiChatKeyboard } from '../hooks/useAiChatKeyboard';
import { AiMessageItem } from '../components/ai/AiMessageItem';
import { AiTypingIndicator } from '../components/ai/AiTypingIndicator';
import { AiSuggestionChips } from '../components/ai/AiSuggestionChips';
import { AiConfirmModal, AiModalType } from '../components/ai/AiConfirmModal';
import { FARMER_THEME } from '../constants/farmerTheme';

export const FarmerAiChatScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const {
    messages,
    loadingHistory,
    isSending,
    isAiAvailable,
    statusMessage,
    followUpChips,
    initialChips,
    sendMessage,
    retryLastMessage,
    deleteMessages,
    clearChat,
  } = useAiChat({ userId: user?.userId });

  const [inputText, setInputText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmModalType, setConfirmModalType] = useState<AiModalType | null>(null);

  const isSelectionMode = selectedIds.length > 0;

  const {
    isKeyboardOpen,
    isKeyboardOpenRef,
    showScrollBottom,
    textInputRef,
    flatListRef,
    handleScroll,
    handleContentSizeChange,
    scrollToBottom,
    prepareSubmit,
    dismissKeyboard,
  } = useAiChatKeyboard({
    messagesCount: messages.length,
    isSending,
  });

  // Dismiss keyboard when entering selection mode
  useEffect(() => {
    if (isSelectionMode) {
      dismissKeyboard();
    }
  }, [isSelectionMode, dismissKeyboard]);

  // Back handling: close modal first, or cancel selection, or dismiss keyboard, or leave screen
  const handleBack = useCallback(() => {
    if (confirmModalType !== null) {
      setConfirmModalType(null);
      return true;
    }
    if (selectedIds.length > 0) {
      setSelectedIds([]);
      return true;
    }
    if (isKeyboardOpenRef.current) {
      dismissKeyboard();
      return true;
    }
    navigation.goBack();
    return true;
  }, [confirmModalType, selectedIds.length, navigation, isKeyboardOpenRef, dismissKeyboard]);

  useEffect(() => {
    const backSub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => backSub.remove();
  }, [handleBack]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || isAiAvailable === false) return;
    prepareSubmit(true);
    setInputText('');
    sendMessage(trimmed);
  };

  const handleSelectChip = (chip: string) => {
    if (isSending || isAiAvailable === false) return;
    prepareSubmit(true);
    sendMessage(chip);
  };

  const handleNewChatPress = () => {
    dismissKeyboard();
    setConfirmModalType('new_chat');
  };

  // Selection toggle handler
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  // Cancel selection mode
  const handleCancelSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Trigger delete modal
  const handleConfirmDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    dismissKeyboard();
    setConfirmModalType('delete');
  }, [selectedIds.length, dismissKeyboard]);

  // Confirm action inside highlighted modal
  const handleModalConfirm = useCallback(async () => {
    if (confirmModalType === 'new_chat') {
      setConfirmModalType(null);
      await clearChat();
    } else if (confirmModalType === 'delete') {
      const idsToDelete = [...selectedIds];
      setSelectedIds([]);
      setConfirmModalType(null);
      await deleteMessages(idsToDelete);
    }
  }, [confirmModalType, clearChat, selectedIds, deleteMessages]);

  // Cancel action inside modal
  const handleModalCancel = useCallback(() => {
    setConfirmModalType(null);
  }, []);

  const isSendDisabled =
    inputText.trim().length === 0 || isSending || isAiAvailable === false;

  return (
    <View style={styles.screenWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F8EF" />

      {/* HEADER: Standard vs Selection Mode */}
      {isSelectionMode ? (
        <View
          style={[
            styles.selectionHeaderContainer,
            { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 16 : 20) },
          ]}
        >
          <TouchableOpacity
            onPress={handleCancelSelection}
            activeOpacity={0.7}
            style={styles.headerCircleBtn}
            accessibilityRole="button"
            accessibilityLabel={t('aiChat.cancelSelection', 'Cancel selection')}
          >
            <Ionicons name="close" size={22} color="#14532D" />
          </TouchableOpacity>

          <View style={styles.headerTitleCenter}>
            <Text style={styles.selectionTitleText}>
              {t('aiChat.selectedCount', { count: selectedIds.length })}
            </Text>
            <Text style={styles.selectionSubtitleText}>
              {t('aiChat.tapToSelect', 'Tap messages to select or unselect')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleConfirmDelete}
            activeOpacity={0.7}
            style={styles.deleteCircleBtn}
            accessibilityRole="button"
            accessibilityLabel={t('aiChat.deleteSelected', 'Delete selected messages')}
          >
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.headerContainer,
            { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 16 : 20) },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={styles.headerCircleBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.back', 'Back')}
          >
            <Ionicons name="chevron-back" size={24} color="#14532D" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            disabled={!isKeyboardOpen}
            onPress={dismissKeyboard}
            style={styles.headerTitleCenter}
          >
            <Text style={styles.headerTitle}>Farm2Home AI</Text>
            <View style={styles.headerSubtitleRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>{t('farmer.khetiSalahkar', 'Farm Advisory')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNewChatPress}
            activeOpacity={0.7}
            style={styles.headerCircleBtn}
            accessibilityRole="button"
            accessibilityLabel={t('aiChat.newChat', 'New Chat')}
          >
            <Ionicons name="create-outline" size={20} color="#14532D" />
          </TouchableOpacity>
        </View>
      )}

      {/* OFFLINE NOTICE (if AI is unavailable) */}
      {!isSelectionMode && statusMessage && (
        <View style={styles.statusBanner}>
          <Ionicons name="alert-circle" size={16} color="#B45309" style={{ marginRight: 6 }} />
          <Text style={styles.statusBannerText}>{statusMessage}</Text>
        </View>
      )}

      {/* MAIN KEYBOARD AVOIDING VIEW */}
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardContainer}
      >
        {/* MESSAGE LIST */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AiMessageItem
              message={item}
              onRetry={retryLastMessage}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(item.id)}
              onToggleSelect={handleToggleSelect}
              onLongPress={handleToggleSelect}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            messages.length === 0 && styles.emptyListContent,
          ]}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loadingHistory ? (
              <View style={styles.skeletonContainer}>
                <View style={[styles.skeletonLine, { width: '60%' }]} />
                <View style={[styles.skeletonCard, { height: 70 }]} />
                <View style={[styles.skeletonCard, { height: 70 }]} />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyAvatarCircle}>
                  <Ionicons name="sparkles" size={26} color="#F2B544" />
                </View>
                <Text style={styles.emptyGreetingTitle}>
                  Hello! Ask anything about farming & crops
                </Text>
                <Text style={styles.emptyGreetingSub}>
                  Ask questions about crops, pest control, fertilizers, or sowing seasons.
                </Text>
                <View style={styles.emptyChipsWrapper}>
                  <AiSuggestionChips
                    chips={initialChips}
                    onSelectChip={handleSelectChip}
                    disabled={isSending || isAiAvailable === false || isSelectionMode}
                  />
                </View>
              </View>
            )
          }
          ListFooterComponent={
            <View style={styles.footerContainer}>
              {isSending && <AiTypingIndicator />}
              {!isSending && !isSelectionMode && messages.length > 0 && followUpChips.length > 0 && (
                <AiSuggestionChips
                  chips={followUpChips.slice(0, 2)}
                  onSelectChip={handleSelectChip}
                  disabled={isSending || isAiAvailable === false}
                />
              )}
            </View>
          }
        />

        {/* SCROLL TO BOTTOM BUTTON (ChatGPT style) */}
        {showScrollBottom && !isSelectionMode && (
          <TouchableOpacity
            style={[
              styles.scrollToBottomBtn,
              {
                bottom:
                  (isKeyboardOpen ? 6 : Math.max(insets.bottom, 12)) + 74,
              },
            ]}
            onPress={scrollToBottom}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('common.scrollToBottom', 'Scroll to bottom')}
          >
            <Ionicons name="arrow-down" size={18} color="#14532D" />
          </TouchableOpacity>
        )}

        {/* INPUT BAR AREA */}
        {!isSelectionMode ? (
          <View
            style={[
              styles.inputWrapper,
              {
                paddingBottom: isKeyboardOpen ? 6 : Math.max(insets.bottom, 12),
              },
            ]}
          >
            {inputText.length > 800 && (
              <Text style={styles.counterText}>
                {inputText.length}/1000
              </Text>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  isAiAvailable === false
                    ? 'AI assistant is currently unavailable...'
                    : 'Ask about crops, pests, fertilizers...'
                }
                placeholderTextColor="#8E9A90"
                multiline
                numberOfLines={1}
                maxLength={1000}
                blurOnSubmit={false}
                editable={isAiAvailable !== false}
              />

              <TouchableOpacity
                onPress={handleSend}
                disabled={isSendDisabled}
                activeOpacity={0.85}
                style={[
                  styles.sendButtonCircle,
                  isSendDisabled && styles.sendButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('common.sendMessage', 'Send message')}
              >
                <LinearGradient
                  colors={['#2E8B4A', '#14532D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* AI DISCLAIMER */}
            <Text style={styles.disclaimerText}>
              AI can make mistakes. Please verify important agricultural advice with local experts or KVK.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.selectionBottomBar,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color="#14532D" style={{ marginRight: 6 }} />
            <Text style={styles.selectionBottomText}>
              {selectedIds.length} {selectedIds.length === 1 ? 'message' : 'messages'} selected. Tap trash icon above to delete permanently.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* CUSTOM HIGHLIGHTED CONFIRMATION MODAL */}
      <AiConfirmModal
        visible={confirmModalType !== null}
        type={confirmModalType || 'new_chat'}
        selectedCount={selectedIds.length}
        onCancel={handleModalCancel}
        onConfirm={handleModalConfirm}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F4F8EF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F4F8EF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EDE0',
  },
  selectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#EAF3E4',
    borderBottomWidth: 1.5,
    borderBottomColor: '#BBD2AE',
  },
  headerCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5E3CC',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  deleteCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FARMER_THEME.fonts.serif,
    color: '#14532D',
    letterSpacing: -0.3,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#166534',
    fontFamily: FARMER_THEME.fonts.medium,
  },
  selectionTitleText: {
    fontSize: 17,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#14532D',
  },
  selectionSubtitleText: {
    fontSize: 11.5,
    color: '#5B6B5F',
    fontFamily: FARMER_THEME.fonts.medium,
    marginTop: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  statusBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: FARMER_THEME.fonts.medium,
  },
  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyAvatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyGreetingTitle: {
    fontSize: 18,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#14532D',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyGreetingSub: {
    fontSize: 13,
    lineHeight: 19,
    color: '#5B6B5F',
    fontFamily: FARMER_THEME.fonts.regular,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: '90%',
  },
  emptyChipsWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  footerContainer: {
    marginTop: 4,
    paddingBottom: 8,
  },
  scrollToBottomBtn: {
    position: 'absolute',
    alignSelf: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D5E3CC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#E2EDE0',
    borderRadius: 8,
  },
  skeletonCard: {
    backgroundColor: '#EAF3E4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E3CC',
  },
  inputWrapper: {
    backgroundColor: '#F4F8EF',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  counterText: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#5B6B5F',
    fontFamily: FARMER_THEME.fonts.medium,
    marginBottom: 4,
    marginRight: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BBD2AE',
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    minHeight: 56,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14.5,
    lineHeight: 20,
    color: '#1B2A22',
    fontFamily: FARMER_THEME.fonts.regular,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingRight: 8,
  },
  sendButtonCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#5B6B5F',
    fontFamily: FARMER_THEME.fonts.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
  },
  selectionBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3E4',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#D5E3CC',
  },
  selectionBottomText: {
    fontSize: 12.5,
    color: '#14532D',
    fontFamily: FARMER_THEME.fonts.medium,
    flexShrink: 1,
  },
});

export default FarmerAiChatScreen;
