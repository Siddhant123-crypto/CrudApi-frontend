import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  NavHomeIcon,
  NavWishlistIcon,
  NavOrdersIcon,
  NavAccountIcon,
  AiSparkleIcon,
} from './CustomerIcons';

export const CustomerTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;

  const activeRouteName = (state.routes[state.index]?.name || '') as string;
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
    navigation.navigate('CustomerAiChat');
  };

  const activeColor = '#3B1A0E';
  const inactiveColor = '#8A6F5C';

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
          accessibilityRole="tab"
          accessibilityState={isTabFocused('Home') ? { selected: true } : {}}
          accessibilityLabel={t('nav.homeTab', 'Home tab')}
          onPress={() => handleTabPress('Home', isTabFocused('Home'))}
          activeOpacity={0.8}
          style={[styles.navItem, isTabFocused('Home') && styles.navItemActive]}
        >
          <NavHomeIcon
            size={22}
            color={isTabFocused('Home') ? activeColor : inactiveColor}
            strokeWidth={1.9}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navLabel,
              { color: isTabFocused('Home') ? activeColor : inactiveColor },
              isTabFocused('Home') ? styles.navLabelActive : styles.navLabelInactive,
            ]}
          >
            {t('nav.home', 'Home')}
          </Text>
        </TouchableOpacity>

        {/* 2. Wishlist */}
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={isTabFocused('Wishlist') ? { selected: true } : {}}
          accessibilityLabel={t('nav.wishlistTab', 'Wishlist tab')}
          onPress={() => handleTabPress('Wishlist', isTabFocused('Wishlist'))}
          activeOpacity={0.8}
          style={[styles.navItem, isTabFocused('Wishlist') && styles.navItemActive]}
        >
          <NavWishlistIcon
            size={22}
            color={isTabFocused('Wishlist') ? activeColor : inactiveColor}
            strokeWidth={1.9}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navLabel,
              { color: isTabFocused('Wishlist') ? activeColor : inactiveColor },
              isTabFocused('Wishlist') ? styles.navLabelActive : styles.navLabelInactive,
            ]}
          >
            {t('nav.wishlist', 'Wishlist')}
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
                colors={['#E8782E', '#B24A14']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.centerCircleGradient}
              >
                <AiSparkleIcon size={26} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.centerLabel} numberOfLines={1}>
              {t('aiChat.aiChatTab', 'AI Chat')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Orders */}
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={isTabFocused('Orders') ? { selected: true } : {}}
          accessibilityLabel={t('nav.ordersTab', 'Orders tab')}
          onPress={() => handleTabPress('Orders', isTabFocused('Orders'))}
          activeOpacity={0.8}
          style={[styles.navItem, isTabFocused('Orders') && styles.navItemActive]}
        >
          <NavOrdersIcon
            size={22}
            color={isTabFocused('Orders') ? activeColor : inactiveColor}
            strokeWidth={1.9}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navLabel,
              { color: isTabFocused('Orders') ? activeColor : inactiveColor },
              isTabFocused('Orders') ? styles.navLabelActive : styles.navLabelInactive,
            ]}
          >
            {t('nav.orders', 'Orders')}
          </Text>
        </TouchableOpacity>

        {/* 5. Account (Profile) */}
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={isTabFocused('Profile') ? { selected: true } : {}}
          accessibilityLabel={t('nav.accountTab', 'Account tab')}
          onPress={() => handleTabPress('Profile', isTabFocused('Profile'))}
          activeOpacity={0.8}
          style={[styles.navItem, isTabFocused('Profile') && styles.navItemActive]}
        >
          <NavAccountIcon
            size={22}
            color={isTabFocused('Profile') ? activeColor : inactiveColor}
            strokeWidth={1.9}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navLabel,
              { color: isTabFocused('Profile') ? activeColor : inactiveColor },
              isTabFocused('Profile') ? styles.navLabelActive : styles.navLabelInactive,
            ]}
          >
            {t('nav.profile', 'Account')}
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
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#F0E1CF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(90, 40, 15, 1)',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.22,
        shadowRadius: 40,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  navItem: {
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
  navItemActive: {
    backgroundColor: '#FFE7CC',
  },
  navLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  navLabelInactive: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  navLabelActive: {
    fontFamily: 'PlusJakartaSans_700Bold',
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
    backgroundColor: '#F7F1E5',
    padding: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#B24A14',
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
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#B24A14',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default CustomerTabBar;
