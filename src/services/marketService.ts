import api from './api';

export interface Market {
  id: string | number;
  marketName: string;
  description?: string;
  address?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
  marketContactName?: string;
  contactNumber?: string;
  isActive: boolean;
  distance?: number;
  distanceUnit?: string;
}

export const getAllMarkets = async () => {
  const response = await api.get('/markets');
  return response.data;
};

export const getMarketById = async (id: string | number) => {
  const response = await api.get(`/markets/${id}`);
  return response.data;
};

export const getNearbyMarkets = async (latitude: number, longitude: number) => {
  const response = await api.get(`/markets/nearby?latitude=${latitude}&longitude=${longitude}`);
  return response.data;
};

export const searchMarkets = async (name: string) => {
  const response = await api.get(`/markets/search?name=${encodeURIComponent(name)}`);
  return response.data;
};
