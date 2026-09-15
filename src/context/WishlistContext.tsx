import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { WishlistResponse } from '../types';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
interface WishlistContextType {
  wishlist: WishlistResponse[];
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isLoggedIn } = useAuth();
  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlist([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await wishlistService.getMyWishlist();
      setWishlist(data || []);
    } catch (error: any) {
      console.log('Error refreshing wishlist:', error);
      if (error?.response?.status === 404) {
        setWishlist([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);
  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);
  const isInWishlist = useCallback((productId: string) => {
    if (!productId) return false;
    return wishlist.some(
      item => String(item.productId).toLowerCase() === String(productId).toLowerCase()
    );
  }, [wishlist]);
  const toggleWishlist = async (productId: string) => {
    if (!isLoggedIn) {
      Alert.alert('Login Required', 'Please login to manage wishlist.');
      return;
    }
    try {
      const exists = isInWishlist(productId);
      if (exists) {
        await wishlistService.removeFromWishlist(productId);
      } else {
        await wishlistService.addToWishlist(productId);
      }
      await refreshWishlist();
    } catch (error: any) {
      console.log('Error toggling wishlist:', error);
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };
  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        refreshWishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
export default WishlistContext;
