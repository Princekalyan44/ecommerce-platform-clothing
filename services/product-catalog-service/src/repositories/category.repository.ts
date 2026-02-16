import { Category } from '../models/Category.model';
import { ICategory, CreateCategoryInput, UpdateCategoryInput } from '../types';
import { generateSlug } from '../utils/slugify';

export class CategoryRepository {
  /**
   * Create a new category
   */
  async create(input: CreateCategoryInput): Promise<ICategory> {
    const slug = generateSlug(input.name);

    const category = new Category({
      ...input,
      slug,
      isActive: true,
      productCount: 0,
    });

    return await category.save();
  }

  /**
   * Find category by ID
   */
  async findById(id: string): Promise<ICategory | null> {
    return await Category.findById(id);
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<ICategory | null> {
    return await Category.findOne({ slug, isActive: true });
  }

  /**
   * Update category
   */
  async update(id: string, input: UpdateCategoryInput): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  }

  /**
   * Delete category
   */
  async delete(id: string): Promise<void> {
    await Category.findByIdAndUpdate(id, { isActive: false });
  }

  /**
   * List all categories
   */
  async listAll(): Promise<ICategory[]> {
    return await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
  }

  /**
   * Get top-level categories
   */
  async getTopLevel(): Promise<ICategory[]> {
    return await Category.find({ isActive: true, parentId: { $exists: false } }).sort({
      order: 1,
      name: 1,
    });
  }

  /**
   * Get subcategories
   */
  async getSubcategories(parentId: string): Promise<ICategory[]> {
    return await Category.find({ isActive: true, parentId }).sort({ order: 1, name: 1 });
  }

  /**
   * Increment product count
   */
  async incrementProductCount(id: string): Promise<void> {
    await Category.findByIdAndUpdate(id, { $inc: { productCount: 1 } });
  }

  /**
   * Decrement product count
   */
  async decrementProductCount(id: string): Promise<void> {
    await Category.findByIdAndUpdate(id, { $inc: { productCount: -1 } });
  }
}
