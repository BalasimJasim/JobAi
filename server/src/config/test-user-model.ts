import { connectDatabase, disconnectDatabase } from './database';
import { User } from '../models/user.model';

const testUserModel = async () => {
  try {
    console.log('Testing User model...');
    
    // Connect to database
    await connectDatabase();
    
    // Create a test user
    const testUser = new User({
      email: 'test@example.com',
      name: 'Test User',
      subscriptionPlan: 'FREE'
    });

    // Save the user
    await testUser.save();
    console.log('✅ Successfully created test user:', testUser.toJSON());

    // Test findByEmail static method
    const foundUser = await User.findByEmail('test@example.com');
    console.log('✅ Successfully found user by email:', foundUser?.toJSON());

    // Test updateLastLogin instance method
    if (foundUser) {
      await foundUser.updateLastLogin();
      console.log('✅ Successfully updated last login time');
    }

    // Clean up - delete test user
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Successfully cleaned up test data');

    // Disconnect
    await disconnectDatabase();
    
    console.log('User model test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('User model test failed:', error);
    process.exit(1);
  }
};

// Run the test
testUserModel(); 