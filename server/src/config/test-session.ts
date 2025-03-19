import { connectDatabase, disconnectDatabase } from './database';
import { User } from '../models/user.model';
import { SessionManager } from '../utils/session';
import { Types } from 'mongoose';

const testSession = async () => {
  try {
    console.log('Testing Session Management...');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database');

    // Create test user
    const testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'testpassword123',
      provider: 'local',
      subscriptionPlan: 'FREE',
      isEmailVerified: true,
      isActive: true
    });

    console.log('✅ Created test user');

    // Test token generation
    console.log('\nTesting token generation...');
    const tokens = SessionManager.generateTokens(
      testUser._id,
      testUser.email,
      testUser.tokenVersion
    );
    console.log('✅ Generated tokens:', {
      accessTokenLength: tokens.accessToken.length,
      refreshTokenLength: tokens.refreshToken.length,
      csrfTokenLength: tokens.csrfToken.length
    });

    // Test token verification
    console.log('\nTesting token verification...');
    const decodedAccess = SessionManager.verifyToken(tokens.accessToken, 'access');
    console.log('✅ Access token verified:', {
      userId: decodedAccess.userId,
      email: decodedAccess.email,
      type: decodedAccess.type
    });

    const decodedRefresh = SessionManager.verifyToken(tokens.refreshToken, 'refresh');
    console.log('✅ Refresh token verified:', {
      userId: decodedRefresh.userId,
      email: decodedRefresh.email,
      type: decodedRefresh.type
    });

    // Test token versioning
    console.log('\nTesting token versioning...');
    const newVersion = await testUser.incrementTokenVersion();
    console.log('✅ Token version incremented:', newVersion);

    // Test CSRF validation
    console.log('\nTesting CSRF validation...');
    const validCsrf = SessionManager.validateCsrfToken(tokens.csrfToken, tokens.csrfToken);
    console.log('✅ CSRF validation result:', validCsrf);

    // Clean up
    await User.deleteOne({ _id: testUser._id });
    console.log('\n✅ Cleaned up test data');

    await disconnectDatabase();
    console.log('✅ Disconnected from database');

    console.log('\nAll session management tests completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Session management test failed:', error);
    process.exit(1);
  }
};

// Run the test
testSession(); 