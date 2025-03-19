import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { ApplicationStatus } from '../types/application.types';

const VALID_STATUSES: ApplicationStatus[] = [
  'DRAFT',
  'APPLIED',
  'INTERVIEWING',
  'OFFERED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN'
];

export const validateCreateApplication = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { position, company, jobDescription } = req.body;

  if (!position || position.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Position is required',
      error: 'MISSING_POSITION'
    });
  }

  if (!company || company.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Company name is required',
      error: 'MISSING_COMPANY'
    });
  }

  if (!jobDescription || jobDescription.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Job description is required',
      error: 'MISSING_JOB_DESCRIPTION'
    });
  }

  // Optional fields validation
  if (req.body.salary) {
    const { min, max } = req.body.salary;
    if (min && max && min > max) {
      return res.status(400).json({
        success: false,
        message: 'Minimum salary cannot be greater than maximum salary',
        error: 'INVALID_SALARY_RANGE'
      });
    }
  }

  next();
};

export const validateUpdateStatus = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { status } = req.body;
  const validStatuses: ApplicationStatus[] = [
    'DRAFT',
    'APPLIED',
    'INTERVIEWING',
    'OFFERED',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN'
  ];

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required',
      error: 'MISSING_STATUS'
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value',
      error: 'INVALID_STATUS',
      validStatuses
    });
  }

  next();
}; 