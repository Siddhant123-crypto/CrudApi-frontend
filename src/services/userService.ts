import api, { BASE_URL, resolveBaseUrl } from './api';

export const getUserProfileImageUrl = (photo?: string | null): string | null => {
  if (!photo || typeof photo !== 'string') return null;
  const trimmed = photo.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const activeBase = resolveBaseUrl();
  const clean = trimmed.replace(/^\/?(uploads\/)+/, '');
  return `${activeBase}/user/image/${clean}`;
};

export const getCurrentUserProfile = async () => {
  const response = await api.get('/user/me');
  return response.data;
};
export const getAllUsers = async () => {
  const response = await api.get('/user/getAll');
  return response.data;
};
export const getUserById = async (id: number | string) => {
  const response = await api.get(`/user/getById/${id}`);
  return response.data;
};
export const updateUser = async (id: number | string, userData: any) => {
  const response = await api.put(`/user/update/${id}`, userData);
  return response.data;
};
export const deleteUser = async (id: number | string) => {
  const response = await api.delete(`/user/delete/${id}`);
  return response.data;
};
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
export const getUserPhoto = async (id: number | string) => {
  const response = await api.get(`/user/getPhoto/${id}`);
  return response.data;
};
export const saveUserMapping = async (mappingData: any) => {
  const response = await api.post('/userMapping/save', mappingData);
  return response.data;
};
export const updateUserMapping = async (id: number | string, mappingData: any) => {
  const response = await api.put(`/userMapping/update/${id}`, mappingData);
  return response.data;
};
