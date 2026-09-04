import api from './api';

export const getFarmDetails = async (farmerId: string) => {
  const response = await api.get(`/farm-details/get/${farmerId}`);
  return response.data;
};

export const saveFarmDetails = async (farmerData: any, farmerPhotoUri?: string, farmVideoUri?: string) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(farmerData));

  if (farmerPhotoUri) {
    const photoName = farmerPhotoUri.split('/').pop() || 'farmer_photo.jpg';
    formData.append('farmerPhoto', {
      uri: farmerPhotoUri,
      name: photoName,
      type: 'image/jpeg',
    } as any);
  }

  if (farmVideoUri) {
    const videoName = farmVideoUri.split('/').pop() || 'farm_video.mp4';
    formData.append('farmVideo', {
      uri: farmVideoUri,
      name: videoName,
      type: 'video/mp4',
    } as any);
  }

  const response = await api.post('/farm-details/save', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 minutes for video uploads
  });
  return response.data;
};

export const updateFarmDetails = async (farmerId: string, farmerData: any, farmerPhotoUri?: string, farmVideoUri?: string) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(farmerData));

  if (farmerPhotoUri) {
    const photoName = farmerPhotoUri.split('/').pop() || 'farmer_photo.jpg';
    formData.append('farmerPhoto', {
      uri: farmerPhotoUri,
      name: photoName,
      type: 'image/jpeg',
    } as any);
  }

  if (farmVideoUri) {
    const videoName = farmVideoUri.split('/').pop() || 'farm_video.mp4';
    formData.append('farmVideo', {
      uri: farmVideoUri,
      name: videoName,
      type: 'video/mp4',
    } as any);
  }

  const response = await api.put(`/farm-details/update/${farmerId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000, // 5 minutes for video uploads
  });
  return response.data;
};
