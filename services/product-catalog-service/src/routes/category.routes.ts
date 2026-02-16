import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get('/top-level', categoryController.getTopLevelCategories.bind(categoryController));
router.get('/slug/:slug', categoryController.getCategoryBySlug.bind(categoryController));
router.get('/:id/subcategories', categoryController.getSubcategories.bind(categoryController));
router.get('/:id', categoryController.getCategoryById.bind(categoryController));
router.get('/', categoryController.listAllCategories.bind(categoryController));

// Protected routes (require admin authentication - to be added)
router.post('/', categoryController.createCategory.bind(categoryController));
router.put('/:id', categoryController.updateCategory.bind(categoryController));
router.delete('/:id', categoryController.deleteCategory.bind(categoryController));

export { router as categoryRoutes };
