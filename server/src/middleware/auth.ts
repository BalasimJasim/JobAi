import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== DEBUG: requireAuth middleware ===');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request cookies:', req.cookies);
    console.log('User ID from request:', req.userId);
    
    if (!req.userId) {
      console.log('ERROR: Authentication required - no userId in request');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('Authentication successful for user:', req.userId);
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({ error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}; 