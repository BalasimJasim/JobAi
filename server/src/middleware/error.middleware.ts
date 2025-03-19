import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../utils/auth';
import { ZodError } from 'zod';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle different types of errors
  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({
      success: false,
      error: 'Authentication Error',
      message: err.message,
      code: 'AUTH_ERROR'
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      code: err.code
    });
  }

  // Handle Mongoose/MongoDB specific errors
  if (err instanceof MongoError) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate Error',
        message: 'A record with this data already exists',
        code: 'DUPLICATE_ERROR'
      });
    }
  }

  if (err instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid data provided',
      details: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      })),
      code: 'MONGOOSE_VALIDATION_ERROR'
    });
  }

  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is invalid',
      code: 'INVALID_ID'
    });
  }

  // Handle unexpected errors
  const statusCode = err instanceof SyntaxError ? 400 : 500;
  const message = err instanceof SyntaxError ? 'Invalid request syntax' : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: err.name,
    message: process.env.NODE_ENV === 'production' ? message : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    code: 'INTERNAL_ERROR'
  });
}; 