import { Request, Response, NextFunction } from 'express';
import { verifyNextAuthToken } from '../utils/nextauth';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for both cookie names since it can vary between development and production
    const token = req.cookies['__Secure-next-auth.session-token'] || 
                 req.cookies['next-auth.session-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const session = await verifyNextAuthToken(token);
    if (!session?.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    req.userId = session.user.id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}; 