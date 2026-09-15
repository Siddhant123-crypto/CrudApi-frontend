import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Review } from '../../types';
import { StarRating } from './StarRating';
import { getProductImageUrl } from '../../services/productService';
import Ionicons from '@expo/vector-icons/Ionicons';
interface ReviewCardProps {
  review: Review;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onImagePress?: (imageUrl: string) => void;
  onVideoPress?: (videoUrl: string) => void;
}
export const ReviewCard = ({
  review,
  isOwner = false,
  onEdit,
  onDelete,
  onImagePress,
  onVideoPress,
}: ReviewCardProps) => {
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
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.customerName}>{review.customerDisplayName}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={review.rating} size={20} disabled={true} />
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>
        {review.isVerifiedPurchase && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#15803D" />
            <Text style={styles.verifiedText}>Verified Purchase</Text>
          </View>
        )}
      </View>
      {review.reviewText ? (
        <Text style={styles.reviewText}>{review.reviewText}</Text>
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
                style={styles.mediaWrapper}
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
                style={styles.mediaWrapper}
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
        <View style={styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
              <Ionicons name="pencil-outline" size={16} color="#15803D" />
              <Text style={styles.actionText}>Edit</Text>
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
});
