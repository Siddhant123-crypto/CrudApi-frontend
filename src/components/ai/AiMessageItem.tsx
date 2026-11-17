import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Clipboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { AiChatMessage } from '../../services/aiService';
import { parseAiAnswer } from '../../utils/aiAnswerParser';
import { AiSparkleIcon } from '../farmer/FarmerIcons';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface AiMessageItemProps {
  message: AiChatMessage;
  onRetry?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const getLabelColor = (label: string): string => {
  const upper = label.toUpperCase();
  if (upper.includes('KAARAN') || upper.includes('CAUSE')) {
    return '#C05621'; // Warm rust/orange
  }
  if (upper.includes('DEKHEIN') || upper.includes('CHECK') || upper.includes('SAMAY') || upper.includes('TIME')) {
    return '#15803D'; // Fresh green
  }
  if (upper.includes('KAREIN') || upper.includes('ACTION') || upper.includes('TAIYARI') || upper.includes('ROPE')) {
    return '#0F766E'; // Deep teal
  }
  return '#14532D'; // Dark forest green
};


export const AiMessageItem: React.FC<AiMessageItemProps> = React.memo(
  ({
    message,
    onRetry,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelect,
    onLongPress,
  }) => {
    const { t } = useTranslation();
    const isUser = message.sender === 'USER';
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState(false);

    const handlePress = () => {
      if (isSelectionMode) {
        onToggleSelect?.(message.id);
      }
    };

    const handleLongPress = () => {
      onLongPress?.(message.id);
    };

    if (isUser) {
      return (
        <View style={styles.userContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            delayLongPress={280}
            onLongPress={handleLongPress}
            onPress={handlePress}
            style={[
              styles.userBubble,
              isSelected && styles.userBubbleSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isSelected ? 'Selected user message' : 'User message'}
          >
            <View style={styles.userRow}>
              {isSelectionMode && (
                <View style={styles.selectionCheckmarkLeft}>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isSelected ? '#14532D' : '#768879'}
                  />
                </View>
              )}
              <Text style={styles.userText}>{message.text}</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // AI Message
    const parsed = parseAiAnswer(message.text);

    const handleCopy = () => {
      if (isSelectionMode) {
        onToggleSelect?.(message.id);
        return;
      }
      Clipboard.setString(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleLike = () => {
      if (isSelectionMode) {
        onToggleSelect?.(message.id);
        return;
      }
      setLiked((prev) => !prev);
    };


    return (
      <View style={styles.aiContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          delayLongPress={280}
          onLongPress={handleLongPress}
          onPress={handlePress}
          style={[
            styles.aiWrapper,
            isSelected && styles.aiWrapperSelected,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isSelected ? 'Selected AI answer' : 'AI answer'}
        >
          {/* Header row: avatar + title + optional selection checkmark */}
          <View style={styles.aiHeaderRow}>
            <View style={styles.aiAvatarCircle}>
              <AiSparkleIcon size={16} color="#F2B544" />
            </View>
            <Text style={styles.aiTitleText}>
              {parsed.title || 'Kheti Salahkar'}
            </Text>
            {isSelectionMode && (
              <View style={styles.aiSelectionCheckmark}>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isSelected ? '#14532D' : '#768879'}
                />
              </View>
            )}
          </View>

          {/* Message content */}
          {message.error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#C0392B" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{message.text}</Text>
              {message.canRetry && onRetry && (
                <TouchableOpacity
                  onPress={onRetry}
                  activeOpacity={0.8}
                  style={styles.retryButton}
                  accessibilityLabel={t('aiChat.retryQuestion', 'Retry question')}
                >
                  <Ionicons name="refresh" size={14} color="#14532D" style={{ marginRight: 4 }} />
                  <Text style={styles.retryText}>{t('common.retry', 'Retry')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : parsed.isStructured ? (
            <View style={styles.cardsContainer}>
              {parsed.cards.map((card, idx) => (
                <View
                  key={`card-${idx}`}
                  style={[styles.card, isSelected && styles.cardSelected]}
                >
                  <Text style={[styles.cardLabel, { color: getLabelColor(card.label) }]}>
                    {card.label}
                  </Text>
                  <Text style={styles.cardContent}>{card.content}</Text>
                </View>
              ))}

              {parsed.footerAdvisory ? (
                <Text style={styles.footerAdvisoryText}>{parsed.footerAdvisory}</Text>
              ) : null}
            </View>
          ) : (
            <View style={[styles.plainTextBox, isSelected && styles.plainTextBoxSelected]}>
              <Text style={styles.plainText}>{message.text}</Text>
            </View>
          )}

          {/* Action Row: Source Chip, Copy & Thumbs Up */}
          {!message.error && (
            <View style={styles.actionRow}>

              <TouchableOpacity
                onPress={handleCopy}
                activeOpacity={0.7}
                style={styles.iconActionBtn}
                accessibilityLabel={t('aiChat.copyResponse', 'Copy response')}
              >
                <Ionicons
                  name={copied ? 'checkmark-outline' : 'copy-outline'}
                  size={17}
                  color={copied ? '#15803D' : '#5B6B5F'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleLike}
                activeOpacity={0.7}
                style={styles.iconActionBtn}
                accessibilityLabel={t('aiChat.helpfulResponse', 'Helpful response')}
              >
                <Ionicons
                  name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={17}
                  color={liked ? '#14532D' : '#5B6B5F'}
                />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  userContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: '#DDEBD3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  userBubbleSelected: {
    backgroundColor: '#CEE4C2',
    borderColor: '#14532D',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionCheckmarkLeft: {
    marginRight: 8,
  },
  userText: {
    color: '#1B2A22',
    fontSize: 14.5,
    lineHeight: 21,
    fontFamily: FARMER_THEME.fonts.regular,
    flexShrink: 1,
  },
  aiContainer: {
    width: '100%',
    marginVertical: 8,
  },
  aiWrapper: {
    width: '100%',
    borderRadius: 20,
    padding: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  aiWrapperSelected: {
    backgroundColor: '#E7F2E0',
    borderColor: '#14532D',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  aiAvatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#14532D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiTitleText: {
    fontSize: 16,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#14532D',
    flex: 1,
  },
  aiSelectionCheckmark: {
    marginLeft: 8,
  },
  cardsContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E3CC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 5,
  },
  cardSelected: {
    borderColor: '#A4C698',
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardContent: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#1B2A22',
    fontFamily: FARMER_THEME.fonts.regular,
  },
  footerAdvisoryText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4A584E',
    fontFamily: FARMER_THEME.fonts.regular,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  plainTextBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E3CC',
    padding: 16,
    marginVertical: 4,
  },
  plainTextBoxSelected: {
    borderColor: '#A4C698',
  },
  plainText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1B2A22',
    fontFamily: FARMER_THEME.fonts.regular,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE6E2',
    borderRadius: 14,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontFamily: FARMER_THEME.fonts.medium,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5E3CC',
    marginLeft: 8,
    minHeight: 44,
  },
  retryText: {
    fontSize: 12,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#14532D',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    paddingHorizontal: 4,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDEBD3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    minHeight: 44,
  },
  sourceText: {
    fontSize: 11.5,
    fontFamily: FARMER_THEME.fonts.semiBold,
    color: '#14532D',
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
});
