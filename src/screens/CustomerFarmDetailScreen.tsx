import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, { resolveMediaUrl } from '../services/api';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface FarmDetailsResponse {
  id: string;
  farmerId: string;
  farmName: string;
  tagline: string;
  location: string;
  farmingSince: number;
  farmingType: string;
  farmArea: number;
  farmAreaUnit: string;
  cropsGrownCount: number;
  yearsExperience: number;
  happyCustomersCount: number;
  farmerName: string;
  mainCrops: string;
  irrigationSource: string;
  soilType: string;
  aboutFarm: string;
  farmerPhoto: string | null;
  farmVideo: string | null;
  verified: boolean;
}

interface FarmGalleryResponse {
  id: string;
  farmerId: string;
  filePath: string;
  fileType: string;
}

export default function CustomerFarmDetailScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { farm }: { farm: FarmDetailsResponse } = route.params;
  const [gallery, setGallery] = useState<FarmGalleryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [photoModalLoading, setPhotoModalLoading] = useState(false);

  const galleryPhotos = gallery
    .filter((item) => item.fileType !== 'VIDEO')
    .map((item) => ({
      id: item.id,
      uri: resolveMediaUrl(item.filePath) || '',
    }))
    .filter((p) => !!p.uri);

  const activePhotoUri =
    activePhotoIndex !== null && galleryPhotos[activePhotoIndex]
      ? galleryPhotos[activePhotoIndex].uri
      : null;

  useFocusEffect(
    useCallback(() => {
      fetchGallery();
    }, [farm.farmerId])
  );

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/farm-gallery/farmer/${farm.farmerId}`);
      if (response.data && response.data.data) {
        setGallery(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching farm gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageBackground style={styles.safeArea}>
      <ThemedHeader
        variant="inner"
        title={farm.farmName || 'Farm Details'}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.titleText}>{farm.farmName || 'Unnamed Farm'}</Text>
            {farm.verified && <Ionicons name="checkmark-circle" size={24} color="#2E7D4F" style={styles.verifiedIcon} />}
          </View>
          <Text style={styles.taglineText}>🌿 {farm.tagline || 'Fresh from the root'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#B8470F" />
            <Text style={styles.locationText}>{farm.location}</Text>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="map-outline" size={24} color="#B8470F" />
            <Text style={styles.statValue}>{farm.farmArea}</Text>
            <Text style={styles.statLabel}>{farm.farmAreaUnit}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="leaf-outline" size={24} color="#B8470F" />
            <Text style={styles.statValue}>{farm.farmingType}</Text>
            <Text style={styles.statLabel}>{t('farmer.farming', 'Farming')}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="calendar-outline" size={24} color="#B8470F" />
            <Text style={styles.statValue}>{farm.yearsExperience}+</Text>
            <Text style={styles.statLabel}>{t('farmer.years', 'Years')}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="people-outline" size={24} color="#B8470F" />
            <Text style={styles.statValue}>{farm.happyCustomersCount}+</Text>
            <Text style={styles.statLabel}>{t('farmer.happyUsers', 'Happy Users')}</Text>
          </View>
        </View>
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>{t('farmer.farmDetails', 'Farm Details')}</Text>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Ionicons name="person-outline" size={16} color="#B8470F" />
                <Text style={styles.detailLabel}>{t('orders.farmer', 'Farmer Name')}</Text>
              </View>
              <Text style={styles.detailValue}>{farm.farmerName}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Ionicons name="basket-outline" size={16} color="#B8470F" />
                <Text style={styles.detailLabel}>{t('farmer.mainCrops', 'Main Crops')}</Text>
              </View>
              <Text style={styles.detailValue}>{farm.mainCrops}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Ionicons name="water-outline" size={16} color="#B8470F" />
                <Text style={styles.detailLabel}>{t('farmer.irrigation', 'Irrigation')}</Text>
              </View>
              <Text style={styles.detailValue}>{farm.irrigationSource}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Ionicons name="earth-outline" size={16} color="#B8470F" />
                <Text style={styles.detailLabel}>{t('farmer.soilType', 'Soil Type')}</Text>
              </View>
              <Text style={styles.detailValue}>{farm.soilType}</Text>
            </View>
          </View>
          {farm.aboutFarm && (
            <View style={styles.aboutBox}>
              <View style={styles.detailHeader}>
                <Ionicons name="information-circle-outline" size={18} color="#B8470F" />
                <Text style={[styles.detailLabel, { fontSize: 16, fontFamily: THEME.fonts.bold, color: '#3B1A0E' }]}>{t('farmer.aboutMyFarm', 'About My Farm')}</Text>
              </View>
              <Text style={styles.aboutText}>{farm.aboutFarm}</Text>
            </View>
          )}
        </View>
        <View style={styles.gallerySection}>
          <Text style={styles.sectionTitle}>{t('farmer.farmGallery', 'Farm Gallery')}</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#B8470F" style={{ marginTop: 20 }} />
          ) : gallery.length === 0 && (!farm.farmVideo || farm.farmVideo === 'null') ? (
            <View style={styles.emptyGallery}>
              <Ionicons name="images-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyGalleryText}>No photos or videos available.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {farm.farmVideo && farm.farmVideo !== 'null' && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setPlayingVideoId('primary')}
                  style={styles.galleryItem}
                >
                  <View style={[styles.galleryMedia, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="videocam" size={40} color="rgba(255,255,255,0.8)" />
                    <Text style={{ color: '#fff', marginTop: 8 }}>{t('farmer.videoPlayer', 'Video Player')}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {gallery.map(file => {
                const mediaUrl = resolveMediaUrl(file.filePath) || '';
                return (
                <View key={file.id} style={styles.galleryItem}>
                  {file.fileType === 'VIDEO' ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setPlayingVideoId(file.id)}
                      style={{ flex: 1 }}
                    >
                      <View style={[styles.galleryMedia, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="videocam" size={40} color="rgba(255,255,255,0.8)" />
                        <Text style={{ color: '#fff', marginTop: 8 }}>{t('farmer.videoPlayer', 'Video Player')}</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={{ flex: 1 }}
                      onPress={() => {
                        const idx = galleryPhotos.findIndex((p) => p.id === file.id);
                        if (idx >= 0) {
                          setPhotoModalLoading(true);
                          setActivePhotoIndex(idx);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: mediaUrl }}
                        style={styles.galleryMedia}
                        resizeMode="cover"
                      />
                      <View style={styles.photoExpandBadge}>
                        <Ionicons name="expand" size={14} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>

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
              style={styles.photoCloseBtn}
              onPress={() => setActivePhotoIndex(null)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.photoModalBody}>
            {photoModalLoading && (
              <View style={styles.photoModalSpinner} pointerEvents="none">
                <ActivityIndicator size="large" color="#FFFFFF" />
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
            {galleryPhotos.length > 1 && activePhotoIndex !== null && (
              <>
                <TouchableOpacity
                  style={[styles.photoNavBtn, styles.photoNavLeft]}
                  onPress={() => {
                    setPhotoModalLoading(true);
                    setActivePhotoIndex((activePhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length);
                  }}
                >
                  <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoNavBtn, styles.photoNavRight]}
                  onPress={() => {
                    setPhotoModalLoading(true);
                    setActivePhotoIndex((activePhotoIndex + 1) % galleryPhotos.length);
                  }}
                >
                  <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </PageBackground>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    backgroundColor: '#FFFDF8',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    shadowColor: 'rgba(90,40,15,0.08)',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleText: {
    fontFamily: THEME.fonts.serif,
    fontSize: 24,
    color: '#3B1A0E',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  taglineText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: '#8A6F5C',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13.5,
    color: '#5C4433',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: '#FFFDF8',
    width: (width - 64) / 4,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    alignItems: 'center',
    shadowColor: 'rgba(90,40,15,0.06)',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statValue: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#3B1A0E',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 10.5,
    color: '#8A6F5C',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: '#FFFDF8',
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    padding: 20,
    shadowColor: 'rgba(90,40,15,0.06)',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: THEME.fonts.serif,
    fontSize: 20,
    color: '#3B1A0E',
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12.5,
    color: '#8A6F5C',
    marginLeft: 6,
  },
  detailValue: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#3B1A0E',
    paddingLeft: 22,
  },
  aboutBox: {
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: '#F1DCC6',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  aboutText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13.5,
    color: '#5C4433',
    lineHeight: 22,
    marginTop: 8,
  },
  gallerySection: {
    backgroundColor: '#FFFDF8',
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    padding: 20,
    shadowColor: 'rgba(90,40,15,0.06)',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 20,
  },
  galleryScroll: {
    gap: 12,
  },
  galleryItem: {
    width: 220,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: '#F0E1CF',
    position: 'relative',
  },
  galleryMedia: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -20,
    marginLeft: -20,
    zIndex: 10,
  },
  emptyGallery: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyGalleryText: {
    fontFamily: THEME.fonts.medium,
    marginTop: 10,
    color: '#8A6F5C',
    fontSize: 14,
  },
  photoExpandBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
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
  photoCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  photoModalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalSpinner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalImage: {
    width,
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
