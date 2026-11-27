export type AdminOrderTab = 'All' | 'Pending' | 'Delivered' | 'Cancelled';
export type AdminProductTab = 'All' | 'Active' | 'Inactive';

export const OPEN_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
] as const;

export const normalizeAdminOrderTab = (statusParam?: string | null): AdminOrderTab => {
  const normalized = String(statusParam || '').trim().toLowerCase();
  if (normalized === 'pending' || normalized === 'processing') {
    return 'Pending';
  }
  if (normalized === 'delivered' || normalized === 'completed') {
    return 'Delivered';
  }
  if (normalized === 'cancelled' || normalized === 'canceled') {
    return 'Cancelled';
  }
  return 'All';
};

export const filterAdminOrders = <
  T extends {
    orderId?: string;
    orderNumber?: string;
    orderStatus?: string;
    status?: string;
    customerName?: string;
    orderDate?: string;
  }
>(
  orders: T[],
  activeTab: AdminOrderTab,
  searchQuery = ''
): T[] => {
  const q = searchQuery.trim().toLowerCase();

  return orders
    .filter((order) => {
      const status = String(order.orderStatus || order.status || 'PENDING').toUpperCase();

      if (q) {
        const orderId = String(order.orderId || '').toLowerCase();
        const shortId = orderId ? `#ord-${orderId.substring(0, 5)}` : '';
        const orderNum = String(order.orderNumber || '').toLowerCase();
        const customerName = String(order.customerName || '').toLowerCase();
        if (
          !shortId.includes(q) &&
          !orderId.includes(q) &&
          !orderNum.includes(q) &&
          !customerName.includes(q)
        ) {
          return false;
        }
      }

      if (activeTab === 'All') {
        return true;
      }
      if (activeTab === 'Pending') {
        return (OPEN_ORDER_STATUSES as readonly string[]).includes(status);
      }
      if (activeTab === 'Delivered') {
        return status === 'DELIVERED';
      }
      if (activeTab === 'Cancelled') {
        return status === 'CANCELLED';
      }
      return false;
    })
    .sort((a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime());
};

export const isNonDeletedProduct = (product: {
  isDelete?: boolean | null;
  status?: string | null;
}): boolean => {
  if (product.isDelete === true) return false;
  if (String(product.status || '').trim().toUpperCase() === 'DELETED') return false;
  return true;
};

export const filterAdminProducts = <
  T extends {
    productName?: string;
    farmerName?: string;
    isActive?: boolean | null;
    isDelete?: boolean | null;
    status?: string | null;
  }
>(
  products: T[],
  activeTab: AdminProductTab,
  searchQuery = ''
): T[] => {
  const q = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    if (!isNonDeletedProduct(product)) {
      return false;
    }

    if (activeTab === 'Active' && product.isActive !== true) {
      return false;
    }
    if (activeTab === 'Inactive' && product.isActive !== false) {
      return false;
    }

    if (q) {
      const matchProduct = String(product.productName || '').toLowerCase().includes(q);
      const matchFarmer = String(product.farmerName || '').toLowerCase().includes(q);
      if (!matchProduct && !matchFarmer) {
        return false;
      }
    }

    return true;
  });
};

export interface NormalizedAdminDashboardData {
  totalFarmers: number;
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: string | number;
  recentOrders: any[];
}

export const normalizeDashboardSummary = (raw: any): NormalizedAdminDashboardData => ({
  totalFarmers: Number(raw?.totalFarmers ?? 0) || 0,
  totalCustomers: Number(raw?.totalCustomers ?? 0) || 0,
  totalProducts: Number(raw?.totalProducts ?? 0) || 0,
  totalOrders: Number(raw?.totalOrders ?? 0) || 0,
  pendingOrders: Number(raw?.pendingOrders ?? 0) || 0,
  completedOrders: Number(raw?.completedOrders ?? 0) || 0,
  cancelledOrders: Number(raw?.cancelledOrders ?? 0) || 0,
  totalRevenue: raw?.totalRevenue ?? 0,
  recentOrders: Array.isArray(raw?.recentOrders) ? raw.recentOrders : [],
});
