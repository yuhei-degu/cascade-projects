/**
 * API Route: プレビュー確認
 * GET  /api/preview?token=xxx  — プレビュー情報取得
 * POST /api/preview             — 承認 or 修正依頼
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRevisionEmail, sendPaymentRequestEmail } from "@/lib/email/mailer";
import { createCheckoutSession } from "@/lib/payment/stripe";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

/** GET: トークンでプレビュー情報取得 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const request = await prisma.request.findUnique({
    where: { previewToken: token },
    include: { evaluations: true },
  });

  if (!request) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });

  // 有効期限チェック
  if (request.previewTokenExp && request.previewTokenExp < new Date()) {
    return NextResponse.json({ error: "This link has expired. Please contact us." }, { status: 410 });
  }

  // 必要な情報だけ返す（メアドなどは含めない）
  return NextResponse.json({
    success: true,
    data: {
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status,
      deliverableUrl: request.deliverableUrl,
      deliverableNote: request.deliverableNote,
    },
  });
}

const actionSchema = z.object({
  token: z.string(),
  action: z.enum(["approve", "revision"]),
  revisionComment: z.string().optional(),
});

/** POST: 承認 or 修正依頼 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, revisionComment } = actionSchema.parse(body);

    const request = await prisma.request.findUnique({ where: { previewToken: token } });
    if (!request) return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    if (request.previewTokenExp && request.previewTokenExp < new Date()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

    if (action === "revision") {
      // 修正依頼
      await prisma.request.update({ where: { id: request.id }, data: { status: "revision" } });
      await prisma.requestMessage.create({
        data: {
          requestId: request.id,
          author: "client",
          content: revisionComment ?? "修正依頼（コメントなし）",
          isInternal: false,
        },
      });
      await sendRevisionEmail(request.email, request.title, revisionComment ?? "（コメントなし）");
      await prisma.activityLog.create({
        data: { requestId: request.id, action: "revision_requested", detail: revisionComment, actor: "client" },
      });
      return NextResponse.json({ success: true, action: "revision" });
    }

    // 承認 → 決済トークン生成 → Stripe セッション作成
    const paymentToken = uuidv4();
    const amount = request.paidAmount ?? (await getDefaultAmount(request.budget));
    const paymentUrl = await createCheckoutSession({
      requestId: request.id,
      title: request.title,
      amount,
      successUrl: `${baseUrl}/payment/success?token=${paymentToken}`,
      cancelUrl: `${baseUrl}/preview/${token}`,
      paymentToken,
    });

    await prisma.request.update({
      where: { id: request.id },
      data: { status: "payment_pending", paymentToken, paidAmount: amount },
    });

    await sendPaymentRequestEmail(request.email, request.title, paymentUrl, amount);

    await prisma.activityLog.create({
      data: { requestId: request.id, action: "payment_requested", detail: `¥${amount}`, actor: "system" },
    });

    return NextResponse.json({ success: true, action: "approve", paymentUrl });
  } catch (err) {
    console.error("Preview action error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

function getDefaultAmount(budget: string): number {
  const map: Record<string, number> = {
    under_5k: 5000, under_10k: 10000, under_30k: 30000, under_50k: 50000, negotiable: 15000,
  };
  return map[budget] ?? 15000;
}
