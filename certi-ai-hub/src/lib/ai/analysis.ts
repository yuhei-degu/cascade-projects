// src/lib/ai/analysis.ts
import Anthropic from "@anthropic-ai/sdk"
import type { AnalysisReport, Category } from "@/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateAnalysis(
  weakCategories: { category: Category; accuracy: number }[],
  totalAnswered: number
): Promise<AnalysisReport> {
  const weakText = weakCategories
    .map(w => `${w.category}: ${Math.round(w.accuracy * 100)}%`)
    .join(", ")

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: `SCとAIF資格の学習コーチです。
弱点分析レポートをJSON形式で返してください:
{"overall_score":数値,"weak_categories":[{"category":"名前","accuracy":0.0}],
"recommendation":"改善アドバイス（150文字）","next_study_focus":"次に集中すべき分野"}`,
    messages: [{
      role: "user",
      content: `総回答数: ${totalAnswered}\n弱い分野: ${weakText || "なし"}`,
    }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""
  try {
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
  } catch {
    return {
      overall_score: 0,
      weak_categories: weakCategories,
      recommendation: "引き続き学習を続けましょう",
      next_study_focus: weakCategories[0]?.category ?? "全分野",
    }
  }
}
