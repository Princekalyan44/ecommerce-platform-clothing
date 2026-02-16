import Joi from 'joi';

export const validateCreateProduct = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(200).required(),
    description: Joi.string().min(10).max(5000).required(),
    shortDescription: Joi.string().max(500).optional(),
    categoryId: Joi.string().required(),
    brand: Joi.string().max(100).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    basePrice: Joi.number().min(0).required(),
    compareAtPrice: Joi.number().min(0).optional(),
    hasVariants: Joi.boolean().default(false),
    variants: Joi.array().items(
      Joi.object({
        sku: Joi.string().required(),
        size: Joi.string().required(),
        color: Joi.string().required(),
        price: Joi.number().min(0).required(),
        compareAtPrice: Joi.number().min(0).optional(),
        stock: Joi.number().min(0).required(),
        images: Joi.array().items(Joi.string().uri()).optional(),
      })
    ).optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        altText: Joi.string().max(200).optional(),
        isPrimary: Joi.boolean().default(false),
        order: Joi.number().default(0),
      })
    ).optional(),
    totalStock: Joi.number().min(0).required(),
    lowStockThreshold: Joi.number().min(0).default(10),
    trackInventory: Joi.boolean().default(true),
    metaTitle: Joi.string().max(60).optional(),
    metaDescription: Joi.string().max(160).optional(),
    metaKeywords: Joi.array().items(Joi.string()).optional(),
    isFeatured: Joi.boolean().default(false),
  });

  return schema.validate(data);
};

export const validateUpdateProduct = (data: any) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(200).optional(),
    description: Joi.string().min(10).max(5000).optional(),
    shortDescription: Joi.string().max(500).optional(),
    categoryId: Joi.string().optional(),
    brand: Joi.string().max(100).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    basePrice: Joi.number().min(0).optional(),
    compareAtPrice: Joi.number().min(0).optional(),
    variants: Joi.array().items(
      Joi.object({
        sku: Joi.string().required(),
        size: Joi.string().required(),
        color: Joi.string().required(),
        price: Joi.number().min(0).required(),
        compareAtPrice: Joi.number().min(0).optional(),
        stock: Joi.number().min(0).required(),
        images: Joi.array().items(Joi.string().uri()).optional(),
      })
    ).optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        altText: Joi.string().max(200).optional(),
        isPrimary: Joi.boolean().default(false),
        order: Joi.number().default(0),
      })
    ).optional(),
    totalStock: Joi.number().min(0).optional(),
    lowStockThreshold: Joi.number().min(0).optional(),
    trackInventory: Joi.boolean().optional(),
    metaTitle: Joi.string().max(60).optional(),
    metaDescription: Joi.string().max(160).optional(),
    metaKeywords: Joi.array().items(Joi.string()).optional(),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }).min(1);

  return schema.validate(data);
};

export const validateProductReview = (data: any) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    userName: Joi.string().min(1).max(100).required(),
    rating: Joi.number().min(1).max(5).required(),
    title: Joi.string().min(3).max(200).required(),
    comment: Joi.string().min(10).max(2000).required(),
    verifiedPurchase: Joi.boolean().default(false),
  });

  return schema.validate(data);
};

export const validateSearchQuery = (data: any) => {
  const schema = Joi.object({
    query: Joi.string().max(200).optional(),
    categoryId: Joi.string().optional(),
    brand: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    inStock: Joi.boolean().optional(),
    isFeatured: Joi.boolean().optional(),
    sortBy: Joi.string()
      .valid('relevance', 'price_asc', 'price_desc', 'newest', 'popular', 'rating')
      .default('relevance'),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
  });

  return schema.validate(data);
};
