import api from './api';

// GET /user/getAll
export const getAllUsers = async () => {
  const response = await api.get('/user/getAll');
  return response.data;
};

// GET /user/getById/{id}
export const getUserById = async (id: number | string) => {
  const response = await api.get(`/user/getById/${id}`);
  return response.data;
};

// PUT /user/update/{id}
export const updateUser = async (id: number | string, userData: any) => {
  const response = await api.put(`/user/update/${id}`, userData);
  return response.data; // UpdateResponse
};

// DELETE /user/delete/{id}
export const deleteUser = async (id: number | string) => {
  const response = await api.delete(`/user/delete/${id}`);
  return response.data;
};

// POST /user/uploadPhoto/{id}  — FormData with "file"
export const uploadUserPhoto = async (id: number | string, fileUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  });
  const response = await api.post(`/user/uploadPhoto/${id}`, formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return response.data;
};

// GET /user/getPhoto/{id}
export const getUserPhoto = async (id: number | string) => {
  const response = await api.get(`/user/getPhoto/${id}`);
  return response.data;
};

// POST /userMapping/save
export const saveUserMapping = async (mappingData: any) => {
  const response = await api.post('/userMapping/save', mappingData);
  return response.data;
};

// PUT /userMapping/update/{id}
export const updateUserMapping = async (id: number | string, mappingData: any) => {
  const response = await api.put(`/userMapping/update/${id}`, mappingData);
  return response.data;
};
