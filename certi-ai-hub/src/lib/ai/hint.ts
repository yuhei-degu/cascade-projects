// src/lib/ai/hint.ts
// AIヒント生成（サーバーサイドのみ）
import Anthropic from "@anthropic-ai/sdk"
import type { HintRequest, HintResponse } from "@/types"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CACHE = new Map<string, HintResponse>()

export async function generateHint(req: HintRequest): Promise<HintResponse> {
  const key = req.question_id + (req.user_answer ?? "")
  if (CACHE.has(key)) return CACHE.get(key)!

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: `あなたは情報処理安全確保支援士(SC)とAWS AI Practitioner(AIF)の
学習支援AIです。ヒントは以下のJSON形式で返してください（前後に余分なテキスト不要）:
{"hint":"学習ヒント（100文字以内）","concept":"関連する概念名","synergy":"SC↔AIF連携のポイント（あれば）"}`,
    messages: [{
      role: "user",
      content: `問題: ${req.question}\n回答: ${req.user_answer ?? "未回答"}\nヒントをください。`,
    }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : ""
  let resp: HintResponse
  try {
    resp = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
  } catch {
    resp = { hint: text.slice(0, 100), concept: "" }
  }
  CACHE.set(key, resp)
  return resp
}
