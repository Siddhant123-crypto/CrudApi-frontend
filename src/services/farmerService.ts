import api from './api';
export const saveFarmer = async (farmerData: any, photoUri: string | null) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(farmerData));
  if (photoUri) {
    formData.append('photo', {
      uri: photoUri,
      name: 'farmer_photo.jpg',
      type: 'image/jpeg',
    });
  }
  const response = await api.post('/farmer/save', formData);
  return response.data;
};
export const getAllFarmers = async () => {
  const response = await api.get('/farmer/getAll');
  return response.data;
};
export const getFarmerById = async (id: number | string) => {
  const response = await api.get(`/farmer/getById/${id}`);
  return response.data;
};
export const updateFarmer = async (id: number | string, farmerData: any) => {
  const response = await api.put(`/farmer/update/${id}`, farmerData);
  return response.data;
};
export const deleteFarmer = async (id: number | string) => {
  const response = await api.delete(`/farmer/delete/${id}`);
  return response.data;
};
export const uploadFarmerPhoto = async (id: number | string, fileUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: 'farmer_photo.jpg',
    type: 'image/jpeg',
  });
  const response = await api.post(`/farmer/uploadPhoto/${id}`, formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return response.data;
};
export const getFarmerPhoto = async (id: number | string) => {
  const response = await api.get(`/farmer/getPhoto/${id}`);
  return response.data;
};
