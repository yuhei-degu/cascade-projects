// src/lib/ai/error-analyzer.ts
import Anthropic from "@anthropic-ai/sdk"
import { analyzeError } from "@/lib/utils/error-patterns"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ErrorAnalysis {
  category: string
  cause: string
  solution: string
  steps: string[]
  guideUrl?: string
}

const SYSTEM = `あなたはClaude Codeのエラーを解決するサポートAIです。
対象: IT未経験の日本人
ルール:
- 必ず日本語で答える
- 原因は1〜2文で簡潔に
- 解決手順は番号付きで最大5ステップ
- 専門用語は避けるか説明を付ける
JSON形式で返すこと: { "cause": "...", "steps": ["...", "..."] }`

export async function analyzeErrorText(errorText: string): Promise<ErrorAnalysis> {
  // まずパターンマッチで高速解決
  const pattern = analyzeError(errorText)
  if (pattern) {
    return {
      category: pattern.category,
      cause: pattern.cause,
      solution: pattern.solution,
      steps: [pattern.solution],
      guideUrl: pattern.guideUrl,
    }
  }

  // パターンにない場合はAI解析
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: `エラー内容:\n${errorText}` }],
    })
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("")
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
    return {
      category: "other",
      cause: json.cause ?? "原因を特定できませんでした",
      solution: json.steps?.[0] ?? "",
      steps: json.steps ?? [],
    }
  } catch {
    return {
      category: "other",
      cause: "エラーを解析できませんでした",
      solution: "エラー文を「AIに聞く」ボタンで貼り付けてみてください",
      steps: [],
    }
  }
}
