import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/api';
import { THEME } from '../constants/theme';
import { LogoutModal } from '../components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomerMenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);

  const state = navigation.getState();
  let activeRoute = route?.params?.activeScreen;
  if (!activeRoute && state?.routes) {
    const menuIdx = state.routes.findIndex((r: any) => r.name === 'CustomerMenu');
    if (menuIdx > 0) {
      const prevRoute = state.routes[menuIdx - 1];
      if (prevRoute.name === 'CustomerMain') {
        const mainState = prevRoute.state;
        if (mainState && mainState.routes && typeof mainState.index === 'number') {
          activeRoute = mainState.routes[mainState.index]?.name;
        } else {
          activeRoute = 'Home';
        }
      } else {
        activeRoute = prevRoute.name;
      }
    }
  }

  const menuItems = [
    { title: 'Home', icon: 'home-outline', route: 'Home' },
    { title: 'Categories', icon: 'grid-outline', route: 'Categories' },
    { title: 'Wishlist', icon: 'heart-outline', route: 'Wishlist' },
    { title: 'My Orders', icon: 'receipt-outline', route: 'Orders' },
    { title: 'Message Farmer', icon: 'chatbox-ellipses-outline', route: 'CustomerMessageFarmer' },
    { title: 'My Profile', icon: 'person-outline', route: 'Profile' },
  ];

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const photoUrl = user?.profilePhoto
    ? `${BASE_URL}/user/image/${user.profilePhoto}`
    : null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.menuContainer}>
        <SafeAreaView style={styles.container}>
          {/* Header area with maroon gradient and user info */}
          <LinearGradient
            colors={THEME.colors.headerGradient}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.header}
          >
            <Svg
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
              viewBox="0 0 300 160"
              preserveAspectRatio="none"
            >
              <Circle cx="260" cy="20" r="90" fill={THEME.colors.headerCircle1} opacity={0.2} />
              <Circle cx="10" cy="140" r="50" fill={THEME.colors.headerCircle2} opacity={0.16} />
            </Svg>

            <View style={styles.headerTop}>
              <View style={styles.userInfoRow}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userTextContainer}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || 'Guest User'}
                  </Text>
                  <Text style={styles.userRole} numberOfLines={1}>
                    {user?.email || 'Farm2Home Customer'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: Math.max(insets.bottom, 16) + 48 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item, index) => {
              const isActive = activeRoute === item.route;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  activeOpacity={0.75}
                  onPress={() => {
                    if (item.route === 'CustomerMessageFarmer') {
                      navigation.navigate(item.route);
                    } else if (item.route === 'Home') {
                      navigation.navigate('CustomerMain', { screen: 'Home' });
                    } else {
                      navigation.navigate('CustomerMain', { screen: item.route });
                    }
                  }}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                      <Ionicons
                        name={item.icon as any}
                        size={19}
                        color={isActive ? '#8A2E12' : '#B8470F'}
                      />
                    </View>
                    <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                      {item.title}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isActive ? '#8A2E12' : '#CDBBB0'}
                  />
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.75}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                  <Ionicons name="log-out-outline" size={19} color={THEME.colors.error} />
                </View>
                <Text style={styles.logoutText}>Log Out</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FCA5A5" />
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
      <TouchableOpacity
        style={styles.overlayClickable}
        onPress={() => navigation.goBack()}
        activeOpacity={1}
      />

      <LogoutModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await logout();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 23, 16, 0.45)',
  },
  menuContainer: {
    width: '82%',
    backgroundColor: '#FFFDF8',
    height: '100%',
  },
  overlayClickable: {
    width: '18%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 22,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: THEME.fonts.serif,
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 12,
    fontFamily: THEME.fonts.medium,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 16,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#F0E1CF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  menuItemActive: {
    backgroundColor: '#FFE7CC',
    borderColor: '#E8A56B',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: '#F3D2B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerActive: {
    backgroundColor: '#FED7AA',
    borderColor: '#E8A56B',
  },
  menuText: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.semiBold,
    color: '#2A1710',
  },
  menuTextActive: {
    color: '#8A2E12',
    fontFamily: THEME.fonts.bold,
  },
  logoutItem: {
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: '#FFF8F8',
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.error,
  },
});

export default CustomerMenuScreen;
