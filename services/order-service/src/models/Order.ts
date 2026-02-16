import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface OrderAttributes {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Pricing
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  
  // Shipping Address
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  
  // Billing Address (optional, defaults to shipping)
  billingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  
  // Payment Info
  paymentMethod?: string;
  paymentTransactionId?: string;
  
  // Tracking
  trackingNumber?: string;
  carrier?: string;
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
  
  // Timestamps
  orderDate: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'orderNumber' | 'status' | 'paymentStatus' | 'orderDate' | 'createdAt' | 'updatedAt'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: string;
  declare orderNumber: string;
  declare userId: string;
  declare status: OrderStatus;
  declare paymentStatus: PaymentStatus;
  
  declare subtotal: number;
  declare tax: number;
  declare shippingCost: number;
  declare discount: number;
  declare total: number;
  
  declare shippingAddress: OrderAttributes['shippingAddress'];
  declare billingAddress: OrderAttributes['billingAddress'];
  
  declare paymentMethod: string | undefined;
  declare paymentTransactionId: string | undefined;
  
  declare trackingNumber: string | undefined;
  declare carrier: string | undefined;
  
  declare customerNotes: string | undefined;
  declare internalNotes: string | undefined;
  
  declare orderDate: Date;
  declare paidAt: Date | undefined;
  declare shippedAt: Date | undefined;
  declare deliveredAt: Date | undefined;
  declare cancelledAt: Date | undefined;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(OrderStatus)),
      defaultValue: OrderStatus.PENDING,
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      defaultValue: PaymentStatus.PENDING,
      allowNull: false,
      field: 'payment_status',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      field: 'shipping_cost',
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'shipping_address',
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'billing_address',
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'payment_method',
    },
    paymentTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'payment_transaction_id',
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'tracking_number',
    },
    carrier: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customerNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'customer_notes',
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'internal_notes',
    },
    orderDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      field: 'order_date',
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at',
    },
    shippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'shipped_at',
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'delivered_at',
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['order_number'], unique: true },
      { fields: ['status'] },
      { fields: ['payment_status'] },
      { fields: ['order_date'] },
      { fields: ['created_at'] },
    ],
  }
);
