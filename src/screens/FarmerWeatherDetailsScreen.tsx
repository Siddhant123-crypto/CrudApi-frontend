import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import * as Location from 'expo-location';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerStatCard, FarmerListRow } from '../components/farmer/FarmerUI';
import { FARMER_THEME } from '../constants/farmerTheme';

const getWeatherIcon = (code: number, size = 24, color = '#17663F') => {
  let name = 'cloud';
  if (code === 0) name = 'sunny';
  else if (code >= 1 && code <= 3) name = 'partly-sunny';
  else if (code === 45 || code === 48) name = 'cloudy';
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) name = 'rainy';
  else if (code >= 71 && code <= 77) name = 'snow';
  else if (code >= 95 && code <= 99) name = 'thunderstorm';
  
  return <Ionicons name={name as any} size={size} color={color} />;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const FarmerWeatherDetailsScreen = ({ route, navigation }: any) => {
  const { weatherData, initialLatitude, initialLongitude, locationName = 'Current Location' } = route.params || {};
  const [loading, setLoading] = useState(!weatherData);
  const [weather, setWeather] = useState<any>(weatherData);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!weatherData) {
      fetchWeather();
    }
  }, []);

  const fetchWeather = async () => {
    try {
      let lat = initialLatitude;
      let lon = initialLongitude;

      if (!lat || !lon) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      }

      if (lat && lon) {
        const response = await api.get(`/weather?latitude=${lat}&longitude=${lon}`);
        if (response.data && response.data.data) {
          setWeather(response.data.data);
        }
      }
    } catch (error) {
      console.log('Error refreshing weather:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeather();
  };

  if (loading) {
    return (
      <FarmerPageBackground>
        <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
        <FarmerHeader
          variant="inner"
          title={locationName}
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color="#1F7A4D" />
        </View>
      </FarmerPageBackground>
    );
  }

  if (!weather) {
    return (
      <FarmerPageBackground>
        <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
        <FarmerHeader
          variant="inner"
          title={locationName}
          onBackPress={() => navigation.goBack()}
        />
        <View style={[styles.container, styles.center]}>
          <Ionicons name="cloud-offline-outline" size={64} color="#7D8D81" />
          <Text style={styles.errorText}>Could not load weather data</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchWeather} activeOpacity={0.85}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </FarmerPageBackground>
    );
  }

  const current = weather.current;
  const forecast = weather.dailyForecast || [];

  return (
    <FarmerPageBackground>
      <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
      <FarmerHeader
        variant="inner"
        title={locationName}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1F7A4D']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Weather Summary Card */}
        <FarmerCard style={styles.mainCard}>
          <Text style={styles.dateText}>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          <View style={styles.mainTempRow}>
            <View style={styles.weatherIconCircle}>
              {getWeatherIcon(current?.weatherCode || 0, 48, '#17663F')}
            </View>
            <View style={styles.tempBlock}>
              <Text style={styles.mainTemp}>{Math.round(current?.temperature || 0)}°</Text>
              <Text style={styles.mainDesc}>{current?.weatherDescription || 'Clear'}</Text>
            </View>
          </View>

          {/* Stat Tiles via FarmerStatCard */}
          <View style={styles.statsGrid}>
            <FarmerStatCard
              value={`${current?.humidity || 0}%`}
              label="Humidity"
              icon={<Ionicons name="water-outline" size={20} color="#1F7F78" />}
              iconBg="#D7F0EC"
              style={styles.statTile}
            />
            <FarmerStatCard
              value={`${current?.rainProbability || 0}%`}
              label="Rain Prob"
              icon={<Ionicons name="rainy-outline" size={20} color="#17663F" />}
              iconBg="#DDF3E4"
              style={styles.statTile}
            />
            <FarmerStatCard
              value={`${current?.windSpeed || 0} km/h`}
              label="Wind Speed"
              icon={<Ionicons name="leaf-outline" size={20} color="#C98A1B" />}
              iconBg="#FFF0CC"
              style={styles.statTile}
            />
          </View>
        </FarmerCard>

        {/* Forecast Section */}
        <Text style={styles.sectionTitle}>7-DAY FORECAST</Text>
        <View style={styles.forecastList}>
          {forecast.map((day: any, index: number) => (
            <FarmerListRow
              key={index}
              title={index === 0 ? 'Today' : formatDate(day.date)}
              subtitle={day.rainProbability > 0 ? `Rain chance: ${day.rainProbability}%` : undefined}
              icon={getWeatherIcon(day.weatherCode, 24, '#17663F')}
              iconBg="#DDF3E4"
              showChevron={false}
              rightElement={
                <View style={styles.forecastTemps}>
                  <Text style={styles.maxTemp}>
                    {Math.round(index === 0 ? (current?.temperature || day.maxTemperature) : day.maxTemperature)}°
                  </Text>
                  <Text style={styles.minTemp}>{Math.round(day.minTemperature)}°</Text>
                </View>
              }
            />
          ))}
        </View>
      </ScrollView>
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 13,
    color: '#5C6B60',
    fontFamily: FARMER_THEME.fonts.medium,
    marginBottom: 12,
    textAlign: 'center',
  },
  mainTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  weatherIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DDF3E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tempBlock: {
    justifyContent: 'center',
  },
  mainTemp: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 40,
    fontWeight: '600',
    color: '#0E3B29',
    lineHeight: 46,
  },
  mainDesc: {
    fontSize: 15,
    color: '#17663F',
    fontFamily: FARMER_THEME.fonts.bold,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    padding: 10,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#17663F',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  forecastList: {
    marginBottom: 20,
  },
  forecastTemps: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maxTemp: {
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    width: 32,
    textAlign: 'right',
  },
  minTemp: {
    fontSize: 14,
    fontFamily: FARMER_THEME.fonts.medium,
    color: '#7D8D81',
    width: 32,
    textAlign: 'right',
    marginLeft: 6,
  },
  errorText: {
    fontSize: 15,
    color: '#5C6B60',
    marginTop: 16,
    marginBottom: 20,
    fontFamily: FARMER_THEME.fonts.regular,
  },
  retryBtn: {
    backgroundColor: '#17663F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    ...FARMER_THEME.shadows.button,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 15,
  },
});

export default FarmerWeatherDetailsScreen;
