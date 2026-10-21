import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Review } from '../../types';
import { StarRating } from './StarRating';
import { getProductImageUrl } from '../../services/productService';
import Ionicons from '@expo/vector-icons/Ionicons';
import { THEME } from '../../constants/theme';
import { FARMER_THEME } from '../../constants/farmerTheme';

interface ReviewCardProps {
  review: Review;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onImagePress?: (imageUrl: string) => void;
  onVideoPress?: (videoUrl: string) => void;
  variant?: 'default' | 'customer' | 'farmer';
}
export const ReviewCard = ({
  review,
  isOwner = false,
  onEdit,
  onDelete,
  onImagePress,
  onVideoPress,
  variant = 'default',
}: ReviewCardProps) => {
  const isCustomer = variant === 'customer';
  const isFarmer = variant === 'farmer';
  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';
  const photos = review.media?.filter((m) => m.mediaType === 'IMAGE') || [];
  const videos = review.media?.filter((m) => m.mediaType === 'VIDEO') || [];
  return (
    <View style={isCustomer ? styles.customerCard : isFarmer ? styles.farmerCard : styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={isCustomer ? styles.customerNameThemed : isFarmer ? styles.farmerNameThemed : styles.customerName}>
            {review.customerDisplayName}
          </Text>
          <View style={styles.ratingRow}>
            <StarRating
              rating={review.rating}
              size={isCustomer || isFarmer ? 16 : 20}
              disabled={true}
              variant={isCustomer ? 'customer' : isFarmer ? 'farmer' : 'default'}
            />
            <Text style={isCustomer ? styles.dateThemed : isFarmer ? styles.farmerDateThemed : styles.date}>{formattedDate}</Text>
          </View>
        </View>
        {review.isVerifiedPurchase && (
          <View style={isCustomer ? styles.verifiedBadgeThemed : isFarmer ? styles.farmerVerifiedBadge : styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={isCustomer ? '#2E7D4F' : isFarmer ? '#17663F' : '#15803D'} />
            <Text style={isCustomer ? styles.verifiedTextThemed : isFarmer ? styles.farmerVerifiedText : styles.verifiedText}>Verified Purchase</Text>
          </View>
        )}
      </View>
      {review.reviewText ? (
        <Text style={isCustomer ? styles.reviewTextThemed : isFarmer ? styles.farmerReviewText : styles.reviewText}>{review.reviewText}</Text>
      ) : null}
      {}
      {photos.length > 0 || videos.length > 0 ? (
        <View style={styles.mediaContainer}>
          {photos.map((photo) => {
            const imageUrl = getProductImageUrl(photo.mediaUrl);
            return (
              <TouchableOpacity
                key={photo.mediaId}
                activeOpacity={0.8}
                onPress={() => onImagePress && onImagePress(imageUrl)}
                style={isCustomer ? styles.customerMediaWrapper : styles.mediaWrapper}
              >
                <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
              </TouchableOpacity>
            );
          })}
          {videos.map((video) => {
            return (
              <TouchableOpacity
                key={video.mediaId}
                activeOpacity={0.8}
                onPress={() => onVideoPress && onVideoPress(video.mediaUrl)}
                style={isCustomer ? styles.customerMediaWrapper : styles.mediaWrapper}
              >
                <View style={styles.videoThumbnailContainer}>
                  <Ionicons name="play-circle" size={32} color="#FFFFFF" style={styles.playIcon} />
                  <View style={styles.videoOverlay} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
      {}
      {isOwner && (onEdit || onDelete) && (
        <View style={isCustomer ? styles.actionsRowThemed : styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Ionicons name="pencil-outline" size={16} color={isCustomer ? '#B8470F' : '#15803D'} />
              <Text style={[styles.actionText, isCustomer && { color: '#B8470F' }]}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    marginTop: 8,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  mediaWrapper: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  videoThumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  playIcon: {
    zIndex: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
    marginLeft: 4,
  },
  deleteBtn: {},
  deleteText: {
    color: '#DC2626',
  },
  customerCard: {
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F0E1CF',
    padding: 16,
    marginBottom: 14,
    shadowColor: 'rgba(90,40,15,0.06)',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  customerNameThemed: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14.5,
    color: '#3B1A0E',
  },
  dateThemed: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#8A6F5C',
    marginLeft: 8,
  },
  verifiedBadgeThemed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F3E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBE3C8',
  },
  verifiedTextThemed: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#2E7D4F',
    marginLeft: 4,
  },
  reviewTextThemed: {
    fontFamily: THEME.fonts.regular,
    fontSize: 14,
    color: '#5C4433',
    lineHeight: 21,
    marginTop: 8,
  },
  customerMediaWrapper: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E1CF',
  },
  actionsRowThemed: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0E1CF',
    paddingTop: 12,
    marginTop: 12,
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5EFE3',
    padding: 16,
    marginBottom: 14,
    ...FARMER_THEME.shadows.card,
  },
  farmerNameThemed: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 14.5,
    color: '#0E3B29',
  },
  farmerDateThemed: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 12,
    color: '#6B7A6F',
    marginLeft: 8,
  },
  farmerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDF3E4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8E2C8',
  },
  farmerVerifiedText: {
    fontFamily: FARMER_THEME.fonts.bold,
    fontSize: 11,
    color: '#17663F',
    marginLeft: 4,
  },
  farmerReviewText: {
    fontFamily: FARMER_THEME.fonts.regular,
    fontSize: 14,
    color: '#1B2A22',
    lineHeight: 21,
    marginTop: 8,
  },
});
