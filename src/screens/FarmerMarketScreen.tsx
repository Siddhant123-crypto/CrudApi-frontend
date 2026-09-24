import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { getNearbyMarkets, searchMarkets, Market } from '../services/marketService';

const { width, height } = Dimensions.get('window');
const LIST_HEIGHT = height * 0.55;
const MIN_HEADER_HEIGHT = 60; // Height of the drag handle area
const COLLAPSED_HEIGHT = 200; // Height to keep the first card visible

export const FarmerMarketScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);

  // Animation states for bottom sheet
  const [isCollapsed, setIsCollapsed] = useState(false);
  const listAnim = useRef(new Animated.Value(0)).current; // 0 = expanded, 1 = collapsed

  const toggleList = () => {
    if (isCollapsed) {
      Animated.spring(listAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.spring(listAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
    setIsCollapsed(!isCollapsed);
  };

  const translateY = listAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LIST_HEIGHT - COLLAPSED_HEIGHT],
  });

  const fetchNearbyMarkets = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const res = await getNearbyMarkets(lat, lon);
      const marketsArray = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setMarkets(marketsArray);
    } catch (error) {
      console.log('Error fetching nearby markets:', error);
      Alert.alert('Error', 'Failed to fetch nearby markets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      if (location) {
        fetchNearbyMarkets(location.coords.latitude, location.coords.longitude);
      } else {
        setMarkets([]);
      }
      return;
    }

    setIsSearching(true);
    try {
      setLoading(true);
      const res = await searchMarkets(query);
      const marketsArray = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setMarkets(marketsArray);
    } catch (error) {
      console.log('Error searching markets:', error);
      Alert.alert('Error', 'Failed to search markets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isSearching || searchQuery.trim().length > 0) {
        handleSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationErrorMsg('Permission to access location was denied');
          setLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        fetchNearbyMarkets(loc.coords.latitude, loc.coords.longitude);
      } catch (e) {
        setLocationErrorMsg('Location is unavailable');
        setLoading(false);
      }
    })();
  }, []);

  const renderMarketItem = (item: Market, idx: number) => (
    <View key={item.id?.toString() ?? idx.toString()} style={styles.marketCard}>
      <View style={styles.cardShine} />
      <View style={styles.marketCardContent}>
        <View style={styles.marketInfo}>
          <Text style={styles.marketName} numberOfLines={2}>{item.marketName}</Text>
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={12} color="#64748B" />
            <Text style={styles.marketAddress} numberOfLines={1}>
              {item.district}, {item.state}
            </Text>
          </View>
          {item.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate-circle-outline" size={12} color="#1E5631" />
              <Text style={styles.distanceText}>
                {item.distance.toFixed(1)} {item.distanceUnit || 'km'} away
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('MarketDetails', { market: item })}
          activeOpacity={0.85}
        >
          <Text style={styles.detailsButtonText}>View{'\n'}Details</Text>
          <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topContainer}>
        {/* Compact header */}
        <View style={styles.headerBlock}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Markets</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={17} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search markets by name..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Map (Full Screen behind sheet) */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation={true}
            paddingAdjustmentBehavior="always"
          >
            {(Array.isArray(markets) ? markets : []).map((market) => {
              const lat = Number(market.latitude);
              const lon = Number(market.longitude);
              const isValidCoord = !isNaN(lat) && !isNaN(lon);
              return isValidCoord ? (
                <Marker
                  key={market.id}
                  coordinate={{ latitude: lat, longitude: lon }}
                  title={market.marketName}
                  description={`${market.district}, ${market.state}`}
                  onCalloutPress={() => navigation.navigate('MarketDetails', { market })}
                >
                  <Ionicons name="location" size={30} color="#1E5631" />
                </Marker>
              ) : null;
            })}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={40} color="#94A3B8" />
            <Text style={styles.mapPlaceholderText}>
              {locationErrorMsg || 'Loading map...'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={toggleList} style={styles.sheetHandleContainer}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderContent}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Search Results' : 'Nearby Markets'}
            </Text>
            <Ionicons name={isCollapsed ? "chevron-up" : "chevron-down"} size={22} color="#64748B" />
          </View>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#1E5631" />
            </View>
          ) : (Array.isArray(markets) ? markets : []).length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="storefront-outline" size={44} color="#CBD5E1" />
              <Text style={styles.emptyText}>No markets found</Text>
            </View>
          ) : (
            (Array.isArray(markets) ? markets : []).map((item, idx) =>
              renderMarketItem(item, idx)
            )
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E5631',
  },
  topContainer: {
    zIndex: 10,
    backgroundColor: '#1E5631',
  },
  headerBlock: {
    paddingTop: Platform.OS === 'android' ? 36 : 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 14,
    height: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    height: '100%',
  },
  clearButton: {
    padding: 2,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  mapPlaceholderText: {
    color: '#64748B',
    fontSize: 13,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: LIST_HEIGHT,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHandleContainer: {
    height: MIN_HEADER_HEIGHT,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetHandle: {
    width: 48,
    height: 6,
    backgroundColor: '#1E5631', // primary color for highlight
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  marketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#1E5631',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(30,86,49,0.05)',
    overflow: 'hidden',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    opacity: 0.5,
    zIndex: 1,
  },
  marketCardContent: {
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  marketInfo: {
    flex: 1,
    marginRight: 10,
  },
  marketName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
    lineHeight: 18,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  marketAddress: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 3,
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  distanceText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
    marginLeft: 3,
  },
  detailsButton: {
    backgroundColor: '#1E5631',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    elevation: 3,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 3,
    textAlign: 'center',
    lineHeight: 15,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default FarmerMarketScreen;
