import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Linking,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Market } from '../services/marketService';

const { height } = Dimensions.get('window');
const BOTTOM_INSET = Platform.OS === 'android' ? 48 : 0;
const SHEET_HEIGHT = height * 0.62;
const HANDLE_HEIGHT = 90; // visible handle area when collapsed
const COLLAPSED_OFFSET = SHEET_HEIGHT - HANDLE_HEIGHT;

export const MarketDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const market: Market = route.params?.market;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, COLLAPSED_OFFSET],
  });

  const toggleSheet = () => {
    Animated.spring(sheetAnim, {
      toValue: isCollapsed ? 0 : 1,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
    setIsCollapsed(!isCollapsed);
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const scrolled = scrollY > 10;
    if (scrolled !== isScrolled) {
      setIsScrolled(scrolled);
      Animated.timing(titleOpacity, {
        toValue: scrolled ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  if (!market) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Market details not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCall = () => {
    if (market.contactNumber) {
      Linking.openURL(`tel:${market.contactNumber}`).catch(() => {
        Alert.alert('Error', 'Could not open dialer.');
      });
    }
  };

  const handleDirections = () => {
    if (market.latitude && market.longitude) {
      const url = Platform.select({
        ios: `maps:0,0?q=${market.latitude},${market.longitude}`,
        android: `geo:0,0?q=${market.latitude},${market.longitude}(${market.marketName})`
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'Could not open maps.');
        });
      }
    } else {
      Alert.alert('Error', 'Location coordinates are not available for this market.');
    }
  };

  const getFullAddress = () => {
    const parts = [
      market.address,
      market.village,
      market.taluka,
      market.district,
      market.state,
      market.pincode
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {market.marketName}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Map fills background */}
      {market.latitude && market.longitude ? (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: market.latitude,
              longitude: market.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            scrollEnabled={false}
          >
            <Marker
              coordinate={{ latitude: market.latitude, longitude: market.longitude }}
              title={market.marketName}
            />
          </MapView>
        </View>
      ) : (
        <View style={[styles.mapContainer, styles.mapPlaceholder]}>
          <Ionicons name="map-outline" size={40} color="#94A3B8" />
          <Text style={styles.mapPlaceholderText}>No location available</Text>
        </View>
      )}

      {/* Animated Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        {/* Drag Handle */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleSheet}
          style={[
            styles.sheetHandleContainer,
            isScrolled && styles.sheetHandleScrolled,
          ]}
        >
          <View style={[styles.sheetHandle, isScrolled && styles.sheetHandleScrolledPill]} />
          <View style={styles.sheetHeaderContent}>
            <Text style={styles.marketNameTitle} numberOfLines={1}>
              {market.marketName}
            </Text>
            <Animated.View style={{ opacity: isScrolled ? 1 : 0.45 }}>
              <Ionicons name={isCollapsed ? 'chevron-up' : 'chevron-down'} size={22} color={isScrolled ? '#1E5631' : '#64748B'} />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {market.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Ionicons name="navigate-circle" size={16} color="#1E5631" />
              <Text style={styles.distanceText}>
                {market.distance.toFixed(1)} {market.distanceUnit || 'km'} away
              </Text>
            </View>
          )}

          {market.description ? (
            <Text style={styles.descriptionText}>{market.description}</Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            {market.marketContactName && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <Text style={styles.infoText}>{market.marketContactName}</Text>
              </View>
            )}
            {market.contactNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color="#64748B" />
                <Text style={styles.infoText}>{market.contactNumber}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#64748B" />
              <Text style={styles.infoText}>{getFullAddress()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.operatingHoursContainer}>
            <View style={styles.operatingHoursLeft}>
              <Text style={styles.sectionTitle}>Operating Hours</Text>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#64748B" />
                <Text style={styles.infoText}>
                  {market.openingTime ? market.openingTime : 'N/A'} - {market.closingTime ? market.closingTime : 'N/A'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.smallDirectionsBtn} onPress={handleDirections}>
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
              <Text style={styles.smallDirectionsText}>Directions</Text>
            </TouchableOpacity>
          </View>

          {market.contactNumber ? (
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.callButtonText}>Call Market</Text>
            </TouchableOpacity>
          ) : null}

          <View style={{ height: 30 }} />
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
  headerBlock: {
    backgroundColor: '#1E5631',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
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
    bottom: BOTTOM_INSET,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  sheetHandleContainer: {
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetHandleScrolled: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#1E5631',
    backgroundColor: '#F0FDF4',
    shadowColor: '#1E5631',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 4,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#1E5631',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHandleScrolledPill: {
    backgroundColor: '#1E5631',
    width: 56,
  },
  sheetHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketNameTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  sheetScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 5,
  },
  descriptionText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  infoSection: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 10,
    flex: 1,
    lineHeight: 19,
  },
  operatingHoursContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  operatingHoursLeft: {
    flex: 1,
    paddingRight: 10,
  },
  smallDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  smallDirectionsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  callButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E5631',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#1E5631',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default MarketDetailsScreen;
