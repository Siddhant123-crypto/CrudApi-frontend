import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import api from '../../services/api';
import { FARMER_THEME } from '../../constants/farmerTheme';
import {
  SunIcon,
  CloudIcon,
  PartlyCloudyIcon,
  RainIcon,
  StormIcon,
  FogIcon,
  DropletIcon,
  WindIcon,
  CloudOffIcon,
} from './FarmerIcons';

interface FarmerWeatherPillProps {
  refreshTrigger?: number;
}

const getWeatherInfo = (code: number, desc?: string) => {
  if (code === 0) {
    return {
      Icon: SunIcon,
      label: desc || 'Clear',
      tileBg: '#FFF4DD',
      strokeColor: '#C98A1B',
    };
  }
  if (code >= 1 && code <= 2) {
    return {
      Icon: PartlyCloudyIcon,
      label: desc || 'Partly cloudy',
      tileBg: '#E3F3E8',
      strokeColor: '#17663F',
    };
  }
  if (code === 3) {
    return {
      Icon: CloudIcon,
      label: desc || 'Cloudy',
      tileBg: '#E3F3E8',
      strokeColor: '#17663F',
    };
  }
  if (code === 45 || code === 48) {
    return {
      Icon: FogIcon,
      label: desc || 'Fog',
      tileBg: '#E3F3E8',
      strokeColor: '#17663F',
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      Icon: RainIcon,
      label: desc || 'Rain',
      tileBg: '#E3EEFF',
      strokeColor: '#3B6FB6',
    };
  }
  if (code >= 71 && code <= 77) {
    return {
      Icon: RainIcon,
      label: desc || 'Snow',
      tileBg: '#E3EEFF',
      strokeColor: '#3B6FB6',
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      Icon: StormIcon,
      label: desc || 'Thunderstorm',
      tileBg: '#E3EEFF',
      strokeColor: '#3B6FB6',
    };
  }
  return {
    Icon: CloudIcon,
    label: desc || 'Overcast',
    tileBg: '#E3F3E8',
    strokeColor: '#17663F',
  };
};

