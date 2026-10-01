import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
const AdminMenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const menuItems = [
    { title: 'Dashboard', icon: 'home-outline', route: 'Home' },
    { title: 'Farmers & Customers', icon: 'people-outline', route: 'AdminFarmers', params: { title: 'Farmers & Customers' } },
    { title: 'Products', icon: 'cube-outline', route: 'AdminProducts' },
    { title: 'Categories', icon: 'grid-outline', route: 'AdminCategories' },
    { title: 'Orders', icon: 'receipt-outline', route: 'AdminOrders' },
    { title: 'Messages', icon: 'chatbubbles-outline', isDropdown: true },
    { title: 'Farm Verification', icon: 'shield-checkmark-outline', route: 'AdminFarmVerification' },
  ];
  const [messagesExpanded, setMessagesExpanded] = React.useState(false);
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.overlayBackground} activeOpacity={1} onPress={() => navigation.goBack()} />
      <SafeAreaView style={styles.drawerContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Menu</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {menuItems.map((item, index) => (
            <View key={index}>
              <TouchableOpacity
                style={styles.menuItem}
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
                    <Ionicons name={item.icon as any} size={20} color="#F5C16C" />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                <Ionicons name={item.isDropdown ? (messagesExpanded ? "chevron-up" : "chevron-down") : "chevron-forward"} size={20} color="#E5E7EB" />
              </TouchableOpacity>
              
              {item.isDropdown && messagesExpanded && (
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => navigation.navigate('AdminMessage', { preSelectedRole: 'FARMER' })}
                  >
                    <Ionicons name="leaf-outline" size={18} color="#6B7280" style={styles.dropdownIcon} />
                    <Text style={styles.dropdownText}>Farmer Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => navigation.navigate('AdminMessage', { preSelectedRole: 'CUSTOMER' })}
                  >
                    <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.dropdownIcon} />
                    <Text style={styles.dropdownText}>Customer Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#F8F1E6',
  },
  header: {
    backgroundColor: '#17212F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scroll: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 11,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#17212F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B2430',
  },
  logoutItem: {
    marginTop: 10,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  dropdownContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
});
export default AdminMenuScreen;
