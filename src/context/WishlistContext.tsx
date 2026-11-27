import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
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
  const togglingIdsRef = useRef<Set<string>>(new Set());

  const refreshWishlist = useCallback(async () => {
    if (!isLoggedIn || user?.role === 'ADMIN' || user?.role === 'FARMER') {
      setWishlist([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await wishlistService.getMyWishlist();
      setWishlist(data || []);
    } catch (error: any) {
      if (__DEV__) {
        console.log('Error refreshing wishlist:', error?.response?.status || error?.message);
      }
      if (error?.response?.status === 404) {
        setWishlist([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user?.role, user?.userId, user?.email]);

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
    if (!productId) return;
    const normalizedId = String(productId).toLowerCase();
    if (togglingIdsRef.current.has(normalizedId)) {
      return;
    }
    togglingIdsRef.current.add(normalizedId);

    const exists = isInWishlist(productId);
    try {
      if (exists) {
        await wishlistService.removeFromWishlist(productId);
        setWishlist(prev => prev.filter(item => String(item.productId).toLowerCase() !== normalizedId));
        Alert.alert(t('common.success', 'Success'), t('wishlist.removedSuccess', 'Removed from product wishlist'));
      } else {
        const added = await wishlistService.addToWishlist(productId);
        if (added) {
          setWishlist(prev =>
            prev.some(item => String(item.productId).toLowerCase() === normalizedId)
              ? prev
              : [...prev, added]
          );
        }
        Alert.alert(t('common.success', 'Success'), t('wishlist.addedSuccess', 'Added to product wishlist'));
      }
      await refreshWishlist();
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = String(error?.response?.data?.message || error?.response?.data?.error || '').toLowerCase();
      if (!exists && status === 400 && msg.includes('already in your wishlist')) {
        // Server already has this product in wishlist; sync local state cleanly without an error alert
        await refreshWishlist();
        return;
      }
      if (exists && status === 404 && msg.includes('not in your wishlist')) {
        // Already removed on server; sync local state cleanly without an error alert
        await refreshWishlist();
        return;
      }
      console.log('Error toggling wishlist:', error);
      Alert.alert(t('common.error', 'Error'), t('wishlist.updateFailed', 'Failed to update wishlist'));
    } finally {
      togglingIdsRef.current.delete(normalizedId);
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
