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
import { FARMER_THEME } from '../../constants/farmerTheme';
import {
  HomeTabIcon,
  LeafIcon,
  StoreIcon,
  ReceiptIcon,
  ProfileTabIcon,
} from './FarmerIcons';

export const FarmerTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;

  // The Farmer bottom nav is only shown on the Farmer Dashboard ('Home') screen
  const currentRouteName = state.routes[state.index]?.name;
  if (currentRouteName !== 'Home') {
    return null;
  }

  const tabs = [
    { name: 'Home', label: 'Home', Icon: HomeTabIcon },
    { name: 'MyFarm', label: 'My farm', Icon: LeafIcon },
    { name: 'Market', label: 'Market', Icon: StoreIcon },
    { name: 'Orders', label: 'Orders', Icon: ReceiptIcon },
    { name: 'Profile', label: 'Profile', Icon: ProfileTabIcon },
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
        {tabs.map((tab) => {
          const isFocused = currentRouteName === tab.name;
          const activeColor = FARMER_THEME.colors.darkGreen;
          const inactiveColor = FARMER_THEME.colors.textMuted;
          const iconColor = isFocused ? activeColor : inactiveColor;
          const TabIcon = tab.Icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes.find((r) => r.name === tab.name)?.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: state.routes.find((r) => r.name === tab.name)?.key,
            });
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.8}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemActive,
              ]}
            >
              <TabIcon size={22} color={iconColor} strokeWidth={1.9} />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: iconColor,
                    fontFamily: isFocused
                      ? FARMER_THEME.fonts.bold
                      : FARMER_THEME.fonts.semiBold,
                  },
                ]}
                numberOfLines={1}
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
    alignItems: 'center',
    zIndex: 9999,
  },
  navBar: {
    width: '100%',
    height: 72,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(14,59,41,1)',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.22,
        shadowRadius: 40,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 18,
  },
  tabItemActive: {
    backgroundColor: FARMER_THEME.colors.pastelGreen,
  },
  tabLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
});

export default FarmerTabBar;
