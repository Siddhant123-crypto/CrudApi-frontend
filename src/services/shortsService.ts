import api, { resolveMediaUrl } from './api';

export interface FarmerShortItem {
  id: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  location?: string;
  playbackUrl: string;
  thumbnailUrl: string | null;
  durationSeconds?: number | null;
  createdAt?: string;
  aboutFarm?: string;
  tagline?: string;
  farmingType?: string;
}

export interface ShortsPageResponse {
  items: FarmerShortItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Fetches authenticated paginated Farmer Shorts feed (newest first, verified only).
 */
export const getFarmerShorts = async (
  page = 0,
  size = 10,
): Promise<ShortsPageResponse> => {
  try {
    const response = await api.get('/shorts', {
      params: { page, size },
    });
    const data = response.data;
    if (data && Array.isArray(data.items)) {
      const mappedItems: FarmerShortItem[] = data.items.map((item: any) => ({
        id: String(item.id || item.farmerId || Math.random()),
        farmerId: String(item.farmerId || ''),
        farmerName: item.farmerName || 'Farmer',
        farmName: item.farmName || 'My Farm',
        location: item.location || '',
        playbackUrl: resolveMediaUrl(item.playbackUrl) || item.playbackUrl,
        thumbnailUrl: item.thumbnailUrl ? resolveMediaUrl(item.thumbnailUrl) : null,
        durationSeconds: item.durationSeconds ?? null,
        createdAt: item.createdAt || '',
        aboutFarm: item.aboutFarm || '',
        tagline: item.tagline || '',
        farmingType: item.farmingType || '',
      }));
      return {
        items: mappedItems,
        page: data.page ?? page,
        size: data.size ?? size,
        totalElements: data.totalElements ?? mappedItems.length,
        totalPages: data.totalPages ?? 1,
        hasMore: data.hasMore ?? false,
      };
    }
    return {
      items: [],
      page,
      size,
      totalElements: 0,
      totalPages: 0,
      hasMore: false,
    };
  } catch (error) {
    console.log('Error fetching farmer shorts:', error);
    return {
      items: [],
      page,
      size,
      totalElements: 0,
      totalPages: 0,
      hasMore: false,
    };
  }
};
