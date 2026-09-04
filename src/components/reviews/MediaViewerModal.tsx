import React from 'react';
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

import { Review } from '../../types';
import { StarRating } from './StarRating';

interface MediaViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  review?: Review | null;
}

const { width, height } = Dimensions.get('window');

export const MediaViewerModal = ({
  visible,
  imageUrl,
  onClose,
  review,
}: MediaViewerModalProps) => {
  if (!imageUrl) return null;

  const maskName = (name: string) => {
    if (!name || name.length <= 2) return name;
    return `${name[0]}***${name[name.length - 1]}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {review && (
          <View style={styles.reviewOverlay}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayName}>{maskName(review.customerDisplayName || 'Customer')}</Text>
              <StarRating rating={review.rating} size={14} disabled={true} />
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
    padding: 8,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    paddingBottom: 40,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overlayName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  overlayText: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },
});
