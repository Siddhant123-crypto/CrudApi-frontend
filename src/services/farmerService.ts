import api from './api';

// POST /farmer/save  — multipart: "data" (JSON) + "photo" (file)
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
  const response = await api.post('/farmer/save', formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return response.data;
};

// GET /farmer/getAll
export const getAllFarmers = async () => {
  const response = await api.get('/farmer/getAll');
  return response.data;
};

// GET /farmer/getById/{id}
export const getFarmerById = async (id: number | string) => {
  const response = await api.get(`/farmer/getById/${id}`);
  return response.data;
};

// PUT /farmer/update/{id}
export const updateFarmer = async (id: number | string, farmerData: any) => {
  const response = await api.put(`/farmer/update/${id}`, farmerData);
  return response.data;
};

// DELETE /farmer/delete/{id}
export const deleteFarmer = async (id: number | string) => {
  const response = await api.delete(`/farmer/delete/${id}`);
  return response.data;
};

// POST /farmer/uploadPhoto/{id}
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

// GET /farmer/getPhoto/{id}
export const getFarmerPhoto = async (id: number | string) => {
  const response = await api.get(`/farmer/getPhoto/${id}`);
  return response.data;
};