export const FarmerWeatherPill: React.FC<FarmerWeatherPillProps> = ({
  refreshTrigger,
}) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { width: windowWidth } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [locationName, setLocationName] = useState('Current Location');
  const [locationCoords, setLocationCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const weatherDataRef = useRef<any>(null);
  weatherDataRef.current = weatherData;

  const fetchWeather = useCallback(async () => {
    try {
      if (!weatherDataRef.current) {
        setLoading(true);
      }

      // 10 second timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        clearTimeout(timeoutId);
        if (!weatherDataRef.current) {
          setHasError(true);
        }
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      setLocationCoords({ lat, lon });

      // Reverse geocode to get city name if possible
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lon,
        });
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          setLocationName(
            place.city || place.district || place.region || 'Current Location'
          );
        }
      } catch (e) {
        // Fallback to Current Location
      }

      let fetched: any = null;

      // 1. Try backend endpoint first
      try {
        const response = await api.get(
          `/weather?latitude=${lat}&longitude=${lon}`,
          { signal: controller.signal }
        );
        if (response.data && response.data.data) {
          fetched = response.data.data;
        }
      } catch (err) {
        // Fallback to Open-Meteo
      }

      // 2. Fallback to Open-Meteo if backend did not return
      if (!fetched) {
        try {
          const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
          const omRes = await fetch(omUrl, { signal: controller.signal });
          const omData = await omRes.json();
          if (omData && omData.current) {
            fetched = {
              current: {
                temperature: omData.current.temperature_2m,
                weatherCode: omData.current.weather_code,
                humidity: omData.current.relative_humidity_2m,
                windSpeed: omData.current.wind_speed_10m,
              },
            };
          }
        } catch (omErr) {
          // Open-Meteo failed
        }
      }

      clearTimeout(timeoutId);

      if (fetched && fetched.current) {
        setWeatherData(fetched);
        setHasError(false);
      } else if (!weatherDataRef.current) {
        setHasError(true);
      }
    } catch (err) {
      if (!weatherDataRef.current) {
        setHasError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when screen gains focus
  useEffect(() => {
    if (isFocused) {
      fetchWeather();
    }
  }, [isFocused, fetchWeather]);

  // Fetch on external pull-to-refresh trigger
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchWeather();
    }
  }, [refreshTrigger, fetchWeather]);

  // Periodic refresh every 30 minutes while screen is open
  useEffect(() => {
    const interval = setInterval(() => {
      if (isFocused) {
        fetchWeather();
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isFocused, fetchWeather]);

  const handlePress = () => {
    if (hasError || (!weatherData && !loading)) {
      fetchWeather();
      return;
    }

    if (weatherData || locationCoords) {
      navigation.navigate('FarmerWeatherDetails', {
        weatherData,
        initialLatitude: locationCoords?.lat,
        initialLongitude: locationCoords?.lon,
        locationName,
      });
    } else {
      fetchWeather();
    }
  };

  // Loading state (no cached data yet)
  if (loading && !weatherData) {
    return (
      <View style={styles.pillContainer}>
        <View style={styles.iconTile}>
          <ActivityIndicator
            size="small"
            color={FARMER_THEME.colors.primaryGreen}
          />
        </View>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonBar} />
        </View>
      </View>
    );
  }

  // Error state (no cached data & failed)
  if (hasError && !weatherData) {
    return (
      <Pressable
        style={styles.pillContainer}
        onPress={handlePress}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      >
        <View style={[styles.iconTile, { backgroundColor: '#F1F5F9' }]}>
          <CloudOffIcon size={18} color="#6B7A6F" strokeWidth={1.9} />
        </View>
        <Text style={styles.errorText} numberOfLines={1}>
          Weather unavailable • Tap to retry
        </Text>
      </Pressable>
    );
  }

  // Loaded state
  const current = weatherData?.current || {};
  const temp =
    current.temperature !== undefined
      ? `${Math.round(current.temperature)}°C`
      : '--°C';
  const code = current.weatherCode !== undefined ? current.weatherCode : 0;
  const desc = current.weatherDescription;
  const { Icon: WeatherIcon, label, tileBg, strokeColor } = getWeatherInfo(
    code,
    desc
  );

  const humidity = current.humidity !== undefined ? `${current.humidity}%` : null;
  const wind =
    current.windSpeed !== undefined
      ? `${Math.round(current.windSpeed)} km/h`
      : null;

  const showBothChips = windowWidth >= 360 && humidity && wind;
  const showOnlyHumidity = (!showBothChips && humidity) || (!wind && humidity);

  return (
    <Pressable
      style={styles.pillContainer}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
    >
      {/* a) Weather Icon Tile */}
      <View style={[styles.iconTile, { backgroundColor: tileBg }]}>
        <WeatherIcon size={18} color={strokeColor} strokeWidth={1.9} />
      </View>

      {/* b) Weather Info in ONE LINE */}
      <View style={styles.textRow}>
        <Text style={styles.tempText} numberOfLines={1}>
          {temp}
        </Text>
        <Text style={styles.conditionText} numberOfLines={1}>
          {label}
        </Text>
      </View>

      {/* c) Right side stat chip */}
      <View style={styles.chipsRow}>
        {showBothChips ? (
          <>
            <View style={styles.statChip}>
              <DropletIcon size={12} color={FARMER_THEME.colors.primaryGreen} strokeWidth={1.9} />
              <Text style={styles.chipValText}>{humidity}</Text>
            </View>
            <View style={styles.statChip}>
              <WindIcon size={12} color={FARMER_THEME.colors.primaryGreen} strokeWidth={1.9} />
              <Text style={styles.chipValText}>{wind}</Text>
            </View>
          </>
        ) : showOnlyHumidity ? (
          <View style={styles.statChip}>
            <DropletIcon size={12} color={FARMER_THEME.colors.primaryGreen} strokeWidth={1.9} />
            <Text style={styles.chipValText}>{humidity}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pillContainer: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    overflow: 'hidden',
    ...FARMER_THEME.shadows.searchBar,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#E3F3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tempText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 15,
    color: FARMER_THEME.colors.darkGreen,
  },
  conditionText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 12,
    color: FARMER_THEME.colors.textSecondary,
    flexShrink: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChip: {
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: '#F1F7EE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chipValText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    color: FARMER_THEME.colors.darkGreen,
  },
  skeletonRow: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonBar: {
    height: 10,
    width: 70,
    borderRadius: 5,
    backgroundColor: '#E3EDE5',
  },
  errorText: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 12,
    color: FARMER_THEME.colors.darkGreen,
    flex: 1,
  },
});

export default FarmerWeatherPill;
