import Joi from 'joi';

export const validateUpdateProfile = (data: any) => {
  const schema = Joi.object({
    first_name: Joi.string().min(1).max(50).optional(),
    last_name: Joi.string().min(1).max(50).optional(),
    phone: Joi.string()
      .pattern(/^[+]?[0-9]{10,15}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid phone number format',
      }),
  }).min(1);

  return schema.validate(data);
};

export const validateChangePassword = (data: any) => {
  const schema = Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base':
          'Password must contain uppercase, lowercase, number, and special character',
      }),
  });

  return schema.validate(data);
};
