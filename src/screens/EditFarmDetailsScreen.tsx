import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { saveFarmDetails, updateFarmDetails } from '../services/farmDetailsService';
import { uploadGalleryFile } from '../services/farmGalleryService';
import { BASE_URL } from '../services/api';
const VideoCard = ({ style, blurred }: { style: any; blurred?: boolean }) => (
  <View style={[style, { backgroundColor: '#0F3320', justifyContent: 'center', alignItems: 'center', opacity: blurred ? 0.6 : 1 }]}>
    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
      <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
    </View>
    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>VIDEO</Text>
  </View>
);
const EditFarmDetailsScreen = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const existingData = route.params?.farmDetails || {};
  const [farmName, setFarmName] = useState(existingData.farmName || '');
  const [tagline, setTagline] = useState(existingData.tagline || '');
  const [location, setLocation] = useState(existingData.location || '');
  const [farmingSince, setFarmingSince] = useState(existingData.farmingSince ? String(existingData.farmingSince) : '');
  const [farmingType, setFarmingType] = useState(existingData.farmingType || '');
  const [farmArea, setFarmArea] = useState(existingData.farmArea ? String(existingData.farmArea) : '');
  const [farmAreaUnit, setFarmAreaUnit] = useState(existingData.farmAreaUnit || 'ACRE');
  const [cropsGrownCount, setCropsGrownCount] = useState(existingData.cropsGrownCount ? String(existingData.cropsGrownCount) : '');
  const [yearsExperience, setYearsExperience] = useState(existingData.yearsExperience ? String(existingData.yearsExperience) : '');
  const [happyCustomersCount, setHappyCustomersCount] = useState(existingData.happyCustomersCount ? String(existingData.happyCustomersCount) : '');
  const [farmerName, setFarmerName] = useState(existingData.farmerName || user?.name || '');
  const [mainCrops, setMainCrops] = useState(existingData.mainCrops || '');
  const [irrigationSource, setIrrigationSource] = useState(existingData.irrigationSource || '');
  const [soilType, setSoilType] = useState(existingData.soilType || '');
  const [aboutFarm, setAboutFarm] = useState(existingData.aboutFarm || '');
  const [farmerPhotoUri, setFarmerPhotoUri] = useState<string | null>(null);
  const [farmVideoUri, setFarmVideoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
      farmingSince: farmingSince ? parseInt(farmingSince) : null,
      farmingType,
      farmArea: farmArea ? parseFloat(farmArea) : null,
      farmAreaUnit,
      cropsGrownCount: cropsGrownCount ? parseInt(cropsGrownCount) : null,
      yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
      happyCustomersCount: happyCustomersCount ? parseInt(happyCustomersCount) : null,
      farmerName,
      mainCrops,
      irrigationSource,
      soilType,
      aboutFarm
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
          uploadGalleryFile(user.farmerId, farmerPhotoUri, mime, `farm_photo.${ext}`)
            .catch(e => console.log('Gallery photo upload error:', e))
        );
      }
      if (farmVideoUri) {
        const ext = farmVideoUri.split('.').pop()?.toLowerCase() || 'mp4';
        const mime = `video/${ext}`;
        galleryUploads.push(
          uploadGalleryFile(user.farmerId, farmVideoUri, mime, `farm_video.${ext}`)
            .catch(e => console.log('Gallery video upload error:', e))
        );
      }
      if (galleryUploads.length > 0) {
        await Promise.all(galleryUploads);
      }
      Alert.alert('Success', 'Farm details saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerBlock}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Farm Details</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Media</Text>
            <View style={styles.mediaRow}>
              <TouchableOpacity style={styles.mediaUploadBox} onPress={handlePickImage}>
                {currentPhoto ? (
                  <Image source={{ uri: currentPhoto }} style={styles.mediaPreview} />
                ) : (
                  <Ionicons name="camera-outline" size={32} color="#176B2C" />
                )}
                <View style={styles.mediaLabelWrap}>
                  <Text style={styles.mediaLabel}>Farmer Photo</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaUploadBox} onPress={handlePickVideo}>
                {farmVideoUri ? (
                  <View style={styles.videoSuccessBox}>
                    <Ionicons name="videocam-outline" size={32} color="#FFFFFF" />
                    <Text style={styles.videoSuccessText}>Selected</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="videocam-outline" size={32} color="#176B2C" />
                    <View style={styles.mediaLabelWrap}>
                      <Text style={styles.mediaLabel}>Farm Video</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          {}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>General Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farm Name *</Text>
              <TextInput style={styles.input} value={farmName} onChangeText={setFarmName} placeholder="E.g. Green Valley Farm" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tagline</Text>
              <TextInput style={styles.input} value={tagline} onChangeText={setTagline} placeholder="E.g. Fresh from the roots" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="E.g. Nashik, Maharashtra" />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Farming Since</Text>
                <TextInput style={styles.input} value={farmingSince} onChangeText={setFarmingSince} placeholder="YYYY" keyboardType="numeric" maxLength={4} />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Farming Type</Text>
                <TextInput style={styles.input} value={farmingType} onChangeText={setFarmingType} placeholder="E.g. Organic" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>About Farm</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={aboutFarm}
                onChangeText={setAboutFarm}
                placeholder="Tell us about your farming practices..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
          {}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Metrics & Area</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Farm Area</Text>
                <TextInput style={styles.input} value={farmArea} onChangeText={setFarmArea} placeholder="E.g. 5.5" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Unit</Text>
                <TouchableOpacity
                  style={styles.unitToggle}
                  onPress={() => setFarmAreaUnit(farmAreaUnit === 'ACRE' ? 'HECTARE' : 'ACRE')}
                >
                  <Text style={styles.unitToggleText}>{farmAreaUnit}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Crops Grown Count</Text>
                <TextInput style={styles.input} value={cropsGrownCount} onChangeText={setCropsGrownCount} placeholder="E.g. 15" keyboardType="numeric" />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Years Experience</Text>
                <TextInput style={styles.input} value={yearsExperience} onChangeText={setYearsExperience} placeholder="E.g. 6" keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Happy Customers Count</Text>
              <TextInput style={styles.input} value={happyCustomersCount} onChangeText={setHappyCustomersCount} placeholder="E.g. 1200" keyboardType="numeric" />
            </View>
          </View>
          {}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Agricultural Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Farmer Name</Text>
              <TextInput style={styles.input} value={farmerName} onChangeText={setFarmerName} placeholder="Enter your full name" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Main Crops (comma separated)</Text>
              <TextInput style={styles.input} value={mainCrops} onChangeText={setMainCrops} placeholder="E.g. Tomato, Onion, Wheat" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Irrigation Source</Text>
              <TextInput style={styles.input} value={irrigationSource} onChangeText={setIrrigationSource} placeholder="E.g. Drip Irrigation" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Soil Type</Text>
              <TextInput style={styles.input} value={soilType} onChangeText={setSoilType} placeholder="E.g. Black Cotton Soil" />
            </View>
          </View>
          {}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Save Farm Details</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerBlock: {
    backgroundColor: '#1E5631',
    paddingTop: Platform.OS === 'android' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    paddingRight: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#EAF6D8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#176B2C',
    marginBottom: 20,
  },
  mediaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaUploadBox: {
    flex: 1,
    height: 120,
    backgroundColor: '#F1FAF2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8DDBB',
    borderStyle: 'dashed',
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  videoSuccessBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#176B2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSuccessText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
  },
  mediaLabelWrap: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  mediaLabel: {
    fontSize: 12,
    color: '#176B2C',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 120,
  },
  unitToggle: {
    backgroundColor: '#F1FAF2',
    borderWidth: 1,
    borderColor: '#B8DDBB',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitToggleText: {
    color: '#176B2C',
    fontWeight: '700',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#176B2C',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    elevation: 4,
    shadowColor: '#176B2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
export default EditFarmDetailsScreen;
