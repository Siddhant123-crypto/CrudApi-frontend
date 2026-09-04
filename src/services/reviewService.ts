import api, { BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Review, ProductRatingResponse } from '../types';

const getMimeType = (filename: string, isVideo: boolean = false): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (isVideo) {
    if (ext === 'mov') return 'video/quicktime';
    if (ext === '3gp') return 'video/3gpp';
    return 'video/mp4';
  } else {
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    return 'image/jpeg';
  }
};

// POST /review (multipart/form-data)
export const createReview = async (
  productId: string,
  orderId: string,
  rating: number,
  reviewText?: string,
  photoUri?: string,
  videoUri?: string
): Promise<Review> => {
  const formData = new FormData();

  const data = {
    productId,
    orderId,
    rating,
    reviewText,
  };

  // Append JSON data as string
  formData.append('data', JSON.stringify(data));

  // Add photo if provided
  if (photoUri) {
    let filename = photoUri.split('/').pop() || 'review_photo.jpg';
    if (!filename.includes('.')) {
      filename = `${filename}.jpg`;
    }
    const fileType = getMimeType(filename, false);
    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type: fileType,
    } as any);
  }

  // Add video if provided
  if (videoUri) {
    let filename = videoUri.split('/').pop() || 'review_video.mp4';
    if (!filename.includes('.')) {
      filename = `${filename}.mp4`;
    }
    const fileType = getMimeType(filename, true);
    formData.append('video', {
      uri: videoUri,
      name: filename,
      type: fileType,
    } as any);
  }

  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${BASE_URL}/review`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: errorData } };
  }

  return await response.json();
};

// GET /review/product/{productId}/reviews
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const response = await api.get(`/review/product/${productId}/reviews`);
  return response.data;
};

// GET /review/product/{productId}/rating
export const getProductRating = async (productId: string): Promise<ProductRatingResponse> => {
  const response = await api.get(`/review/product/${productId}/rating`);
  return response.data;
};

// PUT /review/{reviewId} (multipart/form-data)
export const updateReview = async (
  reviewId: string,
  rating?: number,
  reviewText?: string,
  photoUri?: string,
  videoUri?: string
): Promise<Review> => {
  const formData = new FormData();

  const data = {
    rating,
    reviewText,
  };

  formData.append('data', JSON.stringify(data));

  if (photoUri) {
    let filename = photoUri.split('/').pop() || 'review_photo.jpg';
    if (!filename.includes('.')) {
      filename = `${filename}.jpg`;
    }
    const fileType = getMimeType(filename, false);
    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type: fileType,
    } as any);
  }

  if (videoUri) {
    let filename = videoUri.split('/').pop() || 'review_video.mp4';
    if (!filename.includes('.')) {
      filename = `${filename}.mp4`;
    }
    const fileType = getMimeType(filename, true);
    formData.append('video', {
      uri: videoUri,
      name: filename,
      type: fileType,
    } as any);
  }

  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${BASE_URL}/review/${reviewId}`, {
    method: 'PUT',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { data: errorData } };
  }

  return await response.json();
};

// DELETE /review/{reviewId}
export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/review/${reviewId}`);
};

// GET /review/farmer
export const getFarmerReviews = async (): Promise<Review[]> => {
  const response = await api.get('/review/farmer');
  return response.data;
};
