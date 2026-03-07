/**
 * API Route: POST /api/evaluate
 * AI審査実行 → DB保存 → 自動却下 or 管理者通知
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateWithGemini, evaluateWithGpt4, aggregateEvaluations } from "@/lib/ai/evaluator";
import { sendRejectionEmail } from "@/lib/email/mailer";
import { BUDGET_LABELS } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { requestId } = await req.json();
    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    // 依頼取得
    const request = await prisma.request.findUniqueOrThrow({
      where: { id: requestId },
    });

    // ステータスを「審査中」に更新
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "reviewing" },
    });

    const budgetLabel = BUDGET_LABELS[request.budget as keyof typeof BUDGET_LABELS];

    // Gemini + GPT-4 で並列評価
    const [geminiResult, gptResult] = await Promise.allSettled([
      evaluateWithGemini(request.title, request.description, budgetLabel),
      evaluateWithGpt4(request.title, request.description, budgetLabel),
    ]);

    const evaluations = [];

    // Gemini 結果保存
    if (geminiResult.status === "fulfilled") {
      const r = geminiResult.value;
      await prisma.aiEvaluation.create({
        data: {
          requestId,
          model: r.model,
          feasible: r.feasible,
          feasibilityScore: r.feasibilityScore,
          estimatedHours: r.estimatedHours,
          estimatedPrice: r.estimatedPrice,
          concerns: r.concerns,
          suggestions: r.suggestions,
        },
      });
      evaluations.push(r);
    } else {
      console.error("Gemini evaluation failed:", geminiResult.reason);
    }

    // GPT-4 結果保存
    if (gptResult.status === "fulfilled") {
      const r = gptResult.value;
      await prisma.aiEvaluation.create({
        data: {
          requestId,
          model: r.model,
          feasible: r.feasible,
          feasibilityScore: r.feasibilityScore,
          estimatedHours: r.estimatedHours,
          estimatedPrice: r.estimatedPrice,
          concerns: r.concerns,
          suggestions: r.suggestions,
        },
      });
      evaluations.push(r);
    } else {
      console.error("GPT-4 evaluation failed:", gptResult.reason);
    }

    // APIキーなし / 評価失敗時はフォールバック
    if (evaluations.length === 0) {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "accepted", aiVerdict: "feasible", aiScore: 50 },
      });
      return NextResponse.json({ success: true, verdict: "fallback_accepted" });
    }

    // 統合判定
    const { verdict, avgScore } = aggregateEvaluations(evaluations);

    // ── 両方が「不可」→ 自動却下 + お断りメール ────────────────
    if (verdict === "infeasible") {
      const allConcerns = evaluations.flatMap((e) => e.concerns);
      const uniqueConcerns = [...new Set(allConcerns)];

      await prisma.request.update({
        where: { id: requestId },
        data: { status: "rejected", aiVerdict: "infeasible", aiScore: avgScore },
      });

      await prisma.activityLog.create({
        data: {
          requestId,
          action: "auto_rejected",
          detail: `AI審査により自動却下 (スコア: ${avgScore.toFixed(0)})`,
          actor: "ai",
        },
      });

      await sendRejectionEmail(request.email, request.title, uniqueConcerns);

      await prisma.activityLog.create({
        data: {
          requestId,
          action: "email_sent",
          detail: "お断りメールを送信しました",
          actor: "system",
        },
      });

      return NextResponse.json({ success: true, verdict: "infeasible" });
    }

    // ── 実現可能 or 部分的 → 管理者通知 ──────────────────────────
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "accepted", aiVerdict: verdict, aiScore: avgScore },
    });

    await prisma.activityLog.create({
      data: {
        requestId,
        action: "ai_approved",
        detail: `AI審査通過 (verdict: ${verdict}, スコア: ${avgScore.toFixed(0)})`,
        actor: "ai",
      },
    });

    // 管理者通知（メール or Slack webhook）
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL ?? "noreply@requestforge.dev",
          to: adminEmail,
          subject: `【RequestForge管理】新規依頼: ${request.title}`,
          html: `<p>新しい依頼が届きました。</p>
            <p><strong>${request.title}</strong></p>
            <p>AIスコア: ${avgScore.toFixed(0)} / verdict: ${verdict}</p>
            <p><a href="${baseUrl}/admin/requests/${requestId}">管理画面で確認</a></p>`,
        }),
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, verdict });
  } catch (err) {
    console.error("Evaluate error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
