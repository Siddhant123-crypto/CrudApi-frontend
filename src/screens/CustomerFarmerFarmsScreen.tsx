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
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Farmer Farms',
      headerStyle: {
        backgroundColor: '#1E3A8A',
        elevation: 6,
        shadowColor: '#1E3A8A',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
      },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, marginLeft: 15 }}>
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
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
            <Ionicons name="leaf" size={40} color="#1E3A8A" />
          </View>
        )}
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.farmName} numberOfLines={1}>{item.farmName || 'Unnamed Farm'}</Text>
        <Text style={styles.tagline} numberOfLines={1}>{item.tagline || 'Fresh from the root'}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color="#6B7280" />
          <Text style={styles.infoText}>{item.farmerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
        ) : farms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Farms Found</Text>
            <Text style={styles.emptySubtitle}>There are currently no farmer farms to display.</Text>
          </View>
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
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
  },
  loader: {
    marginTop: '50%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#F9FAFB',
  },
  farmImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 4,
  },
  cardBody: {
    padding: 16,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
});
