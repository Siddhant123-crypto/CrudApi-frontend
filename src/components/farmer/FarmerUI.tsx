import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  StyleProp,
  TextStyle,
  Image,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { ChevronRightIcon } from './FarmerIcons';
import { FarmerPrimaryButton } from './FarmerButtons';

// ----------------------------------------------------
// FarmerChip
// ----------------------------------------------------
interface FarmerChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  count?: number;
  style?: ViewStyle;
}

export const FarmerChip: React.FC<FarmerChipProps> = ({
  label,
  selected = false,
  onPress,
  count,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.chipActive : styles.chipInactive,
        style,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          selected ? styles.chipTextActive : styles.chipTextInactive,
        ]}
        maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
      >
        {label}
        {count !== undefined && count !== null ? ` (${count})` : ''}
      </Text>
    </TouchableOpacity>
  );
};

// ----------------------------------------------------
// FarmerBadge
// ----------------------------------------------------
interface FarmerBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const FarmerBadge: React.FC<FarmerBadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  let bg = FARMER_THEME.colors.deliveredBg;
  let textCol = FARMER_THEME.colors.deliveredText;

  const normalized = (label || '').toUpperCase();

  if (
    variant === 'success' ||
    normalized.includes('DELIVER') ||
    normalized.includes('ACTIVE') ||
    normalized.includes('VERIFIED') ||
    normalized.includes('ACCEPTED')
  ) {
    bg = FARMER_THEME.colors.successBg;
    textCol = FARMER_THEME.colors.success;
  } else if (
    variant === 'warning' ||
    normalized.includes('PENDING') ||
    normalized.includes('PROCESSING') ||
    normalized.includes('WAITING')
  ) {
    bg = FARMER_THEME.colors.warningBg;
    textCol = FARMER_THEME.colors.warning;
  } else if (
    variant === 'error' ||
    normalized.includes('CANCEL') ||
    normalized.includes('INACTIVE') ||
    normalized.includes('REJECT') ||
    normalized.includes('BLOCKED')
  ) {
    bg = FARMER_THEME.colors.errorBg;
    textCol = FARMER_THEME.colors.error;
  } else if (variant === 'info') {
    bg = FARMER_THEME.colors.infoBg;
    textCol = FARMER_THEME.colors.info;
  } else {
    bg = FARMER_THEME.colors.pastelGreen;
    textCol = FARMER_THEME.colors.headings;
  }

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const sizeStyle: ViewStyle = isSmall
    ? { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }
    : isLarge
    ? { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 }
    : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 };

  const sizeTextStyle: TextStyle = isSmall
    ? { fontSize: 10, lineHeight: 14 }
    : isLarge
    ? { fontSize: 13, lineHeight: 18 }
    : { fontSize: 11, lineHeight: 16 };

  return (
    <View style={[styles.badge, sizeStyle, { backgroundColor: bg }, style]}>
      <Text
        style={[styles.badgeText, sizeTextStyle, { color: textCol }, textStyle]}
        maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
      >
        {label}
      </Text>
    </View>
  );
};

// ----------------------------------------------------
// FarmerStatCard
// ----------------------------------------------------
interface FarmerStatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  iconBg?: string;
  style?: ViewStyle;
  subLabel?: string;
  valueStyle?: TextStyle;
  subLabelStyle?: TextStyle;
  labelStyle?: TextStyle;
  iconBoxStyle?: ViewStyle;
  compact?: boolean;
}

export const FarmerStatCard: React.FC<FarmerStatCardProps> = ({
  value,
  label,
  icon,
  iconBg = FARMER_THEME.colors.pastelGreen,
  style,
  subLabel,
  valueStyle,
  subLabelStyle,
  labelStyle,
  iconBoxStyle,
  compact = false,
}) => {
  return (
    <View style={[styles.statCard, compact && styles.statCardCompact, style]}>
      {icon && (
        <View
          style={[
            styles.statIconBox,
            { backgroundColor: iconBg },
            compact && styles.statIconBoxCompact,
            iconBoxStyle,
          ]}
        >
          {icon}
        </View>
      )}
      <Text
        style={[styles.statValue, compact && styles.statValueCompact, valueStyle]}
        maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {subLabel && !compact ? (
        <Text
          style={[styles.statSubLabel, subLabelStyle]}
          maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {subLabel}
        </Text>
      ) : null}
      <Text
        style={[styles.statLabel, compact && styles.statLabelCompact, labelStyle]}
        maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {compact && subLabel ? `${label} (${subLabel})` : label}
      </Text>
    </View>
  );
};

// ----------------------------------------------------
// FarmerListRow
// ----------------------------------------------------
interface FarmerListRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  imageUri?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  showChevron?: boolean;
}

