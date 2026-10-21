import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import api, { BASE_URL } from '../services/api';

import { LinearGradient } from 'expo-linear-gradient';
import { FARMER_THEME } from '../constants/farmerTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProductItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  unit: string;
  productPhoto?: string;
  productVideo?: string;
  status: string;
  isDelete?: boolean;
  farmerName?: string;
  farmerId?: string;
}

// Individual Short Card with its own video player
const ShortItem = ({
  product,
  isActive,
}: {
  product: ProductItem;
  isActive: boolean;
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const videoUrl = product.productVideo
    ? `${BASE_URL}/product/video/${product.productVideo}`
    : null;

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pauseAsync().catch(() => {});
      videoRef.current.setPositionAsync(0).catch(() => {});
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!isMuted);
    setIsMuted(!isMuted);
  };

  return (
    <View style={styles.shortItem}>
      {/* Video */}
      {videoUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={false}
          isMuted={isMuted}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
            }
          }}
        />
      ) : (
        <View style={[styles.video, styles.noVideoPlaceholder]}>
          <Ionicons name="videocam-off" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={styles.noVideoText}>No video available</Text>
        </View>
      )}

      {/* Dark gradient overlay (transparent -> dark emerald) */}
      <LinearGradient
        colors={['transparent', 'rgba(8,36,25,0.35)', 'rgba(8,36,25,0.85)']}
        style={styles.overlay}
      />

      {/* Top Shorts badge */}
      <View style={styles.topBadge}>
        <Ionicons name="videocam" size={13} color="#F5C84B" />
        <Text style={styles.topBadgeText}> Shorts</Text>
      </View>

      {/* Side action buttons */}
      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.sideBtn} onPress={toggleMute} activeOpacity={0.8}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Center tap area for play/pause */}
      <TouchableOpacity
        style={styles.centerTapArea}
        onPress={togglePlay}
        activeOpacity={1}
      >
        {!isPlaying && (
          <View style={styles.playCircle}>
            <Ionicons name="play" size={38} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <View style={styles.farmerRow}>
          <View style={styles.farmerAvatar}>
            <Ionicons name="person" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.farmerName} numberOfLines={1}>
            {product.farmerName || 'Farmer'}
          </Text>
        </View>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.productName}
        </Text>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>{product.category}</Text>
        </View>
      </View>
    </View>
  );
};

const FarmerShortsScreen = ({ navigation }: any) => {
  const [videoProducts, setVideoProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchVideoProducts();
      return () => {
        // cleanup when leaving
        setActiveIndex(-1);
      };
    }, [])
  );

  const fetchVideoProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/product/getAll');
      const raw: ProductItem[] = Array.isArray(response.data) ? response.data : [];
      const videos = raw.filter(
        (p) => !!p.productVideo && p.isDelete !== true && p.status !== 'DELETED'
      );

      // Try to enrich with farmer names
      const enriched = await Promise.all(
        videos.map(async (p) => {
          try {
            if (p.farmerId) {
              const farmerRes = await api.get(`/farmer/getById/${p.farmerId}`);
              const f = farmerRes.data;
              return {
                ...p,
                farmerName: f?.name || f?.fullName || f?.firstName || f?.email || 'Farmer',
              };
            }
          } catch {}
          return p;
        })
      );
      setActiveIndex(0);
      setVideoProducts(enriched);
    } catch (error) {
      console.log('Error fetching video products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setActiveIndex(idx);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading Farmer Shorts...</Text>
      </SafeAreaView>
    );
  }

  if (videoProducts.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Ionicons name="videocam-off-outline" size={64} color="rgba(255,255,255,0.3)" />
        <Text style={styles.emptyTitle}>No Farmer Shorts Yet</Text>
        <Text style={styles.emptySub}>
          Farmers haven't uploaded any video shorts yet.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Header title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 Farmer Shorts</Text>
        <Text style={styles.headerSub}>{videoProducts.length} videos</Text>
      </View>

      <FlatList
        data={videoProducts}
        keyExtractor={(item) => item.productId}
        renderItem={({ item, index }) => (
          <ShortItem product={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
};

export default FarmerShortsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 22,
    marginTop: 12,
  },
  emptySub: {
    fontFamily: FARMER_THEME.fonts.regular,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    position: 'absolute',
    top: 56,
    left: 64,
    zIndex: 99,
  },
  headerTitle: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 17,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSub: {
    fontFamily: FARMER_THEME.fonts.medium,
    color: '#F5D77A',
    fontSize: 11,
    marginTop: 1,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 14,
    zIndex: 100,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  noVideoPlaceholder: {
    backgroundColor: '#082419',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noVideoText: {
    fontFamily: FARMER_THEME.fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBadge: {
    position: 'absolute',
    top: 110,
    right: 16,
    backgroundColor: 'rgba(8,36,25,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(124,203,156,0.4)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBadgeText: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 11,
  },
  sideActions: {
    position: 'absolute',
    right: 16,
    bottom: 170,
    alignItems: 'center',
    gap: 20,
  },
  sideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTapArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 80,
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(8,36,25,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(124,203,156,0.35)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  farmerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#17663F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  farmerName: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  productTitle: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(23,102,63,0.85)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,203,156,0.4)',
  },
  categoryPillText: {
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 11.5,
  },
});
