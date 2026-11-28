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
import { CustomerAiMessageItem } from '../components/ai/CustomerAiMessageItem';
import { AiTypingIndicator } from '../components/ai/AiTypingIndicator';
import { AiSuggestionChips } from '../components/ai/AiSuggestionChips';
import { AiConfirmModal, AiModalType } from '../components/ai/AiConfirmModal';
import {
  CustomerProductCard,
  findMatchingProductForAiCard,
} from '../utils/customerAiAnswerParser';
import { getAllProducts } from '../services/productService';
import { THEME } from '../constants/theme';

export const CustomerAiChatScreen: React.FC = () => {
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
  } = useAiChat({ userId: user?.userId, role: 'CUSTOMER' });

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

  // Confirm action inside modal
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

  // Tap on product card / View button in AI response
  const handleProductPress = useCallback(
    async (card: CustomerProductCard) => {
      if (card.id) {
        navigation.navigate('ProductDetail', {
          product: {
            productId: card.id,
            id: card.id,
            productName: card.productName,
            price: card.price,
            unit: card.unit || 'KG',
            productPhoto: card.productPhoto || null,
            farmerName: card.farmName,
            isActive: !card.isOutOfStock,
          },
        });
        return;
      }
      try {
        const allProducts = await getAllProducts();
        const matched = findMatchingProductForAiCard(
          Array.isArray(allProducts) ? allProducts : [],
          card,
        );
        if (matched && (matched.productId || matched.id)) {
          navigation.navigate('ProductDetail', {
            product: {
              ...matched,
              productId: matched.productId || matched.id,
            },
          });
        }
      } catch (err) {
        console.log('Error resolving product from AI card:', err);
      }
    },
    [navigation]
  );

  const isSendDisabled =
    inputText.trim().length === 0 || isSending || isAiAvailable === false;

  return (
    <View style={styles.screenWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDF8F3" />

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
            <Ionicons name="close" size={22} color="#4A1A0A" />
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
            <Ionicons name="chevron-back" size={24} color="#4A1A0A" />
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
              <Text style={styles.headerSubtitle}>{t('aiChat.online', 'Online')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNewChatPress}
            activeOpacity={0.7}
            style={styles.headerCircleBtn}
            accessibilityRole="button"
            accessibilityLabel={t('aiChat.newChat', 'New Chat')}
          >
            <Ionicons name="create-outline" size={20} color="#4A1A0A" />
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
            <CustomerAiMessageItem
              message={item}
              onRetry={retryLastMessage}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(item.id)}
              onToggleSelect={handleToggleSelect}
              onLongPress={handleToggleSelect}
              onProductPress={handleProductPress}
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
                  Hello! Ask anything about fresh produce
                </Text>
                <Text style={styles.emptyGreetingSub}>
                  Ask about current rates, available stock, delivery, or placing orders.
                </Text>
                <View style={styles.emptyChipsWrapper}>
                  <AiSuggestionChips
                    chips={initialChips}
                    theme="customer"
                    onSelectChip={handleSelectChip}
                    disabled={isSending || isAiAvailable === false || isSelectionMode}
                  />
                </View>
              </View>
            )
          }
          ListFooterComponent={
            <View style={styles.footerContainer}>
              {isSending && <AiTypingIndicator theme="customer" />}
              {!isSending && !isSelectionMode && messages.length > 0 && followUpChips.length > 0 && (
                <AiSuggestionChips
                  chips={followUpChips.slice(0, 2)}
                  theme="customer"
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
            <Ionicons name="arrow-down" size={18} color="#4A1A0A" />
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
                    : 'Ask a question...'
                }
                placeholderTextColor="#A89485"
                multiline
                maxLength={1000}
                blurOnSubmit={false}
                editable={isAiAvailable !== false}
                returnKeyType="default"
              />

              {inputText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setInputText('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#A89485" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSend}
                disabled={isSendDisabled}
                activeOpacity={0.8}
                style={[
                  styles.sendButton,
                  isSendDisabled && styles.sendButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('common.sendMessage', 'Send message')}
              >
                <LinearGradient
                  colors={
                    isSendDisabled
                      ? ['#E5DCD2', '#D3C4B5']
                      : ['#E8782E', '#B24A14']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendGradient}
                >
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color={isSendDisabled ? '#9C8E80' : '#FFFFFF'}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Bottom Disclaimer */}
            <Text style={styles.disclaimerText}>
              AI can make mistakes. Please verify prices and stock in the app.
            </Text>
          </View>
        ) : (
          /* Selection Action Bar */
          <View
            style={[
              styles.selectionActionBar,
              {
                paddingBottom: Math.max(insets.bottom, 14),
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleCancelSelection}
              activeOpacity={0.75}
              style={styles.selectionCancelBtn}
            >
              <Text style={styles.selectionCancelBtnText}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmDelete}
              disabled={selectedIds.length === 0}
              activeOpacity={0.85}
              style={[
                styles.selectionDeleteBtn,
                selectedIds.length === 0 && styles.selectionDeleteBtnDisabled,
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.selectionDeleteBtnText}>
                Delete ({selectedIds.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <AiConfirmModal
        visible={confirmModalType !== null}
        type={confirmModalType || 'new_chat'}
        theme="customer"
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
    backgroundColor: '#FBF8F2',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FDF8F3',
    borderBottomWidth: 1,
    borderBottomColor: '#EADFCB',
  },
  selectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF4E8',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  headerCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2E8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: THEME.fonts.bold,
    color: '#4A1A0A',
    letterSpacing: -0.2,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: THEME.fonts.medium,
    color: '#16A34A',
  },
  selectionTitleText: {
    fontSize: 16,
    fontFamily: THEME.fonts.bold,
    color: '#4A1A0A',
  },
  selectionSubtitleText: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.medium,
    color: '#8A6F5C',
    marginTop: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  statusBannerText: {
    fontSize: 12.5,
    color: '#92400E',
    fontFamily: THEME.fonts.medium,
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  emptyAvatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4A1A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#4A1A0A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyGreetingTitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.bold,
    color: '#4A1A0A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyGreetingSub: {
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: THEME.fonts.regular,
    color: '#7A6658',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyChipsWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  footerContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
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
    borderColor: '#EADFCB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#3B1A0E',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  inputWrapper: {
    backgroundColor: '#FDF8F3',
    borderTopWidth: 1,
    borderTopColor: '#EADFCB',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  counterText: {
    fontSize: 11,
    fontFamily: THEME.fonts.medium,
    color: '#B24A14',
    textAlign: 'right',
    marginBottom: 4,
    marginRight: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EADFCB',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#2A1710',
    fontFamily: THEME.fonts.regular,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    maxHeight: 110,
  },
  clearBtn: {
    padding: 6,
    alignSelf: 'center',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.8,
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#8A6F5C',
    textAlign: 'center',
    marginTop: 6,
    fontFamily: THEME.fonts.regular,
  },
  selectionActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF4E8',
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  selectionCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4A1A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCancelBtnText: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: '#4A1A0A',
  },
  selectionDeleteBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionDeleteBtnDisabled: {
    backgroundColor: '#FCA5A5',
  },
  selectionDeleteBtnText: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  skeletonLine: {
    height: 20,
    backgroundColor: '#EADFCB',
    borderRadius: 8,
  },
  skeletonCard: {
    backgroundColor: '#F0E5D8',
    borderRadius: 14,
  },
});

export default CustomerAiChatScreen;
