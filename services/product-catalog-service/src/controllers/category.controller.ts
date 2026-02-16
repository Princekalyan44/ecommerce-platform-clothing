import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { validateCreateCategory, validateUpdateCategory } from '../validators/category.validator';
import xss from 'xss';

const categoryService = new CategoryService();

export class CategoryController {
  /**
   * Create category
   */
  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { error, value } = validateCreateCategory(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      value.name = xss(value.name);
      if (value.description) value.description = xss(value.description);

      const category = await categoryService.createCategory(value);

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      if (error.message === 'Parent category not found') {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      if (error.message === 'Category not found') {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const category = await categoryService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      if (error.message === 'Category not found') {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Update category
   */
  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { error, value } = validateUpdateCategory(req.body);

      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
        return;
      }

      if (value.name) value.name = xss(value.name);
      if (value.description) value.description = xss(value.description);

      const category = await categoryService.updateCategory(id, value);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      if (error.message === 'Category not found') {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Category not found') {
        res.status(404).json({
          success: false,
          error: 'Category not found',
        });
        return;
      }
      if (error.message.includes('Cannot delete category')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * List all categories
   */
  async listAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.listAllCategories();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top-level categories
   */
  async getTopLevelCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.getTopLevelCategories();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get subcategories
   */
  async getSubcategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const categories = await categoryService.getSubcategories(id);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}
