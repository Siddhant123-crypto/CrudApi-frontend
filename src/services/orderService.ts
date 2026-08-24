import api from './api';

export const getFarmerOrders = async () => {
  try {
    const response = await api.get('/order/farmer');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCustomerOrders = async () => {
  try {
    const response = await api.get('/order/customer/my-orders');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const acceptOrder = async (orderId: string) => {
  try {
    const response = await api.put(`/order/${orderId}/accept`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const farmerCancelOrder = async (orderId: string) => {
  try {
    const response = await api.put(`/order/${orderId}/farmer-cancel`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
