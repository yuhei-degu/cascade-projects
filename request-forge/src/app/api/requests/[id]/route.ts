/**
 * API Route: GET/PATCH /api/requests/[id]
 * 管理者用 — 依頼詳細取得・ステータス更新・プレビューURL生成・納品
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendAcceptedEmail, sendPreviewEmail, sendDeliveryEmail } from "@/lib/email/mailer";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const request = await prisma.request.findUnique({
    where: { id: params.id },
    include: {
      evaluations: true,
      messages: { orderBy: { createdAt: "asc" } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: request });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

    const request = await prisma.request.findUniqueOrThrow({ where: { id: params.id } });

    switch (action) {

      // ── ステータス変更 ────────────────────────────────────────
      case "update_status": {
        await prisma.request.update({
          where: { id: params.id },
          data: { status: payload.status },
        });
        await prisma.activityLog.create({
          data: {
            requestId: params.id,
            action: "status_changed",
            detail: `→ ${payload.status}`,
            actor: "admin",
          },
        });

        // 承認時は制作開始通知メール
        if (payload.status === "building") {
          const estimatedDays = payload.estimatedDays ?? 7;
          await sendAcceptedEmail(request.email, request.title, estimatedDays, params.id);
        }
        return NextResponse.json({ success: true });
      }

      // ── プレビューURL生成・確認メール送信 ───────────────────────
      case "send_preview": {
        const token = uuidv4();
        const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日有効
        const previewUrl = `${baseUrl}/preview/${token}`;

        await prisma.request.update({
          where: { id: params.id },
          data: {
            previewToken: token,
            previewTokenExp: exp,
            deliverableUrl: payload.deliverableUrl,
            deliverableNote: payload.deliverableNote,
            status: "review_ready",
          },
        });

        await sendPreviewEmail(request.email, request.title, previewUrl, exp);

        await prisma.activityLog.create({
          data: { requestId: params.id, action: "preview_sent", detail: previewUrl, actor: "admin" },
        });

        return NextResponse.json({ success: true, previewUrl });
      }

      // ── 手動納品（決済後の成果物URL更新） ─────────────────────
      case "deliver": {
        await prisma.request.update({
          where: { id: params.id },
          data: {
            status: "delivered",
            deliverableUrl: payload.deliverableUrl,
            deliverableNote: payload.deliverableNote,
          },
        });

        await sendDeliveryEmail(
          request.email,
          request.title,
          payload.deliverableUrl,
          payload.deliverableNote
        );

        await prisma.activityLog.create({
          data: { requestId: params.id, action: "delivered", detail: payload.deliverableUrl, actor: "admin" },
        });

        return NextResponse.json({ success: true });
      }

      // ── 内部メモ追加 ───────────────────────────────────────────
      case "add_note": {
        await prisma.requestMessage.create({
          data: {
            requestId: params.id,
            author: "admin",
            content: payload.content,
            isInternal: true,
          },
        });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error("PATCH request error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
