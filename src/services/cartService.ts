import api from './api';
import { CartResponse } from '../types';

export const cartService = {
  addToCart: async (productId: string, quantity: number = 1): Promise<CartResponse> => {
    const response = await api.post(`/cart/add/${productId}`, {
      quantity,
    });
    return response.data.cart;
  },

  getMyCart: async (): Promise<CartResponse> => {
    const response = await api.get('/cart/my');
    return response.data.cart;
  },

  updateQuantity: async (productId: string, quantity: number): Promise<CartResponse> => {
    const response = await api.put(`/cart/update/${productId}`, {
      quantity,
    });
    return response.data.cart;
  },

  removeFromCart: async (productId: string): Promise<void> => {
    await api.delete(`/cart/remove/${productId}`);
  },

  clearCart: async (): Promise<void> => {
    await api.delete('/cart/clear');
  },
};
