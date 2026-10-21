import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { saveFarmDetails, updateFarmDetails } from '../services/farmDetailsService';
import { uploadGalleryFile } from '../services/farmGalleryService';
import { BASE_URL } from '../services/api';

import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerInput } from '../components/farmer/FarmerInput';
import { FarmerDeepButton } from '../components/farmer/FarmerButtons';
import { FarmerStickyBar } from '../components/farmer/FarmerUI';
import { CameraIcon, CheckmarkIcon, ChevronDownIcon } from '../components/farmer/FarmerIcons';

const EditFarmDetailsScreen = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const existingData = route.params?.farmDetails || {};
  const [farmName, setFarmName] = useState(existingData.farmName || '');
  const [tagline, setTagline] = useState(existingData.tagline || '');
  const [location, setLocation] = useState(existingData.location || '');
  const [farmingSince, setFarmingSince] = useState(
    existingData.farmingSince ? String(existingData.farmingSince) : ''
  );
  const [farmingType, setFarmingType] = useState(existingData.farmingType || '');
  const [farmArea, setFarmArea] = useState(
    existingData.farmArea ? String(existingData.farmArea) : ''
  );
  const [farmAreaUnit, setFarmAreaUnit] = useState(existingData.farmAreaUnit || 'ACRE');
  const [cropsGrownCount, setCropsGrownCount] = useState(
    existingData.cropsGrownCount ? String(existingData.cropsGrownCount) : ''
  );
  const [yearsExperience, setYearsExperience] = useState(
    existingData.yearsExperience ? String(existingData.yearsExperience) : ''
  );
  const [farmerName, setFarmerName] = useState(
    existingData.farmerName || user?.name || ''
  );
  const [mainCrops, setMainCrops] = useState(existingData.mainCrops || '');
  const [irrigationSource, setIrrigationSource] = useState(
    existingData.irrigationSource || ''
  );
  const [soilType, setSoilType] = useState(existingData.soilType || '');
  const [aboutFarm, setAboutFarm] = useState(existingData.aboutFarm || '');
  const [farmerPhotoUri, setFarmerPhotoUri] = useState<string | null>(null);
  const [farmVideoUri, setFarmVideoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const UNITS = ['ACRE', 'GUNTHA', 'BIGHA', 'HECTOR'];

  const getExistingPhotoUrl = () => {
    if (existingData.farmerPhotoPath) {
      return `${BASE_URL}/${existingData.farmerPhotoPath}`;
    }
    return null;
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFarmerPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFarmVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking video:', error);
    }
  };

  const handleSave = async () => {
    if (!farmName.trim() || !location.trim()) {
      Alert.alert('Error', 'Farm Name and Location are required.');
      return;
    }
    if (!user?.farmerId) {
      Alert.alert('Error', 'Farmer session missing.');
      return;
    }

    const payload = {
      farmerId: user.farmerId,
      farmName,
      tagline,
      location,
      farmingSince: farmingSince ? parseInt(farmingSince, 10) : null,
      farmingType,
      farmArea: farmArea ? parseFloat(farmArea) : null,
      farmAreaUnit,
      cropsGrownCount: cropsGrownCount ? parseInt(cropsGrownCount, 10) : null,
      yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      farmerName,
      mainCrops,
      irrigationSource,
      soilType,
      aboutFarm,
    };

    setSaving(true);
    try {
      if (existingData.id) {
        await updateFarmDetails(
          user.farmerId,
          payload,
          farmerPhotoUri || undefined,
          farmVideoUri || undefined
        );
      } else {
        await saveFarmDetails(
          payload,
          farmerPhotoUri || undefined,
          farmVideoUri || undefined
        );
      }

      const galleryUploads: Promise<any>[] = [];
      if (farmerPhotoUri) {
        const ext = farmerPhotoUri.split('.').pop()?.toLowerCase() || 'jpg';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        galleryUploads.push(
          uploadGalleryFile(user.farmerId, farmerPhotoUri, mime, `farm_photo.${ext}`).catch(
            (e) => console.log('Gallery photo upload error:', e)
          )
        );
      }
      if (farmVideoUri) {
        const ext = farmVideoUri.split('.').pop()?.toLowerCase() || 'mp4';
        const mime = `video/${ext}`;
        galleryUploads.push(
          uploadGalleryFile(user.farmerId, farmVideoUri, mime, `farm_video.${ext}`).catch(
            (e) => console.log('Gallery video upload error:', e)
          )
        );
      }
      if (galleryUploads.length > 0) {
        await Promise.all(galleryUploads);
      }

      Alert.alert('Success', 'Farm details saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.log('Save Error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save farm details.');
    } finally {
      setSaving(false);
    }
  };

  const currentPhoto = farmerPhotoUri || getExistingPhotoUrl();

  return (
    <FarmerPageBackground>
      {/* Header */}
      <FarmerHeader
        variant="inner"
        title="Edit Farm Details"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={styles.keyboardContainer}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 30 : 90}
        extraHeight={130}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        bounces={false}
      >
          {/* Media Section */}
          <FarmerCard style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={styles.sectionHeading}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                MEDIA & PHOTOS
              </Text>
              <View style={styles.sectionDivider} />
            </View>

            <View style={styles.mediaRow}>
              <TouchableOpacity
                style={styles.mediaBox}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                {currentPhoto ? (
                  <Image source={{ uri: currentPhoto }} style={styles.mediaPreview} />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <View style={styles.mediaIconCircle}>
                      <CameraIcon size={22} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2} />
                    </View>
                    <Text
                      style={styles.mediaBoxLabel}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      Farmer Photo
                    </Text>
                  </View>
                )}
                {currentPhoto && (
                  <View style={styles.mediaOverlayPill}>
                    <Text
                      style={styles.mediaOverlayText}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      Change Photo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaBox}
                onPress={handlePickVideo}
                activeOpacity={0.8}
              >
                {farmVideoUri ? (
                  <View style={styles.videoSuccessBox}>
                    <Ionicons name="videocam" size={26} color="#FFFFFF" />
                    <Text
                      style={styles.videoSuccessText}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      Video Selected
                    </Text>
                  </View>
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <View style={styles.mediaIconCircle}>
                      <Ionicons
                        name="videocam-outline"
                        size={24}
                        color={FARMER_THEME.colors.primaryGreen}
                      />
                    </View>
                    <Text
                      style={styles.mediaBoxLabel}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      Farm Video
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </FarmerCard>

          {/* General Information */}
          <FarmerCard style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={styles.sectionHeading}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                GENERAL INFORMATION
              </Text>
              <View style={styles.sectionDivider} />
            </View>

            <FarmerInput
              label="Farm Name"
              required
              value={farmName}
              onChangeText={setFarmName}
              placeholder="E.g. Green Valley Farm"
            />

            <FarmerInput
              label="Tagline"
              value={tagline}
              onChangeText={setTagline}
              placeholder="E.g. Fresh from the roots"
            />

            <FarmerInput
              label="Location"
              required
              value={location}
              onChangeText={setLocation}
              placeholder="E.g. Nashik, Maharashtra"
            />

            <View style={styles.twoColRow}>
              <View style={styles.twoColItem}>
                <FarmerInput
                  label="Farming Since"
                  value={farmingSince}
                  onChangeText={setFarmingSince}
                  placeholder="YYYY"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={styles.twoColItem}>
                <FarmerInput
                  label="Farming Type"
                  value={farmingType}
                  onChangeText={setFarmingType}
                  placeholder="E.g. Organic"
                />
              </View>
            </View>

            <FarmerInput
              label="About Farm"
              value={aboutFarm}
              onChangeText={setAboutFarm}
              placeholder="Tell us about your farming practices and story..."
              multiline
              numberOfLines={4}
            />
          </FarmerCard>

          {/* Metrics & Area */}
          <FarmerCard style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={styles.sectionHeading}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                METRICS & AREA
              </Text>
              <View style={styles.sectionDivider} />
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.twoColItem}>
                <FarmerInput
                  label="Farm Area"
                  value={farmArea}
                  onChangeText={setFarmArea}
                  placeholder="E.g. 5.5"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.twoColItem}>
                <FarmerInput
                  label="Unit"
                  value={farmAreaUnit}
                  isTouchable
                  onPressContainer={() => setShowUnitDropdown(true)}
                  rightIcon={<ChevronDownIcon size={16} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2.4} />}
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.twoColItem}>
                <FarmerInput
                  label="Crops Grown Count"
                  value={cropsGrownCount}
                  onChangeText={setCropsGrownCount}
                  placeholder="E.g. 15"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.twoColItem}>
                <FarmerInput
                  label="Years Experience"
                  value={yearsExperience}
                  onChangeText={setYearsExperience}
                  placeholder="E.g. 6"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </FarmerCard>

          {/* Agricultural Details */}
          <FarmerCard style={styles.formCard}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={styles.sectionHeading}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                AGRICULTURAL DETAILS
              </Text>
              <View style={styles.sectionDivider} />
            </View>

            <FarmerInput
              label="Farmer Name"
              value={farmerName}
              onChangeText={setFarmerName}
              placeholder="Enter your full name"
            />

            <FarmerInput
              label="Main Crops (comma separated)"
              value={mainCrops}
              onChangeText={setMainCrops}
              placeholder="E.g. Tomato, Onion, Wheat"
            />

            <FarmerInput
              label="Irrigation Source"
              value={irrigationSource}
              onChangeText={setIrrigationSource}
              placeholder="E.g. Drip Irrigation, Canal"
            />

            <FarmerInput
              label="Soil Type"
              value={soilType}
              onChangeText={setSoilType}
              placeholder="E.g. Black Cotton Soil, Red Loam"
            />
          </FarmerCard>
      </KeyboardAwareScrollView>

      {/* Sticky Save Bar */}
      <FarmerStickyBar>
        <FarmerDeepButton
          title="Save Farm Details"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        />
      </FarmerStickyBar>

      {/* Unit Dropdown Modal */}
      {showUnitDropdown && (
        <Modal
          transparent
          animationType="fade"
          visible={showUnitDropdown}
          onRequestClose={() => setShowUnitDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowUnitDropdown(false)}
          >
            <View style={styles.dropdownDialog}>
              <Text
                style={styles.dropdownTitle}
                maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
              >
                Select Farm Unit
              </Text>
              {UNITS.map((u) => {
                const isActive = farmAreaUnit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.dropdownItem,
                      isActive && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setFarmAreaUnit(u);
                      setShowUnitDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isActive && styles.dropdownItemTextActive,
                      ]}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      {u}
                    </Text>
                    {isActive && (
                      <CheckmarkIcon
                        size={18}
                        color={FARMER_THEME.colors.primaryGreen}
                        strokeWidth={2.4}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: FARMER_THEME.spacing.pagePadding,
    paddingTop: 16,
    paddingBottom: 110, // Avoid overlapping sticky bar
    gap: FARMER_THEME.spacing.cardGap,
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
    height: 120,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...FARMER_THEME.shadows.tile,
  },
  mediaBoxLabel: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: FARMER_THEME.colors.headings,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediaOverlayPill: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(14,59,41,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediaOverlayText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
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
    marginTop: 6,
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
    marginBottom: 14,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dropdownItemActive: {
    backgroundColor: FARMER_THEME.colors.chipBgActive,
  },
  dropdownItemText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 15,
    color: FARMER_THEME.colors.textSecondary,
  },
  dropdownItemTextActive: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: FARMER_THEME.colors.headings,
  },
});

export default EditFarmDetailsScreen;
