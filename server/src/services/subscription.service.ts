import { stripe, SUBSCRIPTION_PLANS, createStripeCustomer } from '../config/stripe.config';
import { Types } from 'mongoose';

export class SubscriptionService {
  static async createCheckoutSession(userId: Types.ObjectId, planType: keyof typeof SUBSCRIPTION_PLANS) {
    try {
      const plan = SUBSCRIPTION_PLANS[planType];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Create or retrieve price from Stripe
      const price = await stripe.prices.create({
        unit_amount: Math.round(plan.price * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        product_data: {
          name: plan.name,
          metadata: {
            features: plan.features.join(', ')
          }
        },
      });

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/pricing`,
        metadata: {
          userId: userId.toString(),
          planType
        }
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  static async handleSubscriptionChange(subscriptionId: string, status: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // TODO: Update user's subscription status in database
      console.log(`Subscription ${subscriptionId} status changed to ${status}`);
      
      return subscription;
    } catch (error) {
      console.error('Error handling subscription change:', error);
      throw error;
    }
  }

  static async cancelSubscription(subscriptionId: string) {
    try {
      const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      
      // TODO: Update user's subscription status in database
      console.log(`Subscription ${subscriptionId} cancelled`);
      
      return canceledSubscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
} 