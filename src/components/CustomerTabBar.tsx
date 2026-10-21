import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  NavHomeIcon,
  NavCategoriesIcon,
  NavWishlistIcon,
  NavOrdersIcon,
  NavAccountIcon,
} from './CustomerIcons';

export const CustomerTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;

  const tabs = [
    { name: 'Home', label: 'Home', Icon: NavHomeIcon },
    { name: 'Categories', label: 'Categories', Icon: NavCategoriesIcon },
    { name: 'Wishlist', label: 'Wishlist', Icon: NavWishlistIcon },
    { name: 'Orders', label: 'Orders', Icon: NavOrdersIcon },
    { name: 'Profile', label: 'Account', Icon: NavAccountIcon },
  ];

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
        {tabs.map((tab, index) => {
          const isFocused = state.routes[state.index]?.name === tab.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes.find(r => r.name === tab.name)?.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: state.routes.find(r => r.name === tab.name)?.key,
            });
          };

          const activeColor = '#3B1A0E';
          const inactiveColor = '#8A6F5C';
          const itemColor = isFocused ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.8}
              style={[
                styles.navItem,
                isFocused && styles.navItemActive,
              ]}
            >
              <tab.Icon
                size={22}
                color={itemColor}
                strokeWidth={1.9}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.navLabel,
                  { color: itemColor },
                  isFocused ? styles.navLabelActive : styles.navLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  navBar: {
    height: 72,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#F0E1CF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
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
  },
  navLabelInactive: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  navLabelActive: {
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});

export default CustomerTabBar;
