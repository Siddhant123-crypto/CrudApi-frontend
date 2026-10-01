import api from './api';

export interface SupportRequestResponse {
  supportRequestId: string;
  userId: string;
  userName?: string; // Optional if mapped by backend
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  assignedAdminId?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  transferredByAdminName?: string;
  hasUnreadTransfer?: boolean;
}

export const adminSupportService = {
  getUnassignedSupportRequests: async () => {
    const response = await api.get('/admin/support/unassigned');
    return response.data;
  },
  
  getMyAssignedSupportRequests: async () => {
    const response = await api.get('/admin/support/my-assigned');
    return response.data;
  },
  
  getResolvedSupportRequests: async () => {
    const response = await api.get('/admin/support/resolved');
    return response.data;
  },
  
  assignSupportRequest: async (supportRequestId: string) => {
    const response = await api.post(`/admin/support/${supportRequestId}/assign`);
    return response.data;
  },
  
  transferSupportRequest: async (supportRequestId: string, newAdminId: string) => {
    const response = await api.post(`/admin/support/${supportRequestId}/transfer?newAdminId=${newAdminId}`);
    return response.data;
  },
  
  resolveSupportRequest: async (supportRequestId: string) => {
    const response = await api.post(`/admin/support/${supportRequestId}/resolve`);
    return response.data;
  },
  
  reopenSupportRequest: async (supportRequestId: string) => {
    const response = await api.put(`/admin/support/${supportRequestId}/status`, { status: 'IN_PROGRESS' });
    return response.data;
  },
  
  getAdminUnreadCounts: async () => {
    const response = await api.get('/support/admin/unread-counts');
    return response.data;
  },
  
  getAvailableAdmins: async () => {
    const response = await api.get('/admin/support/admins');
    return response.data;
  }
};
