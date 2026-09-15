import React, { useState } from 'react';
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
  ImageBackground,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { saveProductFormData, updateProductFormData } from '../services/productService';
import { BASE_URL } from '../services/api';
const CATEGORIES = [
  'Vegetable',
  'Root Vegetable',
  'Fruit',
  'Grains',
  'Dairy',
  'Wild Forest Vegetable',
];
const UNITS = [
  'KG',
  'GRAM',
  'LITER',
  'ML',
  'PIECE',
  'DOZEN',
  'BOX',
  'BUNDLE',
];
const AddProductScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const editProduct = route?.params?.product ?? null;
  const isEditMode  = !!editProduct;
  const [productName, setProductName] = useState(editProduct?.productName ?? '');
  const [category, setCategory] = useState(editProduct?.category ?? route?.params?.category ?? CATEGORIES[0]);
  const [unit, setUnit] = useState(editProduct?.unit ?? UNITS[0]);
  const [price, setPrice] = useState(editProduct?.price != null ? String(editProduct.price) : '');
  const [quantity, setQuantity] = useState(editProduct?.quantity != null ? String(editProduct.quantity) : '');
  const [description, setDescription] = useState(editProduct?.description ?? '');
  const [harvestDate, setHarvestDate] = useState(editProduct?.harvestDate ?? '');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>('product_video.mp4');
  const [removeVideo, setRemoveVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaSelectionType, setMediaSelectionType] = useState<'Images' | 'Videos'>('Images');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditMode ? 'Edit Product' : 'Add Product',
      headerStyle: { backgroundColor: '#1E5631', elevation: 0, shadowOpacity: 0 },
      headerTintColor: '#FFF',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16, marginRight: 16 }}>
          <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [isEditMode, navigation]);
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return false;
    }
    return true;
  };
  const handlePickMediaFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access is required.');
        setMediaModalVisible(false);
        return;
      }
      const isVideo = mediaSelectionType === 'Videos';
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: isVideo ? ['images', 'videos'] : 'images',
        allowsEditing: !isVideo,
        quality: isVideo ? 1 : 0.8,
        videoMaxDuration: isVideo ? 120 : undefined,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (isVideo) {
          if (asset.type !== 'video') {
            Alert.alert(
              'Wrong file type',
              'Please select a video from the gallery.',
            );
            return;
          }
          setSelectedVideo(asset.uri);
          setRemoveVideo(false);
          const name = asset.uri.split('/').pop() || 'product_video.mp4';
          setSelectedVideoName(name.endsWith('.mp4') ? name : name.replace(/\.[^.]+$/, '.mp4'));
        } else {
          setSelectedPhoto(asset.uri);
        }
      }
    } catch (error) {
      console.log('Error picking media from gallery:', error);
      Alert.alert('Error', 'Failed to pick media from gallery');
    }
    setMediaModalVisible(false);
  };
  const handlePickMediaFromCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setMediaModalVisible(false);
        return;
      }
      const isVideo = mediaSelectionType === 'Videos';
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: isVideo ? 'videos' : 'images',
        allowsEditing: !isVideo,
        quality: isVideo ? 1 : 0.8,
        videoMaxDuration: isVideo ? 120 : undefined,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (isVideo) {
          setSelectedVideo(asset.uri);
          setRemoveVideo(false);
          const name = asset.uri.split('/').pop() || 'product_video.mp4';
          setSelectedVideoName(name.endsWith('.mp4') ? name : `recorded_video_${Date.now()}.mp4`);
        } else {
          setSelectedPhoto(asset.uri);
        }
      }
    } catch (error) {
      console.log('Error capturing media from camera:', error);
      Alert.alert('Error', 'Failed to capture media. Please try again.');
    }
    setMediaModalVisible(false);
  };
  const handlePickMediaFromDocument = async () => {
    try {
      const isVideo = mediaSelectionType === 'Videos';
      const result = await DocumentPicker.getDocumentAsync({
        type: isVideo ? 'video/*' : 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (isVideo) {
          setSelectedVideo(asset.uri);
          setRemoveVideo(false);
          const name = asset.name || asset.uri.split('/').pop() || 'product_video.mp4';
          setSelectedVideoName(name);
        } else {
          setSelectedPhoto(asset.uri);
        }
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick file from documents');
    }
    setMediaModalVisible(false);
  };
  const handleSaveProduct = async () => {
    if (!productName.trim() || !price.trim() || !quantity.trim() || !harvestDate.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields (including Harvest Date)');
      return;
    }
    if (isNaN(Number(price)) || Number(price) <= 0 || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Validation Error', 'Price and Quantity must be valid numbers greater than 0');
      return;
    }
    setLoading(true);
    try {
      const productPayload = {
        farmerId: user?.farmerId,
        productName: productName.trim(),
        category,
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        unit,
        description: description.trim(),
        harvestDate: harvestDate.trim(),
        removeVideo: removeVideo,
      };
      if (isEditMode) {
        await updateProductFormData(
          editProduct.productId || editProduct.id,
          productPayload,
          selectedPhoto || undefined,
          selectedVideo || undefined,
        );
        Alert.alert('Success', 'Product updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await saveProductFormData(
          productPayload,
          selectedPhoto || undefined,
          selectedVideo || undefined,
        );
        Alert.alert('Success', 'Product added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.log('Error saving product:', error);
      const serverMsg = error.response?.data?.message || 'Failed to save product. Please try again.';
      Alert.alert('Error', serverMsg);
    } finally {
      setLoading(false);
    }
  };
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const handleSelectDay = (day: number) => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setHarvestDate(`${year}-${mm}-${dd}`);
    setShowCalendarModal(false);
  };
  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };
  const renderCalendarModal = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const totalDays = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);
    const daysArray = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      daysArray.push(i);
    }
    return (
      <Modal visible={showCalendarModal} transparent animationType="fade" onRequestClose={() => setShowCalendarModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendarModal(false)}
        >
          <View style={styles.calendarContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                <Ionicons name="chevron-back" size={20} color="#2D983A" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>{monthNames[month]} {year}</Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                <Ionicons name="chevron-forward" size={20} color="#2D983A" />
              </TouchableOpacity>
            </View>
            <View style={styles.weekDaysRow}>
              {dayNames.map(d => (
                <Text key={d} style={styles.weekDayLabel}>{d}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {daysArray.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} style={styles.emptyDayCell} />;
                }
                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = harvestDate === formattedDate;
                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.calCancelBtn} onPress={() => setShowCalendarModal(false)}>
              <Text style={styles.calCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
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
            renderItem={({ item }) => (
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
            showsVerticalScrollIndicator={false}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
  const getBorderColor = (field: string) => {
    return focusedInput === field ? '#4CAF50' : '#E8F5E9';
  };
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
            {}
            <View style={styles.mediaSection}>
                {}
                <View style={styles.mediaCard}>
                  <TouchableOpacity
                    style={styles.mediaCardInner}
                    onPress={() => {
                      setMediaSelectionType('Images');
                      setMediaModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    {selectedPhoto || (isEditMode && editProduct?.productPhoto) ? (
                      <>
                        <Image
                          source={{ uri: selectedPhoto || `${BASE_URL}/product/image/${editProduct?.productPhoto}` }}
                          style={styles.mediaImage}
                          resizeMode="cover"
                        />
                        <View style={styles.replaceOverlay}>
                          <Ionicons name="camera" size={16} color="#FFF" />
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.iconCircle}>
                          <Ionicons name="image" size={32} color="#4CAF50" />
                          <View style={[styles.plusBadge, {backgroundColor: '#4CAF50'}]}>
                            <Ionicons name="add" size={12} color="#FFF" />
                          </View>
                        </View>
                        <Text style={styles.mediaCardTitle}>Add Photo</Text>
                        <Text style={styles.mediaCardSub}>Upload product image</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                {}
                <View style={[styles.mediaCard, { borderStyle: selectedVideo ? 'solid' : 'dashed' }]}>
                  <TouchableOpacity
                    style={styles.mediaCardInner}
                    onPress={() => {
                      setMediaSelectionType('Videos');
                      setMediaModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    {selectedVideo || (isEditMode && editProduct?.productVideo && !removeVideo) ? (
                      <>
                        <View style={styles.videoPreview}>
                          <Ionicons name="checkmark-circle" size={32} color="#7B1FA2" />
                          <Text style={styles.videoSelectedText}>Video Ready</Text>
                          <Text style={styles.videoFileName} numberOfLines={1} ellipsizeMode="middle">
                            {selectedVideo ? selectedVideoName : (editProduct?.productVideo ?? '')}
                          </Text>
                          <Text style={styles.videoReplaceText}>Tap to replace</Text>
                        </View>
                        {}
                        <TouchableOpacity
                          style={styles.removeVideoBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setSelectedVideo(null);
                            setSelectedVideoName('product_video.mp4');
                            if (isEditMode && editProduct?.productVideo) {
                                setRemoveVideo(true);
                            }
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close" size={12} color="#FFF" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <View style={styles.iconCircle}>
                          <Ionicons name="videocam" size={32} color="#9C27B0" />
                          <View style={[styles.plusBadge, {backgroundColor: '#9C27B0'}]}>
                            <Ionicons name="add" size={12} color="#FFF" />
                          </View>
                        </View>
                        <Text style={styles.mediaCardTitle}>Add Video</Text>
                        <Text style={styles.mediaCardSub}>Upload product video (Optional)</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
            </View>
            {}
            <View style={styles.fieldRow}>
                <View style={styles.fieldContent}>
                    <Text style={styles.label}>Product Name *</Text>
                    <TextInput
                        style={[styles.input, { borderColor: getBorderColor('productName') }]}
                        value={productName}
                        onChangeText={setProductName}
                        placeholder="Enter product name"
                        placeholderTextColor="#9CA3AF"
                        onFocus={() => setFocusedInput('productName')}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
            </View>
            <View style={styles.fieldRow}>
                <View style={styles.fieldContent}>
                    <Text style={styles.label}>Category *</Text>
                    <TouchableOpacity
                        style={[styles.dropdownInput, { borderColor: '#E8F5E9' }]}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text style={styles.inputText}>{category}</Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.fieldRow}>
                <View style={styles.fieldContent}>
                    <Text style={styles.label}>Price (₹) *</Text>
                    <TextInput
                        style={[styles.input, { borderColor: getBorderColor('price') }]}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        placeholder="Enter price per unit"
                        placeholderTextColor="#9CA3AF"
                        onFocus={() => setFocusedInput('price')}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
            </View>
            <View style={styles.fieldRow}>
                <View style={styles.fieldContent}>
                    <Text style={styles.label}>Quantity *</Text>
                    <TextInput
                        style={[styles.input, { borderColor: getBorderColor('quantity') }]}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        placeholder="Enter available quantity"
                        placeholderTextColor="#9CA3AF"
                        onFocus={() => setFocusedInput('quantity')}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
            </View>
            <View style={styles.fieldRow}>
                <View style={styles.fieldContent}>
                    <Text style={styles.label}>Unit *</Text>
                    <TouchableOpacity
                        style={[styles.dropdownInput, { borderColor: '#E8F5E9' }]}
                        onPress={() => setShowUnitModal(true)}
                    >
                        <Text style={styles.inputText}>{unit}</Text>
                        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[styles.fieldRow, { marginBottom: 28 }]}>
                <View style={styles.fieldContent}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={[styles.input, { borderColor: getBorderColor('description'), minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Enter product description"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        onFocus={() => setFocusedInput('description')}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
            </View>
            <View style={[styles.fieldRow, { marginTop: 4 }]}>
                <View style={styles.fieldContent}>
                    <Text style={styles.label}>Harvest Date *</Text>
                    <View style={[styles.inputRowContainer, { borderColor: getBorderColor('harvestDate') }]}>
                        <TextInput
                            style={styles.inputFlex}
                            value={harvestDate}
                            onChangeText={setHarvestDate}
                            placeholder="Enter harvest date (e.g. 2026-08-27)"
                            placeholderTextColor="#9CA3AF"
                            onFocus={() => setFocusedInput('harvestDate')}
                            onBlur={() => setFocusedInput(null)}
                        />
                        <TouchableOpacity
                            style={styles.inputCalendarIcon}
                            onPress={() => setShowCalendarModal(true)}
                            accessibilityLabel="Choose Date from Calendar"
                        >
                            <Ionicons name="calendar-outline" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Text style={styles.saveBtnText}>
                          {isEditMode ? 'Update Product' : 'Save Product'}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
      </ScrollView>
      {}
      {renderDropdownModal(showCategoryModal, () => setShowCategoryModal(false), CATEGORIES, setCategory, 'Select Category')}
      {renderDropdownModal(showUnitModal, () => setShowUnitModal(false), UNITS, setUnit, 'Select Unit')}
      {renderCalendarModal()}
      {}
      <Modal visible={mediaModalVisible} transparent animationType="slide" onRequestClose={() => setMediaModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMediaModalVisible(false)}>
          <View style={styles.mediaOptionsContainer}>
            <Text style={styles.mediaOptionsTitle}>
              Select {mediaSelectionType === 'Images' ? 'Photo' : 'Video'} Source
            </Text>
            <TouchableOpacity style={styles.mediaOptionBtn} onPress={handlePickMediaFromCamera}>
              <Ionicons
                name={mediaSelectionType === 'Images' ? 'camera-outline' : 'videocam-outline'}
                size={24}
                color="#4CAF50"
              />
              <Text style={styles.mediaOptionText}>Take {mediaSelectionType === 'Images' ? 'Photo' : 'Video'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaOptionBtn} onPress={handlePickMediaFromGallery}>
              <Ionicons name="image-outline" size={24} color="#4CAF50" />
              <Text style={styles.mediaOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaOptionBtn} onPress={handlePickMediaFromDocument}>
              <Ionicons name="document-outline" size={24} color="#4CAF50" />
              <Text style={styles.mediaOptionText}>Choose from Documents</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mediaOptionBtn, { borderBottomWidth: 0 }]} onPress={() => setMediaModalVisible(false)}>
              <Ionicons name="close-circle-outline" size={24} color="#E53935" />
              <Text style={[styles.mediaOptionText, { color: '#E53935' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E5631',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#1E5631',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  mediaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  mediaCard: {
    width: '47%',
    height: 130,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  mediaCardInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  replaceOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  videoSelectedText: {
    color: '#7B1FA2',
    marginTop: 6,
    fontSize: 13,
    fontWeight: 'bold',
  },
  videoFileName: {
    color: '#9C27B0',
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  videoReplaceText: {
    color: '#AB47BC',
    marginTop: 4,
    fontSize: 10,
  },
  removeVideoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(156,39,176,0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    position: 'relative',
    marginBottom: 12,
  },
  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  mediaCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E3D2E',
    marginBottom: 4,
  },
  mediaCardSub: {
    fontSize: 11,
    color: '#7A8C7A',
    textAlign: 'center',
  },
  fieldRow: {
    marginBottom: 20,
  },
  fieldContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E3D2E',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FFFCF8',
    color: '#2E3D2E',
    fontSize: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FFFCF8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  inputText: {
    color: '#2E3D2E',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: '#1E5631',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#1E5631',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E3D2E',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6F3',
  },
  modalItemText: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
  },
  mediaOptionsContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    position: 'absolute',
    bottom: 0,
  },
  mediaOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E3D2E',
    marginBottom: 20,
    textAlign: 'center',
  },
  mediaOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6F3',
  },
  mediaOptionText: {
    fontSize: 16,
    color: '#2E3D2E',
    marginLeft: 16,
    fontWeight: '500',
  },
  harvestDateCard: {
    marginTop: 28,
    marginBottom: 24,
    backgroundColor: '#F0FBF1',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    padding: 16,
    elevation: 2,
    shadowColor: '#2D983A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  harvestDateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  harvestDateLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
    marginLeft: 8,
  },
  harvestDateHint: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 26,
  },
  inputRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 52,
    backgroundColor: '#FFFCF8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  inputFlex: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    color: '#2E3D2E',
    fontSize: 15,
  },
  inputCalendarIcon: {
    paddingRight: 16,
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calNavBtn: {
    padding: 6,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    width: 32,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedDayCell: {
    backgroundColor: '#2D983A',
  },
  dayText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyDayCell: {
    width: '14.28%',
    height: 38,
  },
  calCancelBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  calCancelBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
export default AddProductScreen;
