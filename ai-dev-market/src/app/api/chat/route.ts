/**
 * API: チャット機能
 * GET  /api/chat?requestId=xxx&token=yyy  — メッセージ取得
 * POST /api/chat                          — メッセージ送信
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { z } from "zod";

/** メッセージ一覧取得（トークン認証） */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId");
  const token     = searchParams.get("token");

  if (!requestId || !token) {
    return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
  }

  // トークン認証
  const { data: request } = await supabase
    .from("requests")
    .select("id, preview_token, preview_expires_at")
    .eq("id", requestId)
    .eq("preview_token", token)
    .single();

  if (!request) return NextResponse.json({ error: "認証失敗" }, { status: 403 });
  if (new Date(request.preview_expires_at) < new Date())
    return NextResponse.json({ error: "リンクの有効期限が切れています" }, { status: 410 });

  const { data: messages } = await supabase
    .from("messages")
    .select("id, author, content, is_internal, created_at")
    .eq("request_id", requestId)
    .eq("is_internal", false) // 依頼者には内部メモを見せない
    .order("created_at", { ascending: true });

  return NextResponse.json({ success: true, data: messages ?? [] });
}

const postSchema = z.object({
  requestId: z.string().uuid(),
  token:     z.string().uuid(),
  content:   z.string().min(1).max(2000),
  author:    z.enum(["client", "admin"]),
});

/** メッセージ送信 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, token, content, author } = postSchema.parse(body);

    // クライアントからの投稿はトークン認証必須
    if (author === "client") {
      const { data: req_ } = await supabase
        .from("requests")
        .select("id, preview_expires_at, free_revision_used")
        .eq("id", requestId)
        .eq("preview_token", token)
        .single();

      if (!req_) return NextResponse.json({ error: "認証失敗" }, { status: 403 });
    }

    // メッセージ保存
    const { data: msg, error } = await supabase
      .from("messages")
      .insert({ request_id: requestId, author, content, is_internal: false })
      .select()
      .single();

    if (error) throw error;

    // 修正依頼の場合はステータス更新（クライアントから）
    if (author === "client" && content.includes("修正")) {
      await supabase.from("requests")
        .update({ status: "revision" })
        .eq("id", requestId);
      await supabase.from("activity_logs").insert({
        request_id: requestId, action: "revision_requested", detail: content.slice(0, 100), actor: "client",
      });
    }

    return NextResponse.json({ success: true, data: msg });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ success: false, error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
