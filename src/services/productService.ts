import api, {BASE_URL} from './api';
export const saveProduct = async (productData: any) => {
  const response = await api.post('/product/save', productData);
  return response.data;
};
export const saveProductFormData = async (data: any, photoUri?: string, videoUri?: string) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));
  if (photoUri) {
    const filename = photoUri.split('/').pop() || 'product_photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type: fileType,
    } as any);
  }
  if (videoUri) {
    const filename = videoUri.split('/').pop() || 'product_video.mp4';
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `video/${match[1]}` : 'video/mp4';
    formData.append('video', {
      uri: videoUri,
      name: filename,
      type: fileType,
    } as any);
  }
  const response = await api.post('/product/save', formData);
  return response.data;
};
export const getAllProducts = async () => {
  const response = await api.get('/product/getAll');
  return response.data;
};
export const getProductById = async (id: number | string) => {
  const response = await api.get(`/product/getById/${id}`);
  return response.data;
};
export const updateProduct = async (id: number | string, productData: any) => {
  const response = await api.put(`/product/update/${id}`, productData);
  return response.data;
};
export const deleteProduct = async (id: number | string) => {
  const response = await api.delete(`/product/delete/${id}`);
  return response.data;
};
export const uploadProductPhoto = async (fileUri: string) => {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'product_photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const fileType = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('photo', {
    uri: fileUri,
    name: filename,
    type: fileType,
  } as any);
  const response = await api.post('/product/upload', formData);
  return response.data;
};
export const searchProducts = async (keyword: string) => {
  const response = await api.get('/product/search', {params: {keyword}});
  return response.data;
};
export const updateProductFormData = async (
  id: number | string,
  data: any,
  photoUri?: string,
  videoUri?: string,
) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));
  if (photoUri) {
    const filename = photoUri.split('/').pop() || 'product_photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('photo', { uri: photoUri, name: filename, type: fileType } as any);
  }
  if (videoUri) {
    const filename = videoUri.split('/').pop() || 'product_video.mp4';
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `video/${match[1]}` : 'video/mp4';
    formData.append('video', { uri: videoUri, name: filename, type: fileType } as any);
  }
  const response = await api.put(`/product/update/${id}`, formData);
  return response.data;
};
export const getProductImageUrl = (fileName: string) => {
  return `${BASE_URL}/product/image/${fileName}`;
};
export const getProductVideoUrl = (fileName: string) => {
  return `${BASE_URL}/product/video/${fileName}`;
};
