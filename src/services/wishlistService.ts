import api from './api';
import { WishlistResponse, WishlistCheckResponse } from '../types';
export const wishlistService = {
  addToWishlist: async (productId: string): Promise<WishlistResponse> => {
    const response = await api.post(`/wishlist/add/${productId}`);
    return response.data.wishlist;
  },
  getMyWishlist: async (): Promise<WishlistResponse[]> => {
    const response = await api.get('/wishlist/my');
    console.log("MY WISHLIST DATA:", JSON.stringify(response.data));
    return response.data.wishlist;
  },
  removeFromWishlist: async (productId: string): Promise<void> => {
    await api.delete(`/wishlist/remove/${productId}`);
  },
  checkWishlist: async (productId: string): Promise<WishlistCheckResponse> => {
    const response = await api.get(`/wishlist/check/${productId}`);
    return response.data.wishlist;
  },
};
