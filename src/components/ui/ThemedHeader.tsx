import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../../constants/theme';
import {
  ArrowLeftIcon,
  BellIcon,
  CartIcon,
  SearchIcon,
  SlidersIcon,
} from '../CustomerIcons';

interface ThemedHeaderProps {
  variant?: 'tab' | 'inner';
  title: string;
  subtitle?: string;
  titleAlign?: 'left' | 'center';
  titleStyle?: StyleProp<TextStyle>;
  onBackPress?: () => void;
  // Tab variant right actions
  showCart?: boolean;
  cartCount?: number;
  onCartPress?: () => void;
  showBell?: boolean;
  onBellPress?: () => void;
  rightAction?: React.ReactNode;
  // Inner variant right action
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
  // Search bar support
  hasSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onFilterPress?: () => void;
}

export const ThemedHeader: React.FC<ThemedHeaderProps> = ({
  variant = 'inner',
  title,
  subtitle,
  titleAlign = 'center',
  titleStyle,
  onBackPress,
  showCart,
  cartCount = 0,
  onCartPress,
  showBell,
  onBellPress,
  rightAction,
  rightIcon,
  onRightPress,
  hasSearch,
  searchPlaceholder = 'Search for fresh product',
  searchValue,
  onSearchChange,
  onFilterPress,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleCart = () => {
    if (onCartPress) {
      onCartPress();
    } else {
      navigation.navigate('Cart');
    }
  };

  const handleBell = () => {
    if (onBellPress) {
      onBellPress();
    } else {
      navigation.navigate('Notifications');
    }
  };

  const paddingTop = Math.max(insets.top + 6, 50);

  if (variant === 'tab') {
    return (
      <View style={styles.headerWrapper}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={THEME.colors.headerGradient}
          start={THEME.colors.headerGradientStart}
          end={THEME.colors.headerGradientEnd}
          style={[
            styles.tabHeaderContainer,
            { paddingTop },
            hasSearch && { paddingBottom: 22 },
          ]}
        >
          {/* Decorative SVG circles */}
          <Svg
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
          >
            <Circle cx="350" cy="30" r="110" fill={THEME.colors.headerCircle1} opacity={0.2} />
            <Circle cx="20" cy="190" r="70" fill={THEME.colors.headerCircle2} opacity={0.16} />
          </Svg>

          {/* Top row */}
          <View style={styles.tabTopRow}>
            <View style={styles.tabTitleContainer}>
              <Text numberOfLines={1} style={[styles.tabTitle, titleStyle]}>
                {title}
              </Text>
              {subtitle ? (
                <Text numberOfLines={1} style={styles.tabSubtitle}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <View style={styles.tabActionsRow}>
              {rightAction ? (
                rightAction
              ) : (
                <>
                  {showBell && (
                    <TouchableOpacity
                      style={styles.glassButton}
                      onPress={handleBell}
                      activeOpacity={0.8}
                    >
                      <BellIcon size={22} color={THEME.colors.white} strokeWidth={1.9} />
                    </TouchableOpacity>
                  )}
                  {showCart && (
                    <TouchableOpacity
                      style={styles.glassButton}
                      onPress={handleCart}
                      activeOpacity={0.8}
                    >
                      <CartIcon size={22} color={THEME.colors.white} strokeWidth={1.9} />
                      {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                          <Text style={styles.cartBadgeText}>
                            {cartCount > 99 ? '99+' : cartCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Optional Search bar */}
          {hasSearch && (
            <View style={styles.searchBarContainer}>
              <View style={styles.searchIconWrapper}>
                <SearchIcon size={20} color={THEME.colors.textMuted} strokeWidth={2} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={THEME.colors.placeholder}
                value={searchValue}
                onChangeText={onSearchChange}
                returnKeyType="search"
              />
              {onFilterPress && (
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={onFilterPress}
                  activeOpacity={0.8}
                >
                  <SlidersIcon size={18} color={THEME.colors.accent} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </LinearGradient>
      </View>
    );
  }

  // Inner variant (compact with back button and centered title)
  return (
    <View style={styles.headerWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={THEME.colors.headerGradient}
        start={THEME.colors.headerGradientStart}
        end={THEME.colors.headerGradientEnd}
        style={[styles.innerHeaderContainer, { paddingTop }]}
      >
        {/* Decorative SVG circles */}
        <Svg
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          viewBox="0 0 400 140"
          preserveAspectRatio="none"
        >
          <Circle cx="350" cy="20" r="100" fill={THEME.colors.headerCircle1} opacity={0.2} />
          <Circle cx="20" cy="110" r="60" fill={THEME.colors.headerCircle2} opacity={0.16} />
        </Svg>

        <View style={styles.innerRow}>
          <TouchableOpacity
            style={styles.glassButton}
            onPress={handleBack}
            activeOpacity={0.8}
            accessibilityLabel="Back"
          >
            <ArrowLeftIcon size={22} color={THEME.colors.white} strokeWidth={2.4} />
          </TouchableOpacity>

          <View
            style={[
              styles.innerTitleContainer,
              titleAlign === 'left' && styles.innerTitleContainerLeft,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.innerTitle,
                titleAlign === 'left' && styles.innerTitleLeft,
                titleStyle,
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.innerSubtitle,
                  titleAlign === 'left' && styles.innerSubtitleLeft,
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {rightIcon ? (
            <TouchableOpacity
              style={styles.glassButton}
              onPress={onRightPress}
              activeOpacity={0.8}
            >
              {rightIcon}
            </TouchableOpacity>
          ) : rightAction ? (
            rightAction
          ) : (
            <View style={styles.glassSpacer} />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 10,
  },
  tabHeaderContainer: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
    paddingHorizontal: THEME.spacing.pageHorizontal,
    paddingBottom: 22,
    minHeight: 130,
  },
  innerHeaderContainer: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
    paddingHorizontal: THEME.spacing.pageHorizontal,
    paddingBottom: 18,
  },
  tabTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  tabTitle: {
    fontFamily: THEME.fonts.serif,
    fontSize: 22,
    color: THEME.colors.white,
    letterSpacing: 0.2,
  },
  tabSubtitle: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.headerLabel,
    marginTop: 2,
  },
  tabActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  innerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  innerTitleContainerLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 0,
    marginLeft: 14,
  },
  innerTitle: {
    fontFamily: THEME.fonts.serif,
    fontSize: 22,
    color: THEME.colors.white,
    textAlign: 'center',
  },
  innerTitleLeft: {
    textAlign: 'left',
  },
  innerSubtitle: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.headerLabel,
    marginTop: 2,
    textAlign: 'center',
  },
  innerSubtitleLeft: {
    textAlign: 'left',
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: THEME.colors.headerGlassBorder,
    backgroundColor: THEME.colors.headerGlassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassSpacer: {
    width: 44,
    height: 44,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.colors.notificationDot,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 10,
    color: THEME.colors.white,
  },
  searchBarContainer: {
    marginTop: 18,
    height: 56,
    borderRadius: 20,
    backgroundColor: THEME.colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,1)',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchIconWrapper: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: THEME.fonts.medium,
    fontSize: 15,
    color: THEME.colors.textBase,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFEBD6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default ThemedHeader;
