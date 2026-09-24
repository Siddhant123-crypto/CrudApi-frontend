import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getMyGallery, uploadGalleryFile, deleteGalleryFile } from '../services/farmGalleryService';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/api';
import { getFarmDetails } from '../services/farmDetailsService';
import { getFarmerById } from '../services/farmerService';
const VideoCard = ({ style, blurred }: { style: any; blurred: boolean }) => (
  <View style={[style, { backgroundColor: '#0F3320', justifyContent: 'center', alignItems: 'center', opacity: blurred ? 0.6 : 1 }]}>
    <View style={{
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.70)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    }}>
      <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
    </View>
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    }}>
      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>VIDEO</Text>
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
        getFarmerById(user.farmerId).catch(() => null)
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
    setSelectedGalleryIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
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
                await deleteGalleryFile(id).catch(err => console.log('Failed to delete', id, err));
              }
              setGallery(prev => prev.filter(item => !selectedGalleryIds.includes(item.id)));
              setIsSelectionMode(false);
              setSelectedGalleryIds([]);
              Alert.alert('Success', 'Selected items deleted successfully');
            } catch (error) {
              console.log('Delete error:', error);
              Alert.alert('Error', 'Failed to delete some items');
            } finally {
              setLoading(false);
            }
          }
        }
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#176B2C" />
      </View>
    );
  }
  const fd = farmDetails || {};
  const isVerified = true;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {}
          <View style={styles.headerBlock}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Farm</Text>
              </View>

            </View>
          </View>
          {}
          <View style={styles.mainContentCard}>
            {}
            <View style={styles.farmProfileCard}>
              <View style={styles.profileRow}>
                <View style={styles.profileLeft}>
                  <View style={styles.farmNameRow}>
                    <Text style={styles.farmNameText}>{fd.farmName || 'Your Farm Name'}</Text>
                    {isVerified && <Ionicons name="checkmark-circle" size={18} color="#176B2C" style={styles.verifiedIcon} />}
                  </View>
                  <View style={styles.taglineRow}>
                    <Ionicons name="leaf-outline" size={14} color="#176B2C" />
                    <Text style={styles.taglineText} numberOfLines={1}>{fd.tagline || 'Add a tagline'}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#647064" />
                    <Text style={styles.locationText} numberOfLines={1}>{fd.location || 'Location not set'}</Text>
                  </View>
                  <Text style={styles.farmDescText} numberOfLines={4}>
                    {fd.aboutFarm || 'Update your farm details to add a description about your farming practices and produce.'}
                  </Text>
                </View>
                <View style={styles.profileDivider} />
                <View style={styles.profileRight}>
                  <View style={styles.infoBlock}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="calendar-outline" size={20} color="#176B2C" />
                    </View>
                    <View>
                      <Text style={styles.infoValue}>Since {fd.farmingSince || '-'}</Text>
                      <Text style={styles.infoLabel}>Farming Since</Text>
                    </View>
                  </View>
                  <View style={styles.infoBlock}>
                    <View style={styles.infoIconBox}>
                      <Ionicons name="leaf-outline" size={20} color="#176B2C" />
                    </View>
                    <View>
                      <Text style={styles.infoValue}>{fd.farmingType || '-'}</Text>
                      <Text style={styles.infoLabel}>Farming Type</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <Ionicons name="map-outline" size={26} color="#176B2C" />
                </View>
                <View style={styles.statTexts}>
                  <Text style={styles.statVal}>{fd.farmArea || '0'}</Text>
                  <Text style={styles.statSubVal}>{fd.farmAreaUnit === 'ACRE' ? 'Acres' : 'Hectares'}</Text>
                  <Text style={styles.statDesc}>Farm Area</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <Ionicons name="flower-outline" size={26} color="#176B2C" />
                </View>
                <View style={styles.statTexts}>
                  <Text style={styles.statVal}>{fd.cropsGrownCount || '0'}+</Text>
                  <Text style={styles.statSubVal}>Crops</Text>
                  <Text style={styles.statDesc}>Grown</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <Ionicons name="ribbon-outline" size={26} color="#176B2C" />
                </View>
                <View style={styles.statTexts}>
                  <Text style={styles.statVal}>{fd.yearsExperience || '0'}+</Text>
                  <Text style={styles.statSubVal}>Years</Text>
                  <Text style={styles.statDesc}>Experience</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconBox}>
                  <Ionicons name="people-outline" size={26} color="#176B2C" />
                </View>
                <View style={styles.statTexts}>
                  <Text style={styles.statVal}>{fd.happyCustomersCount || '0'}+</Text>
                  <Text style={styles.statSubVal}>Happy</Text>
                  <Text style={styles.statDesc}>Customers</Text>
                </View>
              </View>
            </View>
            {}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Farm Details</Text>
              <View style={styles.detailsGrid}>
                {}
                <View style={styles.detailsCol}>
                  <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={22} color="#176B2C" style={styles.detailIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Farmer Name</Text>
                      <Text style={styles.detailValue}>{fd.farmerName || user?.name || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={22} color="#176B2C" style={styles.detailIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{fd.location || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="expand-outline" size={22} color="#176B2C" style={styles.detailIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Farm Size</Text>
                      <Text style={styles.detailValue}>{fd.farmArea ? `${fd.farmArea} ${fd.farmAreaUnit}` : '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="water-outline" size={22} color="#176B2C" style={styles.detailIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Irrigation Source</Text>
                      <Text style={styles.detailValue}>{fd.irrigationSource || '-'}</Text>
                    </View>
                  </View>
                </View>
                {}
                <View style={styles.detailsCol}>
                  <View style={styles.detailItem}>
                    <Ionicons name="leaf-outline" size={22} color="#176B2C" style={styles.detailIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Farming Type</Text>
                      <Text style={styles.detailValue}>{fd.farmingType || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="basket-outline" size={22} color="#176B2C" style={styles.detailIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Main Crops</Text>
                      <Text style={styles.detailValue}>{fd.mainCrops || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={22} color="#176B2C" style={styles.detailIcon} />
                    <View>
                      <Text style={styles.detailLabel}>Experience</Text>
                      <Text style={styles.detailValue}>{fd.yearsExperience ? `${fd.yearsExperience}+ Years` : '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="triangle-outline" size={22} color="#176B2C" style={styles.detailIcon} />
                    <View>
                      <Text style={styles.detailLabel}>Soil Type</Text>
                      <Text style={styles.detailValue}>{fd.soilType || '-'}</Text>
                    </View>
                  </View>
                </View>
              </View>
              {}
              {}
              <View style={styles.aboutBox}>
                <View style={styles.aboutHeader}>
                  <Ionicons name="leaf" size={20} color="#176B2C" />
                  <Text style={styles.aboutTitle}>About My Farm</Text>
                </View>
                <View style={styles.aboutContentRow}>
                  <Text style={styles.aboutText}>
                    {fd.aboutFarm || 'Details about your farming approach will appear here.'}
                  </Text>
                  <Ionicons name="home-outline" size={68} color="#176B2C" style={{ opacity: 0.2 }} />
                </View>
              </View>
            </View>
            {}
            <View style={styles.gallerySection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#176B2C' }}>Farm Photos</Text>
                <View style={styles.actionButtonsRow}>
                  {isSelectionMode ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteActionBtn, selectedGalleryIds.length === 0 && styles.disabledBtn]}
                        onPress={handleDeleteSelected}
                        disabled={selectedGalleryIds.length === 0}
                      >
                        <Ionicons name="trash" size={16} color="#FFFFFF" />
                        <Text style={styles.deleteActionText}>Delete ({selectedGalleryIds.length})</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelActionBtn]}
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
                      <TouchableOpacity style={[styles.actionBtn, styles.addPhotoBtn]} onPress={handleAddPhoto} disabled={uploading}>
                        {uploading ? (
                          <ActivityIndicator size="small" color="#176B2C" />
                        ) : (
                          <>
                            <Ionicons name="add" size={16} color="#176B2C" />
                            <Text style={styles.actionText}>Add Photo</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      {gallery.length > 0 && (
                        <TouchableOpacity style={[styles.actionBtn, styles.selectBtn]} onPress={() => setIsSelectionMode(true)}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
              {gallery.length === 0 ? (
                <View style={styles.emptyGalleryBox}>
                  <Ionicons name="image-outline" size={32} color="#B8DDBB" />
                  <Text style={styles.emptyGalleryText}>No farm photos yet</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                  {gallery.map((item) => {
                    const isSelected = selectedGalleryIds.includes(item.id);
                    const sanitizedPath = item.filePath ? item.filePath.replace(/\\/g, '/') : '';
                    const mediaUrl = `${BASE_URL}/${sanitizedPath}`;
                    const isVideo = item.fileType === 'VIDEO';
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.galleryItem}
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
                        activeOpacity={isSelectionMode ? 0.8 : 0.5}
                      >
                        {isVideo ? (
                          <VideoCard
                            style={styles.galleryImage}
                            blurred={isSelectionMode}
                          />
                        ) : (
                          <Image
                            source={{ uri: mediaUrl }}
                            style={[styles.galleryImage, isSelectionMode && styles.galleryImageBlurred]}
                            resizeMode="cover"
                          />
                        )}
                        {}
                        {!isSelectionMode && isVideo && (
                          <View style={styles.videoOverlay}>
                            <Ionicons name="play-circle" size={36} color="#FFFFFF" />
                          </View>
                        )}
                        {}
                        {isSelectionMode && (
                          <View style={styles.selectionOverlay}>
                            {isSelected ? (
                              <View style={styles.circleSelected}>
                                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
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
            </View>
            {}
            <View style={styles.verifiedCard}>
              <View style={styles.verifiedIconWrap}>
                <Ionicons name="shield-checkmark" size={32} color="#176B2C" />
              </View>
              <View style={styles.verifiedTexts}>
                <Text style={styles.verifiedTitle}>Farm Verified</Text>
                <Text style={styles.verifiedDesc}>Your farm has been verified by our team.</Text>
                <Text style={styles.verifiedDate}>Verified on 12 Jan 2025</Text>
              </View>
              <TouchableOpacity style={styles.certBtn} onPress={() => navigation.navigate('FarmCertificate', { farmDetails: fd })}>
                <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
                <Text style={styles.certBtnText}>View Certificate</Text>
              </TouchableOpacity>
            </View>
            {}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditFarmDetails', { farmDetails: fd })}
            >
              <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Edit Farm Details</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E5631',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerBlock: {
    backgroundColor: '#1E5631',
    paddingTop: Platform.OS === 'android' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 70,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  headerIconButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1E5631',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  mainContentCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    marginTop: -30,
  },
  farmProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: -20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#EAF6D8',
  },
  profileRow: {
    flexDirection: 'row',
  },
  profileLeft: {
    flex: 1.1,
    paddingRight: 6,
  },
  farmNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  farmNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#176B2C',
    marginRight: 6,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taglineText: {
    fontSize: 14,
    color: '#647064',
    marginLeft: 6,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#647064',
    marginLeft: 6,
    flexShrink: 1,
  },
  farmDescText: {
    fontSize: 14,
    color: '#172117',
    lineHeight: 20,
  },
  profileDivider: {
    width: 1,
    backgroundColor: '#EAF6D8',
    marginHorizontal: 10,
  },
  profileRight: {
    flex: 1.0,
    justifyContent: 'center',
    gap: 12,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1FAF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#172117',
    flexShrink: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#647064',
    marginTop: 2,
    flexShrink: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 2,
    paddingVertical: 12,
    paddingHorizontal: 2,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#176B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#EAF6D8',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1FAF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTexts: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#172117',
    textAlign: 'center',
  },
  statSubVal: {
    fontSize: 10,
    color: '#647064',
    fontWeight: '700',
    textAlign: 'center',
  },
  statDesc: {
    fontSize: 9,
    color: '#647064',
    marginTop: 2,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#EAF6D8',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#176B2C',
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
  },
  detailsCol: {
    flex: 1,
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#647064',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#172117',
    paddingRight: 4,
    flexShrink: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  addPhotoBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8DDBB',
  },
  selectBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FCA5A5',
  },
  deleteActionBtn: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  cancelActionBtn: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#176B2C',
    marginLeft: 4,
  },
  deleteActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  cancelActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  galleryImageBlurred: {
    opacity: 0.6,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleSelected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#176B2C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleUnselected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  aboutBox: {
    backgroundColor: '#F1FAF2',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#176B2C',
    marginLeft: 8,
  },
  aboutContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutText: {
    flex: 1,
    fontSize: 14,
    color: '#172117',
    lineHeight: 22,
    marginRight: 16,
  },
  gallerySection: {
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  addPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#176B2C',
    marginLeft: 4,
  },
  emptyGalleryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAF6D8',
    borderStyle: 'dashed',
  },
  emptyGalleryText: {
    color: '#647064',
    fontSize: 13,
    marginTop: 8,
  },
  galleryScroll: {
    gap: 12,
    paddingRight: 16,
  },
  galleryItem: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EAF6D8',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D1E6D3',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    backgroundColor: '#EAF6D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1FAF2',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#B8DDBB',
  },
  verifiedIconWrap: {
    marginRight: 12,
  },
  verifiedTexts: {
    flex: 1,
  },
  verifiedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#176B2C',
  },
  verifiedDesc: {
    fontSize: 11,
    color: '#172117',
    marginTop: 2,
    marginBottom: 4,
  },
  verifiedDate: {
    fontSize: 10,
    color: '#647064',
  },
  certBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#176B2C',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#176B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  certBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  editBtn: {
    flexDirection: 'row',
    backgroundColor: '#176B2C',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#176B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  }
});
export default MyFarmScreen;
