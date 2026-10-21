import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
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

import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerBadge, FarmerEmptyState } from '../components/farmer/FarmerUI';
import { FarmerPrimaryButton } from '../components/farmer/FarmerButtons';
import { PinIcon, ChevronRightIcon } from '../components/farmer/FarmerIcons';

const { width, height } = Dimensions.get('window');
const LIST_HEIGHT = height * 0.55;
const MIN_HEADER_HEIGHT = 64;
const COLLAPSED_HEIGHT = 200;

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
  const listAnim = useRef(new Animated.Value(0)).current;

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
    <FarmerCard
      key={item.id?.toString() ?? idx.toString()}
      style={styles.marketCard}
    >
      <View style={styles.marketCardContent}>
        <View style={styles.marketInfo}>
          <Text
            style={styles.marketName}
            numberOfLines={2}
            maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
          >
            {item.marketName}
          </Text>

          <View style={styles.addressContainer}>
            <PinIcon size={13} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2} />
            <Text
              style={styles.marketAddress}
              numberOfLines={1}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {item.district}, {item.state}
            </Text>
          </View>

          {item.distance !== undefined && (
            <View style={styles.distanceBadgeRow}>
              <FarmerBadge
                label={`${item.distance.toFixed(1)} ${item.distanceUnit || 'km'} away`}
                variant="success"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('MarketDetails', { market: item })}
          activeOpacity={0.85}
        >
          <Text
            style={styles.detailsButtonText}
            maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
          >
            Details
          </Text>
          <ChevronRightIcon size={14} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </FarmerCard>
  );

  return (
    <FarmerPageBackground>
      {/* Farmer Emerald Header */}
      <FarmerHeader
        variant="tab"
        title="Markets"
        subtitle="Locate nearby APMC & mandi markets"
        onBackPress={() => {
          if (navigation?.canGoBack()) {
            navigation.goBack();
          } else {
            navigation?.navigate('Home');
          }
        }}
        showSearch
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search markets by name..."
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {/* Map (Full Background Area) */}
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
                  <View style={styles.markerPin}>
                    <Ionicons name="storefront" size={16} color="#FFFFFF" />
                  </View>
                </Marker>
              ) : null;
            })}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={40} color={FARMER_THEME.colors.placeholder} />
            <Text
              style={styles.mapPlaceholderText}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {locationErrorMsg || 'Loading map...'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleList}
          style={styles.sheetHandleContainer}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderContent}>
            <Text
              style={styles.sectionTitle}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {isSearching ? 'Search Results' : 'Nearby Markets'}
            </Text>
            <Ionicons
              name={isCollapsed ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={FARMER_THEME.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={FARMER_THEME.colors.primaryGreen} />
            </View>
          ) : (Array.isArray(markets) ? markets : []).length === 0 ? (
            <FarmerEmptyState
              icon={<Ionicons name="storefront-outline" size={44} color={FARMER_THEME.colors.primaryGreen} />}
              title="No markets found"
              subtitle={
                isSearching
                  ? 'Try searching with a different name or town'
                  : 'No markets located in your immediate radius'
              }
            />
          ) : (
            (Array.isArray(markets) ? markets : []).map((item, idx) =>
              renderMarketItem(item, idx)
            )
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      </Animated.View>
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#E8F0EA',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FARMER_THEME.colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...FARMER_THEME.shadows.tile,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  mapPlaceholderText: {
    fontFamily: FARMER_THEME.fonts.medium,
    color: FARMER_THEME.colors.textSecondary,
    fontSize: 13,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: LIST_HEIGHT,
    backgroundColor: FARMER_THEME.colors.pageBgBottom,
    borderTopLeftRadius: FARMER_THEME.radius.bottomSheets,
    borderTopRightRadius: FARMER_THEME.radius.bottomSheets,
    ...FARMER_THEME.shadows.stickyBar,
  },
  sheetHandleContainer: {
    height: MIN_HEADER_HEIGHT,
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: FARMER_THEME.radius.bottomSheets,
    borderTopRightRadius: FARMER_THEME.radius.bottomSheets,
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: FARMER_THEME.colors.divider,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: FARMER_THEME.colors.cardBorder,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 18,
    color: FARMER_THEME.colors.headings,
    letterSpacing: -0.2,
  },
  listContainer: {
    paddingHorizontal: FARMER_THEME.spacing.pagePadding,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 10,
  },
  marketCard: {
    padding: 14,
    borderRadius: FARMER_THEME.radius.smallCards,
  },
  marketCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marketInfo: {
    flex: 1,
    marginRight: 12,
  },
  marketName: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 15,
    color: FARMER_THEME.colors.headings,
    marginBottom: 4,
    lineHeight: 20,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  marketAddress: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 12,
    color: FARMER_THEME.colors.textSecondary,
    flex: 1,
  },
  distanceBadgeRow: {
    alignSelf: 'flex-start',
  },
  detailsButton: {
    backgroundColor: FARMER_THEME.colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
  },
  detailsButtonText: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default FarmerMarketScreen;
