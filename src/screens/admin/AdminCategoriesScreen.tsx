import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminBadge,
  AdminEmptyState,
  AdminListSkeleton,
  AdminPrimaryButton,
  AdminDangerButton,
  AdminOutlineButton,
  AdminInput,
  CameraIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  GridIcon,
} from '../../components/admin';

export const AdminCategoriesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [categoryToToggle, setCategoryToToggle] = useState<{ id: string; willBeActive: boolean } | null>(null);
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
        description: newCatDesc.trim() || 'No description',
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
      const res = await api.put(`/admin/categories/${editCatId}`, {
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      if (res.data) {
        setCategories(prev =>
          prev.map(c =>
            c.categoryId === editCatId
              ? { ...c, name: newCatName.trim(), description: newCatDesc.trim() }
              : c
          )
        );
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
      setCategories(prev =>
        prev.map(c => (c.categoryId === categoryId ? { ...c, isActive: !isActive } : c))
      );
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
      activeOpacity={0.7}
      style={styles.categoryCard}
      onPress={() => navigation.navigate('AdminCategoryProducts', { category: item.name })}
    >
      {/* 48x48 pastel icon tile */}
      <View style={[styles.cardLeft, { opacity: item.isActive ? 1 : 0.65 }]}>
        <View style={styles.iconTile}>
          <Ionicons
            name={getIconForCategory(item.name) as any}
            size={24}
            color={ADMIN_THEME.colors.indigo}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {item.description || 'No description'}
          </Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        {/* Vibrant Gradient Status Pill */}
        <View
          style={[
            styles.statusPillWrapper,
            item.isActive ? styles.statusActiveShadow : styles.statusInactiveShadow,
          ]}
        >
          <LinearGradient
            colors={item.isActive ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusPillGradient}
          >
            <View style={styles.statusDotWhite} />
            <Text style={styles.statusTextWhite}>
              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.actionsRow}>
          {/* Edit */}
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.editActionBtn}
            onPress={() => handleEditClick(item)}
          >
            <EditIcon size={14} color="#4338CA" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.deleteActionBtn}
            onPress={() => handleDeleteClick(item)}
          >
            <TrashIcon size={14} color="#DC2626" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Status Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.toggleWrapper}
            onPress={() => handleToggleCategory(item.categoryId, item.isActive)}
          >
            <LinearGradient
              colors={item.isActive ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.toggleGradient}
            >
              <Ionicons
                name={item.isActive ? 'pause-circle' : 'checkmark-circle'}
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.toggleTextWhite}>
                {item.isActive ? 'Inactive' : 'Active'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminPageBackground>
      {/* 1) TAB ADMIN HEADER WITH NAVY "+" RIGHT ACTION */}
      <AdminHeader
        variant="tab"
        title="Categories"
        titleSize={28}
        showBackButton={true}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search categories..."
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerAddButton}
            onPress={() => {
              setNewCatName('');
              setNewCatDesc('');
              setIsModalVisible(true);
            }}
          >
            <PlusIcon size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        }
      />

      {/* 2) CATEGORIES LIST */}
      {loading ? (
        <AdminListSkeleton rows={6} />
      ) : filteredCategories.length > 0 ? (
        <FlatList
          data={filteredCategories}
          keyExtractor={item => item.categoryId || item.name}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <AdminEmptyState
          icon={<GridIcon size={36} color={ADMIN_THEME.colors.indigo} />}
          title="No categories found"
          subtitle="Try adjusting your search query or add a new category."
        />
      )}

      {/* 3) ADD CATEGORY MODAL */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Add New Category</Text>

              <AdminInput
                label="Category Name"
                placeholder="e.g. Spices, Fresh Fruits"
                value={newCatName}
                onChangeText={setNewCatName}
              />

              <AdminInput
                label="Description"
                placeholder="Category description (optional)"
                value={newCatDesc}
                onChangeText={setNewCatDesc}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.modalButtonsRow}>
                {/* Cancel Button - Red Highlighted */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.cancelBtn}
                  onPress={() => setIsModalVisible(false)}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Ionicons name="close-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnTextWhite}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Add Button - Navy Highlighted */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.confirmBtn}
                  onPress={handleAddCategory}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={['#1F2F6B', '#0B1326']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.btnTextWhite}>Add</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 4) EDIT CATEGORY MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Category</Text>

              <AdminInput
                label="Category Name"
                placeholder="Category Name"
                value={newCatName}
                onChangeText={setNewCatName}
              />

              <AdminInput
                label="Description"
                placeholder="Description"
                value={newCatDesc}
                onChangeText={setNewCatDesc}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.modalButtonsRow}>
                {/* Cancel Button - Red Highlighted */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.cancelBtn}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Ionicons name="close-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.btnTextWhite}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Save Button - Navy Highlighted */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.confirmBtn}
                  onPress={handleEditCategory}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={['#1F2F6B', '#0B1326']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.btnTextWhite}>Save</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 5) DELETE CONFIRMATION MODAL */}
      <Modal visible={isDeleteModalVisible} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogIconDanger}>
              <TrashIcon size={28} color={ADMIN_THEME.colors.danger} />
            </View>
            <Text style={styles.dialogTitle}>Delete Category?</Text>
            <Text style={styles.dialogSubtitle}>
              Are you sure you want to delete this category? This action cannot be undone.
            </Text>
            <View style={styles.modalButtonsRow}>
              {/* Cancel Button - Green Highlighted */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.greenDialogBtn}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Ionicons name="close-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnTextWhite}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Delete Button - Crimson Red Highlighted */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.cancelBtn}
                onPress={confirmDelete}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Ionicons name="trash-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnTextWhite}>Delete</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6) STATUS TOGGLE CONFIRMATION MODAL */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <View
              style={[
                styles.dialogIconCircle,
                {
                  backgroundColor: categoryToToggle?.willBeActive
                    ? '#E6F4EA'
                    : '#FEE2E2',
                },
              ]}
            >
              <Ionicons
                name={categoryToToggle?.willBeActive ? 'checkmark-circle' : 'warning'}
                size={34}
                color={
                  categoryToToggle?.willBeActive
                    ? ADMIN_THEME.colors.success
                    : ADMIN_THEME.colors.danger
                }
              />
            </View>
            <Text style={styles.dialogTitle}>Are you sure?</Text>
            <Text style={styles.dialogSubtitle}>
              Are you sure you want to{' '}
              <Text
                style={{
                  fontFamily: AdminFonts.bold,
                  color: categoryToToggle?.willBeActive
                    ? ADMIN_THEME.colors.success
                    : ADMIN_THEME.colors.danger,
                }}
              >
                {categoryToToggle?.willBeActive ? 'activate' : 'deactivate'}
              </Text>{' '}
              this category?
            </Text>
            <View style={styles.modalButtonsRow}>
              <AdminOutlineButton
                title="Cancel"
                onPress={() => {
                  setConfirmModalVisible(false);
                  setCategoryToToggle(null);
                }}
                style={styles.modalButtonHalf}
              />
              <AdminPrimaryButton
                title={`Yes, ${categoryToToggle?.willBeActive ? 'Activate' : 'Deactivate'}`}
                onPress={confirmToggle}
                style={styles.modalButtonHalf}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AdminPageBackground>
  );
};

