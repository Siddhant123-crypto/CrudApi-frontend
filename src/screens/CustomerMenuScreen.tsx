import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const CustomerMenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const menuItems = [
    { title: 'Home', icon: 'home-outline', route: 'Home' },
    { title: 'Categories', icon: 'grid-outline', route: 'Categories' },
    { title: 'Wishlist', icon: 'heart-outline', route: 'Wishlist' },
    { title: 'My Orders', icon: 'receipt-outline', route: 'Orders' },
    { title: 'Message Farmer', icon: 'chatbox-ellipses-outline', route: 'CustomerMessageFarmer' },
    { title: 'My Profile', icon: 'person-outline', route: 'Profile' },
  ];

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.menuContainer}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scroll}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
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
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#E5E7EB" />
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
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
      <TouchableOpacity style={styles.overlayClickable} onPress={() => navigation.goBack()} activeOpacity={1} />
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#F8FAFC',
    height: '100%',
  },
  overlayClickable: {
    width: '20%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E3A8A', // Matching customer primary color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 14,
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
    backgroundColor: '#1E3A8A',
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
    marginTop: 20,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default CustomerMenuScreen;
