import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, authorize } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

// Get current user profile
router.get('/me', authenticateToken, userController.getProfile.bind(userController));

// Update current user profile
router.put('/me', authenticateToken, userController.updateProfile.bind(userController));

// Delete current user account
router.delete('/me', authenticateToken, userController.deleteAccount.bind(userController));

// Change password
router.post('/me/change-password', authenticateToken, userController.changePassword.bind(userController));

// Get user by ID (admin only)
router.get('/:id', authenticateToken, authorize('admin'), userController.getUserById.bind(userController));

// List all users (admin only)
router.get('/', authenticateToken, authorize('admin'), userController.listUsers.bind(userController));

export { router as userRoutes };
