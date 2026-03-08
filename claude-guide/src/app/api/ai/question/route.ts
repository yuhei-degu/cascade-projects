// src/app/api/ai/question/route.ts
import { NextRequest, NextResponse } from "next/server"
import { askAI } from "@/lib/ai/question"

// Rate Limit: IPごとに1分5回まで
const rateLimitMap = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "1分間に質問できるのは5回までです。少し待ってから試してください。" },
      { status: 429 }
    )
  }
  try {
    const { question, stepId } = await req.json()
    if (!question?.trim()) {
      return NextResponse.json({ error: "質問を入力してください" }, { status: 400 })
    }
    const answer = await askAI(question, stepId)
    return NextResponse.json({ answer })
  } catch (err) {
    return NextResponse.json({ error: "回答の取得に失敗しました" }, { status: 500 })
  }
}
