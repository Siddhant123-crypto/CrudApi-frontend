import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { WishlistResponse } from '../types';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
interface WishlistContextType {
  wishlist: WishlistResponse[];
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string, showNotification?: boolean) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [wishlist, setWishlist] = useState<WishlistResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { isLoggedIn, user } = useAuth();
  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn || user?.role === 'ADMIN') {
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
      Alert.alert(t('auth.signInToContinue', 'Login Required'), t('wishlist.loginRequiredMessage', 'Please login to manage wishlist.'));
      return;
    }
    try {
      const exists = isInWishlist(productId);
      if (exists) {
        await wishlistService.removeFromWishlist(productId);
        Alert.alert(t('common.success', 'Success'), t('wishlist.removedSuccess', 'Removed from product wishlist'));
      } else {
        await wishlistService.addToWishlist(productId);
        Alert.alert(t('common.success', 'Success'), t('wishlist.addedSuccess', 'Added to product wishlist'));
      }
      await refreshWishlist();
    } catch (error: any) {
      console.log('Error toggling wishlist:', error);
      Alert.alert(t('common.error', 'Error'), t('wishlist.updateFailed', 'Failed to update wishlist'));
    }
  };
  const removeFromWishlist = async (productId: string, showNotification: boolean = true) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      if (showNotification) {
        Alert.alert(t('common.success', 'Success'), t('wishlist.removedSuccess', 'Removed from product wishlist'));
      }
      await refreshWishlist();
    } catch (error: any) {
      console.log('Error removing from wishlist:', error);
      if (showNotification) {
        Alert.alert(t('common.error', 'Error'), t('wishlist.removeFailed', 'Failed to remove from wishlist'));
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        refreshWishlist,
        toggleWishlist,
        removeFromWishlist,
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
