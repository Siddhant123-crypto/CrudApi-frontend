import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  StyleProp,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FARMER_THEME } from '../../constants/farmerTheme';
import {
  MenuIcon,
  PinIcon,
  ChevronDownIcon,
  BellIcon,
  SearchIcon,
  ArrowBackIcon,
  ChevronLeftIcon,
  CloseCircleIcon,
} from './FarmerIcons';
import { FarmerWeatherPill } from './FarmerWeatherPill';

export interface FarmerHeaderProps {
  variant?: 'dashboard' | 'tab' | 'inner';
  title?: string;
  subtitle?: string;
  titleAlign?: 'center' | 'left';
  titleStyle?: StyleProp<TextStyle>;
  onBackPress?: () => void;
  rightActionIcon?: React.ReactNode;
  onRightActionPress?: () => void;
  rightComponent?: React.ReactNode;
  rightAction?: React.ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  // Dashboard specific (all optional for tab/inner)
  onMenuPress?: () => void;
  farmName?: string;
  onLocationPress?: () => void;
  unreadCount?: number;
  onNotificationPress?: () => void;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: () => void;
  searchLoading?: boolean;
  weatherRefreshTrigger?: number;
}

export const FarmerHeader: React.FC<FarmerHeaderProps> = React.memo(({
  variant = 'dashboard',
  title,
  subtitle,
  titleAlign = 'center',
  titleStyle,
  onBackPress,
  rightActionIcon,
  onRightActionPress,
  rightComponent,
  rightAction,
  showSearch = false,
  searchPlaceholder = 'Search...',
  onMenuPress,
  farmName = 'Farmer',
  onLocationPress,
  unreadCount = 0,
  onNotificationPress,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchLoading = false,
  weatherRefreshTrigger,
}) => {
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // If variant is not explicitly tab or inner, check if title is passed or if farmName/onMenuPress is passed
  const activeVariant =
    variant !== 'dashboard'
      ? variant
      : title && !onMenuPress
      ? 'inner'
      : 'dashboard';

  const isTab = activeVariant === 'tab';
  const isInner = activeVariant === 'inner';

  const paddingTop = isInner
    ? Math.max(insets.top + 6, 44)
    : Math.max(insets.top + 6, 50);

  const handleOpenSearch = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleCloseSearch = () => {
    onSearchChange?.('');
    setIsSearchExpanded(false);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" translucent />
      <LinearGradient
        colors={FARMER_THEME.colors.headerGradient}
        start={FARMER_THEME.colors.headerGradientStart}
        end={FARMER_THEME.colors.headerGradientEnd}
        style={[
          styles.headerContainer,
          {
            paddingTop,
            paddingBottom: isInner ? 18 : 22,
            minHeight: isTab ? 130 : undefined,
          },
        ]}
      >
        {/* Decorative Circles */}
        <Svg
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          viewBox="0 0 390 170"
          preserveAspectRatio="none"
        >
          <Circle
            cx="350"
            cy="30"
            r="110"
            fill={FARMER_THEME.colors.headerCircle1}
            opacity={0.16}
          />
          <Circle
            cx="20"
            cy="150"
            r="70"
            fill={FARMER_THEME.colors.headerCircle2}
            opacity={0.16}
          />
        </Svg>

        {/* Tab Variant */}
        {isTab && (
          <View>
            <View style={styles.tabTopRow}>
              {onBackPress ? (
                <TouchableOpacity
                  style={[styles.glassButton, { marginRight: 12 }]}
                  onPress={onBackPress}
                  activeOpacity={0.75}
                >
                  <ChevronLeftIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
                </TouchableOpacity>
              ) : null}

              <View style={styles.tabTitleContainer}>
                <Text
                  style={styles.tabTitleText}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {subtitle ? (
                  <Text
                    style={styles.tabSubtitleText}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    numberOfLines={1}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <View style={styles.tabActionsRow}>
                {rightComponent ? (
                  rightComponent
                ) : (
                  <>
                    {onNotificationPress && (
                      <TouchableOpacity
                        style={styles.glassButton}
                        onPress={onNotificationPress}
                        activeOpacity={0.75}
                      >
                        <BellIcon size={22} color="#FFFFFF" strokeWidth={1.9} />
                        {unreadCount > 0 && <View style={styles.unreadDot} />}
                      </TouchableOpacity>
                    )}
                    {rightActionIcon && (
                      <TouchableOpacity
                        style={styles.glassButton}
                        onPress={onRightActionPress}
                        activeOpacity={0.75}
                      >
                        {rightActionIcon}
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Optional Tab Search Bar */}
            {showSearch && onSearchChange && (
              <View style={styles.tabSearchBar}>
                <SearchIcon
                  size={20}
                  color={FARMER_THEME.colors.primaryGreen}
                  strokeWidth={2}
                />
                <TextInput
                  style={styles.tabSearchInput}
                  value={searchValue}
                  onChangeText={onSearchChange}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={FARMER_THEME.colors.placeholder}
                  returnKeyType="search"
                  onSubmitEditing={onSearchSubmit}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                />
                {searchLoading && (
                  <ActivityIndicator
                    size="small"
                    color={FARMER_THEME.colors.primaryGreen}
                  />
                )}
                {searchValue.length > 0 && (
                  <TouchableOpacity
                    onPress={() => onSearchChange('')}
                    style={styles.clearBtn}
                    activeOpacity={0.7}
                  >
                    <CloseCircleIcon
                      size={20}
                      color={FARMER_THEME.colors.placeholder}
                      strokeWidth={1.8}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Inner / Detail Variant */}
        {isInner && (
          <View style={styles.innerRow}>
            {onBackPress ? (
              <TouchableOpacity
                style={styles.glassButton}
                onPress={onBackPress}
                activeOpacity={0.75}
              >
                <ChevronLeftIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
              </TouchableOpacity>
            ) : (
              <View style={styles.emptySpacer} />
            )}

            <View
              style={[
                styles.innerTitleWrapper,
                titleAlign === 'left' && styles.innerTitleWrapperLeft,
              ]}
            >
              <Text
                style={[
                  styles.innerTitleText,
                  titleAlign === 'left' && styles.innerTitleTextLeft,
                  titleStyle,
                ]}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>

            {rightAction || rightComponent ? (
              (rightAction || rightComponent)
            ) : rightActionIcon ? (
              <TouchableOpacity
                style={styles.glassButton}
                onPress={onRightActionPress}
                activeOpacity={0.75}
              >
                {rightActionIcon}
              </TouchableOpacity>
            ) : titleAlign === 'left' ? null : (
              <View style={styles.emptySpacer} />
            )}
          </View>
        )}

        {/* Dashboard Variant (Full Dashboard Home Header) */}
        {!isTab && !isInner && (
          <>
            {/* Top Row */}
            <View style={styles.topRow}>
              {/* Menu button */}
              <TouchableOpacity
                style={styles.glassButton}
                onPress={onMenuPress}
                activeOpacity={0.75}
              >
                <MenuIcon size={22} color="#FFFFFF" strokeWidth={1.9} />
              </TouchableOpacity>

              {/* Farm / Location Block */}
              <TouchableOpacity
                style={styles.locationBlock}
                onPress={onLocationPress}
                activeOpacity={0.8}
              >
                <Text
                  style={styles.locationLabel}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  Your farm
                </Text>
                <View style={styles.locationNameRow}>
                  <PinIcon
                    size={16}
                    color={FARMER_THEME.colors.goldLight}
                    strokeWidth={2}
                  />
                  <Text
                    style={styles.locationNameText}
                    numberOfLines={1}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {farmName || 'Farmer'}
                  </Text>
                  <ChevronDownIcon size={16} color="#FFFFFF" strokeWidth={2.2} />
                </View>
              </TouchableOpacity>

              {/* Bell button */}
              <TouchableOpacity
                style={styles.glassButton}
                onPress={onNotificationPress}
                activeOpacity={0.75}
              >
                <BellIcon size={22} color="#FFFFFF" strokeWidth={1.9} />
                {unreadCount > 0 && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            </View>

            {/* Search Button + Weather Update Row */}
            {!isSearchExpanded ? (
              <View style={styles.searchWeatherRow}>
                {/* Round Search Button (Left) */}
                <TouchableOpacity
                  style={styles.searchCircleBtn}
                  onPress={handleOpenSearch}
                  activeOpacity={0.8}
                >
                  <SearchIcon
                    size={20}
                    color={FARMER_THEME.colors.primaryGreen}
                    strokeWidth={2}
                  />
                </TouchableOpacity>

                {/* Weather Pill (Right) */}
                <FarmerWeatherPill refreshTrigger={weatherRefreshTrigger} />
              </View>
            ) : (
              /* Expanding Search Field */
              <View style={styles.searchWeatherRow}>
                <View style={styles.expandedSearchPill}>
                  <TouchableOpacity
                    style={styles.searchBackBtn}
                    onPress={handleCloseSearch}
                    activeOpacity={0.7}
                  >
                    <ChevronLeftIcon
                      size={20}
                      color={FARMER_THEME.colors.primaryGreen}
                      strokeWidth={2.4}
                    />
                  </TouchableOpacity>

                  <TextInput
                    ref={searchInputRef}
                    style={styles.expandedSearchInput}
                    value={searchValue}
                    onChangeText={onSearchChange}
                    placeholder="Search products, orders..."
                    placeholderTextColor={FARMER_THEME.colors.placeholder}
                    underlineColorAndroid="transparent"
                    returnKeyType="search"
                    autoFocus
                    onBlur={() => {
                      if (!searchValue?.trim()) {
                        setIsSearchExpanded(false);
                      }
                    }}
                    onSubmitEditing={() => {
                      onSearchSubmit?.();
                      setIsSearchExpanded(false);
                    }}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  />

                  {searchLoading && (
                    <ActivityIndicator
                      size="small"
                      color={FARMER_THEME.colors.primaryGreen}
                      style={styles.searchSpinner}
                    />
                  )}

                  {searchValue.length > 0 && (
                    <TouchableOpacity
                      onPress={() => onSearchChange?.('')}
                      style={styles.clearBtn}
                      activeOpacity={0.7}
                    >
                      <CloseCircleIcon
                        size={20}
                        color={FARMER_THEME.colors.placeholder}
                        strokeWidth={1.8}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </LinearGradient>
    </>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  tabTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  tabTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  tabTitleText: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  tabSubtitleText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 11,
    color: FARMER_THEME.colors.goldLight,
    marginTop: 2,
  },
  tabActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabSearchBar: {
    marginTop: 14,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    ...FARMER_THEME.shadows.searchBar,
  },
  tabSearchInput: {
    flex: 1,
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 15,
    color: FARMER_THEME.colors.textDark,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  innerTitleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginHorizontal: 12,
  },
  innerTitleWrapperLeft: {
    alignItems: 'flex-start',
    marginLeft: 16,
    marginRight: 8,
    paddingHorizontal: 0,
  },
  innerTitleText: {
    textAlign: 'center',
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  innerTitleTextLeft: {
    textAlign: 'left',
  },
  emptySpacer: {
    width: 44,
    height: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: FARMER_THEME.colors.goldDot,
    borderWidth: 2,
    borderColor: FARMER_THEME.colors.goldDotBorder,
  },
  locationBlock: {
    flex: 1,
  },
  locationLabel: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.66,
    color: FARMER_THEME.colors.goldLight,
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  locationNameText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
    maxWidth: '80%',
  },
  searchWeatherRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...FARMER_THEME.shadows.searchBar,
  },
  expandedSearchPill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
    gap: 6,
    ...FARMER_THEME.shadows.searchBar,
  },
  searchBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedSearchInput: {
    flex: 1,
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 15,
    color: FARMER_THEME.colors.textDark,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  searchSpinner: {
    marginRight: 4,
  },
});

export default FarmerHeader;
