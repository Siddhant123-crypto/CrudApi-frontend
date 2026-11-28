import api from './api';
import { resolveFarmMediaUploadMeta } from '../utils/farmMediaUtils';
export const getFarmDetails = async (farmerId: string) => {
  const response = await api.get(`/farm-details/get/${farmerId}`);
  return response.data;
};
export const saveFarmDetails = async (farmerData: any, farmerPhotoUri?: string, farmVideoUri?: string) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(farmerData));
  if (farmerPhotoUri) {
    const meta = resolveFarmMediaUploadMeta(farmerPhotoUri);
    formData.append('farmerPhoto', {
      uri: meta.uri,
      name: meta.fileName,
      type: meta.mimeType,
    } as any);
  }
  if (farmVideoUri) {
    const meta = resolveFarmMediaUploadMeta({ uri: farmVideoUri, type: 'video' });
    formData.append('farmVideo', {
      uri: meta.uri,
      name: meta.fileName,
      type: meta.mimeType,
    } as any);
  }
  const response = await api.post('/farm-details/save', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  });
  return response.data;
};
export const updateFarmDetails = async (farmerId: string, farmerData: any, farmerPhotoUri?: string, farmVideoUri?: string) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(farmerData));
  if (farmerPhotoUri) {
    const meta = resolveFarmMediaUploadMeta(farmerPhotoUri);
    formData.append('farmerPhoto', {
      uri: meta.uri,
      name: meta.fileName,
      type: meta.mimeType,
    } as any);
  }
  if (farmVideoUri) {
    const meta = resolveFarmMediaUploadMeta({ uri: farmVideoUri, type: 'video' });
    formData.append('farmVideo', {
      uri: meta.uri,
      name: meta.fileName,
      type: meta.mimeType,
    } as any);
  }
  const response = await api.put(`/farm-details/update/${farmerId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  });
  return response.data;
};
