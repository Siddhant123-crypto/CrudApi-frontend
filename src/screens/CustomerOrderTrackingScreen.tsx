import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../services/api';
import { ThemedHeader } from '../components/ui/ThemedHeader';
import { PrimaryButton } from '../components/ui/Buttons';
import { THEME } from '../constants/theme';

interface TrackingLocation {
  farmerName: string;
  farmName: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

const CustomerOrderTrackingScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const [locations, setLocations] = useState<TrackingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<{latitude: number; longitude: number} | null>(null);
  
  const mapRef = useRef<MapView>(null);
  const hasSetInitialRegion = useRef(false);

  const fetchTrackingData = async (isBackground = false) => {
    if (!isBackground && locations.length === 0) {
      setLoading(true);
    }
    try {
      const response = await api.get(`/order/${orderId}/tracking`);
      if (response.data && Array.isArray(response.data)) {
        // Filter valid coordinates
        const validLocations = response.data.filter((loc: TrackingLocation) => 
          loc.latitude >= -90 && loc.latitude <= 90 && 
          loc.longitude >= -180 && loc.longitude <= 180
        );
        
        let allStale = false;
        if (validLocations.length > 0) {
          const now = new Date().getTime();
          // Flag as stale if ALL valid locations are older than 2 minutes (120000 ms)
          allStale = validLocations.every(loc => {
            const locTime = new Date(loc.lastUpdated).getTime();
            // If date is invalid or too old
            return isNaN(locTime) || (now - locTime) > 120000;
          });
        }
        
        setLocations(validLocations);
        setError(validLocations.length === 0 ? "Waiting for farmer's live location. Please keep the Farmer delivery screen open." : null);
        setIsStale(allStale);

        // We will fit map to coordinates in a separate effect when customer location is also available
        // to avoid race conditions. We just mark stale as false.
      } else {
        setLocations([]);
        setError('No tracking data found for this order.');
      }
    } catch (err: any) {
      console.log('Error fetching tracking data:', err);
      // Don't overwrite existing locations on network failure, just mark as stale
      if (locations.length > 0) {
        setIsStale(true);
      } else {
        setError(err?.response?.data?.message || 'Failed to load tracking data.');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to see your position on the map.');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCustomerLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (err) {
        console.log('Error getting customer location:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hasSetInitialRegion.current && (locations.length > 0 || customerLocation) && mapRef.current) {
      hasSetInitialRegion.current = true;
      setTimeout(() => {
        if (mapRef.current) {
          const coords = locations.map(l => ({ latitude: l.latitude, longitude: l.longitude }));
          if (customerLocation) {
            coords.push(customerLocation);
          }
          if (coords.length > 0) {
            mapRef.current.fitToCoordinates(
              coords,
              { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }
            );
          }
        }
      }, 500);
    }
  }, [locations, customerLocation]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      let intervalId: NodeJS.Timeout;

      const startPolling = async () => {
        if (!isActive) return;
        await fetchTrackingData(false);
        intervalId = setInterval(() => {
          if (isActive) {
            fetchTrackingData(true);
          }
        }, 10000); // 10 seconds refresh
      };

      startPolling();

      return () => {
        isActive = false;
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [orderId])
  );

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B1008" />
      <ThemedHeader
        variant="inner"
        title="Track Order"
        subtitle={`Order #${orderId}`}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME.colors.accent} />
            <Text style={styles.loadingText}>Locating your order...</Text>
          </View>
        ) : error && locations.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="location-outline" size={48} color="#CDBBB0" />
            <Text style={styles.errorText}>{error}</Text>
            <PrimaryButton
              title="Retry"
              onPress={() => fetchTrackingData(false)}
              style={{ minWidth: 120, height: 44 }}
            />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={
              customerLocation
                ? {
                    latitude: customerLocation.latitude,
                    longitude: customerLocation.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }
                : locations.length > 0
                ? {
                    latitude: locations[0].latitude,
                    longitude: locations[0].longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }
                : undefined
            }
          >
            {customerLocation && (
              <Marker
                coordinate={{ latitude: customerLocation.latitude, longitude: customerLocation.longitude }}
                title="Your Location"
                description="Current GPS Location"
                pinColor="blue"
              >
                <View style={[styles.markerContainer, { borderColor: '#2563EB' }]}>
                  <Ionicons name="person" size={24} color="#2563EB" />
                </View>
              </Marker>
            )}
            {locations.map((loc, index) => (
              <Marker
                key={`${loc.farmerName}-${index}`}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                title={loc.farmerName}
                description={loc.farmName || 'Farm2Home Partner'}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name="bicycle" size={24} color="#1E3A8A" />
                </View>
              </Marker>
            ))}
          </MapView>
        )}
      </View>

      <View style={styles.infoContainer}>
        {isStale && (
          <View style={styles.staleBanner}>
            <Ionicons name="warning-outline" size={16} color="#B8470F" />
            <Text style={styles.staleText}>Lost connection. Displaying last known location.</Text>
          </View>
        )}
        <Text style={styles.sectionTitle}>Farmer Locations</Text>
        <ScrollView style={styles.farmerList} showsVerticalScrollIndicator={false}>
          {locations.map((loc, index) => (
            <View key={index} style={styles.farmerCard}>
              <View style={styles.farmerAvatar}>
                <Text style={styles.avatarText}>{loc.farmerName?.charAt(0)?.toUpperCase() || 'F'}</Text>
              </View>
              <View style={styles.farmerDetails}>
                <Text style={styles.farmerName}>{loc.farmerName}</Text>
                <Text style={styles.farmName}>{loc.farmName || 'Farm2Home Partner'}</Text>
                <Text style={styles.lastUpdated}>Updated: {formatDate(loc.lastUpdated)}</Text>
              </View>
            </View>
          ))}
          {locations.length === 0 && !loading && (
            <Text style={styles.noDataText}>No farmer locations to display.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.pageBgTop,
  },
  mapContainer: {
    flex: 3,
    backgroundColor: '#E5E7EB',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#7A6350',
    fontFamily: THEME.fonts.medium,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: '#7A6350',
    fontFamily: THEME.fonts.medium,
    textAlign: 'center',
    marginBottom: 20,
  },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoContainer: {
    flex: 2,
    backgroundColor: '#FFFDF8',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F0E1CF',
    padding: 20,
    marginTop: -20,
    shadowColor: '#2A1710',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  staleBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: '#F3D2B8',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  staleText: {
    color: '#B8470F',
    fontSize: 12,
    fontFamily: THEME.fonts.semiBold,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.serif,
    color: '#3B1A0E',
    marginBottom: 16,
  },
  farmerList: {
    flex: 1,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F2',
    borderWidth: 1,
    borderColor: '#F1DCC6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  farmerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF1DE',
    borderWidth: 1,
    borderColor: '#F3D2B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: THEME.fonts.bold,
    color: '#B8470F',
  },
  farmerDetails: {
    flex: 1,
  },
  farmerName: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: '#2A1710',
  },
  farmName: {
    fontSize: 13,
    fontFamily: THEME.fonts.medium,
    color: '#7A6350',
    marginTop: 2,
  },
  lastUpdated: {
    fontSize: 11,
    fontFamily: THEME.fonts.regular,
    color: '#A08D7E',
    marginTop: 4,
  },
  noDataText: {
    textAlign: 'center',
    color: '#7A6350',
    fontFamily: THEME.fonts.medium,
    marginTop: 20,
    fontSize: 14,
  },
});

export default CustomerOrderTrackingScreen;
