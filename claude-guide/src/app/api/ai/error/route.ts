// src/app/api/ai/error/route.ts
import { NextRequest, NextResponse } from "next/server"
import { analyzeErrorText } from "@/lib/ai/error-analyzer"

export async function POST(req: NextRequest) {
  try {
    const { errorText } = await req.json()
    if (!errorText?.trim()) {
      return NextResponse.json({ error: "エラー文を入力してください" }, { status: 400 })
    }
    const analysis = await analyzeErrorText(errorText)
    return NextResponse.json({ analysis })
  } catch {
    return NextResponse.json({ error: "診断に失敗しました" }, { status: 500 })
  }
}
