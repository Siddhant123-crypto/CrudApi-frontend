import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  Linking,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { Audio, Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  getAdminFarmDetails,
  getAdminFarmGallery,
  verifyFarmer,
  requestFarmerAdditionalInfo,
} from '../../services/adminService';
import { refreshFarmVerificationPendingCount } from '../../hooks/useFarmVerificationPendingCount';
import { BASE_URL, resolveMediaUrl } from '../../services/api';
import { ADMIN_THEME, AdminFonts } from '../../constants/adminTheme';
import {
  AdminPageBackground,
  AdminHeader,
  AdminCard,
  AdminBadge,
  AdminStickyBar,
  AdminDangerButton,
  AdminOutlineButton,
  AdminInput,
  ShieldCheckIcon,
  PhoneIcon,
} from '../../components/admin';

// ─── HELPER: FORMAT VIDEO DURATION (Safe: mm:ss, e.g. 45 -> 00:45, 90 -> 01:30) ───
const formatVideoDuration = (seconds?: number | null): string | null => {
  if (seconds === null || seconds === undefined) return null;
  const num = typeof seconds === 'number' ? seconds : parseInt(String(seconds), 10);
  if (isNaN(num) || num <= 0) return null;
  const mins = Math.floor(num / 60);
  const secs = num % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// ─── EMBEDDED FARM SHORTS VIDEO PLAYER ───────────────────────────────────────
const AdminFarmVideoPlayer: React.FC<{
  videoUrl: string;
  originalVideoUrl?: string;
  farmName?: string;
  farmerName?: string;
  thumbnailUrl?: string;
  durationSeconds?: number | null;
}> = ({ videoUrl, originalVideoUrl, farmName, farmerName, thumbnailUrl, durationSeconds }) => {
  const { t } = useTranslation();
  const formattedDuration = formatVideoDuration(durationSeconds);
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    setIsLoading(true);
    setLoadError(false);
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(() => {});
      }
    };
  }, [videoUrl]);

  const handleManualRetry = async () => {
    setLoadError(false);
    setIsLoading(true);
    if (videoRef.current) {
      try {
        await videoRef.current.unloadAsync();
        await videoRef.current.loadAsync({ uri: videoUrl }, { shouldPlay: true }, false);
        setIsPlaying(true);
      } catch (e) {
        console.warn('[AdminFarmVideoPlayer] Manual retry error:', e);
        setLoadError(true);
        setIsLoading(false);
      }
    }
  };

  const openExternal = async () => {
    const targetUrl = originalVideoUrl || videoUrl;
    if (!targetUrl) return;
    try {
      await Linking.openURL(targetUrl);
    } catch (e) {
      console.warn('[AdminFarmVideoPlayer] Failed to open external URL:', e);
    }
  };

  const togglePlay = async () => {
    if (loadError) return;
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('[AdminFarmVideoPlayer] Play error:', err);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    try {
      const nextMuted = !isMuted;
      await videoRef.current.setIsMutedAsync(nextMuted);
      setIsMuted(nextMuted);
    } catch (err) {
      console.warn('[AdminFarmVideoPlayer] Mute error:', err);
    }
  };

  const handleFullscreen = async () => {
    if (!videoRef.current || loadError) return;
    try {
      await videoRef.current.presentFullscreenPlayer();
    } catch (err) {
      console.warn('[AdminFarmVideoPlayer] Fullscreen error:', err);
    }
  };

  return (
    <View style={styles.playerContainer}>
      {!loadError ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.playerVideo}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isPlaying}
          isMuted={isMuted}
          useNativeControls={false}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => {
            setIsLoading(false);
            setLoadError(false);
          }}
          onError={(err) => {
            console.warn('[AdminFarmVideoPlayer] Video load error:', err);
            setIsLoading(false);
            setLoadError(true);
          }}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              setIsLoading(status.isBuffering);
            }
          }}
        />
      ) : (
        <View style={styles.playerErrorContainer}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={[StyleSheet.absoluteFillObject, { opacity: 0.25 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0F172A' }]} />
          )}
          <View style={styles.playerErrorCard}>
            <View style={styles.playerErrorIconCircle}>
              <Ionicons name="videocam-off-outline" size={26} color="#F87171" />
            </View>
            <Text style={styles.playerErrorHeadline}>
              This video cannot be played in the app
            </Text>
            <Text style={styles.playerErrorDetail}>
              Your device's hardware decoder does not support this video resolution or format.
            </Text>

            <View style={styles.playerErrorButtonsRow}>
              <TouchableOpacity
                style={styles.playerExternalBtn}
                onPress={openExternal}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={15} color="#FFFFFF" />
                <Text style={styles.playerExternalBtnText}>{t('admin.openInExternalPlayer')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playerRetryBtn}
                onPress={handleManualRetry}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh-outline" size={15} color="#E2E8F0" />
                <Text style={styles.playerRetryBtnText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Dark gradient overlay for controls & text visibility (when not in error) */}
      {!loadError && (
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.85)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}

      {/* Top Shorts Badge & Duration */}
      <View style={styles.playerTopLeftRow} pointerEvents="none">
        <View style={styles.playerBadge}>
          <Ionicons name="videocam" size={13} color="#F5C84B" />
          <Text style={styles.playerBadgeText}> {t('admin.farmBadge')}</Text>
        </View>
        {formattedDuration ? (
          <View style={styles.playerDurationBadge}>
            <Ionicons name="time-outline" size={12} color="#FFFFFF" />
            <Text style={styles.playerDurationText}>{formattedDuration}</Text>
          </View>
        ) : null}
      </View>

      {/* Top Right Action Buttons: Fullscreen & Sound */}
      {!loadError && (
        <View style={styles.playerTopActions}>
          <TouchableOpacity
            style={styles.playerIconBtn}
            onPress={handleFullscreen}
            activeOpacity={0.8}
          >
            <Ionicons name="expand-outline" size={17} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playerIconBtn}
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={17}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Center Tap Area for Play/Pause */}
      {!loadError && (
        <TouchableOpacity
          style={styles.playerTapArea}
          onPress={togglePlay}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <View style={styles.playerLoadingCircle}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : !isPlaying ? (
            <View style={styles.playerPlayCircle}>
              <Ionicons name="play" size={34} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
          ) : null}
        </TouchableOpacity>
      )}

      {/* Bottom Info Bar */}
      <View style={styles.playerBottomOverlay} pointerEvents="none">
        <Text style={styles.playerFarmTitle} numberOfLines={1}>
          🌾 {farmName || 'Farm Video'}
        </Text>
        {farmerName ? (
          <Text style={styles.playerFarmerSubtitle} numberOfLines={1}>
            Farmer: {farmerName}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

// ─── PINCH-TO-ZOOM FULLSCREEN PHOTO VIEWER ──────────────────────────────────
const AdminZoomablePhotoView: React.FC<{
  uri: string;
  onSingleTap?: () => void;
}> = ({ uri, onSingleTap }) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const lastScale = useRef(1);
  const currentX = useRef(0);
  const lastX = useRef(0);
  const currentY = useRef(0);
  const lastY = useRef(0);

  const initialDistance = useRef(0);
  const initialScale = useRef(1);
  const isPinching = useRef(false);
  const lastTap = useRef(0);
  const singleTapTimer = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
      }
    };
  }, []);

  const resetZoom = (animated = true) => {
    currentScale.current = 1;
    lastScale.current = 1;
    currentX.current = 0;
    lastX.current = 0;
    currentY.current = 0;
    lastY.current = 0;

    if (animated) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
      ]).start();
    } else {
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const zoomTo = (targetScale: number, targetX: number = 0, targetY: number = 0) => {
    currentScale.current = targetScale;
    lastScale.current = targetScale;
    currentX.current = targetX;
    lastX.current = targetX;
    currentY.current = targetY;
    lastY.current = targetY;

    Animated.parallel([
      Animated.spring(scale, { toValue: targetScale, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateX, { toValue: targetX, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateY, { toValue: targetY, useNativeDriver: true, friction: 7 }),
    ]).start();
  };

  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return (
            evt.nativeEvent.touches.length === 2 ||
            (currentScale.current > 1.05 &&
              (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2))
          );
        },
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length === 2) {
            isPinching.current = true;
            initialDistance.current = getDistance(touches);
            initialScale.current = currentScale.current;
          } else if (touches.length === 1) {
            isPinching.current = false;
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length === 2) {
            isPinching.current = true;
            const dist = getDistance(touches);
            if (initialDistance.current > 10) {
              const factor = dist / initialDistance.current;
              let newScale = initialScale.current * factor;
              newScale = Math.max(0.8, Math.min(newScale, 5));
              currentScale.current = newScale;
              scale.setValue(newScale);
            }
          } else if (touches.length === 1 && !isPinching.current && currentScale.current > 1.05) {
            const maxTranslateX = Math.max(0, ((currentScale.current - 1) * screenWidth) / 2);
            const maxTranslateY = Math.max(0, ((currentScale.current - 1) * screenHeight) / 2);

            let newX = lastX.current + gestureState.dx;
            let newY = lastY.current + gestureState.dy;

            newX = Math.max(-maxTranslateX * 1.1, Math.min(newX, maxTranslateX * 1.1));
            newY = Math.max(-maxTranslateY * 1.1, Math.min(newY, maxTranslateY * 1.1));

            currentX.current = newX;
            currentY.current = newY;
            translateX.setValue(newX);
            translateY.setValue(newY);
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;
          if (isPinching.current && touches.length < 2) {
            isPinching.current = false;
          }

          if (currentScale.current < 1) {
            resetZoom(true);
            return;
          }

          if (currentScale.current > 4) {
            currentScale.current = 4;
            lastScale.current = 4;
            Animated.spring(scale, { toValue: 4, useNativeDriver: true, friction: 7 }).start();
          } else {
            lastScale.current = currentScale.current;
          }

          if (currentScale.current > 1) {
            const maxTranslateX = Math.max(0, ((currentScale.current - 1) * screenWidth) / 2);
            const maxTranslateY = Math.max(0, ((currentScale.current - 1) * screenHeight) / 2);

            let boundedX = Math.max(-maxTranslateX, Math.min(currentX.current, maxTranslateX));
            let boundedY = Math.max(-maxTranslateY, Math.min(currentY.current, maxTranslateY));

            lastX.current = boundedX;
            lastY.current = boundedY;
            currentX.current = boundedX;
            currentY.current = boundedY;

            Animated.parallel([
              Animated.spring(translateX, { toValue: boundedX, useNativeDriver: true, friction: 7 }),
              Animated.spring(translateY, { toValue: boundedY, useNativeDriver: true, friction: 7 }),
            ]).start();
          } else {
            lastX.current = 0;
            lastY.current = 0;
            currentX.current = 0;
            currentY.current = 0;
            Animated.parallel([
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }),
              Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
            ]).start();
          }

          // Double tap or single tap handling
          if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
            const now = Date.now();
            if (now - lastTap.current < 280) {
              if (singleTapTimer.current) {
                clearTimeout(singleTapTimer.current);
                singleTapTimer.current = null;
              }
              if (currentScale.current > 1.1) {
                resetZoom(true);
              } else {
                zoomTo(2.5, 0, 0);
              }
              lastTap.current = 0;
            } else {
              lastTap.current = now;
              if (onSingleTap) {
                singleTapTimer.current = setTimeout(() => {
                  if (currentScale.current <= 1.05) {
                    onSingleTap();
                  }
                }, 280);
              }
            }
          }
        },
      }),
    [screenWidth, screenHeight, onSingleTap]
  );

  return (
    <View style={styles.zoomableContainer} {...panResponder.panHandlers}>
      <Animated.Image
        source={{ uri }}
        style={[
          styles.viewerFullImage,
          {
            transform: [
              { scale },
              { translateX },
              { translateY },
            ],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const AdminFarmVerificationDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { verificationId } = route.params || {};

  const [farmData, setFarmData] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [profileImageError, setProfileImageError] = useState(false);
  const [activeFullScreenPhoto, setActiveFullScreenPhoto] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  useEffect(() => {
    if (verificationId) {
      fetchData();
    }
  }, [verificationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [farmRes, galleryRes] = await Promise.all([
        getAdminFarmDetails(verificationId),
        getAdminFarmGallery(verificationId).catch(() => ({ data: [] })),
      ]);
      if (farmRes && farmRes.data) {
        setFarmData(farmRes.data);
        setProfileImageError(false);
      }
      if (galleryRes && galleryRes.data) {
        setGallery(galleryRes.data);
      }
    } catch (error) {
      console.error('Error fetching farm details', error);
      Alert.alert(t('common.error'), t('admin.failedLoadFarmDetails'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => setShowApproveModal(true);

  const confirmApprove = async () => {
    try {
      setActionLoading(true);
      await verifyFarmer(verificationId);
      refreshFarmVerificationPendingCount();
      setShowApproveModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('admin.failedApproveFarm'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      Alert.alert(t('common.error'), t('admin.provideRejectionReason'));
      return;
    }
    try {
      setActionLoading(true);
      await requestFarmerAdditionalInfo(verificationId, rejectReason);
      refreshFarmVerificationPendingCount();
      setShowRejectModal(false);
      Alert.alert(t('common.success'), t('admin.rejectionReasonSent'));
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('admin.failedRejectFarm'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title={t('admin.farmVerification')} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={ADMIN_THEME.colors.indigo} />
        </View>
      </AdminPageBackground>
    );
  }

  if (!farmData) {
    return (
      <AdminPageBackground>
        <AdminHeader variant="inner" title={t('admin.farmVerification')} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('admin.farmDetailsNotFound')}</Text>
        </View>
      </AdminPageBackground>
    );
  }

  const rawProfilePhoto = farmData.profilePhoto || farmData.farmerPhoto;
  let profilePhotoUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(farmData.name || 'F')}&background=E8EBFF&color=4F5BD5&size=150&bold=true`;

  if (rawProfilePhoto && rawProfilePhoto !== 'null' && rawProfilePhoto.trim() !== '') {
    if (rawProfilePhoto.startsWith('http://') || rawProfilePhoto.startsWith('https://')) {
      profilePhotoUri = rawProfilePhoto;
    } else if (rawProfilePhoto.includes('uploads/')) {
      profilePhotoUri = resolveMediaUrl(rawProfilePhoto) || `${BASE_URL}/${rawProfilePhoto}`;
    } else {
      profilePhotoUri = `${BASE_URL}/user/image/${rawProfilePhoto}`;
    }
  }

  // ─── EXTRACT FARM VIDEO (Clean, single prioritized video with playbackUrl first) ─
  let farmVideoUrl: string | null = null;
  let farmVideoOriginalUrl: string | null = null;

  if (farmData.playbackUrl && farmData.playbackUrl !== 'null' && farmData.playbackUrl.trim() !== '') {
    farmVideoUrl = resolveMediaUrl(farmData.playbackUrl);
  } else if (farmData.farmVideo && farmData.farmVideo !== 'null' && farmData.farmVideo.trim() !== '') {
    farmVideoUrl = resolveMediaUrl(farmData.farmVideo);
  }

  if (farmData.farmVideo && farmData.farmVideo !== 'null' && farmData.farmVideo.trim() !== '') {
    farmVideoOriginalUrl = resolveMediaUrl(farmData.farmVideo);
  }

  if (!farmVideoUrl && Array.isArray(gallery) && gallery.length > 0) {
    const vItem = gallery.find((g: any) => {
      const p = g.playbackUrl || g.filePath || g.imageUrl;
      return g.fileType === 'VIDEO' || (typeof p === 'string' && p.match(/\.(mp4|mov|webm)$/i));
    });
    if (vItem) {
      farmVideoUrl = resolveMediaUrl(vItem.playbackUrl || vItem.filePath || vItem.imageUrl);
      farmVideoOriginalUrl = resolveMediaUrl(vItem.filePath || vItem.imageUrl || vItem.playbackUrl);
    }
  }

  const farmPhotos: string[] = [];
  if (farmData.farmerPhoto && farmData.farmerPhoto !== 'null' && farmData.farmerPhoto.trim() !== '') {
    const pUrl = resolveMediaUrl(farmData.farmerPhoto);
    if (pUrl) farmPhotos.push(pUrl);
  }
  gallery.forEach((item: any) => {
    const rawPath = item.filePath || item.imageUrl;
    const isImage =
      item.fileType === 'IMAGE' ||
      (typeof rawPath === 'string' && rawPath.match(/\.(jpg|jpeg|png|webp)$/i));
    if (isImage && rawPath) {
      const pUrl = resolveMediaUrl(rawPath);
      if (pUrl && !farmPhotos.includes(pUrl)) {
        farmPhotos.push(pUrl);
      }
    }
  });

  const certificateRaw = farmData.certificateFile || farmData.certificateUrl;
  const certificateUri = certificateRaw ? resolveMediaUrl(certificateRaw) : null;

  const openPhotoViewer = (index: number) => {
    if (farmPhotos[index]) {
      setActivePhotoIndex(index);
      setActiveFullScreenPhoto(farmPhotos[index]);
    }
  };

  const closePhotoViewer = () => {
    setActiveFullScreenPhoto(null);
  };

  const showNextPhoto = () => {
    if (farmPhotos.length > 1) {
      const nextIdx = (activePhotoIndex + 1) % farmPhotos.length;
      setActivePhotoIndex(nextIdx);
      setActiveFullScreenPhoto(farmPhotos[nextIdx]);
    }
  };

  const showPrevPhoto = () => {
    if (farmPhotos.length > 1) {
      const prevIdx = (activePhotoIndex - 1 + farmPhotos.length) % farmPhotos.length;
      setActivePhotoIndex(prevIdx);
      setActiveFullScreenPhoto(farmPhotos[prevIdx]);
    }
  };

  return (
    <AdminPageBackground>
      <AdminHeader
        variant="inner"
        title={t('admin.farmVerification')}
        rightAction={<AdminBadge status={farmData.verified ? 'Verified' : 'Pending'} />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1) FARMER PROFILE CARD */}
        <AdminCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profileImageError ? `https://ui-avatars.com/api/?name=${encodeURIComponent(farmData.name || 'F')}&background=E8EBFF&color=4F5BD5&size=150&bold=true` : profilePhotoUri }}
              style={styles.profileImage}
              resizeMode="cover"
              onError={() => setProfileImageError(true)}
            />
          </View>
          <Text style={styles.farmerName}>{farmData.name}</Text>

          <View style={styles.profileRow}>
            <PhoneIcon size={16} color={ADMIN_THEME.colors.indigo} strokeWidth={2} />
            <Text style={styles.profileDetail}>{farmData.mobile || t('admin.noMobile')}</Text>
          </View>

          {farmData.email ? (
            <View style={styles.profileRow}>
              <Text style={styles.profileDetail}>{farmData.email}</Text>
            </View>
          ) : null}
        </AdminCard>

        {/* 2) FARM INFORMATION TABLE */}
        <AdminCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('admin.farmInformation')}</Text>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('admin.farmerName')}</Text>
            <Text style={styles.tableValue}>{farmData.farmName || 'N/A'}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('admin.farmSize')}</Text>
            <Text style={styles.tableValue}>
              {farmData.farmArea
                ? `${farmData.farmArea} ${farmData.farmAreaUnit || 'Acres'}`
                : farmData.farmSize
                ? `${farmData.farmSize} Acres`
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('admin.farmingType')}</Text>
            <Text style={styles.tableValue}>{farmData.farmingType || 'Mixing crop'}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{t('admin.experience')}</Text>
            <Text style={styles.tableValue}>
              {farmData.experienceYears || farmData.farmingExperience
                ? `${farmData.experienceYears || farmData.farmingExperience} Years`
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.tableRowLast}>
            <Text style={styles.tableLabel}>{t('common.location')}</Text>
            <Text style={styles.tableValue}>
              {[farmData.village, farmData.state].filter(Boolean).join(', ') || 'N/A'}
            </Text>
          </View>
        </AdminCard>

        {/* 3) FARM VIDEO & GALLERY (Neat & Clean, Direct Shorts-Style Playback) */}
        <AdminCard style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{t('admin.farmVideo')}</Text>
            {formatVideoDuration(farmData.durationSeconds) ? (
              <View style={styles.durationHeaderBadge}>
                <Ionicons name="time-outline" size={13} color="#0F766E" />
                <Text style={styles.durationHeaderBadgeText}>
                  {formatVideoDuration(farmData.durationSeconds)}
                </Text>
              </View>
            ) : null}
          </View>

          {farmVideoUrl ? (
            <View style={styles.videoSectionWrap}>
              <AdminFarmVideoPlayer
                key={farmVideoUrl}
                videoUrl={farmVideoUrl}
                originalVideoUrl={farmVideoOriginalUrl || farmVideoUrl}
                farmName={farmData.farmName}
                farmerName={farmData.name}
                thumbnailUrl={farmData.thumbnailUrl ? (resolveMediaUrl(farmData.thumbnailUrl) || undefined) : undefined}
                durationSeconds={farmData.durationSeconds}
              />
            </View>
          ) : (
            <View style={styles.noVideoBox}>
              <Ionicons name="videocam-off-outline" size={36} color="#94A3B8" />
              <Text style={styles.noVideoTitle}>{t('admin.noFarmVideoUploaded')}</Text>
              <Text style={styles.noVideoSub}>
                {t('admin.noVideoUploadedSub')}
              </Text>
            </View>
          )}

          {/* Farm Photos / Gallery images if available */}
          {farmPhotos.length > 0 && (
            <View style={styles.photosSubSection}>
              <Text style={styles.subSectionTitle}>{t('admin.farmPhotosCount', { count: farmPhotos.length })}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {farmPhotos.map((photoUri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.85}
                    onPress={() => openPhotoViewer(idx)}
                    style={styles.galleryImageTouchable}
                  >
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    <View style={styles.expandIconOverlay}>
                      <Ionicons name="expand" size={13} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </AdminCard>

        {/* 4) CERTIFICATE / DOCUMENT */}
        {certificateUri && (
          <AdminCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('admin.certAndDocs')}</Text>
            <View style={styles.certificateRow}>
              <View style={styles.pdfIconBox}>
                <Text style={styles.pdfIconText}>PDF</Text>
              </View>
              <View style={styles.certInfo}>
                <Text style={styles.certName} numberOfLines={1}>
                  {t('admin.farmCertificate')}
                </Text>
                <Text style={styles.certSize}>{t('admin.officialCertDoc')}</Text>
              </View>
              <AdminOutlineButton
                title={t('common.view')}
                style={styles.viewDocBtn}
                onPress={() => {
                  Linking.openURL(certificateUri).catch(() =>
                    Alert.alert(t('common.error'), t('admin.unableOpenDoc'))
                  );
                }}
              />
            </View>
          </AdminCard>
        )}
      </ScrollView>

      {/* 5) STICKY BOTTOM ACTIONS: HIGHLIGHTED & SINGLE-LINE WORDING */}
      {!farmData.verified && (
        <AdminStickyBar>
          <View style={styles.bottomBarRow}>
            {/* Highlighted Reject Button */}
            <TouchableOpacity
              style={styles.actionRejectBtn}
              onPress={() => setShowRejectModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={19} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.actionRejectText} numberOfLines={1}>
                {t('admin.reject')}
              </Text>
            </TouchableOpacity>

            {/* Highlighted Approve Farm Button (One Line) */}
            <TouchableOpacity
              style={styles.actionApproveBtn}
              onPress={handleApprove}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#16A34A', '#15803D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionApproveGradient}
              >
                <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionApproveText} numberOfLines={1}>
                  {t('admin.approveFarm')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </AdminStickyBar>
      )}

      {/* REJECT MODAL */}
      <Modal visible={showRejectModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('admin.rejectVerification')}</Text>
            <Text style={styles.modalDescription}>
              {t('admin.rejectVerificationDesc')}
            </Text>

            <AdminInput
              label={t('admin.reasonForRejection')}
              required
              multiline
              numberOfLines={4}
              placeholder={t('admin.rejectionPlaceholder')}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowRejectModal(false)}
                activeOpacity={0.7}
                disabled={actionLoading}
              >
                <Ionicons name="close-circle-outline" size={16} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.modalCancelBtnText} numberOfLines={1}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalRejectBtn}
                onPress={handleRejectSubmit}
                activeOpacity={0.8}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#B91C1C" size="small" />
                ) : (
                  <>
                    <Ionicons name="arrow-forward-circle-outline" size={16} color="#B91C1C" style={{ marginRight: 4 }} />
                    <Text style={styles.modalRejectBtnText} numberOfLines={1}>
                      {t('admin.sendReason')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* APPROVE CONFIRM MODAL */}
      <Modal visible={showApproveModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.approveIconCircle}>
              <ShieldCheckIcon size={36} color={ADMIN_THEME.colors.statusSuccess} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitleCenter}>{t('admin.approveConfirm')}</Text>
            <Text style={styles.modalDescriptionCenter}>
              {t('admin.approveConfirmDesc', { name: (farmData.farmName || farmData.name || '').trim() })}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowApproveModal(false)}
                activeOpacity={0.7}
                disabled={actionLoading}
              >
                <Ionicons name="close-circle-outline" size={16} color="#DC2626" style={{ marginRight: 4 }} />
                <Text style={styles.modalCancelBtnText} numberOfLines={1}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmApprove}
                activeOpacity={0.8}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={['#16A34A', '#15803D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalConfirmGradient}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.modalConfirmBtnText} numberOfLines={1}>
                        {t('admin.confirmFarm')}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUCCESS MODAL */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.approveIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={ADMIN_THEME.colors.statusSuccess} />
            </View>
            <Text style={styles.modalTitleCenter}>{t('admin.verificationApproved')}</Text>
            <Text style={styles.modalDescriptionCenter}>
              {t('admin.verificationApprovedDesc')}
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
              style={styles.doneBtn}
            >
              <LinearGradient
                colors={['#16A34A', '#15803D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.doneBtnGradient}
              >
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.doneBtnText}>{t('common.done')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── BIG SCREEN PHOTO VIEWER MODAL ─── */}
      <Modal
        visible={!!activeFullScreenPhoto}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={closePhotoViewer}
      >
        <View style={styles.viewerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <SafeAreaView style={styles.viewerHeaderSafe}>
            <View style={styles.viewerHeader}>
              <View style={styles.viewerTitleWrap}>
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {farmData?.farmName || t('admin.farmPhoto')}
                </Text>
                {farmPhotos.length > 1 && (
                  <Text style={styles.viewerCounter}>
                    {t('admin.photoViewerCounter', { current: activePhotoIndex + 1, total: farmPhotos.length })}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={closePhotoViewer}
                style={styles.viewerCloseBtn}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.viewerImageWrap}>
            {activeFullScreenPhoto && (
              <AdminZoomablePhotoView
                key={activeFullScreenPhoto}
                uri={activeFullScreenPhoto}
                onSingleTap={closePhotoViewer}
              />
            )}
          </View>

          {farmPhotos.length > 1 && (
            <>
              <TouchableOpacity
                style={styles.viewerNavLeft}
                onPress={showPrevPhoto}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewerNavRight}
                onPress={showNextPhoto}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}

          <SafeAreaView style={styles.viewerBottomSafe}>
            <View style={styles.viewerBottomBar}>
              <Text style={styles.viewerBottomText}>{t('admin.pinchToZoom')}</Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </AdminPageBackground>
  );
};

export default AdminFarmVerificationDetailsScreen;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: AdminFonts.medium,
    color: ADMIN_THEME.colors.textSecondary,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 14,
  },

  // Profile Card
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: ADMIN_THEME.colors.indigoTint,
    ...ADMIN_THEME.shadows.card,
    marginBottom: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  farmerName: {
    fontFamily: AdminFonts.heading,
    fontSize: 22,
    color: ADMIN_THEME.colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  profileDetail: {
    fontFamily: AdminFonts.medium,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
  },

  // Section Card
  sectionCard: {
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: AdminFonts.heading,
    fontSize: 18,
    color: ADMIN_THEME.colors.ink,
  },
  videoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoCountText: {
    fontFamily: AdminFonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_THEME.colors.divider,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  tableLabel: {
    width: 120,
    fontFamily: AdminFonts.medium,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
  tableValue: {
    flex: 1,
    fontFamily: AdminFonts.semiBold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
  },

  durationHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  durationHeaderBadgeText: {
    fontFamily: AdminFonts.bold,
    fontSize: 12,
    color: '#0F766E',
  },

  // Video Section & Player
  videoSectionWrap: {
    marginTop: 10,
  },
  playerContainer: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#070D1D',
    position: 'relative',
    ...ADMIN_THEME.shadows.card,
  },
  playerVideo: {
    width: '100%',
    height: '100%',
  },
  playerTopLeftRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  playerBadgeText: {
    fontFamily: AdminFonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  playerDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playerDurationText: {
    fontFamily: AdminFonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  playerTopActions: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 3,
  },
  playerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTapArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  playerPlayCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerLoadingCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 2,
  },
  playerErrorCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    maxWidth: 290,
    width: '100%',
  },
  playerErrorIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playerErrorHeadline: {
    fontFamily: AdminFonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  playerErrorDetail: {
    fontFamily: AdminFonts.regular,
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  playerErrorButtonsRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 8,
  },
  playerExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F5BD5',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  playerExternalBtnText: {
    fontFamily: AdminFonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  playerRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  playerRetryBtnText: {
    fontFamily: AdminFonts.medium,
    fontSize: 12,
    color: '#E2E8F0',
  },
  playerBottomOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    zIndex: 2,
  },
  playerFarmTitle: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  playerFarmerSubtitle: {
    fontFamily: AdminFonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  noVideoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  noVideoTitle: {
    fontFamily: AdminFonts.bold,
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  noVideoSub: {
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  photosSubSection: {
    marginTop: 14,
  },
  subSectionTitle: {
    fontFamily: AdminFonts.semiBold,
    fontSize: 13,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 8,
  },
  galleryScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  galleryImageTouchable: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryImage: {
    width: 110,
    height: 80,
    borderRadius: 12,
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
  },
  expandIconOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Certificate
  certificateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_THEME.colors.inputBg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: ADMIN_THEME.colors.cardBorder,
  },
  pdfIconBox: {
    width: 42,
    height: 48,
    backgroundColor: ADMIN_THEME.colors.statusError,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfIconText: {
    color: '#FFFFFF',
    fontFamily: AdminFonts.bold,
    fontSize: 13,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontFamily: AdminFonts.bold,
    fontSize: 13.5,
    color: ADMIN_THEME.colors.ink,
  },
  certSize: {
    marginTop: 2,
    fontFamily: AdminFonts.regular,
    fontSize: 11.5,
    color: ADMIN_THEME.colors.textSecondary,
  },
  viewDocBtn: {
    height: 38,
    paddingHorizontal: 16,
  },

  // Highlighted Bottom Actions
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionRejectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionRejectText: {
    fontFamily: AdminFonts.bold,
    fontSize: 14.5,
    color: '#B91C1C',
    letterSpacing: 0.2,
  },
  actionApproveBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  actionApproveGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionApproveText: {
    fontFamily: AdminFonts.bold,
    fontSize: 14.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: ADMIN_THEME.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ADMIN_THEME.radius.dialog,
    paddingHorizontal: 20,
    paddingVertical: 24,
    ...ADMIN_THEME.shadows.card,
  },
  modalTitle: {
    fontFamily: AdminFonts.heading,
    fontSize: 20,
    color: ADMIN_THEME.colors.ink,
    marginBottom: 8,
  },
  modalTitleCenter: {
    fontFamily: AdminFonts.heading,
    fontSize: 20,
    color: ADMIN_THEME.colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalDescriptionCenter: {
    fontFamily: AdminFonts.regular,
    fontSize: 13,
    color: ADMIN_THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  modalCancelBtnText: {
    fontFamily: AdminFonts.bold,
    fontSize: 13.5,
    color: '#B91C1C',
    letterSpacing: 0.1,
  },
  modalConfirmBtn: {
    flex: 1.45,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  modalConfirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  modalConfirmBtnText: {
    fontFamily: AdminFonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  modalRejectBtn: {
    flex: 1.45,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  modalRejectBtnText: {
    fontFamily: AdminFonts.bold,
    fontSize: 13.5,
    color: '#B91C1C',
    letterSpacing: 0.1,
  },
  modalActionBtn: {
    flex: 1,
  },
  approveIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ADMIN_THEME.colors.statusSuccessBg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  doneBtn: {
    alignSelf: 'center',
    marginTop: 16,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  doneBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 26,
  },
  doneBtnText: {
    fontFamily: AdminFonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ─── Big Screen Photo Viewer Styles ───
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  viewerHeaderSafe: {
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 14 : 16,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  viewerTitleWrap: {
    flex: 1,
    marginRight: 16,
  },
  viewerTitle: {
    fontFamily: AdminFonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  viewerCounter: {
    fontFamily: AdminFonts.medium,
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 3,
  },
  viewerCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  zoomableContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  viewerFullImage: {
    width: '100%',
    height: '100%',
  },
  viewerNavLeft: {
    position: 'absolute',
    left: 14,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  viewerNavRight: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  viewerBottomSafe: {
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingBottom: Platform.OS === 'android' ? 24 : 14,
  },
  viewerBottomBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewerBottomText: {
    fontFamily: AdminFonts.regular,
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
});
