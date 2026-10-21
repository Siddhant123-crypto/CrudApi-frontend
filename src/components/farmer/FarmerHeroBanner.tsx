import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  LayoutChangeEvent,
  AppState,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface FarmerHeroBannerProps {
  onAddProductPress: () => void;
  currentIndex?: number;
  totalSlides?: number;
}

const FARMER_HERO_IMAGES = [
  require('../../../assets/vagis4.png'),
  require('../../../assets/vagis5.png'),
  require('../../../assets/vagis6.png'),
];

const BANNER_HEIGHT = 190;

const IMAGE_ASSETS = FARMER_HERO_IMAGES.map((source) => {
  const resolved = Image.resolveAssetSource(source);
  return {
    source,
    width: resolved?.width || 350,
    height: resolved?.height || 190,
  };
});

export const FarmerHeroBanner: React.FC<FarmerHeroBannerProps> = ({
  onAddProductPress,
}) => {
  const isFocused = useIsFocused();
  const appState = useRef(AppState.currentState);

  const [bannerWidth, setBannerWidth] = useState(
    Dimensions.get('window').width - 40
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  // Animated values for image opacities (cross-fade)
  const imageOpacities = useRef([
    new Animated.Value(1),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Animated values for dot widths (smooth expansion / contraction)
  const dotWidths = useRef([
    new Animated.Value(22),
    new Animated.Value(6),
    new Animated.Value(6),
  ]).current;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onBannerLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - bannerWidth) > 1) {
      setBannerWidth(width);
    }
  };

  const goToSlide = useCallback((nextIdx: number) => {
    if (nextIdx === activeIndexRef.current) return;
    const prevIdx = activeIndexRef.current;
    activeIndexRef.current = nextIdx;
    setActiveIndex(nextIdx);

    // Cross-fade: in parallel fade in new image & fade out old image
    Animated.parallel([
      Animated.timing(imageOpacities[nextIdx], {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(imageOpacities[prevIdx], {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Smooth dot width animation (300ms)
    dotWidths.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: idx === nextIdx ? 22 : 6,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [imageOpacities, dotWidths]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!isFocused || appState.current !== 'active') {
      return;
    }
    timerRef.current = setInterval(() => {
      const nextIdx = (activeIndexRef.current + 1) % 3;
      goToSlide(nextIdx);
    }, 3000);
  }, [isFocused, goToSlide]);

  const handleDotPress = (index: number) => {
    goToSlide(index);
    resetTimer();
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
      if (nextAppState === 'active' && isFocused) {
        resetTimer();
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    });

    if (isFocused && appState.current === 'active') {
      resetTimer();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isFocused, resetTimer]);

  return (
    <View style={styles.wrapper}>
      {/* Banner Container */}
      <View
        style={styles.bannerContainer}
        onLayout={onBannerLayout}
      >
        {/* Stacked Images for cross-fade, anchored to the right */}
        {IMAGE_ASSETS.map((asset, index) => {
          const scale = Math.max(
            bannerWidth / asset.width,
            BANNER_HEIGHT / asset.height
          );
          const renderedWidth = asset.width * scale;
          const renderedHeight = asset.height * scale;
          const topOffset = (BANNER_HEIGHT - renderedHeight) / 2;

          return (
            <Animated.Image
              key={index}
              source={asset.source}
              style={[
                styles.heroImage,
                {
                  width: renderedWidth,
                  height: renderedHeight,
                  top: topOffset,
                  right: 0,
                  opacity: imageOpacities[index],
                },
              ]}
              resizeMode="cover"
            />
          );
        })}

        {/* Dark left overlay for text readability */}
        <LinearGradient
          colors={[
            'rgba(6,32,26,0.94)',
            'rgba(6,32,26,0.55)',
            'rgba(6,32,26,0)',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Text Block on top of overlay */}
        <View style={styles.textBlock} pointerEvents="box-none">
          {/* Chip */}
          <View style={styles.chip}>
            <Text style={styles.chipText}>YOUR FARM</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Farm{'\n'}Performance</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Manage your stock & orders
          </Text>

          {/* Add product button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAddProductPress}
            style={styles.btnShadow}
          >
            <LinearGradient
              colors={FARMER_THEME.colors.ctaGoldGradient}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
              style={styles.addProductBtn}
            >
              <Text style={styles.addProductText}>Add product</Text>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 5v14M5 12h14"
                  stroke={FARMER_THEME.colors.darkGreen}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pagination Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((index) => {
          const isActive = activeIndex === index;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            >
              <Animated.View
                style={[
                  styles.dotBase,
                  {
                    width: dotWidths[index],
                    backgroundColor: isActive
                      ? FARMER_THEME.colors.primaryGreen
                      : '#C5D8CB',
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  bannerContainer: {
    height: BANNER_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0A2C1E',
    position: 'relative',
    ...FARMER_THEME.shadows.heroBanner,
  },
  heroImage: {
    position: 'absolute',
  },
  textBlock: {
    position: 'absolute',
    top: 20,
    left: 22,
    width: 200,
    zIndex: 3,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  chipText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: FARMER_THEME.colors.goldLight,
  },
  title: {
    marginTop: 8,
    fontFamily: FARMER_THEME.fonts.serif,
    fontSize: 21,
    lineHeight: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    marginTop: 5,
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  btnShadow: {
    marginTop: 12,
    alignSelf: 'flex-start',
    ...FARMER_THEME.shadows.addProductBtn,
  },
  addProductBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addProductText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 13,
    color: FARMER_THEME.colors.darkGreen,
  },
  dotsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dotBase: {
    height: 6,
    borderRadius: 3,
  },
});

export default FarmerHeroBanner;