const styles = StyleSheet.create({
  headerAddButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 130, // Clearance for tab bar
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ADMIN_THEME.colors.cardBg,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
    shadowColor: ADMIN_THEME.shadows.card.shadowColor,
    shadowOffset: ADMIN_THEME.shadows.card.shadowOffset,
    shadowOpacity: ADMIN_THEME.shadows.card.shadowOpacity,
    shadowRadius: ADMIN_THEME.shadows.card.shadowRadius,
    elevation: ADMIN_THEME.shadows.card.elevation,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF0FB',
    borderWidth: 1,
    borderColor: '#DFE3F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imageTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF0FB',
    borderWidth: 1,
    borderColor: '#DFE3F7',
    overflow: 'hidden',
    marginRight: 12,
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14.5,
    fontFamily: AdminFonts.bold,
    color: ADMIN_THEME.colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    fontFamily: AdminFonts.regular,
    color: '#5B6580',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  statusPillWrapper: {
    borderRadius: 999,
  },
  statusActiveShadow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3,
    elevation: 2,
  },
  statusInactiveShadow: {
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 1.5,
  },
  statusPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9.5,
    paddingVertical: 3.5,
    borderRadius: 999,
    gap: 5,
  },
  statusDotWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusTextWhite: {
    fontFamily: AdminFonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  editActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF0FB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#C7D2FE',
    shadowColor: '#4F5BD5',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 1.5,
  },
  deleteActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 1.5,
  },
  toggleWrapper: {
    borderRadius: 999,
  },
  toggleGradient: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.18,
    shadowRadius: 2.5,
    elevation: 2,
  },
  toggleTextWhite: {
    fontSize: 11,
    fontFamily: AdminFonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 38, 0.72)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: AdminFonts.bold,
    color: ADMIN_THEME.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1F2F6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  greenDialogBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  btnTextWhite: {
    fontFamily: AdminFonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalButtonHalf: {
    flex: 1,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 38, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogIconDanger: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 19,
    fontFamily: AdminFonts.bold,
    color: ADMIN_THEME.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontSize: 13.5,
    fontFamily: AdminFonts.regular,
    color: ADMIN_THEME.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AdminCategoriesScreen;
