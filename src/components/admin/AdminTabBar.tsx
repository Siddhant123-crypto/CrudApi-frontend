import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ADMIN_THEME } from '../../constants/adminTheme';
import { HomeIcon, UsersIcon, CubeIcon, StoreIcon } from './AdminIcons';

export const AdminTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index];
  const currentOptions = descriptors[currentRoute.key]?.options;

  // If the current screen specifically hid the tab bar, honor it
  if ((currentOptions?.tabBarStyle as any)?.display === 'none') {
    return null;
  }

  const renderTabIcon = (name: string, isFocused: boolean) => {
    const color = isFocused ? ADMIN_THEME.colors.gold : ADMIN_THEME.colors.muted;
    switch (name) {
      case 'Home':
        return <HomeIcon size={22} color={color} strokeWidth={1.9} />;
      case 'Users':
        return <UsersIcon size={22} color={color} strokeWidth={1.9} />;
      case 'Products':
        return <CubeIcon size={22} color={color} strokeWidth={1.9} />;
      case 'Markets':
        return <StoreIcon size={22} color={color} strokeWidth={1.9} />;
      default:
        return <HomeIcon size={22} color={color} strokeWidth={1.9} />;
    }
  };

  // Shifted upwards matching Customer & Farmer dashboard position
  const bottomInset = insets.bottom > 0 ? insets.bottom : 0;
  const bottomOffset = 22 + bottomInset;

  return (
    <View
      style={[
        styles.tabBarWrapper,
        { bottom: bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (isFocused) {
            return (
              <View key={route.key} style={styles.tabItemWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.touchable}
                >
                  <LinearGradient
                    colors={ADMIN_THEME.colors.darkTileGradient}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={styles.activeTabItem}
                  >
                    {renderTabIcon(route.name, true)}
                    <Text
                      style={styles.activeLabel}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View key={route.key} style={styles.tabItemWrapper}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.inactiveTabItem}
              >
                {renderTabIcon(route.name, false)}
                <Text
                  style={styles.inactiveLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {label}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: ADMIN_THEME.radius.tabBar,
    ...ADMIN_THEME.shadows.tabBar,
  },
  container: {
    height: 72,
    borderRadius: ADMIN_THEME.radius.tabBar,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 4,
    paddingHorizontal: 8,
  },
  tabItemWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: '100%',
    borderRadius: ADMIN_THEME.radius.tabBarItem,
    ...ADMIN_THEME.shadows.tabBarActiveItem,
  },
  activeTabItem: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: ADMIN_THEME.radius.tabBarItem,
  },
  inactiveTabItem: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: ADMIN_THEME.radius.tabBarItem,
  },
  activeLabel: {
    fontFamily: ADMIN_THEME.fonts.bold,
    fontSize: 10.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inactiveLabel: {
    fontFamily: ADMIN_THEME.fonts.semiBold,
    fontSize: 10.5,
    color: ADMIN_THEME.colors.muted,
    textAlign: 'center',
  },
});
