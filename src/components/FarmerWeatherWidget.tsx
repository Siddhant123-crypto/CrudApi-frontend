import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import api from '../services/api';

const getWeatherIcon = (code: number) => {
  if (code === 0) return 'sunny';
  if (code >= 1 && code <= 3) return 'partly-sunny';
  if (code === 45 || code === 48) return 'cloudy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'cloud';
};

const FarmerWeatherWidget = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [locationName, setLocationName] = useState('Current Location');
  const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      setLocationCoords({ lat, lon });

      // Optional: Get city name (might be slow or rate-limited, wrapped in try-catch)
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          setLocationName(place.city || place.district || place.region || 'Current Location');
        }
      } catch (e) {
        // Fallback to 'Current Location'
      }

      const response = await api.get(`/weather?latitude=${lat}&longitude=${lon}`);
      if (response.data && response.data.data) {
        setWeather(response.data.data);
      }
    } catch (error) {
      console.log('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (weather || locationCoords) {
      navigation.navigate('FarmerWeatherDetails', {
        weatherData: weather,
        initialLatitude: locationCoords?.lat,
        initialLongitude: locationCoords?.lon,
        locationName
      });
    }
  };

  if (loading && !weather) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="small" color="#1E8E3E" />
      </View>
    );
  }

  if (!weather) {
    return (
      <TouchableOpacity style={styles.container} onPress={fetchWeather}>
        <View style={styles.errorRow}>
          <Ionicons name="cloud-offline" size={24} color="#94A3B8" />
          <Text style={styles.errorText}>Tap to load weather</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const current = weather.current;
  const temp = current?.temperature ? Math.round(current.temperature) : '--';
  const desc = current?.weatherDescription || 'Unknown';
  const iconName = getWeatherIcon(current?.weatherCode || -1);

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={handlePress}>
      <View style={styles.weatherRow}>
        <View style={styles.leftCol}>
          <Ionicons name="location" size={14} color="#1E8E3E" />
          <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.tempText}>{temp}°C</Text>
          <Ionicons name={iconName} size={20} color="#F9AB00" style={{ marginLeft: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: '#1E8E3E',
    fontWeight: '600',
    marginLeft: 4,
    flexShrink: 1,
  },
  tempText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  errorText: {
    color: '#64748B',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  }
});

export default FarmerWeatherWidget;
