import { OrderStatus, PaymentStatus } from '../models/Order';
import { CartItemAttributes } from '../models/Cart';

export interface AddressInput {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface CreateOrderInput {
  userId: string;
  shippingAddress: AddressInput;
  billingAddress?: AddressInput;
  paymentMethod?: string;
  customerNotes?: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  internalNotes?: string;
}

export interface UpdatePaymentStatusInput {
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
}

export interface AddToCartInput {
  productId: string;
  variantSku?: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  productId: string;
  variantSku?: string;
  quantity: number;
}

export interface RemoveFromCartInput {
  productId: string;
  variantSku?: string;
}

export interface OrderSearchQuery {
  userId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ProductServiceProduct {
  _id: string;
  name: string;
  slug: string;
  basePrice: number;
  compareAtPrice?: number;
  totalStock: number;
  images?: Array<{ url: string; isPrimary: boolean }>;
  variants?: Array<{
    sku: string;
    size: string;
    color: string;
    price: number;
    stock: number;
  }>;
}
