import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

import { FARMER_THEME } from '../constants/farmerTheme';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerBadge } from '../components/farmer/FarmerUI';
import {
  FarmerPrimaryButton,
  FarmerGoldButton,
  FarmerOutlineButton,
} from '../components/farmer/FarmerButtons';
import { PinIcon } from '../components/farmer/FarmerIcons';

// Admin theme imports
import { ADMIN_THEME, AdminFonts } from '../constants/adminTheme';
import { AdminPageBackground } from '../components/admin/AdminPageBackground';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminCard } from '../components/admin/AdminCard';
import { AdminBadge } from '../components/admin/StatusBadge';
import { AdminPrimaryButton, AdminGoldButton, AdminOutlineButton } from '../components/admin/AdminButtons';
import { LocationIcon, ClockIcon, PhoneIcon } from '../components/admin/AdminIcons';

const { height } = Dimensions.get('window');
const BOTTOM_INSET = Platform.OS === 'android' ? 24 : 0;
const SHEET_HEIGHT = height * 0.50;
const HANDLE_HEIGHT = 80;
const COLLAPSED_OFFSET = SHEET_HEIGHT - HANDLE_HEIGHT;

export const MarketDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const market: Market = route.params?.market;
  const isAdmin = route.params?.variant === 'admin';

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
    if (isAdmin) {
      return (
        <AdminPageBackground style={styles.centerContainer}>
          <AdminCard style={styles.adminErrorCard}>
            <Text style={styles.adminErrorText}>Market details not found.</Text>
            <AdminOutlineButton
              title="Go Back"
              onPress={() => navigation.goBack()}
              style={{ marginTop: 16 }}
            />
          </AdminCard>
        </AdminPageBackground>
      );
    }
    return (
      <FarmerPageBackground style={styles.centerContainer}>
        <FarmerCard style={styles.errorCard}>
          <Text style={styles.errorText}>Market details not found.</Text>
          <FarmerOutlineButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </FarmerCard>
      </FarmerPageBackground>
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
        android: `geo:0,0?q=${market.latitude},${market.longitude}(${market.marketName})`,
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
      market.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  // ADMIN VARIANT BRANCH
  if (isAdmin) {
    return (
      <AdminPageBackground>
        <AdminHeader
          variant="inner"
          title={market.marketName || 'Market Details'}
          subtitle="APMC / Mandi Information"
          onBack={() => navigation.goBack()}
        />

        {/* Map */}
        {market.latitude && market.longitude ? (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: Number(market.latitude),
                longitude: Number(market.longitude),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              scrollEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: Number(market.latitude),
                  longitude: Number(market.longitude),
                }}
                title={market.marketName}
              >
                <View style={styles.adminMarkerPin}>
                  <Ionicons name="storefront" size={16} color="#FFFFFF" />
                </View>
              </Marker>
            </MapView>
          </View>
        ) : (
          <View style={[styles.mapContainer, styles.adminMapPlaceholder]}>
            <Ionicons name="map-outline" size={40} color={ADMIN_THEME.colors.placeholder} />
            <Text style={styles.adminMapPlaceholderText}>No map coordinates available</Text>
          </View>
        )}

        {/* Animated Bottom Sheet (Admin Theme) */}
        <Animated.View style={[styles.adminBottomSheet, { transform: [{ translateY }] }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleSheet}
            style={styles.adminSheetHandleContainer}
          >
            <View style={styles.adminSheetHandle} />
            <View style={styles.sheetHeaderContent}>
              <Text style={styles.adminMarketNameTitle} numberOfLines={1}>
                {market.marketName}
              </Text>
              <Ionicons
                name={isCollapsed ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={ADMIN_THEME.colors.inkMuted}
              />
            </View>
          </TouchableOpacity>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {market.distance !== undefined && (
              <View style={styles.distanceBadgeRow}>
                <AdminBadge
                  label={`${market.distance.toFixed(1)} ${market.distanceUnit || 'km'} away`}
                  variant="info"
                />
              </View>
            )}

            {market.description ? (
              <Text style={styles.adminDescriptionText}>{market.description}</Text>
            ) : null}

            {/* Info Card with Indigo Icons */}
            <AdminCard style={styles.adminInfoCard}>
              <View style={styles.infoRowCompact}>
                <View style={styles.adminIconTile}>
                  <LocationIcon size={18} color="#4F5BD5" strokeWidth={2} />
                </View>
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.adminInfoLabel}>Address</Text>
                  <Text style={styles.adminInfoValue}>{getFullAddress() || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.infoRowCompact}>
                <View style={styles.adminIconTile}>
                  <ClockIcon size={18} color="#4F5BD5" strokeWidth={2} />
                </View>
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.adminInfoLabel}>Operating Hours</Text>
                  <Text style={styles.adminInfoValue}>
                    {market.openingTime ? market.openingTime : 'N/A'} -{' '}
                    {market.closingTime ? market.closingTime : 'N/A'}
                  </Text>
                </View>
              </View>

              {(market.marketContactName || market.contactNumber) && (
                <View style={styles.infoRowCompact}>
                  <View style={styles.adminIconTile}>
                    <PhoneIcon size={18} color="#4F5BD5" strokeWidth={2} />
                  </View>
                  <View style={styles.infoTextWrapper}>
                    <Text style={styles.adminInfoLabel}>Contact Person</Text>
                    <Text style={styles.adminInfoValue}>
                      {market.marketContactName ? `${market.marketContactName}` : ''}
                      {market.marketContactName && market.contactNumber ? ' • ' : ''}
                      {market.contactNumber ? `${market.contactNumber}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            </AdminCard>

            {/* Admin Actions */}
            <View style={styles.actionButtonsRow}>
              {market.latitude && market.longitude && (
                <AdminPrimaryButton
                  title="Directions"
                  onPress={handleDirections}
                  icon={<Ionicons name="navigate-outline" size={18} color="#FFFFFF" />}
                  style={{ flex: 1 }}
                />
              )}

              {market.contactNumber && (
                <AdminGoldButton
                  title="Call Market"
                  onPress={handleCall}
                  icon={<Ionicons name="call-outline" size={18} color="#0B1326" />}
                  style={{ flex: 1 }}
                />
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </AdminPageBackground>
    );
  }

  // DEFAULT (FARMER) VARIANT - 100% UNTOUCHED
  return (
    <FarmerPageBackground>
      {/* Emerald Inner Header */}
      <FarmerHeader
        variant="inner"
        title={market.marketName || 'Market Details'}
        onBackPress={() => navigation.goBack()}
      />

      {/* Map fills upper background */}
      {market.latitude && market.longitude ? (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: Number(market.latitude),
              longitude: Number(market.longitude),
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            scrollEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: Number(market.latitude),
                longitude: Number(market.longitude),
              }}
              title={market.marketName}
            >
              <View style={styles.markerPin}>
                <Ionicons name="storefront" size={16} color="#FFFFFF" />
              </View>
            </Marker>
          </MapView>
        </View>
      ) : (
        <View style={[styles.mapContainer, styles.mapPlaceholder]}>
          <Ionicons name="map-outline" size={40} color={FARMER_THEME.colors.placeholder} />
          <Text style={styles.mapPlaceholderText}>No map coordinates available</Text>
        </View>
      )}

      {/* Animated Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        {/* Drag Handle Area */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleSheet}
          style={styles.sheetHandleContainer}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderContent}>
            <Text
              style={styles.marketNameTitle}
              numberOfLines={1}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {market.marketName}
            </Text>
            <Ionicons
              name={isCollapsed ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={FARMER_THEME.colors.textSecondary}
            />
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
            <View style={styles.distanceBadgeRow}>
              <FarmerBadge
                label={`${market.distance.toFixed(1)} ${market.distanceUnit || 'km'} away`}
                variant="success"
              />
            </View>
          )}

          {market.description ? (
            <Text
              style={styles.descriptionText}
              maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
            >
              {market.description}
            </Text>
          ) : null}

          {/* Details Card */}
          <FarmerCard style={styles.infoCard}>
            <View style={styles.infoRowCompact}>
              <View style={[styles.infoIconTile, { backgroundColor: FARMER_THEME.colors.pastelGreen }]}>
                <PinIcon size={18} color={FARMER_THEME.colors.primaryGreen} strokeWidth={2} />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text
                  style={styles.infoValue}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {getFullAddress() || 'Not specified'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRowCompact}>
              <View style={[styles.infoIconTile, { backgroundColor: FARMER_THEME.colors.pastelYellow }]}>
                <Ionicons name="time-outline" size={18} color={FARMER_THEME.colors.warning} />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Operating Hours</Text>
                <Text
                  style={styles.infoValue}
                  maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                >
                  {market.openingTime ? market.openingTime : 'N/A'} -{' '}
                  {market.closingTime ? market.closingTime : 'N/A'}
                </Text>
              </View>
            </View>

            {(market.marketContactName || market.contactNumber) && (
              <View style={styles.infoRowCompact}>
                <View style={[styles.infoIconTile, { backgroundColor: FARMER_THEME.colors.pastelTeal }]}>
                  <Ionicons name="person-outline" size={18} color={FARMER_THEME.colors.tealGreen} />
                </View>
                <View style={styles.infoTextWrapper}>
                  <Text style={styles.infoLabel}>Contact Person</Text>
                  <Text
                    style={styles.infoValue}
                    maxFontSizeMultiplier={FARMER_THEME.typography.maxFontSizeMultiplier}
                  >
                    {market.marketContactName ? `${market.marketContactName}` : ''}
                    {market.marketContactName && market.contactNumber ? ' • ' : ''}
                    {market.contactNumber ? `${market.contactNumber}` : ''}
                  </Text>
                </View>
              </View>
            )}
          </FarmerCard>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {market.latitude && market.longitude && (
              <FarmerPrimaryButton
                title="Directions"
                onPress={handleDirections}
                icon={<Ionicons name="navigate-outline" size={18} color="#FFFFFF" />}
                style={{ flex: 1 }}
              />
            )}

            {market.contactNumber && (
              <FarmerGoldButton
                title="Call Market"
                onPress={handleCall}
                icon={<Ionicons name="call-outline" size={18} color={FARMER_THEME.colors.headings} />}
                style={{ flex: 1 }}
              />
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 16,
    color: FARMER_THEME.colors.headings,
    textAlign: 'center',
  },
  adminErrorCard: {
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  adminErrorText: {
    fontFamily: AdminFonts.bold,
    fontSize: 16,
    color: ADMIN_THEME.colors.ink,
    textAlign: 'center',
  },
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
  adminMarkerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4F5BD5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...ADMIN_THEME.shadows.fab,
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  adminMapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ADMIN_THEME.colors.pearl,
  },
  mapPlaceholderText: {
    fontFamily: FARMER_THEME.fonts.medium,
    color: FARMER_THEME.colors.textSecondary,
    fontSize: 13,
  },
  adminMapPlaceholderText: {
    fontFamily: AdminFonts.medium,
    color: ADMIN_THEME.colors.inkMuted,
    fontSize: 13,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: BOTTOM_INSET,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: FARMER_THEME.colors.pageBgBottom,
    borderTopLeftRadius: FARMER_THEME.radius.bottomSheets,
    borderTopRightRadius: FARMER_THEME.radius.bottomSheets,
    ...FARMER_THEME.shadows.stickyBar,
  },
  adminBottomSheet: {
    position: 'absolute',
    bottom: BOTTOM_INSET,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: ADMIN_THEME.colors.pearl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...ADMIN_THEME.shadows.stickyBar,
  },
  sheetHandleContainer: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: FARMER_THEME.radius.bottomSheets,
    borderTopRightRadius: FARMER_THEME.radius.bottomSheets,
    backgroundColor: FARMER_THEME.colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: FARMER_THEME.colors.divider,
  },
  adminSheetHandleContainer: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_THEME.colors.cardBorder,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: FARMER_THEME.colors.cardBorder,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  adminSheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#D7DCED',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketNameTitle: {
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 18,
    color: FARMER_THEME.colors.headings,
    flex: 1,
    marginRight: 10,
  },
  adminMarketNameTitle: {
    fontFamily: AdminFonts.bold,
    fontSize: 18,
    color: ADMIN_THEME.colors.ink,
    flex: 1,
    marginRight: 10,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  distanceBadgeRow: {
    alignSelf: 'flex-start',
  },
  descriptionText: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 13,
    color: FARMER_THEME.colors.bodyText,
    lineHeight: 19,
  },
  adminDescriptionText: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.inkMuted,
    lineHeight: 19,
  },
  infoCard: {
    padding: 16,
    gap: 14,
  },
  adminInfoCard: {
    padding: 16,
    gap: 14,
  },
  infoRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminIconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8EBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 11,
    color: FARMER_THEME.colors.textSecondary,
    marginBottom: 2,
  },
  adminInfoLabel: {
    fontFamily: AdminFonts.medium,
    fontSize: 11,
    color: ADMIN_THEME.colors.inkMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13.5,
    color: FARMER_THEME.colors.headings,
    lineHeight: 18,
  },
  adminInfoValue: {
    fontFamily: AdminFonts.bold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});

export default MarketDetailsScreen;
