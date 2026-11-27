import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { CartResponse, CartItemResponse } from '../types';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
interface CartContextType {
  cart: CartResponse | null;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number, showNotification?: boolean) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isLoggedIn, user } = useAuth();
  const refreshCart = useCallback(async () => {
    if (!isLoggedIn || user?.role === 'ADMIN' || user?.role === 'FARMER') {
      setCart(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await cartService.getMyCart();
      setCart(data);
    } catch (error: any) {
      console.log('Error refreshing cart:', error);
      if (
        error?.response?.status === 404 ||
        (error?.response?.status === 500 && error?.response?.data?.message?.includes('Cart is empty'))
      ) {
        setCart(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user?.role, user?.userId]);
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);
  const addToCart = async (productId: string, quantity: number = 1, showNotification: boolean = true): Promise<boolean> => {
    try {
      if (!isLoggedIn) {
        Alert.alert(t('auth.signInToContinue', 'Login Required'), t('cart.loginRequiredMessage', 'Please login to add items to cart.'));
        return false;
      }
      setIsLoading(true);
      const updatedCart = await cartService.addToCart(productId, quantity);
      setCart(updatedCart);
      if (showNotification) {
        Alert.alert(t('common.success', 'Success'), t('cart.productAdded', 'Product added to cart!'));
      }
      return true;
    } catch (error: any) {
      console.log('Error adding to cart:', error);
      if (showNotification) {
        Alert.alert(t('common.error', 'Error'), t('cart.addToCartFailed', 'Failed to add product to cart'));
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      setIsLoading(true);
      const updatedCart = await cartService.updateQuantity(productId, quantity);
      setCart(updatedCart);
    } catch (error: any) {
      console.log('Error updating cart quantity:', error);
      Alert.alert(t('common.error', 'Error'), t('cart.updateQuantityFailed', 'Failed to update quantity'));
    } finally {
      setIsLoading(false);
    }
  };
  const removeFromCart = async (productId: string) => {
    try {
      setIsLoading(true);
      await cartService.removeFromCart(productId);
      await refreshCart();
    } catch (error: any) {
      console.log('Error removing from cart:', error);
      Alert.alert(t('common.error', 'Error'), t('cart.removeFromCartFailed', 'Failed to remove product from cart'));
    } finally {
      setIsLoading(false);
    }
  };
  const clearCart = async () => {
    try {
      setIsLoading(true);
      await cartService.clearCart();
      setCart(null);
    } catch (error: any) {
      console.log('Error clearing cart:', error);
      Alert.alert(t('common.error', 'Error'), t('cart.clearCartFailed', 'Failed to clear cart'));
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount: cart?.totalItems || 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
export default CartContext;
