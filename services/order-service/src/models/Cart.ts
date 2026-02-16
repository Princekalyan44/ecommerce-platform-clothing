import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

export interface CartItemAttributes {
  productId: string;
  productName: string;
  productImage?: string;
  variantSku?: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CartAttributes {
  id: string;
  userId: string;
  items: CartItemAttributes[];
  subtotal: number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartCreationAttributes extends Optional<CartAttributes, 'id' | 'items' | 'subtotal' | 'createdAt' | 'updatedAt'> {}

export class Cart extends Model<CartAttributes, CartCreationAttributes> implements CartAttributes {
  declare id: string;
  declare userId: string;
  declare items: CartItemAttributes[];
  declare subtotal: number;
  declare expiresAt: Date;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Cart.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    items: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    tableName: 'carts',
    indexes: [
      { fields: ['user_id'], unique: true },
      { fields: ['expires_at'] },
    ],
  }
);
