import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { SUBSCRIPTION_PLANS } from '../config/liqpay.config';

export const validateCheckoutRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, planType } = req.body;

  // Validate userId
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
      error: 'INVALID_USER_ID'
    });
  }

  // Validate plan type
  if (!planType || !Object.keys(SUBSCRIPTION_PLANS).includes(planType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subscription plan',
      error: 'INVALID_PLAN_TYPE',
      validPlans: Object.keys(SUBSCRIPTION_PLANS)
    });
  }

  next();
};

export const validateCancelRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.body;

  // Validate userId
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
      error: 'INVALID_USER_ID'
    });
  }

  next();
};

export const validateCallbackData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { data, signature } = req.body;

  // Validate data and signature
  if (!data || !signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing callback data or signature',
      error: 'INVALID_CALLBACK_DATA'
    });
  }

  next();
}; 