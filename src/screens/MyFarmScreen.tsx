import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
  Animated,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getMyGallery, uploadGalleryFile, deleteGalleryFile } from '../services/farmGalleryService';
import { useAuth } from '../context/AuthContext';
import { BASE_URL, resolveMediaUrl } from '../services/api';
import { getFarmDetails } from '../services/farmDetailsService';
import { getFarmerById } from '../services/farmerService';

import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerSectionHeader } from '../components/farmer/FarmerSectionHeader';
import { FarmerStatCard, FarmerEmptyState } from '../components/farmer/FarmerUI';
import {
  FarmerDeepButton,
  FarmerOutlineButton,
  FarmerGoldButton,
} from '../components/farmer/FarmerButtons';
import {
  PinIcon,
  CheckmarkIcon,
  TrashIcon,
  EditIcon,
} from '../components/farmer/FarmerIcons';
import { useTranslation } from 'react-i18next';

const VideoCard = ({ style, blurred }: { style: any; blurred: boolean }) => (
  <View
    style={[
      style,
      {
        backgroundColor: '#0E3B29',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: blurred ? 0.6 : 1,
      },
    ]}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.20)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.70)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
      }}
    >
      <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
    </View>
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
        VIDEO
      </Text>
    </View>
  </View>
);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MyFarmScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [farmDetails, setFarmDetails] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [photoModalLoading, setPhotoModalLoading] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  const videoRef = useRef<Video>(null);
  const insets = useSafeAreaInsets();

  const fetchData = async () => {
    if (!user?.farmerId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [detailsResponse, galleryResponse, farmerDetails] = await Promise.all([
        getFarmDetails(user.farmerId).catch(() => null),
        getMyGallery().catch(() => ({ data: [] })),
        getFarmerById(user.farmerId).catch(() => null),
      ]);

      if (farmerDetails) {
        if (farmerDetails.status === 'INACTIVE' && farmerDetails.blockReason) {
          Alert.alert(
            t('errors.unauthorized', 'Account Blocked'),
            `${t('farmer.deactivateWarning', 'Your account has been blocked by the admin.')}\n\n${t('profile.deactivationReason', 'Reason:')} ${farmerDetails.blockReason}`,
            [{ text: t('common.ok', 'OK'), onPress: () => logout() }]
          );
          return;
        }
      }

      if (detailsResponse && detailsResponse.data) {
        setFarmDetails(detailsResponse.data);
      }
      if (galleryResponse && galleryResponse.data) {
        setGallery(galleryResponse.data);
        setFailedImageIds({});
      }
    } catch (error) {
      console.log('Error fetching farm data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?.farmerId])
  );

  const handleAddPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('validation.permissionDenied', 'Permission needed'), t('farmer.galleryPermissionRequired', 'Sorry, we need camera roll permissions to upload media.'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadFile(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Image picker error:', error);
    }
  };

  const uploadFile = async (uri: string) => {
    if (!user?.farmerId) return;
    try {
      setUploading(true);
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      let mimeType = 'image/jpeg';
      if (['mp4', 'mov', 'webm'].includes(fileExt)) {
        mimeType = `video/${fileExt}`;
      } else if (fileExt === 'png') {
        mimeType = 'image/png';
      }
      await uploadGalleryFile(user.farmerId, uri, mimeType, `gallery_file.${fileExt}`);
      Alert.alert(t('common.success', 'Success'), t('farmer.fileUploadedSuccess', 'File uploaded successfully'));
      const galleryResponse = await getMyGallery().catch(() => ({ data: [] }));
      if (galleryResponse && galleryResponse.data) {
        setGallery(galleryResponse.data);
        setFailedImageIds({});
      }
    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert(t('common.error', 'Error'), t('errors.generic', 'Failed to upload file'));
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedGalleryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedGalleryIds.length === 0) return;
    Alert.alert(
      t('common.delete', 'Delete Selected'),
      `${t('common.confirm', 'Are you sure you want to delete')} ${selectedGalleryIds.length} ${t('cart.itemCount_plural', 'item(s)')}?`,
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              for (const id of selectedGalleryIds) {
                await deleteGalleryFile(id).catch((err) =>
                  console.log('Failed to delete', id, err)
                );
              }
              setGallery((prev) => prev.filter((item) => !selectedGalleryIds.includes(item.id)));
              setIsSelectionMode(false);
              setSelectedGalleryIds([]);
              Alert.alert(t('common.success', 'Success'), t('common.success', 'Selected items deleted successfully'));
            } catch (error) {
              console.log('Delete error:', error);
              Alert.alert(t('common.error', 'Error'), t('errors.generic', 'Failed to delete some items'));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePlayVideo = (item: any) => {
    // Prefer playbackUrl (transcoded, mobile-friendly), fallback to filePath
    const rawUrl = item.playbackUrl || item.filePath || '';
    const resolved = resolveMediaUrl(rawUrl);
    if (resolved) {
      setIsVideoPaused(false);
      setIsVideoBuffering(true);
      setVideoModalUrl(resolved);
    } else {
      Alert.alert(t('common.error', 'Error'), t('errors.generic', 'Could not open video.'));
    }
  };

  if (loading) {
    return (
      <FarmerPageBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={FARMER_THEME.colors.primaryGreen} />
      </FarmerPageBackground>
    );
  }

  const fd = farmDetails || {};
  const isVerified = true;

  const galleryPhotos = gallery
    .filter((item) => item.fileType !== 'VIDEO')
    .map((item) => ({
      id: item.id,
      uri: resolveMediaUrl(item.filePath || item.playbackUrl || item.imageUrl) || '',
    }))
    .filter((p) => !!p.uri);

  const activePhotoUri =
    activePhotoIndex !== null && galleryPhotos[activePhotoIndex]
      ? galleryPhotos[activePhotoIndex].uri
      : null;

  const showPrevPhoto = () => {
    if (activePhotoIndex === null || galleryPhotos.length <= 1) return;
    setPhotoModalLoading(true);
    setActivePhotoIndex((activePhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length);
  };

  const showNextPhoto = () => {
    if (activePhotoIndex === null || galleryPhotos.length <= 1) return;
    setPhotoModalLoading(true);
    setActivePhotoIndex((activePhotoIndex + 1) % galleryPhotos.length);
  };

  return (
    <FarmerPageBackground>
      {/* Header */}
      <FarmerHeader
        variant="tab"
        title={t('farmer.myFarm', 'My Farm')}
        subtitle={t('farmer.farmDetails', 'Farm overview, details & gallery')}
        onBackPress={() => navigation.goBack()}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Farm Profile Card */}
          <FarmerCard style={styles.farmProfileCard}>
            <View style={styles.profileRow}>
              <View style={styles.profileLeft}>
                <View style={styles.farmNameRow}>
                  <Text
                    style={styles.farmNameText}
                    numberOfLines={2}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {fd.farmName || fd.farmerName || user?.name || t('farmer.farmDetails', 'Your Farm Name')}
                  </Text>
                  {isVerified && (
                    <View style={styles.verifiedCheckCircle}>
                      <CheckmarkIcon size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </View>

                {fd.tagline ? (
                  <View style={styles.taglineRow}>
                    <Ionicons name="leaf-outline" size={13} color={FARMER_THEME.colors.primaryGreen} />
                    <Text
                      style={styles.taglineText}
                      numberOfLines={2}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      {fd.tagline}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.locationRow}>
                  <PinIcon size={14} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2} />
                  <Text
                    style={styles.locationText}
                    numberOfLines={2}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {fd.location || t('product.farmLocation', 'Location not set')}
                  </Text>
                </View>

                <Text
                  style={styles.farmDescText}
                  numberOfLines={4}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {fd.aboutFarm ||
                    t('farmer.enterDescription', 'Update your farm details to add a description about your farming practices and produce.')}
                </Text>
              </View>

              <View style={styles.profileDivider} />

              <View style={styles.profileRight}>
                <View style={styles.infoBlock}>
                  <View style={[styles.infoIconBox, { backgroundColor: FARMER_THEME.colors.pastelYellow }]}>
                    <Ionicons name="calendar-outline" size={18} color={FARMER_THEME.colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.infoValue}
                      numberOfLines={1}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      {t('farmer.farmingSince', 'Since')} {fd.farmingSince || '-'}
                    </Text>
                    <Text
                      style={styles.infoLabel}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      {t('farmer.farmingSince', 'Farming Since')}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoBlock}>
                  <View style={[styles.infoIconBox, { backgroundColor: FARMER_THEME.colors.pastelGreen }]}>
                    <Ionicons name="leaf-outline" size={18} color={FARMER_THEME.colors.primaryGreen} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.infoValue}
                      numberOfLines={1}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      {fd.farmingType || '-'}
                    </Text>
                    <Text
                      style={styles.infoLabel}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      {t('farmer.farmingType', 'Farming Type')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </FarmerCard>

          {/* Stats Container */}
          <View style={styles.statsContainer}>
            <FarmerStatCard
              value={fd.farmArea || '0'}
              subLabel={fd.farmAreaUnit === 'ACRE' ? t('farmer.acres', 'Acres') : 'Hectares'}
              label={t('farmer.acres', 'Farm Area')}
              icon={<Ionicons name="map-outline" size={17} color={FARMER_THEME.colors.primaryGreen} />}
              iconBg={FARMER_THEME.colors.pastelGreen}
              style={styles.statItem}
              iconBoxStyle={styles.statIconBox}
              valueStyle={styles.statValueText}
              subLabelStyle={styles.statSubLabelText}
              labelStyle={styles.statLabelText}
            />
            <FarmerStatCard
              value={`${fd.cropsGrownCount || '0'}+`}
              subLabel={t('farmer.primaryCrops', 'Crops')}
              label={t('farmer.primaryCrops', 'Grown')}
              icon={<Ionicons name="flower-outline" size={17} color={FARMER_THEME.colors.warning} />}
              iconBg={FARMER_THEME.colors.pastelYellow}
              style={styles.statItem}
              iconBoxStyle={styles.statIconBox}
              valueStyle={styles.statValueText}
              subLabelStyle={styles.statSubLabelText}
              labelStyle={styles.statLabelText}
            />
            <FarmerStatCard
              value={`${fd.yearsExperience || '0'}+`}
              subLabel={t('farmer.years', 'Years')}
              label={t('farmer.experience', 'Experience')}
              icon={<Ionicons name="ribbon-outline" size={17} color={FARMER_THEME.colors.tealGreen} />}
              iconBg={FARMER_THEME.colors.pastelTeal}
              style={styles.statItem}
              iconBoxStyle={styles.statIconBox}
              valueStyle={styles.statValueText}
              subLabelStyle={styles.statSubLabelText}
              labelStyle={styles.statLabelText}
            />
            <FarmerStatCard
              value={`${fd.happyCustomersCount || '0'}+`}
              subLabel={t('home.bestSellers', 'Happy')}
              label={t('admin.totalCustomers', 'Customers')}
              icon={<Ionicons name="people-outline" size={17} color="#D9651B" />}
              iconBg={FARMER_THEME.colors.pastelRed}
              style={styles.statItem}
              iconBoxStyle={styles.statIconBox}
              valueStyle={styles.statValueText}
              subLabelStyle={styles.statSubLabelText}
              labelStyle={styles.statLabelText}
            />
          </View>

          {/* Farm Details Card */}
          <FarmerCard style={styles.detailsCard}>
            <Text
              style={styles.sectionTitle}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {t('farmer.farmDetails', 'Farm Details')}
            </Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailsCol}>
                <View style={styles.detailItem}>
                  <Ionicons name="person-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{t('auth.fullName', 'Farmer Name')}</Text>
                    <Text style={styles.detailValue}>{fd.farmerName || user?.name || '-'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{t('product.farmLocation', 'Location')}</Text>
                    <Text style={styles.detailValue}>{fd.location || '-'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="expand-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{t('farmer.acres', 'Farm Size')}</Text>
                    <Text style={styles.detailValue}>
                      {fd.farmArea ? `${fd.farmArea} ${fd.farmAreaUnit}` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="water-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{t('farmer.waterSource', 'Irrigation Source')}</Text>
                    <Text style={styles.detailValue}>{fd.irrigationSource || '-'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCol}>
                <View style={styles.detailItem}>
                  <Ionicons name="leaf-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{t('farmer.farmingType', 'Farming Type')}</Text>
                    <Text style={styles.detailValue}>{fd.farmingType || '-'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="basket-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{t('farmer.primaryCrops', 'Main Crops')}</Text>
                    <Text style={styles.detailValue}>{fd.mainCrops || '-'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{t('farmer.experience', 'Experience')}</Text>
                    <Text style={styles.detailValue}>
                      {fd.yearsExperience ? `${fd.yearsExperience}+ ${t('farmer.years', 'Years')}` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="triangle-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>{t('farmer.soilType', 'Soil Type')}</Text>
                    <Text style={styles.detailValue}>{fd.soilType || '-'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* About Box */}
            <View style={styles.aboutBox}>
              <View style={styles.aboutHeader}>
                <Ionicons name="leaf" size={18} color={FARMER_THEME.colors.primaryGreen} />
                <Text
                  style={styles.aboutTitle}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {t('farmer.farmDetails', 'About My Farm')}
                </Text>
              </View>
              <View style={styles.aboutContentRow}>
                <Text
                  style={styles.aboutText}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {fd.aboutFarm || t('farmer.enterDescription', 'Details about your farming approach will appear here.')}
                </Text>
                <Ionicons
                  name="home-outline"
                  size={56}
                  color={FARMER_THEME.colors.primaryGreen}
                  style={{ opacity: 0.15 }}
                />
              </View>
            </View>
          </FarmerCard>

          {/* Farm Photos Section */}
          <View style={styles.galleryCardWrapper}>
            <FarmerCard style={styles.galleryCard}>
              <View style={styles.galleryHeaderRow}>
                <Text
                  style={styles.galleryTitle}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {t('farmer.farmMedia', 'Farm Photos & Videos')}
                </Text>

                <View style={styles.galleryActionsRow}>
                  {isSelectionMode ? (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.actionSmallBtn,
                          styles.deleteActionBtn,
                          selectedGalleryIds.length === 0 && styles.disabledBtn,
                        ]}
                        onPress={handleDeleteSelected}
                        disabled={selectedGalleryIds.length === 0}
                      >
                        <TrashIcon size={14} color="#FFFFFF" strokeWidth={2} />
                        <Text style={styles.deleteActionText}>
                          {t('common.delete', 'Delete')} ({selectedGalleryIds.length})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionSmallBtn, styles.cancelActionBtn]}
                        onPress={() => {
                          setIsSelectionMode(false);
                          setSelectedGalleryIds([]);
                        }}
                      >
                        <Text style={styles.cancelActionText}>{t('common.cancel', 'Cancel')}</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.actionSmallBtn, styles.addPhotoBtn]}
                        onPress={handleAddPhoto}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="add" size={16} color="#FFFFFF" />
                            <Text style={styles.addPhotoText}>{t('common.add', 'Add')}</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {gallery.length > 0 && (
                        <TouchableOpacity
                          style={[styles.actionSmallBtn, styles.selectBtn]}
                          onPress={() => setIsSelectionMode(true)}
                        >
                          <TrashIcon size={14} color={FARMER_THEME.colors.error} strokeWidth={2} />
                          <Text style={styles.selectBtnText}>{t('common.select', 'Select')}</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>

              {gallery.length === 0 ? (
                <View style={styles.emptyGalleryBox}>
                  <Ionicons name="images-outline" size={40} color={FARMER_THEME.colors.placeholder} />
                  <Text style={styles.emptyGalleryText}>{t('farmer.noMedia', 'No farm media uploaded yet')}</Text>
                  <Text style={styles.emptyGallerySubtext}>
                    {t('farmer.noMediaDesc', 'Tap Add above to upload photos or videos of your farm')}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}
                >
                  {gallery.map((item) => {
                    const isSelected = selectedGalleryIds.includes(item.id);
                    const isVideo = item.fileType === 'VIDEO';
                    const mediaUrl = resolveMediaUrl(item.filePath || item.playbackUrl || item.imageUrl) || '';
                    const imageFailed = !!failedImageIds[item.id];

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.galleryItem,
                          isSelected && styles.galleryItemSelected,
                        ]}
                        onLongPress={() => {
                          if (!isSelectionMode) {
                            setIsSelectionMode(true);
                            setSelectedGalleryIds([item.id]);
                          }
                        }}
                        onPress={() => {
                          if (isSelectionMode) {
                            toggleSelection(item.id);
                          } else if (isVideo) {
                            handlePlayVideo(item);
                          } else if (mediaUrl) {
                            const photoIdx = galleryPhotos.findIndex((p) => p.id === item.id);
                            if (photoIdx >= 0) {
                              setPhotoModalLoading(true);
                              setActivePhotoIndex(photoIdx);
                            }
                          }
                        }}
                        delayLongPress={300}
                        activeOpacity={isSelectionMode ? 0.8 : 0.7}
                      >
                        {isVideo ? (
                          <VideoCard
                            style={styles.galleryImage}
                            blurred={isSelectionMode}
                          />
                        ) : mediaUrl && !imageFailed ? (
                          <Image
                            source={{ uri: mediaUrl }}
                            style={[
                              styles.galleryImage,
                              isSelectionMode && styles.galleryImageBlurred,
                            ]}
                            resizeMode="cover"
                            onError={() =>
                              setFailedImageIds((prev) => ({ ...prev, [item.id]: true }))
                            }
                          />
                        ) : (
                          <View style={styles.galleryImageFallback}>
                            <Ionicons name="image-outline" size={28} color={FARMER_THEME.colors.placeholder} />
                          </View>
                        )}

                        {!isSelectionMode && isVideo && (
                          <View style={styles.videoOverlay}>
                            <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                          </View>
                        )}

                        {!isSelectionMode && !isVideo && mediaUrl && !imageFailed && (
                          <View style={styles.photoExpandBadge}>
                            <Ionicons name="expand" size={13} color="#FFFFFF" />
                          </View>
                        )}

                        {isSelectionMode && (
                          <View style={styles.selectionOverlay}>
                            {isSelected ? (
                              <View style={styles.circleSelected}>
                                <CheckmarkIcon size={14} color="#FFFFFF" strokeWidth={2.6} />
                              </View>
                            ) : (
                              <View style={styles.circleUnselected} />
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </FarmerCard>
          </View>

          {/* Farm Verified Card */}
          <FarmerCard style={styles.verifiedCard}>
            <View style={styles.verifiedHeaderRow}>
              <View style={styles.verifiedIconWrap}>
                <Ionicons name="shield-checkmark" size={28} color={FARMER_THEME.colors.primaryGreen} />
              </View>
              <View style={styles.verifiedTexts}>
                <Text
                  style={styles.verifiedTitle}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {t('farmer.verifiedBadge', 'Farm Verified')}
                </Text>
                <Text
                  style={styles.verifiedDesc}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {t('farmer.verifiedDesc', 'Your farm has been officially verified by our team.')}
                </Text>
              </View>
            </View>

            <FarmerGoldButton
              title={t('farmer.certificate', 'View Certificate')}
              onPress={() => navigation.navigate('FarmCertificate', { farmDetails: fd })}
              compact
              style={{ marginTop: 12 }}
              icon={<Ionicons name="document-text-outline" size={16} color={FARMER_THEME.colors.headings} />}
            />
          </FarmerCard>

          {/* Edit Farm Details Button */}
          <View style={styles.bottomActionContainer}>
            <FarmerDeepButton
              title={t('farmer.editFarm', 'Edit Farm Details')}
              onPress={() => navigation.navigate('EditFarmDetails', { farmDetails: fd })}
              icon={<EditIcon size={20} color="#FFFFFF" strokeWidth={2} />}
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Full-Screen Video Modal (like Shorts player) ── */}
      <Modal
        visible={!!videoModalUrl}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVideoModalUrl(null)}
      >
        <StatusBar hidden />
        <View style={styles.videoModalContainer}>
          {/* Video Player */}
          {videoModalUrl ? (
            <Video
              ref={videoRef}
              source={{ uri: videoModalUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={!isVideoPaused}
              isMuted={isVideoMuted}
              onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                if (status.isLoaded) {
                  setIsVideoBuffering(status.isBuffering);
                }
              }}
              onError={() => {
                setVideoModalUrl(null);
                Alert.alert(t('common.error', 'Error'), t('errors.generic', 'Could not play video.'));
              }}
            />
          ) : null}

          {/* Dark gradient overlay at top and bottom */}
          <View style={styles.videoModalTopGradient} pointerEvents="none" />
          <View style={styles.videoModalBottomGradient} pointerEvents="none" />

          {/* Buffering Spinner */}
          {isVideoBuffering && (
            <View style={styles.videoModalSpinner} pointerEvents="none">
              <ActivityIndicator size="large" color="#2FA66B" />
            </View>
          )}

          {/* Top Bar: Close + Mute */}
          <View style={[styles.videoModalTopBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.videoModalCircleBtn}
              onPress={() => setVideoModalUrl(null)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.videoModalCircleBtn}
              onPress={() => setIsVideoMuted(prev => !prev)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={isVideoMuted ? 'volume-mute' : 'volume-high'}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Centre Tap: Play / Pause toggle */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setIsVideoPaused(prev => !prev)}
            activeOpacity={1}
          >
            {isVideoPaused && (
              <View style={styles.videoModalPauseIcon}>
                <Ionicons name="play" size={48} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Full-Screen Photo Viewer Modal ── */}
      <Modal
        visible={!!activePhotoUri}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActivePhotoIndex(null)}
      >
        <View style={styles.photoModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <View style={[styles.photoModalTopBar, { paddingTop: insets.top + 10 }]}>
            <View style={styles.photoCounterPill}>
              <Text style={styles.photoCounterText}>
                {activePhotoIndex !== null ? `${activePhotoIndex + 1} / ${galleryPhotos.length}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.videoModalCircleBtn}
              onPress={() => setActivePhotoIndex(null)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.photoModalBody}>
            {photoModalLoading && (
              <View style={styles.videoModalSpinner} pointerEvents="none">
                <ActivityIndicator size="large" color="#2FA66B" />
              </View>
            )}
            {activePhotoUri ? (
              <Image
                source={{ uri: activePhotoUri }}
                style={styles.photoModalImage}
                resizeMode="contain"
                onLoadEnd={() => setPhotoModalLoading(false)}
                onError={() => setPhotoModalLoading(false)}
              />
            ) : null}

            {galleryPhotos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.photoNavBtn, styles.photoNavLeft]}
                  onPress={showPrevPhoto}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoNavBtn, styles.photoNavRight]}
                  onPress={showNextPhoto}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: FARMER_THEME.spacing.tabBottomPadding,
  },
  contentWrapper: {
    paddingHorizontal: FARMER_THEME.spacing.pagePadding,
    paddingTop: 16,
    gap: FARMER_THEME.spacing.cardGap,
  },
  farmProfileCard: {
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
  },
  profileLeft: {
    flex: 1.3,
    paddingRight: 6,
  },
  farmNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  farmNameText: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 19,
    lineHeight: 24,
    color: FARMER_THEME.colors.headings,
    flexShrink: 1,
  },
  verifiedCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: FARMER_THEME.colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  taglineText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 13,
    color: FARMER_THEME.colors.primaryGreen,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  locationText: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.textSecondary,
    flexShrink: 1,
  },
  farmDescText: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.bodyText,
    lineHeight: 18,
  },
  profileDivider: {
    width: 1,
    backgroundColor: FARMER_THEME.colors.divider,
    marginHorizontal: 8,
  },
  profileRight: {
    flex: 0.85,
    justifyContent: 'center',
    gap: 12,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoValue: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: FARMER_THEME.colors.headings,
  },
  infoLabel: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 10,
    color: FARMER_THEME.colors.textSecondary,
    marginTop: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statItem: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 9,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValueText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 16.5,
    lineHeight: 20,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
  },
  statSubLabelText: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: FARMER_THEME.colors.primaryGreen,
    marginTop: 1,
    textAlign: 'center',
  },
  statLabelText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 10,
    lineHeight: 12,
    color: FARMER_THEME.colors.textSecondary,
    marginTop: 1,
    textAlign: 'center',
  },
  detailsCard: {
    padding: 18,
  },
  sectionTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 20,
    color: FARMER_THEME.colors.headings,
    marginBottom: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsCol: {
    flex: 1,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailIcon: {
    marginTop: 2,
  },
  detailLabel: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 11,
    color: FARMER_THEME.colors.textSecondary,
  },
  detailValue: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13,
    color: FARMER_THEME.colors.headings,
    marginTop: 2,
  },
  aboutBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: FARMER_THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.inputBorder,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  aboutTitle: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13,
    color: FARMER_THEME.colors.headings,
  },
  aboutContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  aboutText: {
    flex: 1,
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.bodyText,
    lineHeight: 19,
  },
  galleryCardWrapper: {
    marginTop: 4,
  },
  galleryCard: {
    padding: 16,
  },
  galleryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  galleryTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 16.5,
    color: FARMER_THEME.colors.headings,
    flexShrink: 1,
    marginRight: 6,
  },
  galleryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  actionSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addPhotoBtn: {
    backgroundColor: '#17663F',
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  addPhotoText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  selectBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 3,
  },
  selectBtnText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11.5,
    color: FARMER_THEME.colors.error,
  },
  deleteActionBtn: {
    backgroundColor: FARMER_THEME.colors.error,
  },
  deleteActionText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  cancelActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  cancelActionText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 12,
    color: FARMER_THEME.colors.textSecondary,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  emptyGalleryBox: {
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGalleryText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14,
    color: FARMER_THEME.colors.headings,
    marginTop: 8,
  },
  emptyGallerySubtext: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 12,
    color: FARMER_THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  galleryScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  galleryItem: {
    width: 105,
    height: 105,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: FARMER_THEME.colors.cardBorder,
  },
  galleryItemSelected: {
    borderColor: FARMER_THEME.colors.chipBorderActive,
    borderWidth: 2,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryImageBlurred: {
    opacity: 0.6,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  circleSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: FARMER_THEME.colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  verifiedCard: {
    padding: 16,
  },
  verifiedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifiedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: FARMER_THEME.colors.pastelGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTexts: {
    flex: 1,
  },
  verifiedTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 17,
    color: FARMER_THEME.colors.headings,
  },
  verifiedDesc: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 12.5,
    color: FARMER_THEME.colors.textSecondary,
    marginTop: 2,
  },
  bottomActionContainer: {
    marginTop: 10,
    marginBottom: 16,
  },

  // ── Video Modal Styles ──
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoModalTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  videoModalBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  videoModalSpinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  videoModalCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  videoModalPauseIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  galleryImageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoExpandBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  photoModalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  photoCounterPill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  photoModalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  photoNavBtn: {
    position: 'absolute',
    top: '46%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNavLeft: {
    left: 14,
  },
  photoNavRight: {
    right: 14,
  },
});

export default MyFarmScreen;
