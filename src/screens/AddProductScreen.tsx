import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  FlatList,
  Platform,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { saveProductFormData, updateProductFormData } from '../services/productService';
import { BASE_URL } from '../services/api';

import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerInput } from '../components/farmer/FarmerInput';
import { FarmerDeepButton, FarmerOutlineButton } from '../components/farmer/FarmerButtons';
import { FarmerStickyBar } from '../components/farmer/FarmerUI';
import {
  CameraIcon,
  ChevronDownIcon,
  CheckmarkIcon,
  CloseCircleIcon,
} from '../components/farmer/FarmerIcons';

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

// ---------------------------------------------------------------------------
// Top-Level Memoized Calendar Modal
// ---------------------------------------------------------------------------
interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
  harvestDate: string;
  onSelectDate: (dateStr: string) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = React.memo(({
  visible,
  onClose,
  calendarDate,
  setCalendarDate,
  harvestDate,
  onSelectDate,
}) => {
  if (!visible) return null;

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysCount = daysInMonth(currentMonth, currentYear);
  const startDay = firstDayOfMonth(currentMonth, currentYear);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(currentYear, currentMonth + 1, 1));

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
  }

  for (let day = 1; day <= daysCount; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = harvestDate === dateStr;
    days.push(
      <TouchableOpacity
        key={`day-${day}`}
        style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
        onPress={() => {
          onSelectDate(dateStr);
          onClose();
        }}
      >
        <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
          {day}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.calendarDialog}>
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.calendarArrowBtn}>
              <Ionicons name="chevron-back" size={20} color={FARMER_THEME.colors.primaryGreen} />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.calendarArrowBtn}>
              <Ionicons name="chevron-forward" size={20} color={FARMER_THEME.colors.primaryGreen} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>{days}</View>

          <TouchableOpacity style={styles.calendarCancelBtn} onPress={onClose}>
            <Text style={styles.calendarCancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

// ---------------------------------------------------------------------------
// Top-Level Memoized Dropdown Modal
// ---------------------------------------------------------------------------
interface DropdownModalProps {
  visible: boolean;
  onClose: () => void;
  data: string[];
  onSelect: (val: string) => void;
  title: string;
  onInactiveSelect: () => void;
}

const DropdownModal: React.FC<DropdownModalProps> = React.memo(({
  visible,
  onClose,
  data,
  onSelect,
  title,
  onInactiveSelect,
}) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.dropdownDialog}>
          <Text style={styles.dropdownTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isInactive = item.endsWith(' (Inactive)');
              const displayText = isInactive ? item.replace(' (Inactive)', '') : item;
              return (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    if (isInactive) {
                      onClose();
                      onInactiveSelect();
                    } else {
                      onSelect(item);
                      onClose();
                    }
                  }}
                >
                  <Text style={[styles.dropdownItemText, isInactive && { color: FARMER_THEME.colors.error }]}>
                    {displayText} {isInactive && '(Inactive)'}
                  </Text>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const AddProductScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const editProduct = route?.params?.product ?? null;
  const isEditMode = !!editProduct;

  // Single consolidated form state to prevent parent state churn
  const [form, setForm] = useState({
    productName: editProduct?.productName ?? '',
    category: editProduct?.category ?? route?.params?.category ?? CATEGORIES[0],
    unit: editProduct?.unit ?? UNITS[0],
    price: editProduct?.price != null ? String(editProduct.price) : '',
    quantity: editProduct?.quantity != null ? String(editProduct.quantity) : '',
    description: editProduct?.description ?? '',
    harvestDate: editProduct?.harvestDate ?? '',
  });

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedVideoName, setSelectedVideoName] = useState<string>('product_video.mp4');
  const [removeVideo, setRemoveVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [inactiveAlertVisible, setInactiveAlertVisible] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>(CATEGORIES);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tempSelectedPhoto, setTempSelectedPhoto] = useState<string | null>(null);
  const [photoPreviewModalVisible, setPhotoPreviewModalVisible] = useState(false);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [mediaSelectionType, setMediaSelectionType] = useState<'Images' | 'Videos'>('Images');

  // Input refs for smooth keyboard navigation
  const productNameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const quantityRef = useRef<TextInput>(null);
  const harvestDateRef = useRef<TextInput>(null);

  // Stable field update handler
  const handleFieldChange = useCallback((field: string, value: string) => {
    setForm((prev) => (prev[field as keyof typeof prev] === value ? prev : { ...prev, [field]: value }));
  }, []);

  const onProductNameChange = useCallback((text: string) => handleFieldChange('productName', text), [handleFieldChange]);
  const onPriceChange = useCallback((text: string) => handleFieldChange('price', text), [handleFieldChange]);
  const onQuantityChange = useCallback((text: string) => handleFieldChange('quantity', text), [handleFieldChange]);
  const onDescriptionChange = useCallback((text: string) => handleFieldChange('description', text), [handleFieldChange]);
  const onHarvestDateChange = useCallback((text: string) => handleFieldChange('harvestDate', text), [handleFieldChange]);
  const onCategorySelect = useCallback((cat: string) => handleFieldChange('category', cat), [handleFieldChange]);
  const onUnitSelect = useCallback((u: string) => handleFieldChange('unit', u), [handleFieldChange]);

  const openCategoryModal = useCallback(() => {
    Keyboard.dismiss();
    setShowCategoryModal(true);
  }, []);
  const closeCategoryModal = useCallback(() => setShowCategoryModal(false), []);

  const openUnitModal = useCallback(() => {
    Keyboard.dismiss();
    setShowUnitModal(true);
  }, []);
  const closeUnitModal = useCallback(() => setShowUnitModal(false), []);

  const openCalendarModal = useCallback(() => {
    Keyboard.dismiss();
    setShowCalendarModal(true);
  }, []);
  const closeCalendarModal = useCallback(() => setShowCalendarModal(false), []);

  const openMediaModalImages = useCallback(() => {
    Keyboard.dismiss();
    setMediaSelectionType('Images');
    setMediaModalVisible(true);
  }, []);

  const openMediaModalVideos = useCallback(() => {
    Keyboard.dismiss();
    setMediaSelectionType('Videos');
    setMediaModalVisible(true);
  }, []);

  const onInactiveCategoryAlert = useCallback(() => {
    setInactiveAlertVisible(true);
  }, []);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const focusDescription = useCallback(() => {
    descriptionRef.current?.focus();
  }, []);

  const focusQuantity = useCallback(() => {
    quantityRef.current?.focus();
  }, []);

  const focusHarvestDate = useCallback(() => {
    harvestDateRef.current?.focus();
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Stable static icon references to prevent re-creation
  const categoryRightIcon = useMemo(
    () => <ChevronDownIcon size={16} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2.4} />,
    []
  );

  const unitRightIcon = useMemo(
    () => <ChevronDownIcon size={16} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2.4} />,
    []
  );

  const calendarRightIcon = useMemo(
    () => (
      <TouchableOpacity onPress={openCalendarModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="calendar-outline" size={20} color={FARMER_THEME.colors.primaryGreen} />
      </TouchableOpacity>
    ),
    [openCalendarModal]
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { default: api } = await import('../services/api');
      const res = await api.get('/categories');
      if (res.data && res.data.data) {
        const catNames = res.data.data.map((c: any) =>
          c.isActive ? c.name : `${c.name} (Inactive)`
        );
        setCategoriesList(catNames);
        if (!isEditMode && !route?.params?.category && catNames.length > 0) {
          handleFieldChange('category', catNames[0]);
        }
      }
    } catch (e) {
      console.log('Failed to load dynamic categories', e);
    }
  };

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
        allowsEditing: false,
        quality: isVideo ? 1 : 0.8,
        videoMaxDuration: isVideo ? 120 : undefined,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (isVideo) {
          if (asset.type !== 'video') {
            Alert.alert(
              'Wrong file type',
              'Please select a video from the gallery.'
            );
            return;
          }
          setSelectedVideo(asset.uri);
          setRemoveVideo(false);
          const name = asset.uri.split('/').pop() || 'product_video.mp4';
          setSelectedVideoName(name.endsWith('.mp4') ? name : name.replace(/\.[^.]+$/, '.mp4'));
        } else {
          setTempSelectedPhoto(asset.uri);
          setPhotoPreviewModalVisible(true);
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
        allowsEditing: false,
        quality: isVideo ? 1 : 0.8,
        videoMaxDuration: isVideo ? 120 : undefined,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (isVideo) {
          setSelectedVideo(asset.uri);
          setRemoveVideo(false);
          const name = asset.uri.split('/').pop() || 'product_video.mp4';
          setSelectedVideoName(
            name.endsWith('.mp4') ? name : `recorded_video_${Date.now()}.mp4`
          );
        } else {
          setTempSelectedPhoto(asset.uri);
          setPhotoPreviewModalVisible(true);
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
          setTempSelectedPhoto(asset.uri);
          setPhotoPreviewModalVisible(true);
        }
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick file from documents');
    }
    setMediaModalVisible(false);
  };

  const handleSaveProduct = async () => {
    if (!form.productName.trim() || !form.price.trim() || !form.quantity.trim() || !form.harvestDate.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields (including Harvest Date)');
      return;
    }
    if (
      isNaN(Number(form.price)) ||
      Number(form.price) <= 0 ||
      isNaN(Number(form.quantity)) ||
      Number(form.quantity) <= 0
    ) {
      Alert.alert('Validation Error', 'Price and Quantity must be valid numbers greater than 0');
      return;
    }
    const isCurrentCategoryInactive = categoriesList.includes(`${form.category} (Inactive)`);
    if (isCurrentCategoryInactive) {
      Alert.alert(
        'Category Unavailable',
        'This category is currently unavailable, so you cannot add a product to it.'
      );
      return;
    }
    setLoading(true);
    try {
      const productPayload = {
        farmerId: user?.farmerId,
        productName: form.productName.trim(),
        category: form.category,
        price: parseFloat(form.price),
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        description: form.description.trim(),
        harvestDate: form.harvestDate.trim(),
        removeVideo: removeVideo,
        removePhoto: removePhoto,
      };
      if (isEditMode) {
        await updateProductFormData(
          editProduct.productId || editProduct.id,
          productPayload,
          selectedPhoto || undefined,
          selectedVideo || undefined
        );
        setSuccessMessage('Product updated successfully!');
        setSuccessModalVisible(true);
      } else {
        await saveProductFormData(
          productPayload,
          selectedPhoto || undefined,
          selectedVideo || undefined
        );
        setSuccessMessage('Product added successfully!');
        setSuccessModalVisible(true);
      }
    } catch (error: any) {
      console.log('Error saving product:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FarmerPageBackground>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={30}
        extraHeight={120}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
      >
        {/* Header */}
        <FarmerHeader
          variant="inner"
          title={isEditMode ? 'Edit Product' : 'Add Product'}
          titleAlign="left"
          onBackPress={handleBackPress}
        />

        <View style={styles.scrollContent}>
          {/* Media Section */}
        <FarmerCard style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={styles.sectionHeading}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              PRODUCT MEDIA
            </Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.mediaRow}>
            {/* Photo Box */}
            <TouchableOpacity
              style={styles.mediaBox}
              onPress={openMediaModalImages}
              onLongPress={() => {
                if (selectedPhoto || (isEditMode && editProduct?.productPhoto && !removePhoto)) {
                  Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Yes',
                      onPress: () => {
                        setSelectedPhoto(null);
                        setTempSelectedPhoto(null);
                        if (isEditMode && editProduct?.productPhoto) {
                          setRemovePhoto(true);
                        }
                      },
                      style: 'destructive',
                    },
                  ]);
                }
              }}
              activeOpacity={0.85}
            >
              {selectedPhoto || (isEditMode && editProduct?.productPhoto && !removePhoto) ? (
                <>
                  <Image
                    source={{
                      uri: selectedPhoto || `${BASE_URL}/product/image/${editProduct?.productPhoto}`,
                    }}
                    style={styles.mediaPreview}
                    resizeMode="cover"
                  />
                  <View style={styles.mediaOverlayBadge}>
                    <CameraIcon size={14} color="#FFFFFF" strokeWidth={2} />
                  </View>
                </>
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <View style={styles.mediaIconCircle}>
                    <CameraIcon size={22} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2} />
                  </View>
                  <Text
                    style={styles.mediaBoxTitle}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    Add Photo *
                  </Text>
                  <Text style={styles.mediaBoxSub}>Tap to upload</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Video Box */}
            <TouchableOpacity
              style={styles.mediaBox}
              onPress={openMediaModalVideos}
              activeOpacity={0.85}
            >
              {selectedVideo || (isEditMode && editProduct?.productVideo && !removeVideo) ? (
                <View style={styles.videoSuccessBox}>
                  <Ionicons name="videocam" size={26} color="#FFFFFF" />
                  <Text
                    style={styles.videoSuccessText}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    Video Ready
                  </Text>
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
                    <CloseCircleIcon size={18} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <View style={styles.mediaIconCircle}>
                    <Ionicons name="videocam-outline" size={22} color={FARMER_THEME.colors.primaryGreen} />
                  </View>
                  <Text
                    style={styles.mediaBoxTitle}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    Add Video
                  </Text>
                  <Text style={styles.mediaBoxSub}>Optional</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </FarmerCard>

        {/* Basic Details */}
        <FarmerCard style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={styles.sectionHeading}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              PRODUCT DETAILS
            </Text>
            <View style={styles.sectionDivider} />
          </View>

          <FarmerInput
            ref={productNameRef}
            label="Product Name"
            required
            value={form.productName}
            onChangeText={onProductNameChange}
            placeholder="E.g. Fresh Organic Tomatoes"
            returnKeyType="next"
            onSubmitEditing={focusDescription}
          />

          <FarmerInput
            label="Category"
            required
            value={form.category}
            isTouchable
            onPressContainer={openCategoryModal}
            rightIcon={categoryRightIcon}
          />

          <FarmerInput
            ref={descriptionRef}
            label="Description (Optional)"
            value={form.description}
            onChangeText={onDescriptionChange}
            placeholder="Enter product description, freshness details..."
            multiline
            numberOfLines={3}
            blurOnSubmit={false}
          />
        </FarmerCard>

        {/* Pricing & Stock */}
        <FarmerCard style={styles.formCard}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={styles.sectionHeading}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              PRICING & INVENTORY
            </Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.twoColItem}>
              <FarmerInput
                ref={priceRef}
                label="Price (₹)"
                required
                value={form.price}
                onChangeText={onPriceChange}
                keyboardType="decimal-pad"
                placeholder="E.g. 40"
                returnKeyType="next"
                onSubmitEditing={focusQuantity}
              />
            </View>
            <View style={styles.twoColItem}>
              <FarmerInput
                label="Unit"
                required
                value={form.unit}
                isTouchable
                onPressContainer={openUnitModal}
                rightIcon={unitRightIcon}
              />
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.twoColItem}>
              <FarmerInput
                ref={quantityRef}
                label="Available Quantity"
                required
                value={form.quantity}
                onChangeText={onQuantityChange}
                keyboardType="numeric"
                placeholder="E.g. 100"
                returnKeyType="next"
                onSubmitEditing={focusHarvestDate}
              />
            </View>
            <View style={styles.twoColItem}>
              <FarmerInput
                ref={harvestDateRef}
                label="Harvest Date"
                required
                value={form.harvestDate}
                onChangeText={onHarvestDateChange}
                placeholder="YYYY-MM-DD"
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
                rightIcon={calendarRightIcon}
              />
            </View>
          </View>
        </FarmerCard>
        </View>
      </KeyboardAwareScrollView>

      {/* Sticky Save Bar */}
      <FarmerStickyBar>
        <FarmerDeepButton
          title={isEditMode ? 'Update Product' : 'Save Product'}
          onPress={handleSaveProduct}
          loading={loading}
          disabled={loading}
        />
      </FarmerStickyBar>

      {/* Top-Level Memoized Modals */}
      <DropdownModal
        visible={showCategoryModal}
        onClose={closeCategoryModal}
        data={categoriesList}
        onSelect={onCategorySelect}
        title="Select Category"
        onInactiveSelect={onInactiveCategoryAlert}
      />
      <DropdownModal
        visible={showUnitModal}
        onClose={closeUnitModal}
        data={UNITS}
        onSelect={onUnitSelect}
        title="Select Unit"
        onInactiveSelect={onInactiveCategoryAlert}
      />
      <CalendarModal
        visible={showCalendarModal}
        onClose={closeCalendarModal}
        calendarDate={calendarDate}
        setCalendarDate={setCalendarDate}
        harvestDate={form.harvestDate}
        onSelectDate={onHarvestDateChange}
      />

      {/* Media Selection Modal */}
      <Modal visible={mediaModalVisible} transparent animationType="slide" onRequestClose={() => setMediaModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMediaModalVisible(false)}>
          <View style={styles.mediaSheetContainer}>
            <Text style={styles.mediaSheetTitle}>
              Select {mediaSelectionType === 'Images' ? 'Photo' : 'Video'} Source
            </Text>

            <TouchableOpacity style={styles.mediaOptionBtn} onPress={handlePickMediaFromCamera}>
              <Ionicons
                name={mediaSelectionType === 'Images' ? 'camera-outline' : 'videocam-outline'}
                size={22}
                color={FARMER_THEME.colors.primaryGreen}
              />
              <Text style={styles.mediaOptionText}>Take {mediaSelectionType === 'Images' ? 'Photo' : 'Video'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOptionBtn} onPress={handlePickMediaFromGallery}>
              <Ionicons name="images-outline" size={22} color={FARMER_THEME.colors.primaryGreen} />
              <Text style={styles.mediaOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOptionBtn} onPress={handlePickMediaFromDocument}>
              <Ionicons name="document-text-outline" size={22} color={FARMER_THEME.colors.primaryGreen} />
              <Text style={styles.mediaOptionText}>Choose from Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.mediaOptionBtn, { borderBottomWidth: 0 }]} onPress={() => setMediaModalVisible(false)}>
              <Ionicons name="close-circle-outline" size={22} color={FARMER_THEME.colors.error} />
              <Text style={[styles.mediaOptionText, { color: FARMER_THEME.colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Inactive Category Alert Modal */}
      <Modal visible={inactiveAlertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <FarmerCard style={styles.alertCard}>
            <Ionicons name="alert-circle" size={50} color={FARMER_THEME.colors.error} style={{ marginBottom: 12 }} />
            <Text style={styles.alertTitle}>Notice</Text>
            <Text style={styles.alertSubtitle}>This category is currently inactive.</Text>
            <FarmerOutlineButton
              title="OK"
              onPress={() => setInactiveAlertVisible(false)}
              compact
              style={{ width: '100%', marginTop: 14 }}
            />
          </FarmerCard>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <FarmerCard style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <CheckmarkIcon size={36} color={FARMER_THEME.colors.primaryGreen} strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successSubtitle}>{successMessage}</Text>
            <FarmerDeepButton
              title="Continue"
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
              style={{ width: '100%' }}
            />
          </FarmerCard>
        </View>
      </Modal>

      {/* Photo Preview Modal */}
      <Modal visible={photoPreviewModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
          <Image source={{ uri: tempSelectedPhoto || '' }} style={{ flex: 1, resizeMode: 'contain' }} />
          <View style={{ position: 'absolute', bottom: 60, left: 24, right: 24 }}>
            <FarmerDeepButton
              title="Confirm Photo"
              onPress={() => {
                setSelectedPhoto(tempSelectedPhoto);
                setPhotoPreviewModalVisible(false);
              }}
            />
          </View>
          <TouchableOpacity
            style={styles.closePreviewBtn}
            onPress={() => setPhotoPreviewModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: FARMER_THEME.spacing.pagePadding,
    paddingTop: 16,
    paddingBottom: 0,
    gap: FARMER_THEME.spacing.cardGap,
  },
  inlineButtonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  formCard: {
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionHeading: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: FARMER_THEME.colors.primaryGreen,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: FARMER_THEME.colors.divider,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaBox: {
    flex: 1,
    height: 124,
    backgroundColor: FARMER_THEME.colors.uploadTileBg,
    borderRadius: FARMER_THEME.radius.smallCards,
    borderWidth: 1.5,
    borderColor: FARMER_THEME.colors.uploadTileBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...FARMER_THEME.shadows.tile,
  },
  mediaBoxTitle: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: FARMER_THEME.colors.headings,
  },
  mediaBoxSub: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 10.5,
    color: FARMER_THEME.colors.textSecondary,
    marginTop: 2,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  mediaOverlayBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(14,59,41,0.85)',
    borderRadius: 10,
    padding: 5,
  },
  videoSuccessBox: {
    width: '100%',
    height: '100%',
    backgroundColor: FARMER_THEME.colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSuccessText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
  },
  removeVideoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  twoColItem: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: FARMER_THEME.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownDialog: {
    width: '100%',
    maxWidth: 320,
    maxHeight: 380,
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: FARMER_THEME.radius.dialogs,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    padding: 20,
    ...FARMER_THEME.shadows.card,
  },
  dropdownTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 18,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
    marginBottom: 12,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: FARMER_THEME.colors.divider,
  },
  dropdownItemText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 15,
    color: FARMER_THEME.colors.bodyText,
  },
  calendarDialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: FARMER_THEME.radius.dialogs,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    padding: 20,
    ...FARMER_THEME.shadows.card,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FARMER_THEME.colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 16,
    color: FARMER_THEME.colors.headings,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: FARMER_THEME.colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDayEmpty: {
    width: '14.28%',
    height: 38,
  },
  calendarDay: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  calendarDaySelected: {
    backgroundColor: FARMER_THEME.colors.primaryGreen,
  },
  calendarDayText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 13,
    color: FARMER_THEME.colors.bodyText,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontFamily: FARMER_THEME.fonts.bold,
  },
  calendarCancelBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  calendarCancelText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14,
    color: FARMER_THEME.colors.primaryGreen,
  },
  mediaSheetContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderRadius: FARMER_THEME.radius.dialogs,
    padding: 20,
    ...FARMER_THEME.shadows.card,
  },
  mediaSheetTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 17,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
    marginBottom: 14,
  },
  mediaOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: FARMER_THEME.colors.divider,
    gap: 12,
  },
  mediaOptionText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 15,
    color: FARMER_THEME.colors.bodyText,
  },
  alertCard: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    padding: 24,
  },
  alertTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 18,
    color: FARMER_THEME.colors.headings,
    marginBottom: 6,
  },
  alertSubtitle: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
  },
  successCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    padding: 28,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 22,
    color: FARMER_THEME.colors.headings,
    marginBottom: 8,
  },
  successSubtitle: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 14,
    color: FARMER_THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  closePreviewBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
});

export default AddProductScreen;
