import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FARMER_THEME } from '../../constants/farmerTheme';
import { PlayIcon } from './FarmerIcons';

export interface FarmerShortCardProps {
  id?: string | number;
  handle: string;
  thumbnailUrl?: any;
  index: number;
  onPress: () => void;
}

export const FarmerShortCard: React.FC<FarmerShortCardProps> = ({
  handle,
  thumbnailUrl,
  onPress,
}) => {
  const displayHandle = handle.startsWith('@') ? handle : `@${handle}`;

  const imageSource =
    typeof thumbnailUrl === 'string'
      ? { uri: thumbnailUrl }
      : thumbnailUrl || null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.cardInner}>
        {/* Real Thumbnail Image */}
        {imageSource ? (
          <Image
            source={imageSource}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          /* Subtle clean dark gradient fallback when no image exists */
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Transparent Dark Overlay: clear in the middle, dark at top and bottom */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.72)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Shorts badge */}
        <View style={styles.shortsBadge}>
          <View style={styles.shortsRedDot} />
          <Text style={styles.shortsText}>Shorts</Text>
        </View>

        {/* Centered Play button */}
        <View style={styles.playButton}>
          <PlayIcon size={20} color="#FFFFFF" />
        </View>

        {/* Bottom Handle */}
        <View style={styles.bottomOverlay}>
          <Text style={styles.handleText} numberOfLines={1}>
            {displayHandle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 158,
    height: 236,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    ...FARMER_THEME.shadows.shortsCard,
  },
  cardInner: {
    width: 158,
    height: 236,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  shortsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 2,
  },
  shortsRedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF5B4D',
  },
  shortsText: {
    fontFamily: FARMER_THEME.fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  playButton: {
    position: 'absolute',
    top: 94,
    left: 55,
    width: 48,
    height: 48,
    borderRadius: 24,
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    zIndex: 2,
  },
  handleText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default FarmerShortCard;
