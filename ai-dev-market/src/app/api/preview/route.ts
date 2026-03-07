/**
 * API: プレビュー確認・承認・修正
 * GET  /api/preview?token=xxx
 * POST /api/preview  { action: "ok" | "revision" | "cancel" }
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import Stripe from "stripe";
import { sendRevisionMail } from "@/lib/email/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-09-30.acacia",
});

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const { data, error } = await supabase
    .from("requests")
    .select("id,title,description,status,ai_verdict,ai_estimated_price,prototype_code,prototype_lang,prototype_note,deliverable_url,deliverable_note,preview_expires_at")
    .eq("preview_token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "無効なトークンです" }, { status: 404 });
  if (new Date(data.preview_expires_at) < new Date())
    return NextResponse.json({ error: "リンクの有効期限が切れています" }, { status: 410 });

  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const { token, action, comment } = await req.json();

    const { data: request } = await supabase
      .from("requests")
      .select("*")
      .eq("preview_token", token)
      .single();

    if (!request) return NextResponse.json({ error: "無効なトークン" }, { status: 404 });
    if (new Date(request.preview_expires_at) < new Date())
      return NextResponse.json({ error: "有効期限切れ" }, { status: 410 });

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";

    if (action === "ok") {
      // 決済セッション生成
      const amount = request.ai_estimated_price ?? request.paid_amount ?? 20000;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [{ price_data: {
          currency: "jpy", unit_amount: amount,
          product_data: { name: `【AI Dev Market】${request.title}` },
        }, quantity: 1 }],
        success_url: `${base}/payment/success?token=${token}`,
        cancel_url: `${base}/preview/${token}`,
        metadata: { requestId: request.id, token },
      });

      await supabase.from("requests").update({
        status: "prototype_ok", stripe_session_id: session.id, paid_amount: amount,
      }).eq("id", request.id);

      await supabase.from("activity_logs").insert({
        request_id: request.id, action: "prototype_approved",
        detail: `¥${amount}`, actor: "client",
      });

      return NextResponse.json({ success: true, action: "ok", paymentUrl: session.url });
    }

    if (action === "revision") {
      await supabase.from("requests").update({ status: "revision" }).eq("id", request.id);
      await supabase.from("messages").insert({
        request_id: request.id, author: "client", content: comment ?? "修正希望", is_internal: false,
      });
      await supabase.from("activity_logs").insert({
        request_id: request.id, action: "revision_requested", detail: comment, actor: "client",
      });
      return NextResponse.json({ success: true, action: "revision" });
    }

    if (action === "cancel") {
      await supabase.from("requests").update({ status: "closed" }).eq("id", request.id);
      return NextResponse.json({ success: true, action: "cancel" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (e) {
    console.error("Preview action error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// sendRevisionMail がない場合のスタブ (mailer.ts に追加済み想定)
declare function sendRevisionMail(to: string, title: string, comment: string): Promise<void>;
