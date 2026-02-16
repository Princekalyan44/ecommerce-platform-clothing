import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductReview,
  validateSearchQuery,
} from '../validators/product.validator';
import xss from 'xss';

const productService = new ProductService();

export class ProductController {
  /**
   * Create product
   */
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = validateCreateProduct(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      // Sanitize text inputs
      value.name = xss(value.name);
      value.description = xss(value.description);
      if (value.brand) value.brand = xss(value.brand);

      const product = await productService.createProduct(value);

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Update product
   */
  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { error, value } = validateUpdateProduct(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      // Sanitize text inputs
      if (value.name) value.name = xss(value.name);
      if (value.description) value.description = xss(value.description);
      if (value.brand) value.brand = xss(value.brand);

      const product = await productService.updateProduct(id, value);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * List products
   */
  async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = validateSearchQuery(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const result = await productService.listProducts(value);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: {
          page: value.page,
          limit: value.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / value.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await productService.getFeaturedProducts(limit);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const products = await productService.getProductsByCategory(categoryId, limit);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search products
   */
  async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = validateSearchQuery(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      const result = await productService.searchProducts(value);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: {
          page: value.page,
          limit: value.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / value.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query parameter q is required',
        });
        return;
      }

      const suggestions = await productService.getSearchSuggestions(q);

      res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add product review
   */
  async addReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { error, value } = validateProductReview(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      // Sanitize text inputs
      value.userName = xss(value.userName);
      value.title = xss(value.title);
      value.comment = xss(value.comment);

      const product = await productService.addReview(id, value);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      if (error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Update stock
   */
  async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      if (typeof quantity !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Quantity must be a number',
        });
        return;
      }

      await productService.updateStock(id, quantity);

      res.status(200).json({
        success: true,
        message: 'Stock updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await productService.getLowStockProducts();

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }
}
