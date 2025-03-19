import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

if (!process.env.LIQPAY_PUBLIC_KEY || !process.env.LIQPAY_PRIVATE_KEY) {
  throw new Error('LIQPAY_PUBLIC_KEY or LIQPAY_PRIVATE_KEY is not defined in environment variables');
}

// LiqPay configuration
export const LIQPAY_CONFIG = {
  publicKey: process.env.LIQPAY_PUBLIC_KEY,
  privateKey: process.env.LIQPAY_PRIVATE_KEY
};

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic Plan',
    price: 299, // UAH
    features: [
      'AI Resume Analysis',
      'Basic Cover Letter Generation',
      'Up to 5 Job Applications'
    ]
  },
  PREMIUM: {
    name: 'Premium Plan',
    price: 599, // UAH
    features: [
      'Advanced AI Resume Analysis',
      'Unlimited Cover Letter Generation',
      'Unlimited Job Applications',
      'Priority Support'
    ]
  }
};

export interface PaymentParams {
  public_key: string;
  version: string;
  action: string;
  amount: number;
  currency: string;
  description: string;
  order_id: string;
  result_url?: string;
  server_url?: string;
  subscription?: string;
}

export const generatePaymentParams = (
  planType: keyof typeof SUBSCRIPTION_PLANS,
  userId: string,
  orderId: string
): PaymentParams => {
  const plan = SUBSCRIPTION_PLANS[planType];
  if (!plan) {
    throw new Error('Invalid subscription plan');
  }

  return {
    public_key: LIQPAY_CONFIG.publicKey,
    version: '3',
    action: 'subscribe',
    amount: plan.price,
    currency: 'UAH',
    description: `${plan.name} Subscription - JobAI`,
    order_id: orderId,
    result_url: `${process.env.CLIENT_URL}/dashboard/payment/success`,
    server_url: `${process.env.SERVER_URL}/api/payments/callback`,
    subscription: '1' // Enable subscription mode
  };
};

export const generateSignature = (params: Record<string, any>): string => {
  const data = Buffer.from(JSON.stringify(params)).toString('base64');
  return crypto
    .createHash('sha1')
    .update(LIQPAY_CONFIG.privateKey + data + LIQPAY_CONFIG.privateKey)
    .digest('base64');
}; 