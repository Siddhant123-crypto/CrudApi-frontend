import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Clipboard,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { AiChatMessage } from '../../services/aiService';
import {
  parseCustomerAiAnswer,
  CustomerProductCard,
} from '../../utils/customerAiAnswerParser';
import { AiSparkleIcon } from '../farmer/FarmerIcons';
import { THEME } from '../../constants/theme';

interface CustomerAiMessageItemProps {
  message: AiChatMessage;
  onRetry?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
  onProductPress?: (card: CustomerProductCard) => void;
}


export const CustomerAiMessageItem: React.FC<CustomerAiMessageItemProps> = React.memo(
  ({
    message,
    onRetry,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelect,
    onLongPress,
    onProductPress,
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
                    color={isSelected ? '#B24A14' : '#8A6F5C'}
                  />
                </View>
              )}
              <View style={styles.userContent}>
                <Text style={styles.userText}>{message.text}</Text>
                <Text style={styles.userTime}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // AI Message
    const parsed = parseCustomerAiAnswer(
      message.text,
      (message.data as any)?.products
    );

    const handleCopy = () => {
      Clipboard.setString(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };


    return (
      <View style={styles.aiContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          delayLongPress={280}
          onLongPress={handleLongPress}
          onPress={handlePress}
          style={[
            styles.aiCard,
            isSelected && styles.aiCardSelected,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isSelected ? 'Selected AI response' : 'AI response'}
        >
          {/* Header Row: Avatar + Title + Selection Indicator */}
          <View style={styles.aiHeader}>
            <View style={styles.aiAvatar}>
              <AiSparkleIcon size={16} color="#F2B544" />
            </View>
            <Text style={styles.aiName}>{t('common.appName', 'Farm2Home')} AI</Text>

            {isSelectionMode && (
              <View style={styles.selectionCheckmarkRight}>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isSelected ? '#B24A14' : '#8A6F5C'}
                />
              </View>
            )}
          </View>

          {/* AI Content */}
          <View style={styles.aiBody}>
            {/* 1. Product Catalog Format */}
            {parsed.isProductCatalog ? (
              <View style={styles.catalogContainer}>
                {parsed.introText ? (
                  <Text style={styles.catalogIntroText}>
                    {parsed.introText}
                  </Text>
                ) : null}

                <View style={styles.productCardsList}>
                  {parsed.productCards.map((card, idx) => (
                    <TouchableOpacity
                      key={`card-${idx}-${card.productName}`}
                      activeOpacity={card.id || onProductPress ? 0.75 : 1}
                      onPress={() => onProductPress?.(card)}
                      style={styles.productCardItem}
                    >
                      <View style={styles.productCardTopRow}>
                        <Text
                          style={styles.productCardName}
                          numberOfLines={1}
                        >
                          {card.productName}
                        </Text>
                        <View
                          style={[
                            styles.stockPill,
                            card.isOutOfStock
                              ? styles.stockPillOos
                              : styles.stockPillInStock,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stockPillText,
                              card.isOutOfStock
                                ? styles.stockPillTextOos
                                : styles.stockPillTextInStock,
                            ]}
                          >
                            {card.stockDisplay}
                          </Text>
                        </View>
                      </View>

                      {card.farmName ? (
                        <Text style={styles.productCardFarm} numberOfLines={1}>
                          {card.farmName}
                        </Text>
                      ) : null}

                      <View style={styles.productCardBottomRow}>
                        <Text style={styles.productCardPrice}>
                          {card.priceDisplay}
                        </Text>
                        {card.id ? (
                          <View style={styles.viewProductPill}>
                            <Text style={styles.viewProductText}>{t('common.view', 'View')}</Text>
                            <Ionicons
                              name="chevron-forward"
                              size={12}
                              color="#B24A14"
                            />
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {parsed.trailingText ? (
                  <Text style={styles.catalogTrailingText}>
                    {parsed.trailingText}
                  </Text>
                ) : null}
              </View>
            ) : parsed.isNumberedSteps ? (
              /* 2. Numbered Steps / How-to Format */
              <View style={styles.stepsContainer}>
                {parsed.introText ? (
                  <Text style={styles.stepsIntroText}>
                    {parsed.introText}
                  </Text>
                ) : null}

                <View style={styles.stepsList}>
                  {parsed.numberedSteps.map((step, idx) => (
                    <View key={`step-${idx}`} style={styles.stepItemRow}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              /* 3. Plain Text Fallback */
              <Text style={styles.plainText}>
                {parsed.plainText || message.text}
              </Text>
            )}

            {/* Error Message & Retry */}
            {message.error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>
                  Response could not be completed.
                </Text>
                {onRetry && (
                  <TouchableOpacity
                    onPress={onRetry}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryButtonText}>{t('common.retry', 'Retry')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

          </View>

          {/* Footer Actions: Timestamp + Copy + Thumbs Feedback */}
          <View style={styles.aiFooter}>
            <Text style={styles.aiTime}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>

            <View style={styles.aiActionsRow}>
              <TouchableOpacity
                onPress={handleCopy}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={15}
                  color={copied ? '#15803D' : '#8A6F5C'}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    copied && styles.actionBtnTextSuccess,
                  ]}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLiked(!liked)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={15}
                  color={liked ? '#B24A14' : '#8A6F5C'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  userContainer: {
    marginVertical: 6,
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  userBubble: {
    maxWidth: '84%',
    backgroundColor: '#F0E4D0',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E6D4BE',
    ...Platform.select({
      ios: {
        shadowColor: '#3B1A0E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  userBubbleSelected: {
    borderColor: '#B24A14',
    borderWidth: 2,
    backgroundColor: '#FFEAD5',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionCheckmarkLeft: {
    marginRight: 10,
  },
  selectionCheckmarkRight: {
    marginLeft: 'auto',
  },
  userContent: {
    flexShrink: 1,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2A1710',
    fontFamily: THEME.fonts.regular,
  },
  userTime: {
    fontSize: 11,
    color: '#8A6F5C',
    fontFamily: THEME.fonts.medium,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  aiContainer: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EADFCB',
    ...Platform.select({
      ios: {
        shadowColor: '#3B1A0E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: {
        elevation: 2.5,
      },
    }),
  },
  aiCardSelected: {
    borderColor: '#B24A14',
    borderWidth: 2,
    backgroundColor: '#FFFBF7',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A1A0A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiName: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.bold,
    color: '#4A1A0A',
    letterSpacing: -0.2,
  },
  aiBody: {
    marginBottom: 8,
  },
  plainText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#2A1710',
    fontFamily: THEME.fonts.regular,
  },
  catalogContainer: {
    gap: 8,
  },
  catalogIntroText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#2A1710',
    fontFamily: THEME.fonts.medium,
    marginBottom: 4,
  },
  productCardsList: {
    gap: 10,
  },
  productCardItem: {
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EADFCB',
    padding: 12,
  },
  productCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productCardName: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: '#2A1710',
    flex: 1,
    marginRight: 8,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  stockPillInStock: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  stockPillOos: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  stockPillText: {
    fontSize: 11,
    fontFamily: THEME.fonts.semiBold,
  },
  stockPillTextInStock: {
    color: '#15803D',
  },
  stockPillTextOos: {
    color: '#6B7280',
  },
  productCardFarm: {
    fontSize: 12.5,
    color: '#7A6658',
    fontFamily: THEME.fonts.regular,
    marginBottom: 6,
  },
  productCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  productCardPrice: {
    fontSize: 15.5,
    fontFamily: THEME.fonts.bold,
    color: '#B24A14',
  },
  viewProductPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FFEDD5',
    gap: 2,
  },
  viewProductText: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.bold,
    color: '#B24A14',
  },
  catalogTrailingText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#7A6658',
    fontFamily: THEME.fonts.regular,
    marginTop: 4,
  },
  stepsContainer: {
    gap: 8,
  },
  stepsIntroText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#2A1710',
    fontFamily: THEME.fonts.medium,
    marginBottom: 4,
  },
  stepsList: {
    gap: 8,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    fontSize: 12,
    fontFamily: THEME.fonts.bold,
    color: '#B24A14',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: '#2A1710',
    fontFamily: THEME.fonts.regular,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12.5,
    color: '#DC2626',
    flex: 1,
    fontFamily: THEME.fonts.regular,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: THEME.fonts.bold,
  },
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0E5D8',
  },
  sourcesLabel: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.semiBold,
    color: '#8A6F5C',
    marginBottom: 6,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11,
    color: '#B24A14',
    fontFamily: THEME.fonts.medium,
  },
  aiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE1',
    marginTop: 4,
  },
  aiTime: {
    fontSize: 11,
    color: '#8A6F5C',
    fontFamily: THEME.fonts.medium,
  },
  aiActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  actionBtnText: {
    fontSize: 12,
    color: '#8A6F5C',
    fontFamily: THEME.fonts.medium,
  },
  actionBtnTextSuccess: {
    color: '#15803D',
  },
});

export default CustomerAiMessageItem;
