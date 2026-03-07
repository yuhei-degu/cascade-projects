/**
 * API: POST /api/requests — 依頼投稿
 * GET  /api/requests — 管理者用一覧
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  title:       z.string().min(5, "5文字以上").max(100),
  description: z.string().min(20, "20文字以上").max(3000),
  category:    z.enum(["script","web_tool","api_integration","dashboard","website","other"]),
  budget:      z.enum(["under_10k","under_20k","under_30k","negotiable"]),
  deadline:    z.string().optional(),
  email:       z.string().email("メールアドレスが正しくありません"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // DB保存
    const { data: record, error } = await supabase
      .from("requests")
      .insert({
        title: data.title, description: data.description,
        category: data.category, budget: data.budget,
        deadline: data.deadline ?? null, email: data.email,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) throw error;

    // 活動ログ
    await supabase.from("activity_logs").insert({
      request_id: record.id, action: "request_created",
      detail: data.title, actor: "system",
    });

    // AI審査を非同期で起動（レスポンスを待たない）
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    fetch(`${base}/api/ai/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: record.id }),
    }).catch(console.error);

    return NextResponse.json({ success: true, data: { id: record.id } });

  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ success: false, error: e.errors[0].message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ success: false, error: "送信に失敗しました" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page   = parseInt(searchParams.get("page") ?? "1");
  const per    = 20;

  let q = supabase.from("requests")
    .select("id,title,category,budget,status,email,ai_verdict,ai_score,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page-1)*per, page*per-1);

  if (status) q = q.eq("status", status);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: { requests: data, total: count ?? 0, page } });
}
