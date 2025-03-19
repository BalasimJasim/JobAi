import { Response, NextFunction } from 'express';
import { GenerateCoverLetterRequest } from '../types/cover-letter.types';
import { AuthenticatedRequest } from './auth.middleware';

export const validateCoverLetterRequest = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const body = req.body as Partial<GenerateCoverLetterRequest>;

  // Check if job description exists and is not empty
  if (!body.jobDescription || body.jobDescription.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Job description is required',
      error: 'MISSING_JOB_DESCRIPTION'
    });
  }

  // Validate job description length
  if (body.jobDescription.length < 50) {
    return res.status(400).json({
      success: false,
      message: 'Job description must be at least 50 characters long',
      error: 'INVALID_JOB_DESCRIPTION_LENGTH'
    });
  }

  // Validate key points if provided
  if (body.keyPoints) {
    if (!Array.isArray(body.keyPoints)) {
      return res.status(400).json({
        success: false,
        message: 'Key points must be an array',
        error: 'INVALID_KEY_POINTS_FORMAT'
      });
    }

    if (body.keyPoints.some(point => typeof point !== 'string')) {
      return res.status(400).json({
        success: false,
        message: 'All key points must be strings',
        error: 'INVALID_KEY_POINTS_TYPE'
      });
    }
  }

  // If all validations pass, proceed to next middleware
  next();
}; 