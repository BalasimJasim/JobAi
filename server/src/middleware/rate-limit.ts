import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from '../utils/error-handler';
import { AuthErrorType, handleAuthError } from '../utils/error-handler';

export function rateLimitAuth(req: Request, res: Response, next: NextFunction) {
  const key = `${req.ip}:${req.path}`;

  // Check if the IP is rate limited
  if (RateLimiter.isRateLimited(key)) {
    const remainingTime = RateLimiter.getRemainingTimeInMinutes(key);
    
    return handleAuthError(
      res,
      AuthErrorType.RATE_LIMITED,
      {
        remainingMinutes: remainingTime,
        message: `Too many attempts. Please try again in ${remainingTime} minutes.`
      },
      undefined,
      req.ip
    );
  }

  // Add attempt and get remaining attempts
  RateLimiter.addAttempt(key);
  const remainingAttempts = RateLimiter.getRemainingAttempts(key);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', '5'); // Using fixed value since MAX_ATTEMPTS is private
  res.setHeader('X-RateLimit-Remaining', remainingAttempts.toString());

  next();
} 