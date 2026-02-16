import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8002', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/product_catalog?authSource=admin',
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
  },

  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX || 'products',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || 'password123',
    db: parseInt(process.env.REDIS_DB || '1', 10),
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3: {
      bucket: process.env.S3_BUCKET_NAME || 'ecommerce-product-images',
      uploadPath: process.env.S3_UPLOAD_PATH || 'products',
    },
  },

  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    popularProductsTtl: parseInt(process.env.POPULAR_PRODUCTS_CACHE_TTL || '300', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  },

  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'],
    maxImagesPerProduct: parseInt(process.env.MAX_IMAGES_PER_PRODUCT || '10', 10),
  },

  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },
};
