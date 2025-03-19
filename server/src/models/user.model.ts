import { Schema, model, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { hashPassword, comparePasswords } from '../utils/auth';

// Define subscription plan types
export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PREMIUM';

// Interface for User document
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  password: string | undefined;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  subscriptionId?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  isActive: boolean;
  tokenVersion: number;
  // OAuth fields
  googleId?: string;
  picture?: string;
  provider?: 'local' | 'google';
  lastLoginAt?: Date;
  resetToken?: string;
  resetTokenExpires?: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<IUser>;
  updateSubscription(plan: SubscriptionPlan, subscriptionId: string): Promise<IUser>;
  cancelSubscription(): Promise<IUser>;
  generateResetPasswordToken(): Promise<string>;
  generateEmailVerificationToken(): Promise<string>;
  incrementTokenVersion(): Promise<number>;
}

// Interface for User model static methods
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// Create the schema
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: function(this: IUser) {
      return this.provider === 'local';
    },
    select: false
  },
  subscriptionPlan: {
    type: String,
    enum: ['FREE', 'BASIC', 'PREMIUM'],
    default: 'FREE'
  },
  subscriptionStatus: {
    type: String,
    enum: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
    default: 'EXPIRED'
  },
  subscriptionId: {
    type: String
  },
  subscriptionStartDate: {
    type: Date
  },
  subscriptionEndDate: {
    type: Date
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  picture: {
    type: String
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  lastLoginAt: {
    type: Date
  },
  resetToken: {
    type: String,
    select: false
  },
  resetTokenExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: {
    transform: (_, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Add indexes
// userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password') || !this.password) {
      return next();
    }

    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Add instance methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    // If this is called directly on a user document with password field
    if (this.password) {
      return comparePasswords(candidatePassword, this.password);
    }
    
    // Need to select password explicitly since it's not included by default
    const user = await User.findById(this._id).select('+password');
    if (!user?.password) return false;
    return comparePasswords(candidatePassword, user.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

userSchema.methods.updateLastLogin = async function(): Promise<IUser> {
  this.lastLogin = new Date();
  this.lastLoginAt = new Date();
  return this.save();
};

userSchema.methods.updateSubscription = async function(
  plan: SubscriptionPlan,
  subscriptionId: string
): Promise<IUser> {
  this.subscriptionPlan = plan;
  this.subscriptionId = subscriptionId;
  this.subscriptionStatus = 'ACTIVE';
  this.subscriptionStartDate = new Date();
  this.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  return this.save();
};

userSchema.methods.cancelSubscription = async function(): Promise<IUser> {
  this.subscriptionStatus = 'CANCELLED';
  this.subscriptionEndDate = new Date();
  return this.save();
};

userSchema.methods.generateResetPasswordToken = async function(): Promise<string> {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expire time (1 hour from now)
  this.resetPasswordExpires = new Date(Date.now() + 3600000);

  await this.save();

  // Return unhashed token (will be sent via email)
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = async function(): Promise<string> {
  const token = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
  // Store token in database or cache with expiration
  // For now, just return the token
  return token;
};

// Add method to increment token version (invalidates all existing tokens)
userSchema.methods.incrementTokenVersion = async function(): Promise<number> {
  this.tokenVersion = (this.tokenVersion || 0) + 1;
  await this.save();
  return this.tokenVersion;
};

// Add static methods
userSchema.statics.findByEmail = function(email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Create and export the model
export const User = model<IUser, IUserModel>('User', userSchema); 