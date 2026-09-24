import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import * as Location from 'expo-location';

const getWeatherIcon = (code: number, size = 24, color = '#F9AB00') => {
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
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E8E3E" />
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="cloud-offline" size={64} color="#CBD5E1" />
        <Text style={styles.errorText}>Could not load weather data</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchWeather}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const current = weather.current;
  const forecast = weather.dailyForecast || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{locationName}</Text>
      </View>

      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E8E3E']} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Weather Card */}
          <View style={styles.mainCard}>
            <Text style={styles.dateText}>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            <View style={styles.mainTempRow}>
              {getWeatherIcon(current?.weatherCode || 0, 64, '#1E8E3E')}
              <View style={styles.tempBlock}>
                <Text style={styles.mainTemp}>{Math.round(current?.temperature || 0)}°</Text>
                <Text style={styles.mainDesc}>{current?.weatherDescription || 'Unknown'}</Text>
              </View>
            </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={20} color="#1A73E8" />
              <Text style={styles.statLabel}>Humidity</Text>
              <Text style={styles.statValue}>{current?.humidity || 0}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="rainy-outline" size={20} color="#0EA5E9" />
              <Text style={styles.statLabel}>Rain Prob</Text>
              <Text style={styles.statValue}>{current?.rainProbability || 0}%</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="leaf-outline" size={20} color="#10B981" />
              <Text style={styles.statLabel}>Wind</Text>
              <Text style={styles.statValue}>{current?.windSpeed || 0} km/h</Text>
            </View>
          </View>
        </View>

        {/* Forecast Section */}
        <Text style={styles.sectionTitle}>7-Day Forecast</Text>
        <View style={styles.forecastContainer}>
          {forecast.map((day: any, index: number) => (
            <View key={index} style={styles.forecastRow}>
              <Text style={styles.dayText}>{index === 0 ? 'Today' : formatDate(day.date)}</Text>
              <View style={styles.forecastMiddle}>
                {getWeatherIcon(day.weatherCode, 24, '#F9AB00')}
                {day.rainProbability > 0 && (
                  <Text style={styles.forecastRain}> {day.rainProbability}%</Text>
                )}
              </View>
              <View style={styles.forecastTemps}>
                <Text style={styles.maxTemp}>
                  {Math.round(index === 0 ? (current?.temperature || day.maxTemperature) : day.maxTemperature)}°
                </Text>
                <Text style={styles.minTemp}>{Math.round(day.minTemperature)}°</Text>
              </View>
            </View>
          ))}
        </View>
        </ScrollView>
      </View>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
    backgroundColor: '#1E5631',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  mainTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tempBlock: {
    marginLeft: 16,
  },
  mainTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E293B',
    lineHeight: 56,
  },
  mainDesc: {
    fontSize: 16,
    color: '#1E8E3E',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
    marginLeft: 4,
  },
  forecastContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dayText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  forecastMiddle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastRain: {
    fontSize: 13,
    color: '#1A73E8',
    marginLeft: 4,
    fontWeight: '500',
  },
  forecastTemps: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  maxTemp: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    width: 32,
    textAlign: 'right',
  },
  minTemp: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
    width: 32,
    textAlign: 'right',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#1E8E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  }
});

export default FarmerWeatherDetailsScreen;
