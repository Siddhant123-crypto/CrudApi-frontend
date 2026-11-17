import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Animated,
  AppState,
  AppStateStatus,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getFarmerShorts,
  FarmerShortItem,
} from '../services/shortsService';
import { resolveMediaUrl } from '../services/api';
import { useTranslation } from 'react-i18next';

// Single Short Item Component
interface ShortItemProps {
  item: FarmerShortItem;
  index: number;
  isActive: boolean;
  isPreload: boolean;
  isScreenFocused: boolean;
  isAppActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  onVideoError: (shortId: string) => void;
  onRetry: (shortId: string) => void;
  errorCount: number;
  itemHeight: number;
}

const ShortItem: React.FC<ShortItemProps> = React.memo(({
  item,
  isActive,
  isPreload,
  isScreenFocused,
  isAppActive,
  isMuted,
  toggleMute,
  onVideoError,
  onRetry,
  errorCount,
  itemHeight,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);

  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showIcon, setShowIcon] = useState(false);
  const [iconType, setIconType] = useState<'play' | 'pause'>('pause');

  const iconAnim = useRef(new Animated.Value(0)).current;

  // Reset user paused when video becomes active
  useEffect(() => {
    if (isActive) {
      setIsUserPaused(false);
      setProgress(0);
      setIsBuffering(true);
    }
  }, [isActive]);

  const triggerIconAnimation = (type: 'play' | 'pause') => {
    setIconType(type);
    setShowIcon(true);
    iconAnim.setValue(0);
    Animated.sequence([
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(350),
      Animated.timing(iconAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowIcon(false);
    });
  };

  const handleTap = () => {
    if (isUserPaused) {
      setIsUserPaused(false);
      triggerIconAnimation('play');
    } else {
      setIsUserPaused(true);
      triggerIconAnimation('pause');
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        onVideoError(item.id);
      }
      return;
    }

    setIsBuffering(status.isBuffering);

    if (status.durationMillis && status.durationMillis > 0) {
      setProgress(status.positionMillis / status.durationMillis);
    }
  };

  const shouldPlay = isActive && isScreenFocused && isAppActive && !isUserPaused;
  const isFailed = errorCount > 0;

  const resolvedPlaybackUrl = resolveMediaUrl(item.playbackUrl) || item.playbackUrl;
  const resolvedThumbnailUrl = resolveMediaUrl(item.thumbnailUrl);

  return (
    <View style={[styles.shortItemContainer, { height: itemHeight }]}>
      {/* 1) Video or Preload or Thumbnail Fallback */}
      {isActive || isPreload ? (
        <Video
          ref={videoRef}
          source={{ uri: resolvedPlaybackUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={shouldPlay}
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={() => onVideoError(item.id)}
        />
      ) : null}

      {/* 2) When video is off-screen or loading: Render thumbnail or neutral placeholder */}
      {(!isActive && !isPreload) || isBuffering ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {resolvedThumbnailUrl ? (
            <Image
              source={{ uri: resolvedThumbnailUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#0F172A', '#1E293B', '#090D16']}
              style={[StyleSheet.absoluteFill, styles.neutralPlaceholder]}
            >
              <Ionicons name="videocam-outline" size={54} color="rgba(255,255,255,0.2)" />
              <Text style={styles.neutralPlaceholderText}>{t('shorts.farmerShort')}</Text>
            </LinearGradient>
          )}
        </View>
      ) : null}

      {/* 3) Transparent Dark Gradients for contrast */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 4) Center Tap Area for Play / Pause toggle */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={handleTap}
        activeOpacity={1}
      />

      {/* 5) Buffering Spinner */}
      {isBuffering && !isFailed && isActive ? (
        <View style={styles.centerSpinner} pointerEvents="none">
          <ActivityIndicator size="large" color="#2FA66B" />
        </View>
      ) : null}

      {/* 6) Animated Play/Pause Icon */}
      {showIcon ? (
        <Animated.View
          style={[
            styles.animatedCenterIcon,
            {
              opacity: iconAnim,
              transform: [
                {
                  scale: iconAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1.2],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name={iconType === 'play' ? 'play' : 'pause'}
              size={40}
              color="#FFFFFF"
            />
          </View>
        </Animated.View>
      ) : null}

      {/* 7) Error Card on Playback Failure */}
      {isFailed ? (
        <View style={styles.errorOverlay} pointerEvents="box-none">
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={38} color="#FF6B6B" />
            <Text style={styles.errorTitle}>{t('shorts.videoCannotBePlayed')}</Text>
            <Text style={styles.errorSubtitle}>
              {t('shorts.videoCannotBePlayedDesc')}
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => onRetry(item.id)}
              activeOpacity={0.85}
            >
              <Ionicons name="reload" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* 8) Floating Right Action Button: Mute / Unmute */}
      <View
        style={[
          styles.rightActions,
          { bottom: Math.max(insets.bottom, 16) + 70 },
        ]}
      >
        <TouchableOpacity
          style={styles.actionCircleBtn}
          onPress={toggleMute}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* 9) Bottom Overlay: Farmer Name, Farm Name, Location, Description */}
      <View
        style={[
          styles.bottomInfoContainer,
          { bottom: Math.max(insets.bottom, 16) + 14 },
        ]}
        pointerEvents="box-none"
      >
        {/* Farmer Badge */}
        <View style={styles.farmerBadgeRow}>
          <View style={styles.farmerAvatarPlaceholder}>
            <Ionicons name="leaf" size={13} color="#2FA66B" />
          </View>
          <Text style={styles.farmerHandleText} numberOfLines={1}>
            {item.farmerName}
          </Text>
          <View style={styles.verifiedTick}>
            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
          </View>
        </View>

        {/* Farm Name */}
        <Text style={styles.farmTitleText} numberOfLines={1}>
          🌾 {item.farmName}
        </Text>

        {/* Tagline / About Farm */}
        {item.tagline || item.aboutFarm ? (
          <Text style={styles.farmDescText} numberOfLines={2}>
            {item.tagline || item.aboutFarm}
          </Text>
        ) : null}

        {/* Location & Farming Type Pills */}
        <View style={styles.pillRow}>
          {item.location ? (
            <View style={styles.infoPill}>
              <Ionicons
                name="location-sharp"
                size={11}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.pillText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}

          {item.farmingType ? (
            <View style={[styles.infoPill, styles.farmingTypePill]}>
              <Text style={styles.pillText} numberOfLines={1}>
                🌱 {item.farmingType}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 10) Thin Bottom Progress Bar */}
      <View style={[styles.progressBarTrack, { bottom: Math.max(insets.bottom, 8) }]}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
      </View>
    </View>
  );
});

// Main Farmer Shorts Screen
export const FarmerShortsScreen = ({ route, navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);

  const initialShorts: FarmerShortItem[] = route?.params?.initialShorts || [];
  const initialIndex: number = route?.params?.initialIndex ?? 0;

  const [shorts, setShorts] = useState<FarmerShortItem[]>(initialShorts);
  const [loading, setLoading] = useState(initialShorts.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isAppActive, setIsAppActive] = useState(true);
  const [errorCounts, setErrorCounts] = useState<{ [id: string]: number }>({});

  // AppState listener for pausing on background
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        setIsAppActive(nextState === 'active');
      },
    );
    return () => subscription.remove();
  }, []);

  // Fetch initial shorts feed
  const loadShorts = useCallback(
    async (pageToLoad = 0, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (pageToLoad === 0 && shorts.length === 0) {
          setLoading(true);
        } else if (pageToLoad > 0) {
          setLoadingMore(true);
        }

        const res = await getFarmerShorts(pageToLoad, 10);

        if (isRefresh || pageToLoad === 0) {
          setShorts(res.items);
          setPage(0);
        } else {
          setShorts(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const freshItems = res.items.filter(i => !existingIds.has(i.id));
            return [...prev, ...freshItems];
          });
          setPage(pageToLoad);
        }

        setHasMore(res.hasMore);
      } catch (err) {
        console.log('Error loading shorts feed:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [shorts.length],
  );

  useEffect(() => {
    loadShorts(0);
  }, []);

  const handleRefresh = () => {
    loadShorts(0, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      loadShorts(page + 1);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleVideoError = (shortId: string) => {
    setErrorCounts(prev => {
      const current = (prev[shortId] || 0) + 1;
      // If failed twice, automatically scroll to next short
      if (current >= 2) {
        setTimeout(() => {
          if (activeIndex < shorts.length - 1) {
            flatListRef.current?.scrollToIndex({
              index: activeIndex + 1,
              animated: true,
            });
          }
        }, 1200);
      }
      return { ...prev, [shortId]: current };
    });
  };

  const handleRetry = (shortId: string) => {
    setErrorCounts(prev => ({ ...prev, [shortId]: 0 }));
  };

  // Viewable items changed
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: any) => {
      if (viewableItems && viewableItems.length > 0) {
        const item = viewableItems[0];
        if (typeof item.index === 'number') {
          setActiveIndex(item.index);
        }
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  if (loading && shorts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#2FA66B" />
        <Text style={styles.loadingText}>Loading Farmer Shorts...</Text>
      </View>
    );
  }

  if (!loading && shorts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Ionicons name="videocam-off-outline" size={54} color="rgba(255,255,255,0.3)" />
        <Text style={styles.emptyTitle}>{t('shorts.noShortsTitle')}</Text>
        <Text style={styles.emptySubtitle}>
          {t('shorts.noShortsSubtitle')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* Top Floating Back Button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Top Shorts Header Label */}
      <View style={[styles.topHeaderTag, { top: insets.top + 14 }]}>
        <View style={styles.topHeaderDot} />
        <Text style={styles.topHeaderText}>{t('shorts.shorts')}</Text>
      </View>

      {/* Vertical Paging FlatList */}
      <FlatList
        ref={flatListRef}
        data={shorts}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ShortItem
            item={item}
            index={index}
            isActive={index === activeIndex}
            isPreload={index === activeIndex + 1}
            isScreenFocused={isFocused}
            isAppActive={isAppActive}
            isMuted={isMuted}
            toggleMute={toggleMute}
            onVideoError={handleVideoError}
            onRetry={handleRetry}
            errorCount={errorCounts[item.id] || 0}
            itemHeight={windowHeight}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={windowHeight}
        snapToAlignment="start"
        initialScrollIndex={initialIndex < shorts.length ? initialIndex : 0}
        getItemLayout={(_, index) => ({
          length: windowHeight,
          offset: windowHeight * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews={true}
        initialNumToRender={2}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#2FA66B']}
          />
        }
      />
    </View>
  );
};

export default FarmerShortsScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  shortItemContainer: {
    width: Dimensions.get('window').width,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  neutralPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  neutralPlaceholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  centerSpinner: {
    position: 'absolute',
    top: '48%',
    left: '48%',
    zIndex: 4,
  },
  animatedCenterIcon: {
    position: 'absolute',
    top: '46%',
    left: '44%',
    zIndex: 5,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTag: {
    position: 'absolute',
    left: 68,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  topHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D4D',
  },
  topHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    zIndex: 6,
    alignItems: 'center',
    gap: 16,
  },
  actionCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfoContainer: {
    position: 'absolute',
    left: 16,
    right: 76,
    zIndex: 6,
  },
  farmerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  farmerAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerHandleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedTick: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#2FA66B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  farmDescText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  farmingTypePill: {
    backgroundColor: 'rgba(47,166,107,0.3)',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2FA66B',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 7,
    paddingHorizontal: 24,
  },
  errorCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    maxWidth: 320,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 17,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2FA66B',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
