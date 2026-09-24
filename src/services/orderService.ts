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
export const getFarmerItemsStatus = (items: any[]): string => {
  if (!items || items.length === 0) return 'PENDING';
  const statuses = items.map(item => item.status);
  const allCancelled = statuses.every(s => s === 'CANCELLED');
  if (allCancelled) return 'CANCELLED';
  const allDeliveredOrCancelled = statuses.every(s => s === 'DELIVERED' || s === 'CANCELLED');
  if (allDeliveredOrCancelled) return 'DELIVERED';
  const allOutForDeliveryOrBeyond = statuses.every(s => s === 'OUT_FOR_DELIVERY' || s === 'DELIVERED' || s === 'CANCELLED');
  if (allOutForDeliveryOrBeyond) return 'OUT_FOR_DELIVERY';
  const allProcessingOrBeyond = statuses.every(s => s === 'PROCESSING' || s === 'OUT_FOR_DELIVERY' || s === 'DELIVERED' || s === 'CANCELLED');
  if (allProcessingOrBeyond) return 'PROCESSING';
  const allConfirmedOrBeyond = statuses.every(s => s === 'CONFIRMED' || s === 'PROCESSING' || s === 'OUT_FOR_DELIVERY' || s === 'DELIVERED' || s === 'CANCELLED');
  if (allConfirmedOrBeyond) return 'CONFIRMED';
  return 'PENDING';
};

export const getAllAdminOrders = async () => {
  try {
    const response = await api.get('/admin/orders');
    return response.data;
  } catch (error) {
    throw error;
  }
};
