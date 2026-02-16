import Joi from 'joi';

export const validateCreateCategory = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000).optional(),
    parentId: Joi.string().optional(),
    image: Joi.string().uri().optional(),
    order: Joi.number().default(0),
  });

  return schema.validate(data);
};

export const validateUpdateCategory = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(1000).optional(),
    parentId: Joi.string().optional(),
    image: Joi.string().uri().optional(),
    order: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
  }).min(1);

  return schema.validate(data);
};
