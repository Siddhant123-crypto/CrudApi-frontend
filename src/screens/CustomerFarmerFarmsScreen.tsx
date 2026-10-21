import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api, { BASE_URL } from '../services/api';
import { THEME } from '../constants/theme';
import { PageBackground } from '../components/ui/PageBackground';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { ThemedEmptyState } from '../components/ui/ThemedEmptyState';

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

export default function CustomerFarmerFarmsScreen({ navigation }: any) {
  const [farms, setFarms] = useState<FarmDetailsResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchFarms();
    }, [])
  );

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/farm-details/getAll');
      if (response.data && response.data.data) {
        setFarms(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFarmCard = ({ item }: { item: FarmDetailsResponse }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('CustomerFarmDetail', { farm: item })}
    >
      <View style={styles.imageContainer}>
        {item.farmerPhoto && item.farmerPhoto !== 'null' ? (
          <Image
            source={{ uri: `${BASE_URL}/${item.farmerPhoto}` }}
            style={styles.farmImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.farmImage, styles.placeholderImage]}>
            <Ionicons name="leaf" size={40} color="#B8470F" />
          </View>
        )}
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#2E7D4F" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.farmName} numberOfLines={1}>{item.farmName || 'Unnamed Farm'}</Text>
        <Text style={styles.tagline} numberOfLines={1}>{item.tagline || 'Fresh from the root'}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color="#8A6F5C" />
          <Text style={styles.infoText}>{item.farmerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#B8470F" />
          <Text style={styles.infoText} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.farmingType || 'Organic'}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.farmArea} {item.farmAreaUnit}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <PageBackground style={styles.safeArea}>
      <ThemedHeader
        variant="inner"
        title="Farmer Farms"
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#B8470F" style={styles.loader} />
        ) : farms.length === 0 ? (
          <ThemedEmptyState
            icon={<Ionicons name="home-outline" size={44} color="#B8470F" />}
            title="No Farms Found"
            subtitle="There are currently no farmer farms to display."
          />
        ) : (
          <FlatList
            data={farms}
            keyExtractor={(item) => item.id}
            renderItem={renderFarmCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </PageBackground>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loader: {
    marginTop: '50%',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: 'rgba(90,40,15,0.09)',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#FFF9F2',
  },
  farmImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1E3',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F3E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBE3C8',
  },
  verifiedText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: '#2E7D4F',
    marginLeft: 4,
  },
  cardBody: {
    padding: 18,
  },
  farmName: {
    fontFamily: THEME.fonts.serif,
    fontSize: 19,
    color: '#3B1A0E',
    marginBottom: 4,
  },
  tagline: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: '#8A6F5C',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13.5,
    color: '#5C4433',
    marginLeft: 8,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  badge: {
    backgroundColor: '#FFF1E3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F2B27D',
  },
  badgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: '#B8470F',
  },
});
