/**
 * Stripe 決済サービス — ai-dev-market
 */
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-09-30.acacia",
});

/** Stripe Checkout セッション生成 */
export async function createCheckoutSession(params: {
  requestId: string; title: string; amount: number;
  successUrl: string; cancelUrl: string; token: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "jpy", unit_amount: params.amount,
        product_data: { name: `【AI Dev Market】${params.title}` },
      }, quantity: 1,
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { requestId: params.requestId, token: params.token },
  });
  return session.url ?? "";
}

/** Webhook 署名検証 */
export function constructWebhookEvent(payload: string | Buffer, sig: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload, sig, process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );
}
