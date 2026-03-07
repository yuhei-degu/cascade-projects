/**
 * AI 審査エンジン — GPT-4o + Gemini-1.5-pro 並列審査
 * 判定: A（可）/ B（条件付き可）/ C（不可）
 */
import { AiVerdict } from "@/types";

// ── プロンプト構築 ──────────────────────────────────────────
function buildEvalPrompt(title: string, desc: string, budget: string): string {
  return `あなたは個人フリーランス開発者です。
以下の依頼を審査し、AIツール（ChatGPT/Claude/Gemini）を使って個人開発者1人が
2週間以内・予算内で対応できるか判定してください。

## 依頼内容
タイトル: ${title}
説明: ${desc}
希望予算: ${budget}

## 判定基準
A（可）: AIで簡単に作れる小規模ツール・スクリプト・Webページ
B（条件付き）: 条件や追加確認があれば対応可能
C（不可）: 大規模すぎる/技術的に困難/違法・倫理問題/予算と規模が乖離

Cになる主な理由:
- 個人で2週間以上かかる大規模案件
- AIが苦手な特殊な業務知識が必要
- 予算¥30,000超の大型開発
- 違法・有害なコンテンツ
- 説明が不明瞭で要件が判断不能

## 回答形式（JSONのみ。説明不要）
{
  "verdict": "A" または "B" または "C",
  "score": 0〜100の整数（高いほど実現しやすい）,
  "estimated_hours": 見積工数（整数、時間）,
  "estimated_price": 見積価格（整数、円）,
  "concerns": ["懸念点1", "懸念点2"],
  "suggestions": "改善提案や条件"
}`;
}

// ── GPT-4o ────────────────────────────────────────────────
export async function evaluateWithGpt4o(
  title: string, desc: string, budget: string
) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "個人開発者として依頼の実現可能性を審査します。JSONのみ返してください。" },
        { role: "user", content: buildEvalPrompt(title, desc, budget) },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`GPT-4o: ${await res.text()}`);
  const j = await res.json();
  return { model: "gpt-4o", ...safeParseJson(j.choices[0].message.content) };
}

// ── Gemini-1.5-pro ─────────────────────────────────────────
export async function evaluateWithGemini(
  title: string, desc: string, budget: string
) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildEvalPrompt(title, desc, budget) }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini: ${await res.text()}`);
  const j = await res.json();
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return { model: "gemini-1.5-pro", ...safeParseJson(text) };
}

// ── 2つの判定を統合 ────────────────────────────────────────
export function aggregateVerdicts(results: { verdict: string; score: number }[]): {
  verdict: AiVerdict; avgScore: number;
} {
  const verdicts = results.map(r => r.verdict as AiVerdict);
  const avgScore = Math.round(results.reduce((a, b) => a + b.score, 0) / results.length);

  const cCount = verdicts.filter(v => v === "C").length;
  if (cCount === results.length) return { verdict: "C", avgScore };

  const aCount = verdicts.filter(v => v === "A").length;
  if (aCount === results.length) return { verdict: "A", avgScore };

  return { verdict: "B", avgScore };
}

// ── JSON安全パース ─────────────────────────────────────────
function safeParseJson(text: string): Record<string, unknown> {
  try {
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { verdict: "C", score: 0, concerns: ["応答解析失敗"], suggestions: "" };
  }
}
