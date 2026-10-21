import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getFarmerReviews } from '../services/reviewService';
import { getProductVideoUrl } from '../services/productService';
import { ReviewCard } from '../components/reviews/ReviewCard';
import { StarRating } from '../components/reviews/StarRating';
import { MediaViewerModal } from '../components/reviews/MediaViewerModal';
import { FarmerHeader } from '../components/farmer/FarmerHeader';
import { FarmerPageBackground } from '../components/farmer/FarmerPageBackground';
import { FarmerCard } from '../components/farmer/FarmerCard';
import { FarmerEmptyState } from '../components/farmer/FarmerUI';
import { FARMER_THEME } from '../constants/farmerTheme';
import { Review } from '../types';

export const FarmerProductReviewsScreen = ({ route, navigation }: any) => {
  const product = route.params?.product;
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [mediaModalUrl, setMediaModalUrl] = useState<string | null>(null);
  const [mediaModalIsVideo, setMediaModalIsVideo] = useState(false);

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

  const totalReviews = filteredReviews.length;
  const averageRating = totalReviews > 0
    ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  return (
    <FarmerPageBackground>
      <StatusBar barStyle="light-content" backgroundColor="#1F7A4D" />
      <FarmerHeader
        variant="inner"
        title="Product Reviews"
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1F7A4D" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : filteredReviews.length === 0 ? (
        <View style={styles.centerContainer}>
          <FarmerEmptyState
            icon={<Ionicons name="chatbox-ellipses-outline" size={48} color="#17663F" />}
            title="No Reviews Yet"
            subtitle="Your customers haven't shared their Farm2Home experience yet."
            buttonTitle="Check Again"
            onButtonPress={() => fetchReviews()}
          />
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => item.reviewId}
          contentContainerStyle={styles.listContent}
          onRefresh={() => fetchReviews(true)}
          refreshing={refreshing}
          ListHeaderComponent={
            totalReviews > 0 ? (
              <FarmerCard style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.ratingBox}>
                    <Text style={styles.averageRatingText}>{averageRating.toFixed(1)}</Text>
                    <StarRating rating={Math.round(averageRating)} size={18} disabled={true} variant="farmer" />
                    <Text style={styles.totalReviewsText}>{totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}</Text>
                  </View>
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryTitle}>Overall Product Rating</Text>
                    <Text style={styles.summarySub}>Based on verified customer orders.</Text>
                  </View>
                </View>
              </FarmerCard>
            ) : null
          }
          renderItem={({ item }) => (
            <View>
              {!product && (
                <View style={styles.productGroupLabel}>
                  <Text style={styles.productGroupText}>
                    📦 {item.productName}
                  </Text>
                </View>
              )}
              <ReviewCard
                review={item}
                variant="farmer"
                onImagePress={(url) => {
                  setMediaModalIsVideo(false);
                  setMediaModalUrl(url);
                  setMediaModalVisible(true);
                }}
                onVideoPress={(fileName) => {
                  const videoUrl = getProductVideoUrl(fileName);
                  setMediaModalIsVideo(true);
                  setMediaModalUrl(videoUrl);
                  setMediaModalVisible(true);
                }}
              />
            </View>
          )}
        />
      )}

      <MediaViewerModal
        visible={mediaModalVisible}
        mediaUrl={mediaModalUrl}
        isVideo={mediaModalIsVideo}
        onClose={() => {
          setMediaModalVisible(false);
          setMediaModalUrl(null);
          setMediaModalIsVideo(false);
        }}
      />
    </FarmerPageBackground>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBox: {
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5EFE3',
    paddingRight: 18,
    marginRight: 18,
  },
  averageRatingText: {
    fontSize: 34,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
    marginBottom: 2,
  },
  totalReviewsText: {
    fontSize: 12,
    color: '#6B7A6F',
    marginTop: 4,
    fontFamily: FARMER_THEME.fonts.regular,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#0E3B29',
  },
  summarySub: {
    fontSize: 12.5,
    color: '#5C6B60',
    marginTop: 3,
    fontFamily: FARMER_THEME.fonts.regular,
  },
  productGroupLabel: {
    backgroundColor: '#DDF3E4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#B8E2C8',
  },
  productGroupText: {
    fontSize: 13,
    fontFamily: FARMER_THEME.fonts.bold,
    color: '#17663F',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#5C6B60',
    marginTop: 12,
    fontFamily: FARMER_THEME.fonts.medium,
  },
});
