/**
 * Stripe Webhook — 決済完了処理
 * POST /api/payment/webhook
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/payment/stripe";
import { sendDeliveryEmail } from "@/lib/email/mailer";

export const runtime = "nodejs"; // Edge ランタイムでは Buffer が使えないため

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  let event;
  try {
    event = constructWebhookEvent(rawBody, sig);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { requestId?: string; paymentToken?: string };
      amount_total?: number | null;
    };

    const requestId = session.metadata?.requestId;
    if (!requestId) return NextResponse.json({ error: "No requestId in metadata" }, { status: 400 });

    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    // 決済完了でステータス更新
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "paid",
        paidAt: new Date(),
        paidAmount: session.amount_total ?? request.paidAmount,
        stripeSessionId: (event.data.object as { id?: string }).id,
      },
    });

    await prisma.activityLog.create({
      data: {
        requestId,
        action: "payment_completed",
        detail: `¥${session.amount_total} 決済完了`,
        actor: "system",
      },
    });

    // 納品情報が既にある場合は自動納品メール
    if (request.deliverableUrl) {
      await prisma.request.update({ where: { id: requestId }, data: { status: "delivered" } });

      await sendDeliveryEmail(
        request.email,
        request.title,
        request.deliverableUrl,
        request.deliverableNote ?? undefined
      );

      await prisma.activityLog.create({
        data: { requestId, action: "delivered", detail: "自動納品メール送信済み", actor: "system" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
