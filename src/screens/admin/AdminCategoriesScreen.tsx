import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { useNavigation } from '@react-navigation/native';

export const AdminCategoriesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState<{ id: string, willBeActive: boolean } | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editCatId, setEditCatId] = useState('');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState('');
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { default: api } = await import('../../services/api');
      const res = await api.get('/admin/categories');
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch categories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setSaving(true);
      const { default: api } = await import('../../services/api');
      const res = await api.post('/admin/categories', {
        name: newCatName.trim(),
        description: newCatDesc.trim() || 'No description'
      });
      if (res.data && res.data.data) {
        setCategories([...categories, res.data.data]);
        setIsModalVisible(false);
        setNewCatName('');
        setNewCatDesc('');
      }
    } catch (e) {
      console.log('Error adding category:', e);
      Alert.alert('Failed to add category. It may already exist.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (item: any) => {
    setEditCatId(item.categoryId);
    setNewCatName(item.name);
    setNewCatDesc(item.description || '');
    setIsEditModalVisible(true);
  };

  const handleEditCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      setSaving(true);
      const { default: api } = await import('../../services/api');
      // Replace with actual edit endpoint if it differs
      const res = await api.put(`/admin/categories/${editCatId}`, {
        name: newCatName.trim(),
        description: newCatDesc.trim()
      });
      if (res.data) {
        setCategories(prev => prev.map(c => c.categoryId === editCatId ? { ...c, name: newCatName.trim(), description: newCatDesc.trim() } : c));
        setIsEditModalVisible(false);
        setNewCatName('');
        setNewCatDesc('');
      }
    } catch (e) {
      console.log('Error editing category:', e);
      Alert.alert('Failed to edit category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (item: any) => {
    setDeleteCatId(item.categoryId);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const { default: api } = await import('../../services/api');
      await api.delete(`/admin/categories/${deleteCatId}`);
      setCategories(prev => prev.filter(c => c.categoryId !== deleteCatId));
      setIsDeleteModalVisible(false);
    } catch (e) {
      console.log('Error deleting category:', e);
      Alert.alert('Failed to delete category.');
    }
  };

  const handleToggleCategory = (categoryId: string, isActive: boolean) => {
    setCategoryToToggle({ id: categoryId, willBeActive: !isActive });
    setConfirmModalVisible(true);
  };

  const confirmToggle = () => {
    if (categoryToToggle) {
      toggleCategoryStatus(categoryToToggle.id, !categoryToToggle.willBeActive);
    }
    setConfirmModalVisible(false);
    setCategoryToToggle(null);
  };

  const toggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
    try {
      const { default: api } = await import('../../services/api');
      const action = isActive ? 'deactivate' : 'activate';
      await api.put(`/admin/categories/${categoryId}/${action}`);
      setCategories(prev => prev.map(c => c.categoryId === categoryId ? { ...c, isActive: !isActive } : c));
    } catch (e) {
      console.log('Failed to toggle category status', e);
      Alert.alert('Failed to update category status.');
    }
  };

  const filteredCategories = categories.filter(c =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconForCategory = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('veg')) return 'leaf-outline';
    if (n.includes('fruit')) return 'nutrition-outline';
    if (n.includes('grain')) return 'flower-outline';
    if (n.includes('dairy') || n.includes('milk')) return 'water-outline';
    return 'grid-outline';
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('AdminCategoryProducts', { category: item.name })}
    >
      <View style={[styles.cardLeft, { opacity: item.isActive ? 1 : 0.4 }]}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIconForCategory(item.name) as any} size={28} color="#F5C16C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={{ opacity: item.isActive ? 1 : 0.4 }}>
          <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} />
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
          <TouchableOpacity 
            style={{ padding: 6, backgroundColor: '#E5E7EB', borderRadius: 6, alignItems: 'center' }}
            onPress={() => handleEditClick(item)}
          >
            <Ionicons name="pencil" size={14} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ padding: 6, backgroundColor: '#FEE2E2', borderRadius: 6, alignItems: 'center' }}
            onPress={() => handleDeleteClick(item)}
          >
            <Ionicons name="trash" size={14} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ padding: 6, backgroundColor: item.isActive ? '#FEE2E2' : '#D1FAE5', borderRadius: 6, alignItems: 'center' }}
            onPress={() => handleToggleCategory(item.categoryId, item.isActive)}
          >
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: item.isActive ? '#EF4444' : '#10B981' }}>
              {item.isActive ? 'Inactive' : 'Active'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AdminHeader showBackButton />
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
        keyExtractor={item => item.categoryId || item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Ionicons name="add" size={24} color="#17212F" />
        <Text style={styles.fabText}>Add Category</Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Add New Category</Text>
              <TextInput 
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
                placeholder="Category Name (e.g. Spices)"
                value={newCatName}
                onChangeText={setNewCatName}
              />
              <TextInput 
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20 }}
                placeholder="Description (optional)"
                value={newCatDesc}
                onChangeText={setNewCatDesc}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{ padding: 12, marginRight: 12 }}>
                  <Text style={{ color: '#666', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddCategory} disabled={saving} style={{ backgroundColor: '#17212F', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? 'Adding...' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Edit Category</Text>
              <TextInput 
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
                placeholder="Category Name"
                value={newCatName}
                onChangeText={setNewCatName}
              />
              <TextInput 
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20 }}
                placeholder="Description"
                value={newCatDesc}
                onChangeText={setNewCatDesc}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={{ padding: 12, marginRight: 12 }}>
                  <Text style={{ color: '#666', fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEditCategory} disabled={saving} style={{ backgroundColor: '#17212F', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={isDeleteModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 20, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
               <Ionicons name="trash" size={32} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1B2430', marginBottom: 12, textAlign: 'center' }}>Delete Category?</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', marginBottom: 30, textAlign: 'center', lineHeight: 22 }}>
              Are you sure you want to delete this category? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => setIsDeleteModalVisible(false)} 
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' }}>
                <Text style={{ color: '#4B5563', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmDelete} 
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: categoryToToggle?.willBeActive ? '#E6F4EA' : '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
               <Ionicons name={categoryToToggle?.willBeActive ? "checkmark-circle" : "warning"} size={40} color={categoryToToggle?.willBeActive ? "#1E8E3E" : "#EF4444"} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1B2430', marginBottom: 12, textAlign: 'center' }}>Are you sure?</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', marginBottom: 30, textAlign: 'center', lineHeight: 22 }}>
              Are you sure you want to <Text style={{ fontWeight: 'bold', color: categoryToToggle?.willBeActive ? '#1E8E3E' : '#EF4444' }}>{categoryToToggle?.willBeActive ? 'activate' : 'deactivate'}</Text> this category?
            </Text>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => { setConfirmModalVisible(false); setCategoryToToggle(null); }} 
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' }}>
                <Text style={{ color: '#4B5563', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmToggle} 
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: categoryToToggle?.willBeActive ? '#1E8E3E' : '#EF4444', alignItems: 'center', shadowColor: categoryToToggle?.willBeActive ? '#1E8E3E' : '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Yes, {categoryToToggle?.willBeActive ? 'Activate' : 'Deactivate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F1E6' },
  headerArea: { padding: 16, paddingBottom: 16 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B2430', marginBottom: 16 },
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
  },cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#17212F', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  categoryName: { fontSize: 14, fontWeight: 'bold', color: '#1B2430', marginBottom: 4 },
  description: { fontSize: 10, color: '#6B7280' },
  cardRight: { alignItems: 'flex-end' },
  fab: {position: 'absolute', bottom: 80, right: 16, left: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F5C16C', borderRadius: 12, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  fabText: { fontSize: 14, fontWeight: 'bold', color: '#17212F', marginLeft: 8 },
});
export default AdminCategoriesScreen;
