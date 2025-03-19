import { Response } from 'express';
import { Types } from 'mongoose';

export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  RATE_LIMITED = 'RATE_LIMITED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

interface ErrorLog {
  timestamp: Date;
  userId?: Types.ObjectId;
  ip: string;
  errorType: AuthErrorType;
  details: any;
}

const errorMessages = {
  [AuthErrorType.INVALID_CREDENTIALS]: {
    message: 'Invalid email or password',
    statusCode: 401
  },
  [AuthErrorType.ACCOUNT_LOCKED]: {
    message: 'Account has been locked due to too many failed attempts',
    statusCode: 423
  },
  [AuthErrorType.RATE_LIMITED]: {
    message: 'Too many attempts. Please try again later',
    statusCode: 429
  },
  [AuthErrorType.TOKEN_EXPIRED]: {
    message: 'Authentication token has expired',
    statusCode: 401
  },
  [AuthErrorType.INVALID_TOKEN]: {
    message: 'Invalid authentication token',
    statusCode: 401
  },
  [AuthErrorType.UNAUTHORIZED]: {
    message: 'Unauthorized access',
    statusCode: 401
  },
  [AuthErrorType.FORBIDDEN]: {
    message: 'Access forbidden',
    statusCode: 403
  },
  [AuthErrorType.VALIDATION_ERROR]: {
    message: 'Validation error',
    statusCode: 400
  },
  [AuthErrorType.SERVER_ERROR]: {
    message: 'Internal server error',
    statusCode: 500
  }
};

class AuthErrorLogger {
  private static errorLogs: ErrorLog[] = [];

  static log(log: ErrorLog): void {
    this.errorLogs.push(log);
    console.error(`[Auth Error] ${log.timestamp.toISOString()} - Type: ${log.errorType}`, {
      userId: log.userId?.toString() || 'anonymous',
      ip: log.ip,
      details: log.details
    });
  }

  static getRecentLogs(minutes: number = 60): ErrorLog[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorLogs.filter(log => log.timestamp > cutoff);
  }

  static clearOldLogs(hours: number = 24): void {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    this.errorLogs = this.errorLogs.filter(log => log.timestamp > cutoff);
  }
}

export function handleAuthError(
  res: Response,
  errorType: AuthErrorType,
  details?: any,
  userId?: Types.ObjectId,
  ip: string = 'unknown'
): void {
  const { message, statusCode } = errorMessages[errorType];

  // Log the error
  AuthErrorLogger.log({
    timestamp: new Date(),
    userId,
    ip,
    errorType,
    details
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      type: errorType,
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined
    }
  });
}

// Rate limiting implementation
interface RateLimitEntry {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
}

class RateLimiter {
  private static attempts: Map<string, RateLimitEntry> = new Map();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  static isRateLimited(key: string): boolean {
    const entry = this.attempts.get(key);
    if (!entry) return false;

    const now = new Date();
    const windowExpired = now.getTime() - entry.firstAttempt.getTime() > this.WINDOW_MS;

    if (windowExpired) {
      this.attempts.delete(key);
      return false;
    }

    return entry.count >= this.MAX_ATTEMPTS;
  }

  static addAttempt(key: string): void {
    const now = new Date();
    const entry = this.attempts.get(key);

    if (!entry) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return;
    }

    const windowExpired = now.getTime() - entry.firstAttempt.getTime() > this.WINDOW_MS;

    if (windowExpired) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    } else {
      entry.count++;
      entry.lastAttempt = now;
    }
  }

  static getRemainingAttempts(key: string): number {
    const entry = this.attempts.get(key);
    if (!entry) return this.MAX_ATTEMPTS;

    const now = new Date();
    const windowExpired = now.getTime() - entry.firstAttempt.getTime() > this.WINDOW_MS;

    if (windowExpired) {
      this.attempts.delete(key);
      return this.MAX_ATTEMPTS;
    }

    return Math.max(0, this.MAX_ATTEMPTS - entry.count);
  }

  static getRemainingTimeInMinutes(key: string): number {
    const entry = this.attempts.get(key);
    if (!entry) return 0;

    const now = new Date();
    const windowExpired = now.getTime() - entry.firstAttempt.getTime() > this.WINDOW_MS;

    if (windowExpired) {
      this.attempts.delete(key);
      return 0;
    }

    const remainingMs = this.WINDOW_MS - (now.getTime() - entry.firstAttempt.getTime());
    return Math.ceil(remainingMs / (60 * 1000)); // Convert to minutes and round up
  }

  static clearAttempts(key: string): void {
    this.attempts.delete(key);
  }
}

export { AuthErrorLogger, RateLimiter }; 