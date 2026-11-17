import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { FARMER_THEME } from '../../constants/farmerTheme';

export type AiModalType = 'new_chat' | 'delete';

interface AiConfirmModalProps {
  visible: boolean;
  type: AiModalType;
  selectedCount?: number;
  theme?: 'farmer' | 'customer';
  onCancel: () => void;
  onConfirm: () => void;
}

export const AiConfirmModal: React.FC<AiConfirmModalProps> = ({
  visible,
  type,
  selectedCount = 1,
  theme = 'farmer',
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  if (!visible) return null;

  const isDelete = type === 'delete';
  const isCustomer = theme === 'customer';

  const newChatGradient: [string, string] = isCustomer
    ? ['#E8782E', '#B24A14']
    : ['#2E8B4A', '#14532D'];

  const title = isDelete
    ? selectedCount > 1
      ? t('aiChat.deleteSelected', 'Delete selected messages')
      : t('notifications.deleteMessageTitle', 'Delete Message')
    : t('aiChat.newChat', 'New Chat');

  const description = isDelete
    ? t('aiChat.clearChatConfirmDesc', 'All messages in this conversation will be permanently deleted.')
    : t('aiChat.clearChatConfirmDesc', 'All messages in this conversation will be permanently deleted.');

  const highlightLabel = isDelete
    ? t('aiChat.deleteSelected', 'Delete selected messages')
    : t('aiChat.newChat', 'New Chat');

  const confirmBtnText = isDelete ? t('common.delete', 'Delete') : t('aiChat.newChat', 'New Chat');

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.cardContainer,
                isCustomer && { borderColor: '#EADFCB' },
              ]}
            >
              {/* Highlight Badge Icon */}
              <View
                style={[
                  styles.iconOuterRing,
                  isDelete
                    ? styles.iconOuterRingDelete
                    : isCustomer
                    ? { backgroundColor: '#FFEDD5' }
                    : styles.iconOuterRingNewChat,
                ]}
              >
                {isDelete ? (
                  <View style={styles.iconCircleDelete}>
                    <Ionicons name="trash" size={24} color="#DC2626" />
                  </View>
                ) : (
                  <LinearGradient
                    colors={newChatGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconCircleNewChat}
                  >
                    <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </View>

              {/* Title */}
              <Text
                style={[
                  styles.titleText,
                  isCustomer && { color: '#4A1A0A' },
                ]}
              >
                {title}
              </Text>

              {/* Description */}
              <Text style={styles.descriptionText}>{description}</Text>

              {/* Highlight Pill Note */}
              <View
                style={[
                  styles.highlightPill,
                  isDelete
                    ? styles.highlightPillDelete
                    : isCustomer
                    ? { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' }
                    : styles.highlightPillNewChat,
                ]}
              >
                <Ionicons
                  name={isDelete ? 'alert-circle' : 'sparkles'}
                  size={14}
                  color={isDelete ? '#DC2626' : isCustomer ? '#B24A14' : '#15803D'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.highlightPillText,
                    isDelete
                      ? styles.highlightPillTextDelete
                      : isCustomer
                      ? { color: '#B24A14' }
                      : styles.highlightPillTextNewChat,
                  ]}
                >
                  {highlightLabel}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={onCancel}
                  activeOpacity={0.75}
                  style={[
                    styles.cancelButton,
                    isCustomer && { borderColor: '#4A1A0A' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel', 'Cancel')}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={isCustomer ? '#4A1A0A' : '#14532D'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.cancelButtonText,
                      isCustomer && { color: '#4A1A0A' },
                    ]}
                  >
                    {t('common.cancel', 'Cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onConfirm}
                  activeOpacity={0.85}
                  style={styles.confirmButtonWrapper}
                  accessibilityRole="button"
                  accessibilityLabel={confirmBtnText}
                >
                  {isDelete ? (
                    <View style={styles.confirmDeleteButton}>
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.confirmDeleteButtonText}>
                        {confirmBtnText}
                      </Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={newChatGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.confirmNewChatButton}
                    >
                      <Ionicons
                        name="sparkles"
                        size={15}
                        color={isCustomer ? '#FFFFFF' : '#F2B544'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.confirmNewChatButtonText}>
                        {confirmBtnText}
                      </Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 30, 18, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D5E3CC',
    ...Platform.select({
      ios: {
        shadowColor: '#0F3820',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  iconOuterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconOuterRingNewChat: {
    backgroundColor: '#EAF3E4',
  },
  iconOuterRingDelete: {
    backgroundColor: '#FEE2E2',
  },
  iconCircleNewChat: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDelete: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 20,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#14532D',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#4A584E',
    fontFamily: FARMER_THEME.fonts.regular,
    textAlign: 'center',
    marginBottom: 16,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 22,
  },
  highlightPillNewChat: {
    backgroundColor: '#EAF3E4',
    borderColor: '#C5DEC0',
  },
  highlightPillDelete: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  highlightPillText: {
    fontSize: 11.5,
    fontFamily: FARMER_THEME.fonts.semiBold,
  },
  highlightPillTextNewChat: {
    color: '#15803D',
  },
  highlightPillTextDelete: {
    color: '#DC2626',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#14532D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cancelButtonText: {
    fontSize: 14.5,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#14532D',
    letterSpacing: 0.2,
  },
  confirmButtonWrapper: {
    flex: 1.3,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmNewChatButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  confirmNewChatButtonText: {
    fontSize: 13.5,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
  },
  confirmDeleteButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
  },
  confirmDeleteButtonText: {
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
  },
});
