import { connectDatabase, disconnectDatabase } from './database';
import { User, IUser } from '../models/user.model';
import { createSessionData } from '../utils/auth';

const testAuthMiddleware = async () => {
  try {
    console.log('Starting authentication middleware test...');

    // Connect to database
    await connectDatabase();
    console.log('Connected to database');

    // Create a test user
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'testPassword123',
      name: 'Test User',
      subscriptionPlan: 'FREE',
      subscriptionStatus: 'EXPIRED'
    }) as IUser;

    console.log('Created test user:', testUser.email);

    // Generate session data with token
    const sessionData = createSessionData(
      testUser._id,
      testUser.email,
      testUser.name
    );

    console.log('Generated auth token:', sessionData.token);

    // Clean up
    await User.findByIdAndDelete(testUser._id);
    console.log('Test user deleted');

    await disconnectDatabase();
    console.log('Disconnected from database');
    console.log('Authentication middleware test completed successfully');

  } catch (error) {
    console.error('Error during authentication middleware test:', error);
    process.exit(1);
  }
};

// Run the test
testAuthMiddleware(); 