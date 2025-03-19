import { Router } from 'express';
import { Types } from 'mongoose';
import { PaymentService } from '../services/payment.service';
import { User } from '../models/user.model';
import { SUBSCRIPTION_PLANS } from '../config/liqpay.config';
import { validateCheckoutRequest, validateCancelRequest, validateCallbackData } from '../middleware/validate-subscription';

const router = Router();

// Get available subscription plans
router.get('/plans', (req, res) => {
  res.json(SUBSCRIPTION_PLANS);
});

// Create a checkout session for subscription
router.post('/checkout', validateCheckoutRequest, async (req, res) => {
  try {
    const { userId, planType } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const paymentForm = await PaymentService.createPaymentForm(
      new Types.ObjectId(userId),
      planType
    );

    res.json(paymentForm);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Handle LiqPay payment callback
router.post('/callback', validateCallbackData, async (req, res) => {
  try {
    const { data, signature } = req.body;
    const callbackData = await PaymentService.handlePaymentCallback(data, signature);
    
    // Update user subscription based on callback data
    const userId = callbackData.order_id.split('_')[2];
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (callbackData.status === 'success' || callbackData.status === 'subscribed') {
      await user.updateSubscription(
        callbackData.description.includes('Premium') ? 'PREMIUM' : 'BASIC',
        callbackData.payment_id
      );
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error handling payment callback:', error);
    res.status(500).json({ error: 'Failed to process payment callback' });
  }
});

// Cancel subscription
router.post('/cancel', validateCancelRequest, async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscriptionId) {
      await PaymentService.cancelSubscription(user.subscriptionId);
      await user.cancelSubscription();
    }

    res.json({ status: 'success', message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get user's current subscription
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      plan: user.subscriptionPlan,
      status: user.subscriptionStatus,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription details' });
  }
});

export default router; 