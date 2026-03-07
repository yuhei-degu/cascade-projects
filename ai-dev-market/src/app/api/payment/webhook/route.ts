/**
 * Stripe Webhook — 決済完了処理
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase/server";
import { sendStartMail } from "@/lib/email/mailer";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-09-30.acacia",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (e) {
    console.error("Webhook signature failed:", e);
    return NextResponse.json({ error: "Signature failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const requestId = session.metadata?.requestId;
    if (!requestId) return NextResponse.json({ ok: true });

    const { data: request } = await supabase
      .from("requests").select("*").eq("id", requestId).single();
    if (!request) return NextResponse.json({ ok: true });

    await supabase.from("requests").update({
      status: "paid",
      paid_amount: session.amount_total ?? request.paid_amount,
      paid_at: new Date().toISOString(),
    }).eq("id", requestId);

    await supabase.from("activity_logs").insert({
      request_id: requestId, action: "payment_completed",
      detail: `¥${session.amount_total}`, actor: "system",
    });

    // 開発開始通知メール
    await sendStartMail(request.email, request.title, 7);

    // 管理者通知
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL, to: adminEmail,
          subject: `【管理】決済完了: ${request.title}`,
          html: `<p>¥${session.amount_total?.toLocaleString()} の決済が完了しました。</p><p><a href="${base}/admin/requests/${requestId}">管理画面で確認</a></p>`,
        }),
      }).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
