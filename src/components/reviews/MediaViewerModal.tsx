import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Text,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Video, ResizeMode } from 'expo-av';
import { Review } from '../../types';
import { StarRating } from './StarRating';
import { THEME } from '../../constants/theme';

interface MediaViewerModalProps {
  visible: boolean;
  mediaUrl: string | null;
  isVideo?: boolean;
  onClose: () => void;
  review?: Review | null;
}
const { width, height } = Dimensions.get('window');
export const MediaViewerModal = ({
  visible,
  mediaUrl,
  isVideo = false,
  onClose,
  review,
}: MediaViewerModalProps) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Reset play state when modal becomes visible/invisible
  useEffect(() => {
    if (visible && isVideo) {
      setIsPlaying(true);
    }
  }, [visible, isVideo]);

  if (!mediaUrl) return null;

  const maskName = (name: string) => {
    if (!name || name.length <= 2) return name;
    return `${name[0]}***${name[name.length - 1]}`;
  };

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

  const handleClose = () => {
    setIsPlaying(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {isVideo ? (
          <TouchableOpacity activeOpacity={1} onPress={togglePlay} style={styles.fullScreenVideoWrapper}>
            <Video
              ref={videoRef}
              source={{ uri: mediaUrl }}
              style={styles.fullScreenVideo}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={isPlaying}
            />
            {!isPlaying && (
              <View style={styles.playPauseOverlay}>
                <Ionicons name="play" size={80} color="rgba(255,255,255,0.7)" />
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: mediaUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        {review && (
          <View style={styles.reviewOverlay}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayName}>{review.customerDisplayName || 'Customer'}</Text>
              <StarRating rating={review.rating} size={14} disabled={true} variant="customer" />
            </View>
            {review.reviewText ? (
              <Text style={styles.overlayText}>{review.reviewText}</Text>
            ) : null}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenVideoWrapper: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  imageContainer: {
    width: width,
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  reviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(43,14,6,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(240,225,207,0.2)',
    padding: 20,
    paddingBottom: 90,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overlayName: {
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  overlayText: {
    fontFamily: THEME.fonts.regular,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13.5,
    lineHeight: 20,
  },
});
