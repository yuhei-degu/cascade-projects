/**
 * GET  /api/accounts — 監視アカウント一覧
 * POST /api/accounts — 監視アカウント追加
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// ─── GET ─────────────────────────────────────────────────
export async function GET() {
  try {
    const accounts = await prisma.trackedAccount.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ success: true, data: accounts });
  } catch (err) {
    console.error("[API /api/accounts GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "アカウント一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// ─── POST ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUsername = (body.username ?? "") as string;

    // バリデーション: 空・長すぎ・不正文字を弾く
    const username = rawUsername.trim().replace(/^@/, ""); // @は除去
    if (!username) {
      return NextResponse.json(
        { success: false, error: "usernameは必須です" },
        { status: 400 }
      );
    }
    if (username.length > 50 || !/^[A-Za-z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { success: false, error: "usernameが不正です (英数字・_のみ)" },
        { status: 400 }
      );
    }

    const account = await prisma.trackedAccount.upsert({
      where: { username },
      update: { isActive: true }, // 既存の場合はアクティブに戻す
      create: {
        username,
        displayName: body.displayName ?? null,
        isActive: true,
      },
    });

    console.log(`[API /api/accounts] @${username} を追加/更新しました`);
    return NextResponse.json({ success: true, data: account }, { status: 201 });
  } catch (err) {
    console.error("[API /api/accounts POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "アカウントの追加に失敗しました" },
      { status: 500 }
    );
  }
}
