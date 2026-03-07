/**
 * AI 審査エンジン — Gemini + GPT-4 で同時評価
 *
 * 2つのモデルで独立評価し、両方が「不可」なら自動却下。
 * 片方でも「可」なら管理者判断へ。
 */
import { AiEvaluationResult } from "@/types";

// ── 共通プロンプト ────────────────────────────────────────────────
function buildPrompt(title: string, description: string, budget: string): string {
  return `あなたはソフトウェア開発の専門家です。以下の制作依頼を審査してください。

## 依頼内容
タイトル: ${title}
説明: ${description}
希望予算: ${budget}

## 審査観点
1. 技術的に実現可能か（個人開発者1名で2週間以内に対応できるか）
2. 予算と規模の整合性
3. 法的・倫理的な問題がないか
4. 要件が明確か

## 回答形式（必ずJSON形式で返してください）
{
  "feasible": true または false,
  "feasibilityScore": 0〜100の整数,
  "estimatedHours": 見積もり工数（時間、整数）,
  "estimatedPrice": 見積もり価格（円、整数）,
  "concerns": ["懸念点1", "懸念点2"],
  "suggestions": "改善提案や補足説明"
}

feasibleがfalseになる条件:
- 個人開発では現実的に対応不可能な規模
- 違法・倫理的に問題のある依頼
- 予算と規模が著しく乖離している（¥5,000で大規模システムなど）
- 説明が不明瞭で要件が判断できない

JSONのみを返してください。説明文は不要です。`;
}

// ── Gemini 評価 ────────────────────────────────────────────────────
export async function evaluateWithGemini(
  title: string,
  description: string,
  budget: string
): Promise<AiEvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(title, description, budget) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseAiJson(text);

  return {
    model: "gemini-1.5-pro",
    feasible: parsed.feasible,
    feasibilityScore: parsed.feasibilityScore,
    estimatedHours: parsed.estimatedHours,
    estimatedPrice: parsed.estimatedPrice,
    concerns: parsed.concerns ?? [],
    suggestions: parsed.suggestions,
  };
}

// ── GPT-4o 評価 ────────────────────────────────────────────────────
export async function evaluateWithGpt4(
  title: string,
  description: string,
  budget: string
): Promise<AiEvaluationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "あなたはソフトウェア開発の専門家です。依頼の実現可能性を審査し、必ずJSONのみを返してください。",
        },
        { role: "user", content: buildPrompt(title, description, budget) },
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = parseAiJson(text);

  return {
    model: "gpt-4o",
    feasible: parsed.feasible,
    feasibilityScore: parsed.feasibilityScore,
    estimatedHours: parsed.estimatedHours,
    estimatedPrice: parsed.estimatedPrice,
    concerns: parsed.concerns ?? [],
    suggestions: parsed.suggestions,
  };
}

// ── 2つの評価を統合して最終判定 ───────────────────────────────────
export function aggregateEvaluations(
  evaluations: AiEvaluationResult[]
): { verdict: "feasible" | "infeasible" | "partial"; avgScore: number } {
  const scores = evaluations.map((e) => e.feasibilityScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  const feasibleCount = evaluations.filter((e) => e.feasible).length;

  if (feasibleCount === 0) return { verdict: "infeasible", avgScore };
  if (feasibleCount === evaluations.length) return { verdict: "feasible", avgScore };
  return { verdict: "partial", avgScore };
}

// ── JSON パース（```json ... ``` を含む場合もケア） ─────────────
function parseAiJson(text: string): Record<string, unknown> {
  // コードブロック除去
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // フォールバック: 不明な形式 → 不可判定
    console.error("Failed to parse AI JSON:", text);
    return {
      feasible: false,
      feasibilityScore: 0,
      concerns: ["AI応答の解析に失敗しました"],
      suggestions: "再審査が必要です",
    };
  }
}
