import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getFarmerReviews } from '../services/reviewService';
import { getProductVideoUrl } from '../services/productService';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { StarRating } from '../components/reviews/StarRating';
import { MediaViewerModal } from '../components/reviews/MediaViewerModal';
import { Review } from '../types';

export const FarmerProductReviewsScreen = ({ route, navigation }: any) => {
  const product = route.params?.product;
  
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Media Viewer state
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaModalUrl, setMediaModalUrl] = useState<string | null>(null);

  const fetchReviews = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getFarmerReviews();
      setAllReviews(data);

      if (product) {
        // Filter reviews for this specific product
        const filtered = data.filter((r) => r.productId === product.productId);
        setFilteredReviews(filtered);
      } else {
        setFilteredReviews(data);
      }
    } catch (error: any) {
      console.log('Error fetching farmer reviews:', error);
      Alert.alert('Error', 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product?.productId]);

  // Compute rating metrics
  const totalReviews = filteredReviews.length;
  const averageRating = totalReviews > 0
    ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Product Review
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1B5E20" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : filteredReviews.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbox-ellipses-outline" size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptySub}>
            Your customers haven't shared their Farm2Home experience yet.
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchReviews()}>
            <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.refreshBtnText}>Check Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.reviewId}
          contentContainerStyle={styles.mainCard}
          onRefresh={() => fetchReviews(true)}
          refreshing={refreshing}
          ListHeaderComponent={
            totalReviews > 0 ? (
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <View style={styles.ratingBox}>
                    <Text style={styles.averageRatingText}>{averageRating.toFixed(1)}</Text>
                    <StarRating rating={Math.round(averageRating)} size={20} disabled={true} />
                    <Text style={styles.totalReviewsText}>{totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}</Text>
                  </View>
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryTitle}>Overall Product Rating</Text>
                    <Text style={styles.summarySub}>Based on verified customer orders.</Text>
                  </View>
                </View>
                <View style={styles.divider} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View>
              {!product && (
                <Text style={styles.productGroupLabel}>
                  📦 {item.productName}
                </Text>
              )}
              <ReviewCard
                review={item}
                onImagePress={(url) => {
                  setMediaModalUrl(url);
                  setMediaModalVisible(true);
                }}
                onVideoPress={(fileName) => {
                  const videoUrl = getProductVideoUrl(fileName);
                  Linking.openURL(videoUrl).catch(() =>
                    Alert.alert('Error', 'Could not play video. Please try again.')
                  );
                }}
              />
            </View>
          )}
        />
      )}

      <MediaViewerModal
        visible={mediaModalVisible}
        imageUrl={mediaModalUrl}
        onClose={() => {
          setMediaModalVisible(false);
          setMediaModalUrl(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Cream green background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1E5631', // Match other farmer screens
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'left',
    marginLeft: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8, // 3D look
    paddingBottom: 24,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBox: {
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingRight: 20,
    marginRight: 20,
  },
  averageRatingText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  totalReviewsText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summarySub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  productGroupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B5E20',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E5631',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
