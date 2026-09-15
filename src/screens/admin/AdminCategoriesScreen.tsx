import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation } from '@react-navigation/native';
const mockCategories = [
  { id: '1', name: 'Vegetables', description: 'Fresh vegetables', status: 'Active', icon: 'leaf-outline' },
  { id: '2', name: 'Fruits', description: 'Fresh farm fruits', status: 'Active', icon: 'nutrition-outline' },
  { id: '3', name: 'Grains', description: 'Healthy grains', status: 'Active', icon: 'flower-outline' },
  { id: '4', name: 'Dairy', description: 'Milk & dairy products', status: 'Active', icon: 'water-outline' },
  { id: '5', name: 'Root Vegetables', description: 'Potatoes, carrots, etc.', status: 'Active', icon: 'server-outline' },
  { id: '6', name: 'Wild Forest Vegetables', description: 'Rare forest produce', status: 'Active', icon: 'rose-outline' },
];export const AdminCategoriesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<any>();
  const filteredCategories = mockCategories.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('AdminCategoryProducts', { category: item.name })}
    ><View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon as any} size={28} color="#F5C16C" />
        </View>
        <View>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <StatusBadge status={item.status} />
      </View>
    </TouchableOpacity>
  );return (
    <View style={styles.container}>
      <AdminHeader />
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Categories</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <FlatList
        data={filteredCategories}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#17212F" />
        <Text style={styles.fabText}>Add Category</Text>
      </TouchableOpacity>
    </View>
  );
};const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E6' },
  headerArea: { padding: 16, paddingBottom: 16 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#1B2430', marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1B2430' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  categoryCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },cardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#17212F', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  categoryName: { fontSize: 16, fontWeight: 'bold', color: '#1B2430', marginBottom: 4 },
  description: { fontSize: 12, color: '#6B7280' },
  cardRight: { alignItems: 'flex-end' },
  fab: {position: 'absolute', bottom: 80, right: 16, left: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F5C16C', borderRadius: 12, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  fabText: { fontSize: 14, fontWeight: 'bold', color: '#17212F', marginLeft: 8 },
});
export default AdminCategoriesScreen;
