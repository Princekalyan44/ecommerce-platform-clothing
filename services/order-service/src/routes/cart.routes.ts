import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';

const router = Router();
const cartController = new CartController();

// Cart routes
router.get('/:userId', (req, res, next) => cartController.getCart(req, res, next));
router.post('/:userId/items', (req, res, next) => cartController.addItem(req, res, next));
router.put('/:userId/items', (req, res, next) => cartController.updateItem(req, res, next));
router.delete('/:userId/items', (req, res, next) => cartController.removeItem(req, res, next));
router.delete('/:userId', (req, res, next) => cartController.clearCart(req, res, next));
router.get('/:userId/validate', (req, res, next) => cartController.validateCart(req, res, next));

export const cartRoutes = router;
