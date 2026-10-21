import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Image,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { FARMER_THEME } from '../constants/farmerTheme';
import { BASE_URL } from '../services/api';
import { getFarmerById } from '../services/farmerService';
import { LogoutModal } from '../components/ui';

const { width } = Dimensions.get('window');

const FarmerMenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUserData } = useAuth();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
  const [farmerDisplayName, setFarmerDisplayName] = useState<string>(
    user?.name || user?.email?.split('@')[0] || 'Farmer'
  );

  useFocusEffect(
    useCallback(() => {
      if (user?.profilePhoto) {
        setProfilePhoto(user.profilePhoto);
      }
      if (user?.name) {
        setFarmerDisplayName(user.name);
      }

      const loadLatestProfile = async () => {
        try {
          if (user?.farmerId) {
            const data = await getFarmerById(user.farmerId);
            const profile = data?.response || data;
            if (profile) {
              if (profile.profilePhoto) {
                setProfilePhoto(profile.profilePhoto);
              }
              if (profile.name) {
                setFarmerDisplayName(profile.name);
              }
              if (
                profile.profilePhoto !== user?.profilePhoto ||
                profile.name !== user?.name
              ) {
                updateUserData({
                  profilePhoto: profile.profilePhoto,
                  name: profile.name,
                });
              }
            }
          }
        } catch (e) {
          console.log('Error refreshing menu profile photo:', e);
        }
      };

      loadLatestProfile();
    }, [user?.farmerId, user?.profilePhoto, user?.name])
  );

  const menuItems = [
    { title: 'Dashboard', icon: 'grid-outline', route: 'Dashboard' },
    { title: 'Add Product', icon: 'add-circle-outline', route: 'AddProduct' },
    { title: 'Category', icon: 'list-circle-outline', route: 'FarmerCategories' },
    { title: 'My Farm', icon: 'leaf-outline', route: 'MyFarm' },
    { title: 'Market', icon: 'storefront-outline', route: 'Market' },
    { title: 'My Orders', icon: 'receipt-outline', route: 'Orders' },
    { 
      title: 'Messages', 
      icon: 'chatbubbles-outline', 
      subItems: [
        { title: 'Message Admin', icon: 'shield-checkmark-outline', route: 'FarmerSupportChatScreen' },
        { title: 'Message Customer', icon: 'people-outline', route: 'FarmerMessageCustomer' }
      ] 
    },
    { title: 'My Profile', icon: 'person-outline', route: 'Profile' },
  ];

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const initial = (farmerDisplayName || 'F').charAt(0).toUpperCase();
  const photoUrl = profilePhoto
    ? (profilePhoto.startsWith('http')
        ? profilePhoto
        : `${BASE_URL}/user/image/${profilePhoto}`)
    : (user?.profilePhoto
        ? (user.profilePhoto.startsWith('http')
            ? user.profilePhoto
            : `${BASE_URL}/user/image/${user.profilePhoto}`)
        : null);

  const paddingTop = Platform.OS === 'android' ? Math.max(insets.top, 38) + 6 : insets.top || 20;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.menuContainer}>
        {/* Header area with emerald gradient and user info (matching CustomerMenu) */}
        <LinearGradient
          colors={FARMER_THEME.colors.headerGradient}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={[styles.header, { paddingTop }]}
        >
          <Svg
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            viewBox="0 0 300 160"
            preserveAspectRatio="none"
          >
            <Circle
              cx="260"
              cy="20"
              r="90"
              fill={FARMER_THEME.colors.headerCircle1}
              opacity={0.2}
            />
            <Circle
              cx="10"
              cy="140"
              r="50"
              fill={FARMER_THEME.colors.headerCircle2}
              opacity={0.16}
            />
          </Svg>

          <View style={styles.headerTop}>
            <View style={styles.userInfoRow}>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}
              <View style={styles.userTextContainer}>
                <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                  {farmerDisplayName}
                </Text>
                <Text style={styles.userRole} numberOfLines={1} ellipsizeMode="tail">
                  {user?.email || 'Farm2Home Producer'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
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
          {menuItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.subItems) {
                    setExpandedItem(expandedItem === item.title ? null : item.title);
                  } else if (item.route) {
                    if (item.route === 'FarmerSupportChatScreen' || item.route === 'FarmerMessageCustomer' || item.route === 'AddProduct' || item.route === 'FarmerCategories') {
                      navigation.navigate(item.route);
                    } else {
                      navigation.navigate('FarmerMain', { screen: item.route });
                    }
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={20} color="#17663F" />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                <Ionicons
                  name={item.subItems ? (expandedItem === item.title ? "chevron-down" : "chevron-forward") : "chevron-forward"}
                  size={18}
                  color="#7D8D81"
                />
              </TouchableOpacity>

              {item.subItems && expandedItem === item.title && (
                <View style={styles.subItemsContainer}>
                  {item.subItems.map((sub, subIdx) => (
                    <TouchableOpacity
                      key={subIdx}
                      style={[styles.subItem, subIdx !== item.subItems!.length - 1 && styles.subItemBorder]}
                      onPress={() => navigation.navigate(sub.route)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name={sub.icon as any} size={18} color="#17663F" style={{ marginLeft: 6, marginRight: 10 }} />
                        <Text style={styles.subItemText}>{sub.title}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color="#7D8D81" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
          
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FDE6E2' }]}>
                <Ionicons name="log-out-outline" size={20} color="#C0392B" />
              </View>
              <Text style={styles.logoutText}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <TouchableOpacity style={styles.overlayClickable} onPress={() => navigation.goBack()} activeOpacity={1} />

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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  menuContainer: {
    width: '82%',
    backgroundColor: '#F3F8F0',
    height: '100%',
  },
  overlayClickable: {
    width: '18%',
    height: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
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
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
  },
  userTextContainer: {
    marginLeft: 10,
    flex: 1,
    flexShrink: 1,
  },
  userName: {
    fontSize: 17,
    fontFamily: FARMER_THEME.fonts.serif,
    color: '#FFFFFF',
  },
  userRole: {
    fontSize: 12,
    fontFamily: FARMER_THEME.fonts.medium,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scroll: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5EFE3',
    ...FARMER_THEME.shadows.tile,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#DDF3E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
  },
  subItemsContainer: {
    backgroundColor: '#F5FBF7',
    borderRadius: 16,
    marginBottom: 12,
    marginTop: -4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#D3E5D8',
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  subItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5EFE3',
  },
  subItemText: {
    fontSize: 13,
    fontFamily: FARMER_THEME.fonts.medium,
    color: '#1B2A22',
  },
  logoutItem: {
    marginTop: 20,
    backgroundColor: '#FFFDFD',
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#C0392B',
  },
});

export default FarmerMenuScreen;
