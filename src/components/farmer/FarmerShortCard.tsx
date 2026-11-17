import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { PlayIcon } from './FarmerIcons';
import { resolveMediaUrl } from '../../services/api';

export interface FarmerShortCardProps {
  id?: string | number;
  handle: string;
  farmName?: string;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  index: number;
  onPress: () => void;
}

export const FarmerShortCard: React.FC<FarmerShortCardProps> = ({
  handle,
  farmName,
  thumbnailUrl,
  videoUrl,
  onPress,
}) => {
  const { t } = useTranslation();
  const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;
  const resolvedUri = resolveMediaUrl(thumbnailUrl);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  // Shimmer pulse animation while thumbnail is loading
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (!imgLoaded && !imgError && resolvedUri) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 0.65,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.3,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [imgLoaded, imgError, resolvedUri, shimmerAnim]);

  const handleImageLoad = () => {
    setImgLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleImageError = (e: any) => {
    setImgError(true);
  };

  const showRealImage = !!resolvedUri && !imgError;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.cardInner}>
        {/* 1) Base Neutral Placeholder (Always visible under image or on error) */}
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          style={[StyleSheet.absoluteFill, styles.neutralPlaceholder]}
        >
          <Ionicons
            name="videocam-outline"
            size={36}
            color="rgba(255,255,255,0.22)"
          />
        </LinearGradient>

        {/* 2) Loading Shimmer overlay while image loads */}
        {showRealImage && !imgLoaded ? (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.shimmerOverlay,
              { opacity: shimmerAnim },
            ]}
          />
        ) : null}

        {/* 3) Real Video Thumbnail with Fade-In */}
        {showRealImage ? (
          <Animated.Image
            source={{ uri: resolvedUri }}
            style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
            resizeMode="cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : null}

        {/* 4) Transparent Dark Overlay: clear in middle, dark at top and bottom */}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.78)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* 5) Shorts badge */}
        <View style={styles.shortsBadge}>
          <View style={styles.shortsRedDot} />
          <Text style={styles.shortsText}>{t('shorts.shorts', 'Shorts')}</Text>
        </View>

        {/* 6) Centered Play button */}
        <View style={styles.playButton} pointerEvents="none">
          <PlayIcon size={20} color="#FFFFFF" />
        </View>

        {/* 7) Bottom Handle & Farm Name */}
        <View style={styles.bottomOverlay} pointerEvents="none">
          <Text style={styles.handleText} numberOfLines={1}>
            {displayHandle}
          </Text>
          {farmName ? (
            <Text style={styles.farmNameText} numberOfLines={1}>
              🌾 {farmName}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 145,
    height: 236, // ~9:16 vertical card
    borderRadius: 20,
    backgroundColor: '#0F172A',
    ...FARMER_THEME.shadows.shortsCard,
  },
  cardInner: {
    width: 145,
    height: 236,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  neutralPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerOverlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shortsBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.48)',
    zIndex: 2,
  },
  shortsRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5B4D',
  },
  shortsText: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  playButton: {
    position: 'absolute',
    top: 96,
    left: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    zIndex: 2,
  },
  handleText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  farmNameText: {
    fontFamily: FARMER_THEME.fonts.medium,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default FarmerShortCard;
