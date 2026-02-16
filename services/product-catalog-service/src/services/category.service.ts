import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryInput, UpdateCategoryInput } from '../types';
import { logger } from '../utils/logger';

const categoryRepository = new CategoryRepository();

export class CategoryService {
  /**
   * Create category
   */
  async createCategory(input: CreateCategoryInput) {
    // Validate parent category exists if provided
    if (input.parentId) {
      const parent = await categoryRepository.findById(input.parentId);
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    const category = await categoryRepository.create(input);
    logger.info('Category created', { categoryId: category._id });

    return category;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id: string, input: UpdateCategoryInput) {
    const category = await categoryRepository.update(id, input);
    if (!category) {
      throw new Error('Category not found');
    }

    logger.info('Category updated', { categoryId: id });
    return category;
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has products
    if (category.productCount > 0) {
      throw new Error('Cannot delete category with products');
    }

    // Check if category has subcategories
    const subcategories = await categoryRepository.getSubcategories(id);
    if (subcategories.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    await categoryRepository.delete(id);
    logger.info('Category deleted', { categoryId: id });
  }

  /**
   * List all categories
   */
  async listAllCategories() {
    return await categoryRepository.listAll();
  }

  /**
   * Get top-level categories
   */
  async getTopLevelCategories() {
    return await categoryRepository.getTopLevel();
  }

  /**
   * Get subcategories
   */
  async getSubcategories(parentId: string) {
    return await categoryRepository.getSubcategories(parentId);
  }
}
