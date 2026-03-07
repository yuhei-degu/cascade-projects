/**
 * API: POST /api/ai/evaluate — AI審査実行
 * 非同期で呼ばれる。審査→プロトタイプ生成まで一気通貫。
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { evaluateWithGpt4o, evaluateWithGemini, aggregateVerdicts } from "@/lib/ai/evaluator";
import { generatePrototype } from "@/lib/ai/prototype-generator";
import { sendRejectionMail, sendPrototypeMail } from "@/lib/email/mailer";
import { BUDGET_LABEL } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { requestId } = await req.json();
    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    // 依頼取得
    const { data: request, error: fetchErr } = await supabase
      .from("requests").select("*").eq("id", requestId).single();
    if (fetchErr || !request) throw new Error("依頼が見つかりません");

    // 審査中に更新
    await supabase.from("requests").update({ status: "reviewing" }).eq("id", requestId);

    const budgetLabel = BUDGET_LABEL[request.budget as keyof typeof BUDGET_LABEL];

    // ── 並列審査 ────────────────────────────────────────────
    const [gptResult, gemResult] = await Promise.allSettled([
      evaluateWithGpt4o(request.title, request.description, budgetLabel),
      evaluateWithGemini(request.title, request.description, budgetLabel),
    ]);

    const results: { model: string; verdict: string; score: number; estimated_hours?: number; estimated_price?: number; concerns?: string[]; suggestions?: string }[] = [];

    for (const r of [gptResult, gemResult]) {
      if (r.status === "fulfilled") {
        const v = r.value;
        await supabase.from("ai_evaluations").insert({
          request_id: requestId, model: v.model,
          verdict: v.verdict, score: v.score,
          estimated_hours: v.estimated_hours, estimated_price: v.estimated_price,
          concerns: v.concerns ?? [], suggestions: v.suggestions,
        });
        results.push(v as { model: string; verdict: string; score: number; estimated_hours?: number; estimated_price?: number; concerns?: string[]; suggestions?: string });
      } else {
        console.error("AI eval failed:", r.reason);
      }
    }

    if (results.length === 0) {
      // API失敗時はBフォールバック
      await supabase.from("requests").update({ status: "prototype_ready", ai_verdict: "B", ai_score: 50 }).eq("id", requestId);
      return NextResponse.json({ success: true, verdict: "B_fallback" });
    }

    const { verdict, avgScore } = aggregateVerdicts(results as { verdict: string; score: number }[]);
    const rep = results[0];
    const hours = rep.estimated_hours ?? 4;
    const price = rep.estimated_price ?? 20000;

    // ── C判定: 自動お断り ─────────────────────────────────
    if (verdict === "C") {
      const concerns = results.flatMap(r => r.concerns ?? []);
      await supabase.from("requests").update({
        status: "rejected", ai_verdict: "C", ai_score: avgScore,
        ai_estimated_hours: hours, ai_estimated_price: price,
      }).eq("id", requestId);

      await sendRejectionMail(request.email, request.title, [...new Set(concerns)]);
      await supabase.from("activity_logs").insert({
        request_id: requestId, action: "auto_rejected",
        detail: `スコア: ${avgScore}`, actor: "ai",
      });
      return NextResponse.json({ success: true, verdict: "C" });
    }

    // ── A/B判定: プロトタイプ生成 ─────────────────────────
    const proto = await generatePrototype(request.title, request.description, request.category, hours);

    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const { data: updated } = await supabase.from("requests")
      .update({
        status: "prototype_ready",
        ai_verdict: verdict, ai_score: avgScore,
        ai_estimated_hours: hours, ai_estimated_price: price,
        prototype_code: proto.code, prototype_lang: proto.lang, prototype_note: proto.note,
      }).eq("id", requestId).select("preview_token").single();

    const previewUrl = `${base}/preview/${updated?.preview_token}`;
    const conditions = verdict === "B" ? results.map(r => r.suggestions).filter(Boolean).join(" / ") : undefined;

    await sendPrototypeMail(request.email, request.title, previewUrl, verdict as "A"|"B", conditions);
    await supabase.from("activity_logs").insert({
      request_id: requestId, action: "prototype_ready",
      detail: `verdict: ${verdict}, score: ${avgScore}`, actor: "ai",
    });

    return NextResponse.json({ success: true, verdict });

  } catch (e) {
    console.error("Evaluate error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
