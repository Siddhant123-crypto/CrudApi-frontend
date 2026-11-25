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
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StarRating } from './StarRating';
import { createReview, updateReview } from '../../services/reviewService';
import { Review } from '../../types';
import { THEME } from '../../constants/theme';
import { PageBackground } from '../ui/PageBackground';
import { ThemedHeader } from '../ui/ThemedHeader';
import { PrimaryButton } from '../ui/Buttons';
import { useTranslation } from 'react-i18next';

interface ReviewFormProps {
  visible: boolean;
  orderId: string;
  productId: string;
  productName: string;
  existingReview?: Review | null;
  onClose: () => void;
  onSubmitSuccess: (newReview: Review) => void;
  variant?: 'default' | 'customer';
}
export const ReviewForm = ({
  visible,
  orderId,
  productId,
  productName,
  existingReview,
  onClose,
  onSubmitSuccess,
  variant = 'customer',
}: ReviewFormProps) => {
  const { t } = useTranslation();
  const isCustomer = variant === 'customer';
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  useEffect(() => {
    if (visible) {
      if (existingReview) {
        setRating(existingReview.rating);
        setReviewText(existingReview.reviewText || '');
        const photo = existingReview.media?.find((m) => m.mediaType === 'IMAGE');
        const video = existingReview.media?.find((m) => m.mediaType === 'VIDEO');
        setPhotoUri(null);
        setVideoUri(null);
      } else {
        setRating(0);
        setReviewText('');
        setPhotoUri(null);
        setVideoUri(null);
      }
      setPendingPhotoUri(null);
      setSuccess(false);
    }
  }, [visible, existingReview]);
  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error', 'Permission Denied'),
        t('validation.cameraPermissionRequired', 'Gallery access is required to select photos.')
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPendingPhotoUri(result.assets[0].uri);
    }
  };

  const renderPhotoPreviewOverlay = () => {
    if (!pendingPhotoUri) return null;
    return (
      <View style={styles.photoPreviewOverlay}>
        <View style={styles.photoPreviewCard}>
          <Text style={styles.photoPreviewTitle}>
            {t('farmer.selectedPhoto', 'Selected Photo')}
          </Text>

          <View style={styles.photoPreviewFrame}>
            <Image
              source={{ uri: pendingPhotoUri }}
              style={styles.photoPreviewImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.photoPreviewActions}>
            <TouchableOpacity
              style={styles.photoPreviewCancelBtn}
              onPress={() => setPendingPhotoUri(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.photoPreviewCancelText}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoPreviewDoneBtn}
              onPress={() => {
                setPhotoUri(pendingPhotoUri);
                setPendingPhotoUri(null);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.photoPreviewDoneText}>
                {t('common.done', 'Done')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.photoPreviewRepickBtn}
            onPress={() => {
              setPendingPhotoUri(null);
              setTimeout(() => handleSelectPhoto(), 150);
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="images-outline" size={16} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.photoPreviewRepickText}>
              {t('profile.chooseAnotherPhoto', 'Choose Another Photo')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const handleSelectVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.error', 'Permission Denied'),
        t('validation.cameraPermissionRequired', 'Gallery access is required to select videos.')
      );
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
        Alert.alert(t('common.error', 'Invalid file'), t('product.selectVideoFile', 'Please select a video file.'));
        return;
      }
      setVideoUri(asset.uri);
    }
  };
  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        t('product.rateProduct', 'Rating Required'),
        t('product.selectRatingPrompt', 'Please select a rating of 1 to 5 stars.')
      );
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
      Alert.alert(
        t('common.error', 'Error'),
        t('reviews.submitFailed', 'Failed to submit review. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isCustomer) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
        <PageBackground style={{ flex: 1 }}>
          <ThemedHeader
            variant="inner"
            title={existingReview ? t('product.editReview', 'Edit Review') : t('product.writeReview', 'Write Review')}
            onBackPress={onClose}
          />
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#2E7D4F" />
                <Text style={styles.successTitleThemed}>{t('product.reviewSubmitted', 'Review Submitted')}</Text>
                <Text style={styles.successSubThemed}>{t('product.reviewSubmittedDesc', 'Thank you for sharing your Farm2Home experience.')}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.customerScrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.customerProductName}>{productName}</Text>

                <View style={styles.customerRatingCard}>
                  <Text style={styles.customerRatingLabel}>{t('product.rateProduct', 'Rate this product')}</Text>
                  <StarRating rating={rating} onRatingChange={setRating} size={38} variant="customer" />
                  {rating > 0 ? (
                    <Text style={styles.customerRatingText}>
                      {rating === 5 ? t('product.premiumQuality', 'Excellent!') : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
                    </Text>
                  ) : null}
                </View>

                <Text style={styles.customerSectionLabel}>{t('product.shareExperience', 'Share your experience')}</Text>
                <TextInput
                  style={styles.customerReviewInput}
                  placeholder={t('product.writeReviewPlaceholder', 'Write your review here... (optional)')}
                  placeholderTextColor="#8A6F5C"
                  multiline
                  numberOfLines={6}
                  value={reviewText}
                  onChangeText={setReviewText}
                  textAlignVertical="top"
                  editable={!submitting}
                />

                <Text style={styles.customerSectionLabel}>{t('product.photosOptional', 'Photos and videos are optional')}</Text>
                <View style={styles.mediaButtonsRow}>
                  <TouchableOpacity
                    style={[styles.customerMediaButton, photoUri && styles.customerMediaButtonActive]}
                    onPress={handleSelectPhoto}
                    disabled={submitting}
                  >
                    <Ionicons name="camera-outline" size={24} color={photoUri ? '#B8470F' : '#8A6F5C'} />
                    <Text style={[styles.customerMediaButtonText, photoUri && styles.customerMediaButtonTextActive]}>
                      {photoUri ? t('farmer.choosePhoto', 'Change Photo') : t('farmer.takePhoto', 'Add Photo')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.customerMediaButton, videoUri && styles.customerMediaButtonActive]}
                    onPress={handleSelectVideo}
                    disabled={submitting}
                  >
                    <Ionicons name="videocam-outline" size={24} color={videoUri ? '#B8470F' : '#8A6F5C'} />
                    <Text style={[styles.customerMediaButtonText, videoUri && styles.customerMediaButtonTextActive]}>
                      {videoUri ? t('farmer.changeVideo', 'Change Video') : t('farmer.addVideo', 'Add Video')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {photoUri || videoUri ? (
                  <View style={styles.customerPreviewContainer}>
                    {photoUri ? (
                      <View style={styles.previewWrapper}>
                        <Image source={{ uri: photoUri }} style={styles.customerPreviewThumbnail} />
                        <TouchableOpacity
                          style={styles.removeMediaBtn}
                          onPress={() => setPhotoUri(null)}
                          disabled={submitting}
                        >
                          <Ionicons name="close-circle" size={20} color="#DC2626" />
                        </TouchableOpacity>
                        <Text style={styles.customerPreviewTypeText}>{t('product.photoSelected', 'Photo Selected')}</Text>
                      </View>
                    ) : null}
                    {videoUri ? (
                      <View style={styles.previewWrapper}>
                        <View style={styles.customerVideoPreviewThumbnail}>
                          <Ionicons name="play" size={24} color="#FFFFFF" />
                        </View>
                        <TouchableOpacity
                          style={styles.removeMediaBtn}
                          onPress={() => setVideoUri(null)}
                          disabled={submitting}
                        >
                          <Ionicons name="close-circle" size={20} color="#DC2626" />
                        </TouchableOpacity>
                        <Text style={styles.customerPreviewTypeText}>{t('product.videoSelected', 'Video Selected')}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <PrimaryButton
                  title={existingReview ? t('product.updateReview', 'Update Review') : t('product.submitReview', 'Submit Review')}
                  loading={submitting}
                  disabled={submitting || rating === 0}
                  onPress={handleSubmit}
                  style={{ marginTop: 24, marginBottom: 50 }}
                />
              </ScrollView>
            )}
          </KeyboardAvoidingView>
          {renderPhotoPreviewOverlay()}
        </PageBackground>
      </Modal>
    );
  }

  // Fallback default view
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container}>
          {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            <Text style={styles.successTitle}>{t('product.reviewSubmitted', 'Review Submitted')}</Text>
            <Text style={styles.successSub}>{t('product.reviewSubmittedDesc', 'Thank you for sharing your Farm2Home experience.')}</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} disabled={submitting} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{existingReview ? t('product.editReview', 'Edit Review') : t('product.writeReview', 'Write Review')}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.productName}>{productName}</Text>
              <View style={styles.ratingCard}>
                <Text style={styles.ratingLabel}>{t('product.rateProduct', 'Rate this product')}</Text>
                <StarRating rating={rating} onRatingChange={setRating} size={40} />
                {rating > 0 ? (
                  <Text style={styles.ratingText}>
                    {rating === 5 ? t('product.premiumQuality', 'Excellent!') : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.sectionLabel}>{t('product.shareExperience', 'Share your experience')}</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder={t('product.writeReviewPlaceholder', 'Write your review here... (optional)')}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                value={reviewText}
                onChangeText={setReviewText}
                textAlignVertical="top"
                editable={!submitting}
              />
              <Text style={styles.sectionLabel}>{t('product.photosOptional', 'Photos and videos are optional')}</Text>
              <View style={styles.mediaButtonsRow}>
                <TouchableOpacity
                  style={[styles.mediaButton, photoUri && styles.mediaButtonActive]}
                  onPress={handleSelectPhoto}
                  disabled={submitting}
                >
                  <Ionicons name="camera-outline" size={24} color={photoUri ? '#15803D' : '#6B7280'} />
                  <Text style={[styles.mediaButtonText, photoUri && styles.mediaButtonTextActive]}>
                    {photoUri ? t('farmer.choosePhoto', 'Change Photo') : t('farmer.takePhoto', 'Add Photo')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mediaButton, videoUri && styles.mediaButtonActive]}
                  onPress={handleSelectVideo}
                  disabled={submitting}
                >
                  <Ionicons name="videocam-outline" size={24} color={videoUri ? '#15803D' : '#6B7280'} />
                  <Text style={[styles.mediaButtonText, videoUri && styles.mediaButtonTextActive]}>
                    {videoUri ? t('farmer.changeVideo', 'Change Video') : t('farmer.addVideo', 'Add Video')}
                  </Text>
                </TouchableOpacity>
              </View>
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
                      <Text style={styles.previewTypeText}>{t('product.photoSelected', 'Photo Selected')}</Text>
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
                      <Text style={styles.previewTypeText}>{t('product.videoSelected', 'Video Selected')}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting || rating === 0}
              >
                {submitting ? (
                  <View style={styles.submittingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>{t('common.loading', 'Submitting Review...')}</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>
                    {existingReview ? t('product.updateReview', 'Update Review').toUpperCase() : t('product.submitReview', 'Submit Review').toUpperCase()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
      </KeyboardAvoidingView>
      {renderPhotoPreviewOverlay()}
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
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
    backgroundColor: '#1E3A8A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 12,
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
    borderColor: '#4CAF50',
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
    borderColor: '#81C784',
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
    borderColor: '#A7F3D0',
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
    paddingBottom: 80,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitBtn: {
    backgroundColor: '#F5A623',
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
  customerScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  customerProductName: {
    fontFamily: THEME.fonts.serif,
    fontSize: 22,
    color: '#3B1A0E',
    marginBottom: 20,
    textAlign: 'center',
  },
  customerRatingCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    marginBottom: 20,
    shadowColor: 'rgba(90,40,15,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerRatingLabel: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: '#3B1A0E',
    marginBottom: 12,
  },
  customerRatingText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: '#B8470F',
    marginTop: 10,
  },
  customerSectionLabel: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#3B1A0E',
    marginBottom: 10,
    marginTop: 8,
  },
  customerReviewInput: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    borderRadius: 16,
    padding: 16,
    fontFamily: THEME.fonts.regular,
    fontSize: 15,
    color: '#3B1A0E',
    minHeight: 120,
    marginBottom: 20,
  },
  customerMediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
  },
  customerMediaButtonActive: {
    borderColor: '#B8470F',
    backgroundColor: '#FFF1E3',
  },
  customerMediaButtonText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13.5,
    color: '#8A6F5C',
    marginLeft: 8,
  },
  customerMediaButtonTextActive: {
    fontFamily: THEME.fonts.bold,
    color: '#B8470F',
  },
  customerPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    marginBottom: 16,
  },
  customerPreviewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  customerVideoPreviewThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#3B1A0E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerPreviewTypeText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#8A6F5C',
    marginTop: 6,
  },
  successTitleThemed: {
    fontFamily: THEME.fonts.serif,
    fontSize: 24,
    color: '#3B1A0E',
    marginTop: 20,
    marginBottom: 8,
  },
  successSubThemed: {
    fontFamily: THEME.fonts.regular,
    fontSize: 15,
    color: '#7A6350',
    textAlign: 'center',
    lineHeight: 22,
  },
  photoPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  photoPreviewCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFDF8',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E1CF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  photoPreviewTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 18,
    color: '#3B1A0E',
    marginBottom: 14,
  },
  photoPreviewFrame: {
    width: '100%',
    height: 260,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F3E9DD',
    borderWidth: 1.5,
    borderColor: '#E8D5C0',
    marginBottom: 18,
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoPreviewActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  photoPreviewCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5D5C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewCancelText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 14.5,
    color: '#6B5545',
  },
  photoPreviewDoneBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  photoPreviewDoneText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  photoPreviewRepickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  photoPreviewRepickText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 13.5,
    color: '#15803D',
  },
});
