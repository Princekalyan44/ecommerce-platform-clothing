import Joi from 'joi';

export const validateRegister = (data: any) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
      }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base':
          'Password must contain uppercase, lowercase, number, and special character',
        'any.required': 'Password is required',
      }),
    first_name: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'any.required': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters',
      }),
    last_name: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'any.required': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters',
      }),
  });

  return schema.validate(data);
};

export const validateLogin = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};
