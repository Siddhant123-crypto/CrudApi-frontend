export interface User {
  userId?: string;
  name: string;
  email: string;
  role: 'USER' | 'FARMER' | 'ADMIN';
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
  productVideo?: string;
  isActive?: boolean;
  status?: string;
  averageRating?: number;
  reviewCount?: number;
  harvestDate?: string;
}
export interface ReviewMedia {
  mediaId: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  createdAt: string;
}
export interface Review {
  reviewId: string;
  productId: string;
  orderId: string;
  productName: string;
  customerDisplayName: string;
  rating: number;
  reviewText?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt?: string;
  media?: ReviewMedia[];
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
export interface ProductRatingResponse {
  productId: string;
  productName: string;
  averageRating: number;
  reviewCount: number;
}
export interface CartItemResponse {
  cartItemId: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
}
export interface CartResponse {
  cartId: string;
  totalAmount: number;
  totalItems: number;
  items: CartItemResponse[];
  createdAt: string;
  updatedAt: string;
}
export interface WishlistResponse {
  wishlistId: string;
  productId: string;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  description?: string;
  productPhoto?: string;
  productVideo?: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
}
export interface WishlistCheckResponse {
  inWishlist: boolean;
  wishlistId?: string;
}

export interface NotificationResponse {
  notificationId: string;
  userId: string;
  senderId?: string;
  senderName?: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  title?: string;
  senderType?: string;
}

export interface NotificationSendRequest {
  targetUserId?: string;
  message: string;
  type?: string;
  receiverType?: string;
  receiverId?: string;
  title?: string;
  notificationType?: NotificationType;
}

export type NotificationType = 'ORDER' | 'SYSTEM' | 'MESSAGE' | 'ALERT' | 'PRODUCT' | 'FARMER' | 'CUSTOMER' | 'ADMIN';
