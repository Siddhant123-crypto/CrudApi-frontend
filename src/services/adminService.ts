import api from './api';

export const getAdminDashboardSummary = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAdminOrderById = async (orderId: string) => {
  try {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPendingFarmers = async () => {
  try {
    const response = await api.get('/admin/farmers/pending');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAdminFarmDetails = async (farmerId: string) => {
  try {
    const response = await api.get(`/admin/farmers/verification/${farmerId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyFarmer = async (farmerId: string) => {
  try {
    const response = await api.put(`/admin/farmers/verification/${farmerId}/approve`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const requestFarmerAdditionalInfo = async (farmerId: string, message: string) => {
  try {
    const response = await api.put(`/admin/farmers/verification/${farmerId}/reject`, { message });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAdminFarmGallery = async (farmerId: string) => {
  try {
    const response = await api.get(`/admin/farmers/${farmerId}/gallery`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllAdminFarmers = async () => {
  try {
    const response = await api.get('/admin/farmers');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getVerificationFarmers = async () => {
  try {
    const response = await api.get('/admin/farmers/verification/list');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createAdminMarket = async (marketData: any) => {
  try {
    const response = await api.post('/admin/markets', marketData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAdminMarket = async (id: string | number, marketData: any) => {
  try {
    const response = await api.put(`/admin/markets/${id}`, marketData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateAdminMarketStatus = async (id: string | number, isActive: boolean) => {
  try {
    const response = await api.put(`/admin/markets/${id}/status?isActive=${isActive}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAdminMarket = async (id: string | number) => {
  try {
    const response = await api.delete(`/admin/markets/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAdminGroupMessages = async () => {
  try {
    const response = await api.get('/admin/group/messages');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendAdminGroupMessage = async (message: string) => {
  try {
    const payload = { message };
    const response = await api.post('/admin/group/messages', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAvailableAdmins = async () => {
  try {
    const response = await api.get('/admin/support/admins');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteAdminGroupMessage = async (messageId: string) => {
  try {
    const response = await api.delete(`/admin/group/messages/${messageId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
