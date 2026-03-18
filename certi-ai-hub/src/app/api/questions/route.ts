// src/app/api/questions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

/** Fisher-Yates シャッフル */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const module     = searchParams.get("module")   // SC | AIF | MIXED
  const category   = searchParams.get("category")
  const difficulty = searchParams.get("difficulty")
  const limit      = parseInt(searchParams.get("limit") ?? "10")
  const shuffle    = searchParams.get("shuffle") === "true"

  const db = createServiceClient()
  // 多めに取得してJS側でシャッフル・選出する
  const fetchLimit = 100

  // ── 共通フィルタ適用ヘルパー ────────────────────────────
  function applyFilters(q: ReturnType<typeof db.from>) {
    if (module === "MIXED") q = q.in("module", ["SC", "AIF"])
    else if (module)        q = q.eq("module", module)
    if (difficulty)         q = q.eq("difficulty", parseInt(difficulty))  // ← 必ず適用
    return q
  }

  let pool: Record<string, unknown>[] = []

  // ── カテゴリ指定あり：カテゴリ × 難易度で取得 ───────────
  if (category) {
    let q = applyFilters(db.from("question_bank").select("*"))
    q = q.eq("category", category).limit(fetchLimit)
    const { data, error } = await q
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    pool = data ?? []
  }

  // カテゴリ内が limit に満たない場合はモジュール全体から同じ難易度で補充
  if (pool.length < limit) {
    let q = applyFilters(db.from("question_bank").select("*"))
    q = q.limit(fetchLimit)
    const { data, error } = await q
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })

    // 重複を除いて補充
    const existingIds = new Set(pool.map((r) => r.id))
    const extra = (data ?? []).filter((r: Record<string, unknown>) => !existingIds.has(r.id))
    pool = [...pool, ...extra]
  }

  // シャッフルして limit 件に絞る
  const result = shuffle ? shuffleArray(pool).slice(0, limit) : pool.slice(0, limit)
  return NextResponse.json({ data: result, error: null })
}
