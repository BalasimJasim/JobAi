import { connectDatabase, disconnectDatabase } from './database';
import { User, IUser } from '../models/user.model';
import { PaymentService } from '../services/payment.service';
import { Types } from 'mongoose';

const testSubscription = async () => {
  try {
    console.log('Testing Subscription Flow...');
    
    // Connect to database
    await connectDatabase();
    
    // Create a test user
    const testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      subscriptionPlan: 'FREE',
      isEmailVerified: true,
      isActive: true
    });

    const userId = testUser._id as unknown as Types.ObjectId;
    console.log('✅ Created test user:', testUser.toJSON());

    // Test creating a payment form
    console.log('\nTesting payment form creation...');
    const paymentForm = await PaymentService.createPaymentForm(
      userId,
      'BASIC'
    );
    console.log('✅ Created payment form');
    console.log('Order ID:', paymentForm.orderId);
    console.log('Form HTML length:', paymentForm.formHtml.length);

    // Clean up
    await User.deleteOne({ _id: userId });
    console.log('\n✅ Cleaned up test data');

    await disconnectDatabase();
    console.log('\nSubscription test completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Subscription test failed:', error);
    process.exit(1);
  }
};

// Run the test
testSubscription(); 