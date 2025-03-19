import { Types } from 'mongoose';
import { SUBSCRIPTION_PLANS, generatePaymentParams, generateSignature, LIQPAY_CONFIG } from '../config/liqpay.config';
import axios from 'axios';

export class PaymentService {
  static async createPaymentForm(userId: Types.ObjectId, planType: keyof typeof SUBSCRIPTION_PLANS) {
    try {
      const orderId = `order_${Date.now()}_${userId.toString()}`;
      const params = generatePaymentParams(planType, userId.toString(), orderId);
      const data = Buffer.from(JSON.stringify(params)).toString('base64');
      const signature = generateSignature(params);

      // Generate payment form HTML
      const formHtml = `
        <form method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
          <input type="hidden" name="data" value="${data}" />
          <input type="hidden" name="signature" value="${signature}" />
          <button type="submit">Pay with LiqPay</button>
        </form>
      `;

      return {
        orderId,
        formHtml,
        data,
        signature
      };
    } catch (error) {
      console.error('Error creating payment form:', error);
      throw error;
    }
  }

  static async handlePaymentCallback(data: string, signature: string) {
    try {
      // Verify callback signature
      const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
      const expectedSignature = generateSignature(decodedData);
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid payment callback signature');
      }

      // Handle different payment statuses
      switch (decodedData.status) {
        case 'success':
          await this.handleSuccessfulPayment(decodedData);
          break;
        case 'failure':
          await this.handleFailedPayment(decodedData);
          break;
        case 'subscribed':
          await this.handleSubscriptionCreated(decodedData);
          break;
        case 'unsubscribed':
          await this.handleSubscriptionCancelled(decodedData);
          break;
        default:
          console.log(`Unhandled payment status: ${decodedData.status}`);
      }

      return decodedData;
    } catch (error) {
      console.error('Error handling payment callback:', error);
      throw error;
    }
  }

  private static async handleSuccessfulPayment(paymentData: any) {
    // TODO: Update user's payment status in database
    console.log('Payment successful:', paymentData.order_id);
  }

  private static async handleFailedPayment(paymentData: any) {
    // TODO: Handle failed payment in database
    console.log('Payment failed:', paymentData.order_id);
  }

  private static async handleSubscriptionCreated(paymentData: any) {
    // TODO: Update user's subscription status in database
    console.log('Subscription created:', paymentData.order_id);
  }

  private static async handleSubscriptionCancelled(paymentData: any) {
    // TODO: Update user's subscription status in database
    console.log('Subscription cancelled:', paymentData.order_id);
  }

  static async cancelSubscription(subscriptionId: string) {
    try {
      const params = {
        version: '3',
        action: 'unsubscribe',
        public_key: LIQPAY_CONFIG.publicKey,
        subscription_id: subscriptionId
      };

      const data = Buffer.from(JSON.stringify(params)).toString('base64');
      const signature = generateSignature(params);

      const response = await axios.post('https://www.liqpay.ua/api/request', {
        data,
        signature
      });

      // TODO: Update user's subscription status in database
      console.log(`Subscription ${subscriptionId} cancelled`);
      
      return response.data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
} 