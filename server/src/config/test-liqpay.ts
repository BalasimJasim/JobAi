import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { PaymentService } from '../services/payment.service';
import { LIQPAY_CONFIG } from './liqpay.config';

dotenv.config();

const testLiqPayIntegration = async () => {
  try {
    console.log('Testing LiqPay Integration...');

    // Test 1: Verify Environment Variables
    console.log('\n1. Testing Environment Variables...');
    if (LIQPAY_CONFIG.publicKey && LIQPAY_CONFIG.privateKey) {
      console.log('✅ LiqPay API keys are configured');
      console.log('Public Key:', LIQPAY_CONFIG.publicKey);
    } else {
      throw new Error('LiqPay API keys are not configured');
    }

    // Test 2: Create a test payment form
    console.log('\n2. Testing payment form creation...');
    const userId = new Types.ObjectId();
    const paymentForm = await PaymentService.createPaymentForm(userId, 'BASIC');
    console.log('✅ Successfully created payment form');
    console.log('Order ID:', paymentForm.orderId);
    console.log('Form HTML length:', paymentForm.formHtml.length);
    console.log('Data:', paymentForm.data);
    console.log('Signature:', paymentForm.signature);

    // Test 3: Test callback signature verification
    console.log('\n3. Testing callback signature verification...');
    const testCallback = await PaymentService.handlePaymentCallback(
      paymentForm.data,
      paymentForm.signature
    );
    console.log('✅ Successfully verified callback signature');
    console.log('Decoded callback data:', testCallback);

    console.log('\nAll LiqPay integration tests completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('LiqPay integration test failed:', error);
    process.exit(1);
  }
};

// Run the test
testLiqPayIntegration(); 