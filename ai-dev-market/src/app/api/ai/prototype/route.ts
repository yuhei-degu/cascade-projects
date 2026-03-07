/**
 * API: POST /api/ai/prototype
 * 管理者が手動でプロトタイプを再生成するエンドポイント
 * （evaluate/route.ts の自動生成と同じ処理を単体で呼び出せる）
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { generatePrototype } from "@/lib/ai/prototype-generator";
import { sendPrototypeMail } from "@/lib/email/mailer";
import { VERDICT_LABEL } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    // 依頼取得
    const { data: request, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !request) {
      return NextResponse.json({ error: "依頼が見つかりません" }, { status: 404 });
    }

    // rejected / closed は再生成不可
    if (["rejected", "closed"].includes(request.status)) {
      return NextResponse.json({ error: "この依頼はプロトタイプを生成できません" }, { status: 400 });
    }

    const hours = request.ai_estimated_hours ?? 4;

    // プロトタイプ生成
    const proto = await generatePrototype(
      request.title,
      request.description,
      request.category,
      hours
    );

    // DB更新
    await supabase.from("requests").update({
      prototype_code: proto.code,
      prototype_lang: proto.lang,
      prototype_note: proto.note,
      status: "prototype_ready",
    }).eq("id", requestId);

    // 確認メール再送
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const previewUrl = `${base}/preview/${request.preview_token}`;
    const verdict = (request.ai_verdict ?? "A") as "A" | "B";

    await sendPrototypeMail(
      request.email,
      request.title,
      previewUrl,
      verdict
    );

    // 活動ログ
    await supabase.from("activity_logs").insert({
      request_id: requestId,
      action: "prototype_regenerated",
      detail: `lang: ${proto.lang}`,
      actor: "admin",
    });

    return NextResponse.json({
      success: true,
      data: {
        lang: proto.lang,
        note: proto.note,
        codeLength: proto.code.length,
      },
    });

  } catch (e) {
    console.error("Prototype generation error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
