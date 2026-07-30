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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {useAuth} from '../context/AuthContext';
import {saveProduct, uploadProductPhoto} from '../services/productService';

const CATEGORIES = [
  'Leafy Vegetables',
  'Vegetables',
  'Fruits',
  'Grains',
  'Dairy',
  'Others',
];

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

const AddProductScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [unit, setUnit] = useState(UNITS[0]);
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async () => {
    try {
      const {status} = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

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

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
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
      let productPhotoFilename = '';
      if (selectedPhoto) {
        // Upload photo first
        productPhotoFilename = await uploadProductPhoto(selectedPhoto);
      }

      const productPayload = {
        farmerId: user?.farmerId,
        productName: productName.trim(),
        category,
        price: parseFloat(price),
        unit,
        description: description.trim(),
        productPhoto: productPhotoFilename || null,
      };

      await saveProduct(productPayload);
      Alert.alert('Success', 'Product added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.log('Error saving product:', error);
      const serverMsg =
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response?.data : null) ||
        error.message ||
        'Failed to add product. Please try again.';
      console.log('Error detail:', serverMsg);
      Alert.alert('Error', serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add New Product</Text>
      <Text style={styles.subtitle}>Enter the details of your produce</Text>

      {/* Product Name */}
      <Text style={styles.label}>Product Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Apple, Methi (Fenugreek)"
        placeholderTextColor="#9E9E9E"
        value={productName}
        onChangeText={setProductName}
      />

      {/* Category Selection */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoriesContainer}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.choiceChip,
              category === cat && styles.choiceChipSelected,
            ]}
            onPress={() => setCategory(cat)}>
            <Text
              style={[
                styles.choiceChipText,
                category === cat && styles.choiceChipTextSelected,
              ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Unit Selection */}
      <Text style={styles.label}>Unit / Parameter</Text>
      <View style={styles.categoriesContainer}>
        {UNITS.map(u => (
          <TouchableOpacity
            key={u}
            style={[
              styles.choiceChip,
              unit === u && styles.choiceChipSelected,
            ]}
            onPress={() => setUnit(u)}>
            <Text
              style={[
                styles.choiceChipText,
                unit === u && styles.choiceChipTextSelected,
              ]}>
              {u}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price */}
      <Text style={styles.label}>Price (₹) *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 80"
        placeholderTextColor="#9E9E9E"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the product (freshness, location, harvesting info...)"
        placeholderTextColor="#9E9E9E"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />

      {/* Photo Picker */}
      <Text style={styles.label}>Product Photo</Text>
      {selectedPhoto && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{uri: selectedPhoto}} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeImageBtn}
            onPress={() => setSelectedPhoto(null)}>
            <Text style={styles.removeImageBtnText}>✕ Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mediaButtonsContainer}>
        <TouchableOpacity style={styles.mediaBtn} onPress={handleTakePhoto}>
          <Text style={styles.mediaBtnIcon}>📸</Text>
          <Text style={styles.mediaBtnText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mediaBtn} onPress={handlePickImage}>
          <Text style={styles.mediaBtnIcon}>🖼️</Text>
          <Text style={styles.mediaBtnText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mediaBtn} onPress={handlePickDocument}>
          <Text style={styles.mediaBtnIcon}>📄</Text>
          <Text style={styles.mediaBtnText}>Document</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSaveProduct}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Add Product</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B5E20',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 10,
  },
  choiceChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  choiceChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B5E20',
  },
  choiceChipText: {
    color: '#616161',
    fontSize: 13,
    fontWeight: '600',
  },
  choiceChipTextSelected: {
    color: '#1B5E20',
    fontWeight: '700',
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  removeImageBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mediaButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mediaBtn: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  mediaBtnIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mediaBtnText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1B5E20',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddProductScreen;
