// src/app/api/ai/analysis/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const Schema = z.object({
  sessions: z.array(z.object({
    module:  z.string(),
    correct: z.number(),
    total:   z.number(),
    pct:     z.number(),
    mode:    z.string().optional(),
  })),
})

export async function POST(req: NextRequest) {
  const body = Schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ data: null, error: body.error.message }, { status: 400 })

  const { sessions } = body.data
  if (!sessions.length) return NextResponse.json({ data: null, error: "No sessions" }, { status: 400 })

  // ローカル計算（APIキー不要）
  const totalAnswered = sessions.reduce((s, r) => s + r.total, 0)
  const totalCorrect  = sessions.reduce((s, r) => s + r.correct, 0)
  const overallPct    = Math.round((totalCorrect / totalAnswered) * 100)

  const scSessions  = sessions.filter(s => s.module === "SC")
  const aifSessions = sessions.filter(s => s.module === "AIF")
  const scPct  = scSessions.length  ? Math.round(scSessions.reduce((s,r)  => s + r.pct, 0) / scSessions.length)  : null
  const aifPct = aifSessions.length ? Math.round(aifSessions.reduce((s,r) => s + r.pct, 0) / aifSessions.length) : null

  // 弱点判定
  const weakModules = []
  if (scPct  !== null && scPct  < 70) weakModules.push(`SC（現在${scPct}%）`)
  if (aifPct !== null && aifPct < 70) weakModules.push(`AIF（現在${aifPct}%）`)

  let recommendation = ""
  let nextFocus      = ""

  if (overallPct >= 80) {
    recommendation = "非常に良い成績です！難問（難易度3）に挑戦して、さらに実力を伸ばしましょう。"
    nextFocus = "難問チャレンジ"
  } else if (overallPct >= 70) {
    recommendation = "合格ラインを超えています。模擬試験で本番形式に慣れることで、さらに安定した実力が身につきます。"
    nextFocus = "模擬試験で実力確認"
  } else if (weakModules.length > 0) {
    recommendation = `${weakModules.join("・")} の正解率が70%未満です。必須問題（難易度1）から復習しましょう。`
    nextFocus = weakModules[0].split("（")[0] + " の必須問題"
  } else {
    recommendation = "まだデータが少ないです。各カテゴリをまんべんなく解いて弱点を把握しましょう。"
    nextFocus = "全カテゴリを一通り学習"
  }

  const data = {
    overall_score: overallPct,
    sc_score:  scPct,
    aif_score: aifPct,
    total_answered: totalAnswered,
    recommendation,
    next_study_focus: nextFocus,
    passing: overallPct >= 70,
  }

  return NextResponse.json({ data, error: null })
}
