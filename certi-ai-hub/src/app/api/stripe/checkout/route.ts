// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" })

export async function POST(req: NextRequest) {
  try {
    const db   = createServiceClient()
    const body = await req.json()
    const { user_id, email } = body

    if (!user_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Stripe Customer 作成 or 取得
    const { data: profile } = await db
      .from("profiles").select("stripe_customer_id, is_premium").eq("id", user_id).single()

    if (profile?.is_premium) {
      return NextResponse.json({ error: "Already premium" }, { status: 400 })
    }

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { user_id } })
      customerId = customer.id
      await db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user_id)
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "jpy",
          product_data: {
            name: "Certi-AI Hub プレミアム（買い切り）",
            description: "SC × AIF 全問題・無制限アクセス",
            images: [],
          },
          unit_amount: 1980,  // ¥1,980
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url:  `${origin}/pricing?payment=cancelled`,
      metadata: { user_id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
