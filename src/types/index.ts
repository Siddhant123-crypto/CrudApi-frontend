export interface User {
  userId?: string;
  name: string;
  email: string;
  role: 'USER' | 'FARMER';
  farmerId?: string;
  profilePhoto?: string;
}

export interface Farmer {
  farmerId: string;
  name: string;
  village?: string;
  address?: string;
  postalCode?: string;
  mobile: string;
  email: string;
  state?: string;
  profilePhoto?: string;
  status?: string;
  isActive?: boolean;
}

export interface Product {
  productId: string;
  farmerId: string;
  farmerName?: string;
  farmerAddress?: string;
  farmerState?: string;
  farmerVillage?: string;
  productName: string;
  category: string;
  price: number;
  unit: string;
  description?: string;
  productPhoto?: string;
  isActive?: boolean;
  status?: string;
}

export interface LoginResponse {
  message: string;
  response: User;
}

export interface RegisterResponse {
  message: string;
  response: any;
}

export interface ApiResponse<T> {
  message: string;
  response: T;
}
