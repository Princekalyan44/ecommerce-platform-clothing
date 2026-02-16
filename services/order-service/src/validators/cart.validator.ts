import Joi from 'joi';

export const validateAddToCart = (data: any) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    variantSku: Joi.string().optional(),
    quantity: Joi.number().min(1).max(99).required(),
  });

  return schema.validate(data);
};

export const validateUpdateCartItem = (data: any) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    variantSku: Joi.string().optional(),
    quantity: Joi.number().min(1).max(99).required(),
  });

  return schema.validate(data);
};

export const validateRemoveFromCart = (data: any) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    variantSku: Joi.string().optional(),
  });

  return schema.validate(data);
};
