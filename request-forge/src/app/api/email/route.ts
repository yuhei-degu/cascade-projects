/**
 * API Route: POST /api/email — 管理者手動メール送信
 * request-forge 用
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendAcceptedEmail,
  sendPreviewEmail,
  sendPaymentRequestEmail,
  sendDeliveryEmail,
} from "@/lib/email/mailer";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const schema = z.object({
  requestId: z.string(),
  type: z.enum(["accepted", "preview", "payment", "delivery"]),
  // accepted
  estimatedDays: z.number().optional(),
  // preview
  deliverableUrl: z.string().optional(),
  deliverableNote: z.string().optional(),
  // payment
  amount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, type, ...params } = schema.parse(body);

    const request = await prisma.request.findUniqueOrThrow({ where: { id: requestId } });
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";

    switch (type) {
      case "accepted": {
        const days = params.estimatedDays ?? 7;
        await sendAcceptedEmail(request.email, request.title, days, requestId);
        await prisma.activityLog.create({
          data: { requestId, action: "email_sent", detail: "受付完了メール送信", actor: "admin" },
        });
        return NextResponse.json({ success: true, type: "accepted" });
      }

      case "preview": {
        const token = uuidv4();
        const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const previewUrl = `${base}/preview/${token}`;

        await prisma.request.update({
          where: { id: requestId },
          data: {
            previewToken: token, previewTokenExp: exp, status: "review_ready",
            deliverableUrl: params.deliverableUrl,
            deliverableNote: params.deliverableNote,
          },
        });

        await sendPreviewEmail(request.email, request.title, previewUrl, exp);
        await prisma.activityLog.create({
          data: { requestId, action: "email_sent", detail: `確認メール: ${previewUrl}`, actor: "admin" },
        });
        return NextResponse.json({ success: true, type: "preview", previewUrl });
      }

      case "payment": {
        const amount = params.amount ?? request.paidAmount ?? 20000;
        const paymentUrl = `${base}/payment/${uuidv4()}`;
        await sendPaymentRequestEmail(request.email, request.title, paymentUrl, amount);
        await prisma.activityLog.create({
          data: { requestId, action: "email_sent", detail: `決済依頼: ¥${amount}`, actor: "admin" },
        });
        return NextResponse.json({ success: true, type: "payment" });
      }

      case "delivery": {
        if (!params.deliverableUrl) throw new Error("deliverableUrl is required");
        await prisma.request.update({
          where: { id: requestId },
          data: { status: "delivered", deliverableUrl: params.deliverableUrl, deliverableNote: params.deliverableNote },
        });
        await sendDeliveryEmail(request.email, request.title, params.deliverableUrl, params.deliverableNote ?? undefined);
        await prisma.activityLog.create({
          data: { requestId, action: "delivered", detail: params.deliverableUrl, actor: "admin" },
        });
        return NextResponse.json({ success: true, type: "delivery" });
      }
    }
  } catch (e) {
    console.error("Email API error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
