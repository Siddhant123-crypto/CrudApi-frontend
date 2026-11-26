import api, { refreshAccessTokenSingleFlight, resolveBaseUrl } from './api';
import { getAccessToken } from './tokenStorage';
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

const fetchReviewWithAuthRetry = async (
  path: string,
  method: 'POST' | 'PUT',
  formData: FormData
): Promise<Review> => {
  const baseUrl = resolveBaseUrl();
  const buildInit = (token: string | null): RequestInit => ({
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let token = await getAccessToken();
  let response = await fetch(`${baseUrl}${path}`, buildInit(token));
  if (response.status === 401) {
    const refreshedToken = await refreshAccessTokenSingleFlight();
    if (refreshedToken) {
      response = await fetch(`${baseUrl}${path}`, buildInit(refreshedToken));
    }
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { response: { status: response.status, data: errorData } };
  }
  return await response.json();
};
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
  return fetchReviewWithAuthRetry('/review', 'POST', formData);
};
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const response = await api.get(`/review/product/${productId}/reviews`);
  return response.data;
};
export const getProductRating = async (productId: string): Promise<ProductRatingResponse> => {
  const response = await api.get(`/review/product/${productId}/rating`);
  return response.data;
};
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
  return fetchReviewWithAuthRetry(`/review/${reviewId}`, 'PUT', formData);
};
export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/review/${reviewId}`);
};
export const getFarmerReviews = async (): Promise<Review[]> => {
  const response = await api.get('/review/farmer');
  return response.data;
};
