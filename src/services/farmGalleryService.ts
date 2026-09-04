import api from './api';

export const getMyGallery = async () => {
  const response = await api.get('/farm-gallery');
  return response.data;
};

export const getGalleryByFarmerId = async (farmerId: string) => {
  const response = await api.get(`/farm-gallery/farmer/${farmerId}`);
  return response.data;
};

export const uploadGalleryFile = async (farmerId: string, fileUri: string, mimeType: string, originalName: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: originalName || 'gallery_file.jpg',
    type: mimeType || 'image/jpeg',
  } as any);

  const response = await api.post(`/farm-gallery/upload/${farmerId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 minutes for video uploads
  });
  return response.data;
};

export const updateGalleryFile = async (galleryId: string, fileUri: string, mimeType: string, originalName: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: originalName || 'gallery_file.jpg',
    type: mimeType || 'image/jpeg',
  } as any);

  const response = await api.put(`/farm-gallery/update/${galleryId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 minutes for video uploads
  });
  return response.data;
};

export const deleteGalleryFile = async (galleryId: string) => {
  const response = await api.delete(`/farm-gallery/delete/${galleryId}`);
  return response.data;
};
