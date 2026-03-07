/**
 * GET /api/posts
 * 投稿一覧取得API
 * クエリパラメータ:
 *   - page: ページ番号 (default: 1)
 *   - per: 1ページあたり件数 (default: 20, max: 100)
 *   - username: フィルター（特定アカウントのみ）
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const per  = Math.min(100, Math.max(1, parseInt(searchParams.get("per") ?? "20", 10)));
    const username = searchParams.get("username") ?? undefined;

    const where = username
      ? { account: { username } }
      : {};

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          account: { select: { username: true, displayName: true } },
        },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * per,
        take: per,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          per,
          total,
          totalPages: Math.ceil(total / per),
        },
      },
    });
  } catch (err) {
    console.error("[API /api/posts] Error:", err);
    return NextResponse.json(
      { success: false, error: "投稿一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
