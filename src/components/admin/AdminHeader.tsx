import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  TextStyle,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useNotification } from '../../context/NotificationContext';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  MenuIcon,
  ChatIcon,
  MessageIcon,
  BellIcon,
  ChevronLeftIcon,
  SearchIcon,
  FilterIcon,
} from './AdminIcons';

export interface AdminHeaderProps {
  variant?: 'dashboard' | 'tab' | 'inner' | 'default';
  title?: string;
  titleStyle?: TextStyle;
  titleAlign?: 'center' | 'left';
  titleSize?: number;
  titleWrapperStyle?: ViewStyle;
  subtitle?: string;
  onMenuPress?: () => void;
  showBackButton?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showNotifications?: boolean;
  // Search bar support
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  onFilterPress?: () => void;
}

const AdminHeaderComponent: React.FC<AdminHeaderProps> = ({
  variant = 'default',
  title = 'Farm2Home',
  titleStyle,
  titleAlign = 'center',
  titleSize = 22,
  titleWrapperStyle,
  subtitle,
  onMenuPress,
  showBackButton = false,
  showBack = false,
  onBackPress,
  onBack,
  rightAction,
  showNotifications = true,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  onFilterPress,
}) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { unreadCount, blockedFarmerUnreadCount, hasNewAdminGroupMsg } = useNotification();
  const isBackVisible = showBackButton || showBack;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      navigation.navigate('AdminMenu');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1) DASHBOARD VARIANT (Home)
  // ──────────────────────────────────────────────────────────────────────────
  if (variant === 'dashboard') {
    const topPadding = Math.max(insets.top + 6, 50);

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <LinearGradient
          colors={ADMIN_THEME.colors.headerGradient}
          start={ADMIN_THEME.colors.headerGradientStart}
          end={ADMIN_THEME.colors.headerGradientEnd}
          style={[styles.dashboardGradient, { paddingTop: topPadding }]}
        >
          {/* Decorative SVG Circles */}
          <Svg
            style={StyleSheet.absoluteFillObject}
            viewBox="0 0 390 132"
            pointerEvents="none"
          >
            <Circle cx="350" cy="10" r="100" fill={ADMIN_THEME.colors.headerCircle1} opacity={0.18} />
            <Circle cx="30" cy="130" r="60" fill={ADMIN_THEME.colors.headerCircle2} opacity={0.12} />
          </Svg>

          {/* Row */}
          <View style={styles.dashboardRow}>
            {/* Menu button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuCircleButton}
              onPress={showBackButton ? handleBack : handleMenu}
            >
              {showBackButton ? (
                <ChevronLeftIcon size={22} color="#FFFFFF" strokeWidth={2.2} />
              ) : (
                <MenuIcon size={24} color="#FFFFFF" strokeWidth={2.2} />
              )}
            </TouchableOpacity>

            {/* Wordmark (Always completely visible without truncation) */}
            <View style={styles.wordmarkWrapper}>
              <Text style={styles.wordmarkText} numberOfLines={1}>
                Farm<Text style={styles.wordmarkAccent}>2</Text>Home
              </Text>
            </View>

            {/* Right Action Buttons */}
            <View style={styles.rightIconsGroup}>
              {/* Glass button: Group Chat */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.actionCircleButton}
                onPress={() => navigation.navigate('AdminGroupChat')}
              >
                <ChatIcon size={18} color="#FFFFFF" strokeWidth={1.9} />
                {hasNewAdminGroupMsg && <View style={styles.redDot} />}
              </TouchableOpacity>

              {/* Glass button: Farmers / Messages */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.actionCircleButton}
                onPress={() => navigation.navigate('AdminFarmers', { initialTab: 'Blocked' })}
              >
                <MessageIcon size={18} color="#FFFFFF" strokeWidth={1.9} />
                {blockedFarmerUnreadCount > 0 && <View style={styles.redDot} />}
              </TouchableOpacity>

              {/* Bell button */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.actionBellButton}
                onPress={() => navigation.navigate('Notifications')}
              >
                <BellIcon size={18} color={ADMIN_THEME.colors.gold} strokeWidth={1.9} />
                {unreadCount > 0 && <View style={styles.bellUnreadDot} />}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2) TAB VARIANT (Top-level pages: Users, Products, Markets, etc.)
  // ──────────────────────────────────────────────────────────────────────────
  if (variant === 'tab') {
    const topPadding = Math.max(insets.top + 6, 50);

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <LinearGradient
          colors={ADMIN_THEME.colors.headerGradient}
          start={ADMIN_THEME.colors.headerGradientStart}
          end={ADMIN_THEME.colors.headerGradientEnd}
          style={[styles.tabGradient, { paddingTop: topPadding }]}
        >
          {/* Decorative SVG Circles */}
          <Svg
            style={StyleSheet.absoluteFillObject}
            viewBox="0 0 390 140"
            pointerEvents="none"
          >
            <Circle cx="350" cy="10" r="100" fill={ADMIN_THEME.colors.headerCircle1} opacity={0.18} />
            <Circle cx="30" cy="130" r="60" fill={ADMIN_THEME.colors.headerCircle2} opacity={0.12} />
          </Svg>

          <View style={styles.tabTopRow}>
            {showBackButton && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.glassCircleButton, { marginRight: 12 }]}
                onPress={handleBack}
              >
                <ChevronLeftIcon size={22} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            )}

            {/* Title & subtitle */}
            <View style={styles.tabTitleContainer}>
              <Text
                style={[
                  styles.tabTitleText,
                  titleSize ? { fontSize: titleSize } : null,
                  titleStyle,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.tabSubtitleText} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            {/* Right actions */}
            <View style={styles.tabRightGroup}>
              {rightAction}

              {showNotifications && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.bellButton}
                  onPress={() => navigation.navigate('Notifications')}
                >
                  <BellIcon size={20} color={ADMIN_THEME.colors.gold} strokeWidth={1.9} />
                  {unreadCount > 0 && <View style={styles.bellUnreadDot} />}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.glassCircleButton}
                onPress={handleMenu}
              >
                <MenuIcon size={22} color="#FFFFFF" strokeWidth={1.9} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Optional Search Bar */}
          {showSearch && (
            <View style={styles.searchBarWrapper}>
              <View style={styles.searchBarContainer}>
                <SearchIcon size={20} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  value={searchValue}
                  onChangeText={onSearchChange}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={ADMIN_THEME.colors.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {onFilterPress && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.filterButton}
                    onPress={onFilterPress}
                  >
                    <FilterIcon size={18} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3) INNER VARIANT (Detail / Form screens)
  // ──────────────────────────────────────────────────────────────────────────
  if (variant === 'inner') {
    const topPadding = Math.max(insets.top + 6, 50);

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <LinearGradient
          colors={ADMIN_THEME.colors.headerGradient}
          start={ADMIN_THEME.colors.headerGradientStart}
          end={ADMIN_THEME.colors.headerGradientEnd}
          style={[styles.innerGradient, { paddingTop: topPadding }]}
        >
          {/* Decorative SVG Circles */}
          <Svg
            style={StyleSheet.absoluteFillObject}
            viewBox="0 0 390 120"
            pointerEvents="none"
          >
            <Circle cx="350" cy="10" r="100" fill={ADMIN_THEME.colors.headerCircle1} opacity={0.18} />
            <Circle cx="30" cy="120" r="60" fill={ADMIN_THEME.colors.headerCircle2} opacity={0.12} />
          </Svg>

          <View style={styles.innerRow}>
            {/* Glass Back Button 42x42 */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.glassCircleButton}
              onPress={handleBack}
            >
              <ChevronLeftIcon size={22} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>

            {/* Centered or Left Title */}
            <View
              style={[
                styles.innerTitleWrapper,
                titleAlign === 'left' && styles.innerTitleWrapperLeft,
                titleWrapperStyle,
              ]}
            >
              <Text
                style={[
                  styles.innerTitleText,
                  { fontSize: titleSize },
                  titleAlign === 'left' && styles.innerTitleTextLeft,
                  titleStyle,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {title}
              </Text>
            </View>

            {/* Glass Action Button or Empty 42x42 Spacer */}
            {rightAction ? (
              <View style={styles.rightActionWrapper}>{rightAction}</View>
            ) : titleAlign === 'left' ? null : (
              <View style={styles.spacer42} />
            )}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4) DEFAULT (fallback)
  // ──────────────────────────────────────────────────────────────────────────
  const defaultTopPadding = Math.max(insets.top + 6, 48);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <LinearGradient
        colors={ADMIN_THEME.colors.headerGradient}
        start={ADMIN_THEME.colors.headerGradientStart}
        end={ADMIN_THEME.colors.headerGradientEnd}
        style={[styles.innerGradient, { paddingTop: defaultTopPadding }]}
      >
        <View style={styles.innerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.glassCircleButton}
            onPress={isBackVisible ? handleBack : handleMenu}
          >
            {isBackVisible ? (
              <ChevronLeftIcon size={22} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <MenuIcon size={22} color="#FFFFFF" strokeWidth={1.9} />
            )}
          </TouchableOpacity>

          <View
            style={[
              styles.innerTitleWrapper,
              titleAlign === 'left' && styles.innerTitleWrapperLeft,
              titleWrapperStyle,
            ]}
          >
            <Text
              style={[
                styles.innerTitleText,
                { fontSize: titleSize },
                titleAlign === 'left' && styles.innerTitleTextLeft,
                titleStyle,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {title}
            </Text>
          </View>

          {rightAction ? (
            <View style={styles.rightActionWrapper}>{rightAction}</View>
          ) : titleAlign === 'left' ? null : (
            <View style={styles.spacer42} />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

export const AdminHeader = React.memo(AdminHeaderComponent);
AdminHeader.displayName = 'AdminHeader';
export default AdminHeader;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  // Dashboard Variant
  dashboardGradient: {
    minHeight: 124,
    borderBottomLeftRadius: ADMIN_THEME.radius.headerBottom,
    borderBottomRightRadius: ADMIN_THEME.radius.headerBottom,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  wordmarkWrapper: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  wordmarkText: {
    fontFamily: AdminFonts.heading,
    fontSize: 18.5,
    letterSpacing: 0.1,
    color: '#FFFFFF',
  },
  wordmarkAccent: {
    color: ADMIN_THEME.colors.gold,
  },
  rightIconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 4,
  },
  actionCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  actionBellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: ADMIN_THEME.colors.gold,
    backgroundColor: 'rgba(231,192,106,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  // Tab Variant
  tabGradient: {
    minHeight: 132,
    borderBottomLeftRadius: ADMIN_THEME.radius.headerBottom,
    borderBottomRightRadius: ADMIN_THEME.radius.headerBottom,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 22,
    justifyContent: 'flex-start',
  },
  tabTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabTitleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  tabTitleText: {
    fontFamily: AdminFonts.heading,
    fontSize: 26,
    color: '#FFFFFF',
  },
  tabSubtitleText: {
    marginTop: 2,
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  tabRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Inner Variant
  innerGradient: {
    minHeight: 104,
    borderBottomLeftRadius: ADMIN_THEME.radius.headerBottom,
    borderBottomRightRadius: ADMIN_THEME.radius.headerBottom,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 18,
    justifyContent: 'flex-start',
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  innerTitleWrapper: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  innerTitleWrapperLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 0,
    marginLeft: 14,
    marginRight: 10,
    flex: 1,
  },
  innerTitleText: {
    fontFamily: AdminFonts.heading,
    fontSize: 17.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  innerTitleTextLeft: {
    textAlign: 'left',
  },
  rightActionWrapper: {
    minWidth: 42,
    height: 42,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  spacer42: {
    width: 42,
    height: 42,
  },

  // Shared 42x42 Glass Buttons
  glassCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: ADMIN_THEME.colors.gold,
    backgroundColor: 'rgba(231,192,106,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellUnreadDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    borderWidth: 1.5,
    borderColor: '#1B2A5E',
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },

  // Search Bar inside Header
  searchBarWrapper: {
    marginTop: 10,
    width: '100%',
  },
  searchBarContainer: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    ...ADMIN_THEME.shadows.searchBar,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: AdminFonts.regular,
    fontSize: 14,
    color: ADMIN_THEME.colors.ink,
    paddingVertical: 0,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: ADMIN_THEME.colors.indigoTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
