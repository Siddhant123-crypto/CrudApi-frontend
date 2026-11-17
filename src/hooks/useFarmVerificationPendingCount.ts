import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getFarmVerificationPendingCount } from '../services/adminService';

export interface FarmVerificationCounts {
  pendingCount: number;
  newCount: number;
  updatedCount: number;
}

let globalCounts: FarmVerificationCounts = {
  pendingCount: 0,
  newCount: 0,
  updatedCount: 0,
};

let isFetching = false;
const listeners = new Set<(counts: FarmVerificationCounts) => void>();

export const refreshFarmVerificationPendingCount = async (): Promise<FarmVerificationCounts> => {
  if (isFetching) return globalCounts;
  isFetching = true;
  try {
    const res = await getFarmVerificationPendingCount();
    let data: any = res;
    if (res && res.data) {
      data = res.data;
    }
    const counts: FarmVerificationCounts = {
      pendingCount: Number(data?.pendingCount ?? res?.pendingCount ?? 0),
      newCount: Number(data?.newCount ?? res?.newCount ?? 0),
      updatedCount: Number(data?.updatedCount ?? res?.updatedCount ?? 0),
    };
    globalCounts = counts;
    listeners.forEach((listener) => listener(counts));
    return counts;
  } catch (error) {
    // If the API fails, hide the dot silently (no error popup)
    console.log('Failed to fetch pending farm verification count silently', error);
    return globalCounts;
  } finally {
    isFetching = false;
  }
};

export const useFarmVerificationPendingCount = () => {
  const [counts, setCounts] = useState<FarmVerificationCounts>(globalCounts);

  useEffect(() => {
    const listener = (newCounts: FarmVerificationCounts) => {
      setCounts(newCounts);
    };
    listeners.add(listener);

    // Initial fetch on mount
    refreshFarmVerificationPendingCount();

    // AppState listener (when returning to foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshFarmVerificationPendingCount();
      }
    };
    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Polling every 60 seconds while app is open
    const intervalId = setInterval(() => {
      refreshFarmVerificationPendingCount();
    }, 60000);

    return () => {
      listeners.delete(listener);
      appStateSub.remove();
      clearInterval(intervalId);
    };
  }, []);

  return {
    ...counts,
    refresh: refreshFarmVerificationPendingCount,
  };
};

export default useFarmVerificationPendingCount;
