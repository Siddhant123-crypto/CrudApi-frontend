import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const FarmerMenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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
        { title: 'Message Admin', icon: 'shield-checkmark-outline', route: 'FarmerContactAdmin' },
        { title: 'Message Customer', icon: 'people-outline', route: 'FarmerMessageCustomer' }
      ] 
    },
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
              <View key={index}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    if (item.subItems) {
                      setExpandedItem(expandedItem === item.title ? null : item.title);
                    } else if (item.route) {
                      if (item.route === 'FarmerContactAdmin' || item.route === 'FarmerMessageCustomer' || item.route === 'AddProduct' || item.route === 'FarmerCategories') {
                        navigation.navigate(item.route);
                      } else {
                        navigation.navigate('FarmerMain', { screen: item.route });
                      }
                    }
                  }}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name={item.icon as any} size={20} color="#F5C16C" />
                    </View>
                    <Text style={styles.menuText}>{item.title}</Text>
                  </View>
                  <Ionicons name={item.subItems ? (expandedItem === item.title ? "chevron-down" : "chevron-forward") : "chevron-forward"} size={20} color="#E5E7EB" />
                </TouchableOpacity>

                {item.subItems && expandedItem === item.title && (
                  <View style={styles.subItemsContainer}>
                    {item.subItems.map((sub, subIdx) => (
                      <TouchableOpacity
                        key={subIdx}
                        style={[styles.subItem, subIdx !== item.subItems!.length - 1 && styles.subItemBorder]}
                        onPress={() => navigation.navigate(sub.route)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name={sub.icon as any} size={20} color="#6B7280" style={{ marginLeft: 8, marginRight: 12 }} />
                          <Text style={styles.subItemText}>{sub.title}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
    backgroundColor: '#F8F1E6',
    height: '100%',
  },
  overlayClickable: {
    width: '20%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F1E6',
  },
  header: {
    backgroundColor: '#1B5E20',
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
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B2430',
  },
  subItemsContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    marginBottom: 12,
    marginTop: -8, 
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
    borderBottomColor: '#E5E7EB',
  },
  subItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
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

export default FarmerMenuScreen;
