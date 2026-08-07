import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useAuth} from '../context/AuthContext';
import {saveProduct, uploadProductPhoto, updateProduct, getProductImageUrl} from '../services/productService';
import Ionicons from '@expo/vector-icons/Ionicons';

const CATEGORIES = [
  'Leafy Vegetables',
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Others',
];

const STATUS_OPTIONS = ['Active', 'Inactive'];

const UNITS = [
  'KG',
  'GRAM',
  'BUNDLE',
  'PIECE',
  'DOZEN',
  'LITER',
  'ML',
  'BOX',
];

const AddProductScreen = ({route, navigation}: any) => {
  const {user} = useAuth();
  const productToEdit = route.params?.product;

  const [productName, setProductName] = useState(productToEdit?.productName || '');
  const [category, setCategory] = useState(productToEdit?.category || CATEGORIES[0]);
  const [unit, setUnit] = useState(productToEdit?.unit || UNITS[0]);
  const [price, setPrice] = useState(productToEdit?.price?.toString() || '');
  const [quantity, setQuantity] = useState('120');
  const [quantityUnit, setQuantityUnit] = useState(UNITS[0]); // default unit for quantity
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [description, setDescription] = useState(productToEdit?.description || '');
  
  const [status, setStatus] = useState(productToEdit?.isActive !== false ? 'Active' : 'Inactive');
  const [city, setCity] = useState(productToEdit?.farmerAddress?.split(',')[0] || '');
  const [state, setState] = useState('Maharashtra');
  const [area, setArea] = useState('Near Panchavati, Nashik');
  
  const initialPhotoUrl = productToEdit?.productPhoto ? getProductImageUrl(productToEdit.productPhoto) : null;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(initialPhotoUrl);
  const [loading, setLoading] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handlePickImage = async () => {
    try {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required to pick photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const handleSaveProduct = async () => {
    if (!productName.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than 0');
      return;
    }

    setLoading(true);
    try {
      let productPhotoFilename = productToEdit?.productPhoto || '';
      
      if (selectedPhoto && !selectedPhoto.startsWith('http')) {
        productPhotoFilename = await uploadProductPhoto(selectedPhoto);
      } else if (!selectedPhoto) {
        productPhotoFilename = '';
      }

      const address = `${city}, ${state}`;

      const productPayload = {
        farmerId: user?.farmerId,
        productName: productName.trim(),
        category,
        price: parseFloat(price),
        unit,
        description: description.trim(),
        productPhoto: productPhotoFilename || null,
        isActive: status === 'Active',
        farmerAddress: productToEdit ? productToEdit.farmerAddress : address
      };

      if (productToEdit) {
        await updateProduct(productToEdit.productId, productPayload);
        Alert.alert('Success', 'Product updated successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()}
        ]);
      } else {
        await saveProduct(productPayload);
        Alert.alert('Success', 'Product added successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()}
        ]);
      }
    } catch (error: any) {
      console.log('Error saving product:', error);
      const serverMsg =
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response?.data : null) ||
        error.message ||
        'Failed to save product. Please try again.';
      Alert.alert('Error', serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderDropdownModal = (
    visible: boolean,
    onClose: () => void,
    data: string[],
    onSelect: (val: string) => void,
    title: string
  ) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header Section (Removed double back button) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{productToEdit ? 'Edit Product' : 'Add Product'}</Text>
        <Text style={styles.headerSubtitle}>{productToEdit ? 'Update your product details' : 'Enter the details of your produce'}</Text>
      </View>

      {/* Main Form Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.formContainer}>
        
        {/* Photo Section */}
        <View style={styles.photoSection}>
          {selectedPhoto ? (
            <Image source={{uri: selectedPhoto}} style={styles.photoPreview} />
          ) : (
            <View style={[styles.photoPreview, {backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center'}]}>
               <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
          <TouchableOpacity style={styles.changePhotoBtn} onPress={handlePickImage}>
            <Ionicons name="camera-outline" size={28} color="#6B7280" />
            <Text style={styles.changePhotoText}>{selectedPhoto ? 'Change Photo' : 'Add Photo'}</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <Text style={styles.label}>Product Name<Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={productName}
          onChangeText={setProductName}
          placeholder="e.g. Banana"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Category<Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.dropdownContainer} onPress={() => setShowCategoryModal(true)}>
          <View style={[styles.input, {marginBottom: 0, justifyContent: 'center'}]}>
            <Text style={{fontSize: 15, color: '#111827'}}>{category}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6B7280" style={styles.dropdownIcon} />
        </TouchableOpacity>

        <Text style={styles.label}>Unit<Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.dropdownContainer} onPress={() => setShowQuantityModal(true)}>
          <View style={[styles.input, {marginBottom: 0, justifyContent: 'center'}]}>
            <Text style={{fontSize: 15, color: '#111827'}}>{quantityUnit}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6B7280" style={styles.dropdownIcon} />
        </TouchableOpacity>

        <Text style={styles.label}>Price (per {quantityUnit})<Text style={styles.required}>*</Text></Text>
        <View style={styles.inputWithIcon}>
          <TextInput
            style={styles.inputInside}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="20.00"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.currencyIcon}>₹</Text>
        </View>

        <Text style={styles.label}>Quantity ({quantityUnit})<Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="120"
          placeholderTextColor="#9CA3AF"
        />

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.label}>Description<Text style={styles.required}>*</Text></Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Fresh and naturally ripened bananas. Rich in nutrients and great for health."
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        {/* Product Status */}
        <Text style={styles.sectionTitle}>Product Status</Text>
        <Text style={styles.label}>Status<Text style={styles.required}>*</Text></Text>
        <TouchableOpacity style={styles.dropdownContainer} onPress={() => setShowStatusModal(true)}>
          <View style={[styles.input, {marginBottom: 0, backgroundColor: status === 'Active' ? '#ECFDF5' : '#FEE2E2', borderColor: status === 'Active' ? '#D1FAE5' : '#FECACA', justifyContent: 'center'}]}>
             <Text style={{fontSize: 15, fontWeight: '600', color: status === 'Active' ? '#065F46' : '#991B1B'}}>{status}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={status === 'Active' ? '#065F46' : '#991B1B'} style={styles.dropdownIcon} />
        </TouchableOpacity>

        {/* Location */}
        <Text style={styles.sectionTitle}>Location</Text>
        
        <Text style={styles.label}>Village / City<Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="Nashik"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>State<Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={state}
          onChangeText={setState}
          placeholder="Maharashtra"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Area / Locality</Text>
        <TextInput
          style={[styles.input, {marginBottom: 30}]}
          value={area}
          onChangeText={setArea}
          placeholder="Near Panchavati, Nashik"
          placeholderTextColor="#9CA3AF"
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" style={{marginRight: 8}} />
              <Text style={styles.saveBtnText}>{productToEdit ? 'Update Product' : 'Save Product'}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
          <Text style={styles.infoText}>Changes will be updated immediately.</Text>
        </View>
        <View style={{height: 40}} />
      </ScrollView>

      {/* Modals for Dropdowns */}
      {renderDropdownModal(showCategoryModal, () => setShowCategoryModal(false), CATEGORIES, setCategory, 'Select Category')}
      {renderDropdownModal(showStatusModal, () => setShowStatusModal(false), STATUS_OPTIONS, setStatus, 'Select Status')}
      {renderDropdownModal(showQuantityModal, () => setShowQuantityModal(false), ['KG', 'GRAM', 'PIECE', 'BUNDLE', 'LITER'], setQuantityUnit, 'Select Unit')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#1B5E20',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 4,
  },
  headerSubtitle: {
    color: '#D1FAE5',
    fontSize: 14,
    marginLeft: 4,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  photoSection: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  photoPreview: {
    width: 140,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    resizeMode: 'cover',
  },
  changePhotoBtn: {
    flex: 1,
    height: 100,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  changePhotoText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    height: 48,
  },
  dropdownContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  inputWithIcon: {
    position: 'relative',
    marginBottom: 16,
  },
  inputInside: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    paddingRight: 40,
    height: 48,
  },
  currencyIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  textAreaContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    height: 100,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 11,
    color: '#9CA3AF',
  },
  saveBtn: {
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    height: 48,
    marginRight: 10,
  },
  unitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFFFFF',
    minWidth: 100,
  },
  unitDropdownText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
});

export default AddProductScreen;
