import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models/user.model';
import { generateToken } from '../src/utils/jwt';
import { sendEmail } from '../src/utils/email';
import { Types } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testPasswordReset = async () => {
  try {
    console.log('Starting password reset flow test...');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');
    
    const testEmail = process.env.EMAIL_USER || 'balasimboliewi@gmail.com';
    
    // Clean up any existing test user first
    await User.deleteOne({ email: testEmail });
    
    // Create a test user
    const testUser = await User.create({
      email: testEmail,
      name: 'Test User',
      password: 'testpassword123',
      subscriptionPlan: 'FREE',
      isEmailVerified: true,
      isActive: true
    });

    console.log(`✅ Created test user: ${testUser.email}`);

    // Generate reset token
    const resetToken = generateToken(
      { userId: testUser._id },
      '1h'
    );
    console.log('✅ Generated reset token');

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('Reset URL:', resetUrl);

    try {
      // Send test email
      await sendEmail({
        to: testUser.email,
        subject: 'Password Reset Test',
        text: `This is a test email for password reset. Reset URL: ${resetUrl}`,
        html: `<p>This is a test email for password reset.</p><p>Reset URL: <a href="${resetUrl}">${resetUrl}</a></p>`
      });
      console.log('✅ Successfully sent test email');
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }

    // Verify token
    const decoded = await generateToken({ userId: testUser._id }, '1h');
    console.log('✅ Token verification successful:', decoded);

    // Clean up
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Cleaned up test user');

    await disconnectDatabase();
    console.log('✅ Disconnected from database');
    console.log('Test completed successfully');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

// Run the test
testPasswordReset(); 