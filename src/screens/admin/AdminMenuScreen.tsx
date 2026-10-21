import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import { AdminOutlineButton } from '../../components/admin/AdminButtons';
import { LogoutModal } from '../../components/ui';

export const AdminMenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [messagesExpanded, setMessagesExpanded] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const menuItems = [
    { title: 'Dashboard', icon: 'home-outline', route: 'Home' },
    {
      title: 'Farmers & Customers',
      icon: 'people-outline',
      route: 'AdminFarmers',
      params: { title: 'Farmers & Customers' },
    },
    { title: 'Products', icon: 'cube-outline', route: 'AdminProducts' },
    { title: 'Categories', icon: 'grid-outline', route: 'AdminCategories' },
    { title: 'Orders', icon: 'receipt-outline', route: 'AdminOrders' },
    { title: 'Messages', icon: 'chatbubbles-outline', isDropdown: true },
    { title: 'Farm Verification', icon: 'shield-checkmark-outline', route: 'AdminFarmVerification' },
  ];

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const adminName = user?.name || user?.email || 'Administrator';
  const adminInitial = (adminName.charAt(0) || 'A').toUpperCase();

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.overlayBackground}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />
      <SafeAreaView style={styles.drawerContainer}>
        {/* Navy Gradient Header */}
        <LinearGradient
          colors={['#233577', '#0A1122']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerProfileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{adminInitial}</Text>
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.headerAdminName} numberOfLines={1}>
                {adminName}
              </Text>
              <Text style={styles.headerAdminRole}>ADMIN PORTAL</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Menu Body */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {menuItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.isDropdown) {
                    setMessagesExpanded(!messagesExpanded);
                  } else if (item.route === 'Home') {
                    navigation.navigate('AdminMain', { screen: 'Home' });
                  } else {
                    navigation.navigate(item.route, (item as any).params);
                  }
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={18} color="#4F5BD5" />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                <Ionicons
                  name={
                    item.isDropdown
                      ? messagesExpanded
                        ? 'chevron-up'
                        : 'chevron-down'
                      : 'chevron-forward'
                  }
                  size={18}
                  color="#8A93AB"
                />
              </TouchableOpacity>

              {item.isDropdown && messagesExpanded && (
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('AdminMessage', { preSelectedRole: 'FARMER' })
                    }
                  >
                    <Ionicons
                      name="leaf-outline"
                      size={16}
                      color="#4F5BD5"
                      style={styles.dropdownIcon}
                    />
                    <Text style={styles.dropdownText}>Farmer Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('AdminMessage', { preSelectedRole: 'CUSTOMER' })
                    }
                  >
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color="#4F5BD5"
                      style={styles.dropdownIcon}
                    />
                    <Text style={styles.dropdownText}>Customer Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {/* Logout Button */}
          <View style={styles.logoutWrapper}>
            <AdminOutlineButton
              title="Log Out"
              icon={<Ionicons name="log-out-outline" size={18} color="#D64545" />}
              onPress={handleLogout}
              style={styles.logoutBtn}
              textStyle={styles.logoutBtnText}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

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
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 19, 38, 0.55)',
  },
  drawerContainer: {
    width: '82%',
    height: '100%',
    backgroundColor: ADMIN_THEME.colors.pearl,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...ADMIN_THEME.shadows.stickyBar,
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7C06A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontFamily: AdminFonts.bold,
    fontSize: 18,
    color: '#0B1326',
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerAdminName: {
    fontFamily: AdminFonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerAdminRole: {
    fontFamily: AdminFonts.bold,
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: '#E7C06A',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scroll: {
    padding: 16,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3E7F2',
    ...ADMIN_THEME.shadows.card,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 14,
    color: ADMIN_THEME.colors.ink,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E3E7F2',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F7',
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    fontFamily: AdminFonts.medium,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
  },
  logoutWrapper: {
    marginTop: 14,
    marginBottom: 20,
  },
  logoutBtn: {
    borderColor: '#FAC4C4',
    backgroundColor: '#FDE7E7',
  },
  logoutBtnText: {
    color: '#D64545',
    fontFamily: AdminFonts.bold,
  },
});

export default AdminMenuScreen;
