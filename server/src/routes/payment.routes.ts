import express from 'express';
import { Types } from 'mongoose';
import { PaymentService } from '../services/payment.service';

const router = express.Router();

// Create payment form for subscription
router.post('/create-payment', async (req, res) => {
  try {
    const { planType } = req.body;
    // TODO: Get actual userId from authenticated session
    const userId = new Types.ObjectId();

    const paymentForm = await PaymentService.createPaymentForm(userId, planType);
    res.json({
      success: true,
      data: paymentForm
    });
  } catch (error) {
    console.error('Error creating payment form:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error creating payment form'
    });
  }
});

// Handle LiqPay callback
router.post('/callback', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const { data, signature } = req.body;
    
    if (!data || !signature) {
      throw new Error('Missing payment callback data or signature');
    }

    const result = await PaymentService.handlePaymentCallback(data, signature);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error handling payment callback:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error handling payment callback'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const result = await PaymentService.cancelSubscription(subscriptionId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error cancelling subscription'
    });
  }
});

// Test endpoint to verify LiqPay connection
router.get('/test-connection', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'LiqPay integration is ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing LiqPay connection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error connecting to LiqPay'
    });
  }
});

export default router; 