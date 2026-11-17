import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { FARMER_THEME } from '../../constants/farmerTheme';
import {
  HomeTabIcon,
  StoreIcon,
  ReceiptIcon,
  ProfileTabIcon,
  AiSparkleIcon,
} from './FarmerIcons';

export const FarmerTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;

  // The Farmer bottom nav is only shown on the Farmer Dashboard ('Home') screen
  const activeRouteName = (state.routes[state.index]?.name || '') as string;
  if (activeRouteName !== 'Home') {
    return null;
  }

  const isTabFocused = (name: string): boolean => activeRouteName === name;

  const handleTabPress = (name: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes.find((r) => r.name === name)?.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const handleCenterAiPress = () => {
    navigation.navigate('FarmerAiChat');
  };

  return (
    <View
      style={[
        styles.navContainer,
        {
          bottom: 22 + bottomInset,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.navBar}>
        {/* 1. Home */}
        <TouchableOpacity
          onPress={() => handleTabPress('Home', isTabFocused('Home'))}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel={t('nav.homeTab', 'Home tab')}
          style={[
            styles.tabItem,
            isTabFocused('Home') && styles.tabItemActive,
          ]}
        >
          <HomeTabIcon
            size={22}
            color={isTabFocused('Home') ? FARMER_THEME.colors.darkGreen : FARMER_THEME.colors.textMuted}
            strokeWidth={1.9}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isTabFocused('Home') ? FARMER_THEME.colors.darkGreen : FARMER_THEME.colors.textMuted,
                fontFamily: isTabFocused('Home') ? FARMER_THEME.fonts.bold : FARMER_THEME.fonts.semiBold,
              },
            ]}
            numberOfLines={1}
          >
            {t('nav.home', 'Home')}
          </Text>
        </TouchableOpacity>

        {/* 2. Market */}
        <TouchableOpacity
          onPress={() => handleTabPress('Market', isTabFocused('Market'))}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel={t('nav.marketTab', 'Market tab')}
          style={[
            styles.tabItem,
            isTabFocused('Market') && styles.tabItemActive,
          ]}
        >
          <StoreIcon
            size={22}
            color={isTabFocused('Market') ? FARMER_THEME.colors.darkGreen : FARMER_THEME.colors.textMuted}
            strokeWidth={1.9}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isTabFocused('Market') ? FARMER_THEME.colors.darkGreen : FARMER_THEME.colors.textMuted,
                fontFamily: isTabFocused('Market') ? FARMER_THEME.fonts.bold : FARMER_THEME.fonts.semiBold,
              },
            ]}
            numberOfLines={1}
          >
            {t('nav.market', 'Market')}
          </Text>
        </TouchableOpacity>

        {/* 3. AI Chat (CENTER, RAISED) */}
        <View style={styles.centerButtonWrapper} pointerEvents="box-none">
          <TouchableOpacity
            onPress={handleCenterAiPress}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t('aiChat.openAiChat', 'Open Farm2Home AI Chat')}
            style={styles.centerTouchable}
          >
            <View style={styles.centerGlowRing}>
              <LinearGradient
                colors={['#2E8B4A', '#14532D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.centerCircleGradient}
              >
                <AiSparkleIcon size={25} color="#F2B544" />
              </LinearGradient>
            </View>
            <Text style={styles.centerLabel} numberOfLines={1}>
              {t('aiChat.aiChatTab', 'AI Chat')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Orders */}
        <TouchableOpacity
          onPress={() => handleTabPress('Orders', isTabFocused('Orders'))}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel={t('nav.ordersTab', 'Orders tab')}
          style={[
            styles.tabItem,
            isTabFocused('Orders') && styles.tabItemActive,
          ]}
        >
          <ReceiptIcon
            size={22}
            color={isTabFocused('Orders') ? FARMER_THEME.colors.darkGreen : FARMER_THEME.colors.textMuted}
            strokeWidth={1.9}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isTabFocused('Orders') ? FARMER_THEME.colors.darkGreen : FARMER_THEME.colors.textMuted,
                fontFamily: isTabFocused('Orders') ? FARMER_THEME.fonts.bold : FARMER_THEME.fonts.semiBold,
              },
            ]}
            numberOfLines={1}
          >
            {t('nav.orders', 'Orders')}
          </Text>
        </TouchableOpacity>

        {/* 5. Profile */}
        <TouchableOpacity
          onPress={() => handleTabPress('Profile', isTabFocused('Profile'))}
          activeOpacity={0.8}
          accessibilityRole="tab"
          accessibilityLabel={t('nav.profileTab', 'Profile tab')}
          style={[
            styles.tabItem,
            isTabFocused('Profile') && styles.tabItemActive,
          ]}
        >
          <ProfileTabIcon
            size={22}
            color={isTabFocused('Profile') ? FARMER_THEME.colors.darkGreen : FARMER_THEME.colors.textMuted}
            strokeWidth={1.9}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: isTabFocused('Profile') ? FARMER_THEME.colors.darkGreen : FARMER_THEME.colors.textMuted,
                fontFamily: isTabFocused('Profile') ? FARMER_THEME.fonts.bold : FARMER_THEME.fonts.semiBold,
              },
            ]}
            numberOfLines={1}
          >
            {t('nav.profile', 'Profile')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
    overflow: 'visible',
  },
  navBar: {
    width: '100%',
    height: 72,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: '#D5E3CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.18,
        shadowRadius: 32,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabItem: {
    flex: 1,
    minWidth: 44,
    minHeight: 48,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 18,
  },
  tabItemActive: {
    backgroundColor: '#EAF3E4',
  },
  tabLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  centerButtonWrapper: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 10000,
  },
  centerTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 60,
    marginTop: -26,
    overflow: 'visible',
  },
  centerGlowRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EAF3E4',
    padding: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.32,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  centerCircleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#14532D',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default FarmerTabBar;
