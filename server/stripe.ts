import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
});

export async function createCheckoutSession({
  email,
  priceId,
  successUrl,
  cancelUrl,
  customerName,
}: {
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerName?: string;
}) {
  return await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      customerName: customerName || "",
    },
  });
}

export const createCustomer = async (email: string, paymentMethodId: string) => {
  try {
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};