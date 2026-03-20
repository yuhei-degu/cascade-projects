// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body      = await req.text()
  const signature = req.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error("Webhook signature error:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const user_id = session.metadata?.user_id

    if (user_id && session.payment_status === "paid") {
      const db = createServiceClient()
      await db.from("profiles").update({
        is_premium: true,
        purchased_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
      }).eq("id", user_id)

      console.log(`✅ Premium unlocked for user: ${user_id}`)
    }
  }

  return NextResponse.json({ received: true })
}

// StripeのWebhookはraw bodyが必要なのでbodyParserを無効化
export const config = { api: { bodyParser: false } }
