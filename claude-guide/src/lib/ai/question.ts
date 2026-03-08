// src/lib/ai/question.ts
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `あなたはClaude Codeの使い方を教える先生です。
対象: IT未経験の日本人（看護師・教師・事務員など）
ルール:
- 必ず日本語で答える
- 専門用語を使う場合は必ずカッコ内に日本語で説明する
- 回答は短く・具体的に（最大300文字）
- コマンドが必要な場合はコードブロックで示す
- 「できます」「試してみてください」など優しい言葉を使う`

// シンプルなメモリキャッシュ（本番はRedis推奨）
const cache = new Map<string, { answer: string; ts: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 // 1時間

export async function askAI(question: string, stepId?: string): Promise<string> {
  const cacheKey = `${stepId ?? ""}::${question.trim().slice(0, 100)}`

  // キャッシュヒット
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.answer
  }

  const context = stepId ? `（質問されたページ: ${stepId}）` : ""

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `${context}\n\n質問: ${question}` }],
  })

  const answer = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("")

  cache.set(cacheKey, { answer, ts: Date.now() })
  return answer
}
