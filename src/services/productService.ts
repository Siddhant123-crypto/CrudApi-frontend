import api, {BASE_URL} from './api';

// POST /product/save
export const saveProduct = async (productData: any) => {
  const response = await api.post('/product/save', productData);
  return response.data;
};

// GET /product/getAll
export const getAllProducts = async () => {
  const response = await api.get('/product/getAll');
  return response.data;
};

// GET /product/getById/{id}
export const getProductById = async (id: number | string) => {
  const response = await api.get(`/product/getById/${id}`);
  return response.data;
};

// PUT /product/update/{id}
export const updateProduct = async (id: number | string, productData: any) => {
  const response = await api.put(`/product/update/${id}`, productData);
  return response.data;
};

// DELETE /product/delete/{id}
export const deleteProduct = async (id: number | string) => {
  const response = await api.delete(`/product/delete/${id}`);
  return response.data;
};

// POST /product/upload  — FormData with "photo"
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

  const response = await api.post('/product/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => data,
  });
  return response.data; // returns filename string
};

// GET /product/search?keyword=...
export const searchProducts = async (keyword: string) => {
  const response = await api.get('/product/search', {params: {keyword}});
  return response.data;
};

// Helper — build full image URL for product photos
export const getProductImageUrl = (fileName: string) => {
  return `${BASE_URL}/product/image/${fileName}`;
};
