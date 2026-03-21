// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  // 環境変数チェック
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("dummy")) {
    console.error("STRIPE_SECRET_KEY is not configured")
    return NextResponse.json({ error: "Payment not configured. Please contact support." }, { status: 503 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { user_id, email } = body
  if (!user_id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const db = createServiceClient()

    // プレミアム済みチェック
    const { data: profile, error: profileError } = await db
      .from("profiles").select("stripe_customer_id, is_premium").eq("id", user_id).single()

    if (profileError) {
      console.error("Profile fetch error:", profileError.message)
      // profileが存在しない場合は作成して続行
    }

    if (profile?.is_premium) {
      return NextResponse.json({ error: "Already premium" }, { status: 400 })
    }

    // Stripe Customer 取得 or 作成
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { user_id } })
      customerId = customer.id
      await db.from("profiles").upsert({
        id: user_id,
        email,
        stripe_customer_id: customerId,
      }, { onConflict: "id" })
    }

    const origin = req.headers.get("origin") ?? "https://certi-ai-hub.vercel.app"

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "jpy",
          product_data: {
            name: "Certi-AI Hub プレミアム（買い切り）",
            description: "SC × AIF 全問題・無制限アクセス",
          },
          unit_amount: 1980,
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
    console.error("Stripe checkout error:", {
      message: err?.message,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
    })
    return NextResponse.json({
      error: err?.message ?? "Payment processing failed",
      code: err?.code,
    }, { status: 500 })
  }
}
