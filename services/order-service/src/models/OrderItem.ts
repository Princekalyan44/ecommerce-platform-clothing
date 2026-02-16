import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import { Order } from './Order';

export interface OrderItemAttributes {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  
  // Variant info
  variantSku?: string;
  size?: string;
  color?: string;
  
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare productName: string;
  declare productImage: string | undefined;
  
  declare variantSku: string | undefined;
  declare size: string | undefined;
  declare color: string | undefined;
  
  declare quantity: number;
  declare unitPrice: number;
  declare subtotal: number;
  declare discount: number;
  declare total: number;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'product_id',
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'product_name',
    },
    productImage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'product_image',
    },
    variantSku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'variant_sku',
    },
    size: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: 'order_items',
    indexes: [
      { fields: ['order_id'] },
      { fields: ['product_id'] },
    ],
  }
);

// Define relationships
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