export const FarmerListRow: React.FC<FarmerListRowProps> = ({
  title,
  subtitle,
  icon,
  iconBg = FARMER_THEME.colors.pastelGreen,
  imageUri,
  rightElement,
  onPress,
  style,
  showChevron = true,
}) => {
  const content = (
    <View style={[styles.listRowCard, style]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.rowImageTile} />
      ) : icon ? (
        <View style={[styles.rowIconTile, { backgroundColor: iconBg }]}>
          {icon}
        </View>
      ) : null}

      <View style={styles.rowMiddle}>
        <Text
          style={styles.rowTitle}
          maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={styles.rowSubtitle}
            maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowRight}>
        {rightElement}
        {showChevron && onPress && (
          <ChevronRightIcon size={20} color={FARMER_THEME.colors.textMuted} strokeWidth={2} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// ----------------------------------------------------
// FarmerEmptyState
// ----------------------------------------------------
interface FarmerEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  style?: ViewStyle;
}

export const FarmerEmptyState: React.FC<FarmerEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  buttonTitle,
  onButtonPress,
  style,
}) => {
  return (
    <View style={[styles.emptyContainer, style]}>
      <View style={styles.emptyCircle}>
        <LinearGradient
          colors={['#FFFFFF', '#DDF3E4']}
          style={styles.emptyCircleGradient}
        >
          {icon}
        </LinearGradient>
      </View>
      <Text
        style={styles.emptyTitle}
        maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
      >
        {title}
      </Text>
      <Text
        style={styles.emptySubtitle}
        maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
      >
        {subtitle}
      </Text>
      {buttonTitle && onButtonPress && (
        <FarmerPrimaryButton
          title={buttonTitle}
          onPress={onButtonPress}
          style={styles.emptyButton}
          compact
        />
      )}
    </View>
  );
};

// ----------------------------------------------------
// FarmerStickyBar & useKeyboardVisible
// ----------------------------------------------------
export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return isKeyboardVisible;
};

interface FarmerStickyBarProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hideOnKeyboard?: boolean;
}

export const FarmerStickyBar: React.FC<FarmerStickyBarProps> = React.memo(({
  children,
  style,
  hideOnKeyboard = true,
}) => {
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisible();

  if (hideOnKeyboard && isKeyboardVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.stickyBar,
        { paddingBottom: Math.max(insets.bottom, 16) },
        style,
      ]}
    >
      {children}
    </View>
  );
});

// ----------------------------------------------------
// FarmerSkeleton
// ----------------------------------------------------
interface FarmerSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const FarmerSkeleton: React.FC<FarmerSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  // Chip
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: FARMER_THEME.radius.chips,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInactive: {
    backgroundColor: FARMER_THEME.colors.chipBgInactive,
    borderColor: FARMER_THEME.colors.chipBorderInactive,
  },
  chipActive: {
    backgroundColor: FARMER_THEME.colors.chipBgActive,
    borderColor: FARMER_THEME.colors.chipBorderActive,
  },
  chipText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13,
  },
  chipTextInactive: {
    color: FARMER_THEME.colors.chipTextInactive,
  },
  chipTextActive: {
    color: FARMER_THEME.colors.chipTextActive,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    letterSpacing: 0.4,
  },

  // Stat Card
  statCard: {
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: FARMER_THEME.radius.smallCards,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    ...FARMER_THEME.shadows.tile,
  },
  statCardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 0,
    borderRadius: 12,
  },
  statIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconBoxCompact: {
    width: 32,
    height: 32,
    borderRadius: 10,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 22,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
  },
  statValueCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  statSubLabel: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 11,
    color: FARMER_THEME.colors.primaryGreen,
    marginTop: 1,
  },
  statLabel: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 12,
    color: FARMER_THEME.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  statLabelCompact: {
    fontSize: 10.5,
    lineHeight: 13,
    marginTop: 1,
  },

  // List Row
  listRowCard: {
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: FARMER_THEME.radius.cards,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...FARMER_THEME.shadows.tile,
  },
  rowIconTile: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowImageTile: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  rowMiddle: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 15,
    color: FARMER_THEME.colors.headings,
  },
  rowSubtitle: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 12.5,
    color: FARMER_THEME.colors.textSecondary,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    ...FARMER_THEME.shadows.tile,
  },
  emptyCircleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 20,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 14,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 160,
  },

  // Sticky Bar
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    paddingHorizontal: 20,
    paddingTop: 16,
    ...FARMER_THEME.shadows.stickyBar,
  },

  // Skeleton
  skeletonBlock: {
    backgroundColor: '#E3EDE5',
  },
});
