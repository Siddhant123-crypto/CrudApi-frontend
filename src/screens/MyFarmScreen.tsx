import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getMyGallery, uploadGalleryFile, deleteGalleryFile } from '../services/farmGalleryService';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/api';
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
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [farmDetails, setFarmDetails] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>([]);

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
            'Account Blocked',
            `Your account has been blocked by the admin.\n\nReason: ${farmerDetails.blockReason}`,
            [{ text: 'OK', onPress: () => logout() }]
          );
          return;
        }
      }

      if (detailsResponse && detailsResponse.data) {
        setFarmDetails(detailsResponse.data);
      }
      if (galleryResponse && galleryResponse.data) {
        setGallery(galleryResponse.data);
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
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload media.');
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
      Alert.alert('Success', 'File uploaded successfully');
      const galleryResponse = await getMyGallery().catch(() => ({ data: [] }));
      if (galleryResponse && galleryResponse.data) {
        setGallery(galleryResponse.data);
      }
    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
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
      'Delete Selected',
      `Are you sure you want to delete ${selectedGalleryIds.length} item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
              Alert.alert('Success', 'Selected items deleted successfully');
            } catch (error) {
              console.log('Delete error:', error);
              Alert.alert('Error', 'Failed to delete some items');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handlePlayVideo = (filePath: string) => {
    const videoUrl = `${BASE_URL}/${filePath}`;
    Linking.openURL(videoUrl).catch(() =>
      Alert.alert('Error', 'Could not open video.')
    );
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

  return (
    <FarmerPageBackground>
      {/* Header */}
      <FarmerHeader
        variant="tab"
        title="My Farm"
        subtitle="Farm overview, details & gallery"
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
                    {fd.farmName || fd.farmerName || user?.name || 'Your Farm Name'}
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
                    {fd.location || 'Location not set'}
                  </Text>
                </View>

                <Text
                  style={styles.farmDescText}
                  numberOfLines={4}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {fd.aboutFarm ||
                    'Update your farm details to add a description about your farming practices and produce.'}
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
                      Since {fd.farmingSince || '-'}
                    </Text>
                    <Text
                      style={styles.infoLabel}
                      maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                    >
                      Farming Since
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
                      Farming Type
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
              subLabel={fd.farmAreaUnit === 'ACRE' ? 'Acres' : 'Hectares'}
              label="Farm Area"
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
              subLabel="Crops"
              label="Grown"
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
              subLabel="Years"
              label="Experience"
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
              subLabel="Happy"
              label="Customers"
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
              Farm Details
            </Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailsCol}>
                <View style={styles.detailItem}>
                  <Ionicons name="person-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Farmer Name</Text>
                    <Text style={styles.detailValue}>{fd.farmerName || user?.name || '-'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{fd.location || '-'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="expand-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Farm Size</Text>
                    <Text style={styles.detailValue}>
                      {fd.farmArea ? `${fd.farmArea} ${fd.farmAreaUnit}` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="water-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Irrigation Source</Text>
                    <Text style={styles.detailValue}>{fd.irrigationSource || '-'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsCol}>
                <View style={styles.detailItem}>
                  <Ionicons name="leaf-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Farming Type</Text>
                    <Text style={styles.detailValue}>{fd.farmingType || '-'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="basket-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Main Crops</Text>
                    <Text style={styles.detailValue}>{fd.mainCrops || '-'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Experience</Text>
                    <Text style={styles.detailValue}>
                      {fd.yearsExperience ? `${fd.yearsExperience}+ Years` : '-'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="triangle-outline" size={20} color={FARMER_THEME.colors.primaryGreen} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Soil Type</Text>
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
                  About My Farm
                </Text>
              </View>
              <View style={styles.aboutContentRow}>
                <Text
                  style={styles.aboutText}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {fd.aboutFarm || 'Details about your farming approach will appear here.'}
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
                  Farm Photos & Videos
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
                          Delete ({selectedGalleryIds.length})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionSmallBtn, styles.cancelActionBtn]}
                        onPress={() => {
                          setIsSelectionMode(false);
                          setSelectedGalleryIds([]);
                        }}
                      >
                        <Text style={styles.cancelActionText}>Cancel</Text>
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
                            <Text style={styles.addPhotoText}>Add</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {gallery.length > 0 && (
                        <TouchableOpacity
                          style={[styles.actionSmallBtn, styles.selectBtn]}
                          onPress={() => setIsSelectionMode(true)}
                        >
                          <TrashIcon size={14} color={FARMER_THEME.colors.error} strokeWidth={2} />
                          <Text style={styles.selectBtnText}>Select</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>

              {gallery.length === 0 ? (
                <View style={styles.emptyGalleryBox}>
                  <Ionicons name="images-outline" size={40} color={FARMER_THEME.colors.placeholder} />
                  <Text style={styles.emptyGalleryText}>No farm media uploaded yet</Text>
                  <Text style={styles.emptyGallerySubtext}>
                    Tap Add above to upload photos or videos of your farm
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
                    const sanitizedPath = item.filePath ? item.filePath.replace(/\\/g, '/') : '';
                    const mediaUrl = `${BASE_URL}/${sanitizedPath}`;
                    const isVideo = item.fileType === 'VIDEO';

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
                            handlePlayVideo(item.filePath);
                          }
                        }}
                        delayLongPress={300}
                        activeOpacity={isSelectionMode ? 0.8 : 0.6}
                      >
                        {isVideo ? (
                          <VideoCard
                            style={styles.galleryImage}
                            blurred={isSelectionMode}
                          />
                        ) : (
                          <Image
                            source={{ uri: mediaUrl }}
                            style={[
                              styles.galleryImage,
                              isSelectionMode && styles.galleryImageBlurred,
                            ]}
                            resizeMode="cover"
                          />
                        )}

                        {!isSelectionMode && isVideo && (
                          <View style={styles.videoOverlay}>
                            <Ionicons name="play-circle" size={32} color="#FFFFFF" />
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
                  Farm Verified
                </Text>
                <Text
                  style={styles.verifiedDesc}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  Your farm has been officially verified by our team.
                </Text>
              </View>
            </View>

            <FarmerGoldButton
              title="View Certificate"
              onPress={() => navigation.navigate('FarmCertificate', { farmDetails: fd })}
              compact
              style={{ marginTop: 12 }}
              icon={<Ionicons name="document-text-outline" size={16} color={FARMER_THEME.colors.headings} />}
            />
          </FarmerCard>

          {/* Edit Farm Details Button */}
          <View style={styles.bottomActionContainer}>
            <FarmerDeepButton
              title="Edit Farm Details"
              onPress={() => navigation.navigate('EditFarmDetails', { farmDetails: fd })}
              icon={<EditIcon size={20} color="#FFFFFF" strokeWidth={2} />}
            />
          </View>
        </View>
      </ScrollView>
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
});

export default MyFarmScreen;
