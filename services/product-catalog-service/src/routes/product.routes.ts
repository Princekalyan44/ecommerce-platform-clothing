import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const productController = new ProductController();

// Public routes
router.get('/search', productController.searchProducts.bind(productController));
router.get('/suggestions', productController.getSearchSuggestions.bind(productController));
router.get('/featured', productController.getFeaturedProducts.bind(productController));
router.get('/category/:categoryId', productController.getProductsByCategory.bind(productController));
router.get('/slug/:slug', productController.getProductBySlug.bind(productController));
router.get('/:id', productController.getProductById.bind(productController));
router.get('/', productController.listProducts.bind(productController));

// Protected routes (require authentication - to be added)
router.post('/', productController.createProduct.bind(productController));
router.put('/:id', productController.updateProduct.bind(productController));
router.delete('/:id', productController.deleteProduct.bind(productController));
router.post('/:id/reviews', productController.addReview.bind(productController));
router.patch('/:id/stock', productController.updateStock.bind(productController));

// Admin routes
router.get('/admin/low-stock', productController.getLowStockProducts.bind(productController));

export { router as productRoutes };
