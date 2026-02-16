import Joi from 'joi';
import { OrderStatus, PaymentStatus } from '../models/Order';

const addressSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  addressLine1: Joi.string().min(5).max(200).required(),
  addressLine2: Joi.string().max(200).optional(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  postalCode: Joi.string().min(3).max(20).required(),
  country: Joi.string().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .required(),
});

export const validateCreateOrder = (data: any) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    shippingAddress: addressSchema.required(),
    billingAddress: addressSchema.optional(),
    paymentMethod: Joi.string().max(50).optional(),
    customerNotes: Joi.string().max(500).optional(),
  });

  return schema.validate(data);
};

export const validateUpdateOrderStatus = (data: any) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .required(),
    trackingNumber: Joi.string().max(100).optional(),
    carrier: Joi.string().max(100).optional(),
    internalNotes: Joi.string().max(1000).optional(),
  });

  return schema.validate(data);
};

export const validateUpdatePaymentStatus = (data: any) => {
  const schema = Joi.object({
    paymentStatus: Joi.string()
      .valid(...Object.values(PaymentStatus))
      .required(),
    paymentTransactionId: Joi.string().max(255).optional(),
  });

  return schema.validate(data);
};

export const validateOrderSearch = (data: any) => {
  const schema = Joi.object({
    userId: Joi.string().optional(),
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .optional(),
    paymentStatus: Joi.string()
      .valid(...Object.values(PaymentStatus))
      .optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
  });

  return schema.validate(data);
};
