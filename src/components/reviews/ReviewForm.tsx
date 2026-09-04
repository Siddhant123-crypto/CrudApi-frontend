import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StarRating } from './StarRating';
import { createReview, updateReview } from '../../services/reviewService';
import { Review } from '../../types';

interface ReviewFormProps {
  visible: boolean;
  orderId: string;
  productId: string;
  productName: string;
  existingReview?: Review | null;
  onClose: () => void;
  onSubmitSuccess: (newReview: Review) => void;
}

export const ReviewForm = ({
  visible,
  orderId,
  productId,
  productName,
  existingReview,
  onClose,
  onSubmitSuccess,
}: ReviewFormProps) => {
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      if (existingReview) {
        setRating(existingReview.rating);
        setReviewText(existingReview.reviewText || '');
        // Expose media preview if available on existing review
        const photo = existingReview.media?.find((m) => m.mediaType === 'IMAGE');
        const video = existingReview.media?.find((m) => m.mediaType === 'VIDEO');
        setPhotoUri(null); // Keep it clean for new uploads since updating existing media on the backend adds to it
        setVideoUri(null);
      } else {
        setRating(0);
        setReviewText('');
        setPhotoUri(null);
        setVideoUri(null);
      }
      setSuccess(false);
    }
  }, [visible, existingReview]);

  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSelectVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to select videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.type !== 'video') {
        Alert.alert('Invalid file', 'Please select a video file.');
        return;
      }
      setVideoUri(asset.uri);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating of 1 to 5 stars.');
      return;
    }

    setSubmitting(true);
    try {
      let responseReview: Review;
      if (existingReview) {
        responseReview = await updateReview(
          existingReview.reviewId,
          rating,
          reviewText.trim() ? reviewText.trim() : undefined,
          photoUri || undefined,
          videoUri || undefined
        );
      } else {
        responseReview = await createReview(
          productId,
          orderId,
          rating,
          reviewText.trim() ? reviewText.trim() : undefined,
          photoUri || undefined,
          videoUri || undefined
        );
      }

      setSuccess(true);
      setTimeout(() => {
        onSubmitSuccess(responseReview);
      }, 1500);
    } catch (error: any) {
      console.log('Error submitting review:', error);
      let errorMessage = 'Failed to submit review. Please try again.';
      if (error?.response?.data) {
        errorMessage = `Server Error: ${JSON.stringify(error.response.data)}`;
      } else if (error?.message) {
        errorMessage = `Network/Client Error: ${error.message}`;
      } else {
        errorMessage = `Unknown Error: ${JSON.stringify(error)}`;
      }
      Alert.alert('Error Details', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            <Text style={styles.successTitle}>Review Submitted</Text>
            <Text style={styles.successSub}>Thank you for sharing your Farm2Home experience.</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} disabled={submitting} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{existingReview ? 'Edit Review' : 'Write Review'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.productName}>{productName}</Text>
              
              {/* Rating Box */}
              <View style={styles.ratingCard}>
                <Text style={styles.ratingLabel}>Rate this product</Text>
                <StarRating rating={rating} onRatingChange={setRating} size={40} />
                {rating > 0 ? (
                  <Text style={styles.ratingText}>
                    {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
                  </Text>
                ) : null}
              </View>

              {/* Review Text */}
              <Text style={styles.sectionLabel}>Share your experience</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Write your review here... (optional)"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                value={reviewText}
                onChangeText={setReviewText}
                textAlignVertical="top"
                editable={!submitting}
              />

              {/* Optional Media */}
              <Text style={styles.sectionLabel}>Photos and videos are optional</Text>
              
              <View style={styles.mediaButtonsRow}>
                <TouchableOpacity
                  style={[styles.mediaButton, photoUri && styles.mediaButtonActive]}
                  onPress={handleSelectPhoto}
                  disabled={submitting}
                >
                  <Ionicons name="camera-outline" size={24} color={photoUri ? '#15803D' : '#6B7280'} />
                  <Text style={[styles.mediaButtonText, photoUri && styles.mediaButtonTextActive]}>
                    {photoUri ? 'Change Photo' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mediaButton, videoUri && styles.mediaButtonActive]}
                  onPress={handleSelectVideo}
                  disabled={submitting}
                >
                  <Ionicons name="videocam-outline" size={24} color={videoUri ? '#15803D' : '#6B7280'} />
                  <Text style={[styles.mediaButtonText, videoUri && styles.mediaButtonTextActive]}>
                    {videoUri ? 'Change Video' : 'Add Video'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Media Preview Box */}
              {photoUri || videoUri ? (
                <View style={styles.previewContainer}>
                  {photoUri ? (
                    <View style={styles.previewWrapper}>
                      <Image source={{ uri: photoUri }} style={styles.previewThumbnail} />
                      <TouchableOpacity
                        style={styles.removeMediaBtn}
                        onPress={() => setPhotoUri(null)}
                        disabled={submitting}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <Text style={styles.previewTypeText}>Photo Selected</Text>
                    </View>
                  ) : null}

                  {videoUri ? (
                    <View style={styles.previewWrapper}>
                      <View style={styles.videoPreviewThumbnail}>
                        <Ionicons name="play" size={24} color="#FFFFFF" />
                      </View>
                      <TouchableOpacity
                        style={styles.removeMediaBtn}
                        onPress={() => setVideoUri(null)}
                        disabled={submitting}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <Text style={styles.previewTypeText}>Video Selected</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <View style={styles.submittingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Submitting Review...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>SUBMIT REVIEW</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9', // Cream green
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 24 : (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 36),
    paddingBottom: 20,
    borderBottomColor: '#1E3A8A',
    backgroundColor: '#1E3A8A', // Customer theme blue
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF', // White text
    marginLeft: 12, // Near back arrow
  },
  scrollContent: {
    padding: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50', // Highlighted
    marginBottom: 20,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginTop: 8,
  },
  reviewInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#81C784', // Highlighted
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 120,
    marginBottom: 20,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#A7F3D0', // Highlighted
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaButtonActive: {
    borderColor: '#1B5E20',
    backgroundColor: '#E8F5E9',
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 8,
  },
  mediaButtonTextActive: {
    color: '#15803D',
  },
  previewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewWrapper: {
    alignItems: 'center',
    marginHorizontal: 16,
    position: 'relative',
  },
  previewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  videoPreviewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    zIndex: 2,
  },
  previewTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 6,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitBtn: {
    backgroundColor: '#F5A623', // Orange yellow
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  submittingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
