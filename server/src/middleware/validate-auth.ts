import { Request, Response, NextFunction } from 'express';

interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ResetPasswordRequest {
  email?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const validateSignupRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body = req.body as Partial<SignupRequest>;

  if (!body.email || !body.email.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
      error: 'MISSING_EMAIL'
    });
  }

  if (!body.password || body.password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long',
      error: 'INVALID_PASSWORD'
    });
  }

  if (!body.name || !body.name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Name is required',
      error: 'MISSING_NAME'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      error: 'INVALID_EMAIL'
    });
  }

  next();
};

export const validateLoginRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body = req.body as Partial<LoginRequest>;

  if (!body.email || !body.email.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
      error: 'MISSING_EMAIL'
    });
  }

  if (!body.password || !body.password.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      error: 'MISSING_PASSWORD'
    });
  }

  next();
};

export const validateResetPasswordRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body = req.body as Partial<ResetPasswordRequest>;

  // For initial reset request
  if (req.path === '/reset-password') {
    if (!body.email || !body.email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        error: 'MISSING_EMAIL'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      });
    }
  }

  // For password reset confirmation
  if (req.path.includes('/reset-password/')) {
    if (!body.newPassword || body.newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
        error: 'INVALID_NEW_PASSWORD'
      });
    }

    if (!body.confirmPassword || body.confirmPassword !== body.newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
        error: 'PASSWORD_MISMATCH'
      });
    }
  }

  next();
}; 