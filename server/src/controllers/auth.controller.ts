import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { AuthError, generateResetToken, hashResetToken, hashPassword, comparePasswords } from '../utils/auth';
import { sendEmail } from '../utils/email';
import { getGoogleAuthUrl, getGoogleUserInfo } from '../config/google.config';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getPasswordResetEmailTemplate, getEmailVerificationTemplate } from '../utils/emailTemplates';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user
    const user = new User({
      email,
      password, // Password will be hashed by the model's pre-save middleware
      name,
      isEmailVerified: false,
      isActive: true,
      subscriptionPlan: 'FREE',
      subscriptionStatus: 'ACTIVE'
    });

    // Generate verification token
    const verificationToken = await user.generateEmailVerificationToken();

    // Save user
    await user.save();

    // Generate verification link
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    try {
      // Send verification email
      await sendEmail({
        to: email,
        subject: 'Verify your JobAI account',
        html: getEmailVerificationTemplate(verificationLink, name)
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(201).json({
        success: true,
        message: 'Registration successful, but we could not send the verification email. Please contact support.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified
        }
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login time
    await user.updateLastLogin();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
};

export const googleAuth = async (_req: Request, res: Response): Promise<void> => {
  try {
    const url = getGoogleAuthUrl();
    res.json({ 
      success: true,
      url 
    });
  } catch (error) {
    throw new AuthError('Failed to generate Google auth URL', 500);
  }
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new AuthError('Invalid authorization code', 400);
    }

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(code);

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        picture: googleUser.picture,
        provider: 'google',
        isEmailVerified: googleUser.verified_email,
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'ACTIVE'
      });
    } else {
      // Update existing user's Google info
      user.googleId = googleUser.id;
      user.picture = googleUser.picture;
      user.provider = 'google';
      await user.save();
    }

    // Update last login
    await user.updateLastLogin();

    res.json({
      success: true,
      message: 'Logged in successfully with Google',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Google callback error:', error);
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Google authentication failed', 500);
  }
};

export const logout = async (_req: Request, res: Response) => {
    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
      // Don't reveal if user exists
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions shortly.'
    });
  }

    const { token, hashedToken } = generateResetToken();
    
    user.resetToken = hashedToken;
    user.resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    const emailTemplate = getPasswordResetEmailTemplate(resetUrl);

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions shortly.'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    const hashedToken = hashResetToken(token);
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
      message: 'Failed to reset password'
    });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
}; 