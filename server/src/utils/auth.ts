import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Constants
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 */
export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a random reset token
 */
export const generateResetToken = (): { token: string; hashedToken: string } => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashResetToken(token);
  return { token, hashedToken };
};

/**
 * Hash a reset token for verification
 */
export const hashResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
}; 