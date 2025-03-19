import { connectDatabase, disconnectDatabase } from './database';
import { JobApplication } from '../models/job-application.model';
import { User } from '../models/user.model';
import { Types } from 'mongoose';

const testJobApplicationModel = async () => {
  try {
    console.log('Testing JobApplication model...');
    
    // Connect to database
    await connectDatabase();
    
    // First create a test user
    const testUser = new User({
      email: 'test@example.com',
      name: 'Test User',
      subscriptionPlan: 'FREE'
    });
    await testUser.save();
    console.log('✅ Created test user');

    // Create a test job application
    const testApplication = new JobApplication({
      userId: testUser._id,
      position: 'Senior Software Engineer',
      company: 'Tech Corp',
      jobDescription: 'Looking for a senior software engineer with experience in Node.js and TypeScript.',
      status: 'APPLIED',
      salary: {
        min: 100000,
        max: 150000,
        currency: 'USD'
      },
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        remote: true
      }
    });

    // Save the application
    await testApplication.save();
    console.log('✅ Successfully created test job application:', testApplication.toJSON());

    // Test findByUserId static method
    const userApplications = await JobApplication.findByUserId(testUser._id as Types.ObjectId);
    console.log(`✅ Found ${userApplications.length} applications for user`);

    // Test findByStatus static method
    const appliedApplications = await JobApplication.findByStatus('APPLIED');
    console.log(`✅ Found ${appliedApplications.length} applications with status APPLIED`);

    // Test updateStatus instance method
    await testApplication.updateStatus('INTERVIEWING', 'First interview scheduled');
    console.log('✅ Successfully updated application status');

    // Test salary validation
    try {
      const invalidApplication = new JobApplication({
        userId: testUser._id,
        position: 'Invalid Test Position',
        company: 'Test Corp',
        jobDescription: 'Test Description',
        salary: {
          min: 150000,
          max: 100000 // Invalid: min > max
        }
      });
      await invalidApplication.save();
    } catch (error) {
      console.log('✅ Successfully caught invalid salary validation:', 
        error instanceof Error ? error.message : 'Unknown error');
    }

    // Clean up - delete test data
    await JobApplication.deleteMany({ userId: testUser._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Successfully cleaned up test data');

    // Disconnect
    await disconnectDatabase();
    
    console.log('JobApplication model test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('JobApplication model test failed:', error);
    process.exit(1);
  }
};

// Run the test
testJobApplicationModel(); 