import { Router } from 'express';
import { validateSignup, validateLogin } from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitAuth } from '../middleware/rate-limit';
import { asyncHandler } from '../utils/async-handler';
import {
  signup,
  login,
  logout,
  googleAuth,
  googleCallback,
  requestPasswordReset,
  resetPassword,
  getCurrentUser
} from '../controllers/auth.controller';

const router = Router();

// Public routes
console.log('Setting up auth routes:');

// Authentication routes
console.log('- POST /signup');
router.post('/signup', rateLimitAuth, validateSignup, asyncHandler(signup));

console.log('- POST /login');
router.post('/login', rateLimitAuth, validateLogin, asyncHandler(login));

console.log('- POST /logout');
router.post('/logout', authMiddleware, asyncHandler(logout));

// OAuth routes
console.log('- GET /google');
router.get('/google', asyncHandler(googleAuth));

console.log('- GET /google/callback');
router.get('/google/callback', asyncHandler(googleCallback));

// Protected routes
console.log('- GET /me');
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

// Password Reset Routes
console.log('- POST /request-password-reset');
router.post('/request-password-reset', rateLimitAuth, asyncHandler(requestPasswordReset));

console.log('- POST /reset-password');
router.post('/reset-password', rateLimitAuth, asyncHandler(resetPassword));

export default router;