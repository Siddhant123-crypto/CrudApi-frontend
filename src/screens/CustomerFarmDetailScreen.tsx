import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, { BASE_URL } from '../services/api';
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
  const { farm }: { farm: FarmDetailsResponse } = route.params;
  const [gallery, setGallery] = useState<FarmGalleryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: farm.farmName || 'Farm Details',
      headerStyle: {
        backgroundColor: '#1E3A8A',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: '800',
      },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
          <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, farm.farmName]);
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.titleText}>{farm.farmName || 'Unnamed Farm'}</Text>
            {farm.verified && <Ionicons name="checkmark-circle" size={24} color="#16A34A" style={styles.verifiedIcon} />}
          </View>
          <Text style={styles.taglineText}>🌿 {farm.tagline || 'Fresh from the root'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.locationText}>{farm.location}</Text>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="map-outline" size={24} color="#1E3A8A" />
            <Text style={styles.statValue}>{farm.farmArea}</Text>
            <Text style={styles.statLabel}>{farm.farmAreaUnit}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="leaf-outline" size={24} color="#1E3A8A" />
            <Text style={styles.statValue}>{farm.farmingType}</Text>
            <Text style={styles.statLabel}>Farming</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="calendar-outline" size={24} color="#1E3A8A" />
            <Text style={styles.statValue}>{farm.yearsExperience}+</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="people-outline" size={24} color="#1E3A8A" />
            <Text style={styles.statValue}>{farm.happyCustomersCount}+</Text>
            <Text style={styles.statLabel}>Happy Users</Text>
          </View>
        </View>
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Farm Details</Text>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Ionicons name="person-outline" size={16} color="#16A34A" />
                <Text style={styles.detailLabel}>Farmer Name</Text>
              </View>
              <Text style={styles.detailValue}>{farm.farmerName}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Ionicons name="basket-outline" size={16} color="#16A34A" />
                <Text style={styles.detailLabel}>Main Crops</Text>
              </View>
              <Text style={styles.detailValue}>{farm.mainCrops}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Ionicons name="water-outline" size={16} color="#16A34A" />
                <Text style={styles.detailLabel}>Irrigation</Text>
              </View>
              <Text style={styles.detailValue}>{farm.irrigationSource}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailHeader}>
                <Ionicons name="earth-outline" size={16} color="#16A34A" />
                <Text style={styles.detailLabel}>Soil Type</Text>
              </View>
              <Text style={styles.detailValue}>{farm.soilType}</Text>
            </View>
          </View>
          {farm.aboutFarm && (
            <View style={styles.aboutBox}>
              <View style={styles.detailHeader}>
                <Ionicons name="information-circle-outline" size={18} color="#16A34A" />
                <Text style={[styles.detailLabel, { fontSize: 16, fontWeight: '700' }]}>About My Farm</Text>
              </View>
              <Text style={styles.aboutText}>{farm.aboutFarm}</Text>
            </View>
          )}
        </View>
        <View style={styles.gallerySection}>
          <Text style={styles.sectionTitle}>Farm Gallery</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#1E3A8A" style={{ marginTop: 20 }} />
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
                    <Text style={{ color: '#fff', marginTop: 8 }}>Video Player</Text>
                  </View>
                </TouchableOpacity>
              )}
              {gallery.map(file => (
                <View key={file.id} style={styles.galleryItem}>
                  {file.fileType === 'VIDEO' ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setPlayingVideoId(file.id)}
                      style={{ flex: 1 }}
                    >
                      <View style={[styles.galleryMedia, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="videocam" size={40} color="rgba(255,255,255,0.8)" />
                        <Text style={{ color: '#fff', marginTop: 8 }}>Video Player</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <Image
                      source={{ uri: `${BASE_URL}/${file.filePath}` }}
                      style={styles.galleryMedia}
                    />
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  taglineText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    width: (width - 70) / 4,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    paddingLeft: 22,
  },
  aboutBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 8,
  },
  gallerySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  galleryScroll: {
    gap: 12,
  },
  galleryItem: {
    width: 220,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
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
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 14,
  },
});
