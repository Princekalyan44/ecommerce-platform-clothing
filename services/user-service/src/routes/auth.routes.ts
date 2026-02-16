import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { rateLimiterMiddleware } from '../middleware/rate-limiter.middleware';
import passport from 'passport';
import '../config/passport';

const router = Router();
const authController = new AuthController();

// Rate limit for auth endpoints (stricter)
const authRateLimit = rateLimiterMiddleware(5, 3600000); // 5 requests per hour

// Register
router.post('/register', authRateLimit, authController.register.bind(authController));

// Login
router.post('/login', authRateLimit, authController.login.bind(authController));

// Refresh token
router.post('/refresh', authController.refresh.bind(authController));

// Logout
router.post('/logout', authController.logout.bind(authController));

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  authController.googleCallback.bind(authController)
);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  authController.facebookCallback.bind(authController)
);

export { router as authRoutes };
