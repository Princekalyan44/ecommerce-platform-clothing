import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const orderController = new OrderController();

// Order routes
router.post('/', (req, res, next) => orderController.createOrder(req, res, next));
router.get('/search', (req, res, next) => orderController.searchOrders(req, res, next));
router.get('/stats', (req, res, next) => orderController.getOrderStats(req, res, next));
router.get('/recent', (req, res, next) => orderController.getRecentOrders(req, res, next));
router.get('/user/:userId', (req, res, next) => orderController.getUserOrders(req, res, next));
router.get('/:id', (req, res, next) => orderController.getOrderById(req, res, next));
router.get('/number/:orderNumber', (req, res, next) => orderController.getOrderByNumber(req, res, next));
router.patch('/:id/status', (req, res, next) => orderController.updateOrderStatus(req, res, next));
router.patch('/:id/payment', (req, res, next) => orderController.updatePaymentStatus(req, res, next));
router.post('/:id/cancel', (req, res, next) => orderController.cancelOrder(req, res, next));

export const orderRoutes = router;
