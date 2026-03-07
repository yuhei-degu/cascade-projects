/**
 * Stripe 決済サービス
 */
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-09-30.acacia",
});

/** Stripe Checkout セッション生成 */
export async function createCheckoutSession(params: {
  requestId: string;
  title: string;
  amount: number; // 円
  successUrl: string;
  cancelUrl: string;
  paymentToken: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          unit_amount: params.amount,
          product_data: { name: `【RequestForge】${params.title}` },
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      requestId: params.requestId,
      paymentToken: params.paymentToken,
    },
  });

  return session.url ?? "";
}

/** Webhook 署名検証 */
export function constructWebhookEvent(
  payload: string | Buffer,
  sig: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  return stripe.webhooks.constructEvent(payload, sig, secret);
}
