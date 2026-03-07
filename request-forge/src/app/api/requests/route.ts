/**
 * API Route: POST /api/requests
 * 依頼フォーム送信 → DB保存 → AI審査トリガー
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NewRequestInput } from "@/types";
import { z } from "zod";

// バリデーションスキーマ
const schema = z.object({
  title: z.string().min(5, "タイトルは5文字以上").max(100),
  description: z.string().min(20, "詳細は20文字以上").max(3000),
  category: z.enum(["website", "webapp", "script", "design", "consultation", "other"]),
  budget: z.enum(["under_5k", "under_10k", "under_30k", "under_50k", "negotiable"]),
  deadline: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body) as NewRequestInput;

    // DB保存（status: pending）
    const request = await prisma.request.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category as any,
        budget: data.budget as any,
        deadline: data.deadline ? new Date(data.deadline) : null,
        email: data.email,
        status: "pending",
      },
    });

    // 活動ログ
    await prisma.activityLog.create({
      data: {
        requestId: request.id,
        action: "request_created",
        detail: `新規依頼: ${data.title}`,
        actor: "system",
      },
    });

    // AI審査を非同期で実行（レスポンスを待たない）
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      data: { requestId: request.id },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Request creation error:", err);
    return NextResponse.json(
      { success: false, error: "依頼の送信に失敗しました。しばらくしてから再試行してください。" },
      { status: 500 }
    );
  }
}

/** GET /api/requests — 管理者用一覧取得 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const per = 20;

  const where = status ? { status: status as any } : {};

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * per,
      take: per,
      include: {
        evaluations: { select: { model: true, feasible: true, feasibilityScore: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.request.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { requests, total, page, totalPages: Math.ceil(total / per) } });
}
