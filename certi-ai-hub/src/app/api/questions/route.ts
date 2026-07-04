// src/app/api/questions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"

const FREE_DAILY_LIMIT = 10
const MAX_LIMIT = 60
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)
const PUBLIC_QUESTION_COLUMNS = [
  "id",
  "module",
  "category",
  "difficulty",
  "question",
  "options",
  "code_snippet",
  "synergy_hint",
  "hint",
  "tags",
  "created_at",
].join(",")

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
  const module     = searchParams.get("module")
  const category   = searchParams.get("category")
  const difficulty = searchParams.get("difficulty")
  const requestedLimit = parseInt(searchParams.get("limit") ?? "10")
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : 10
  const shuffle    = searchParams.get("shuffle") === "true"

  const db      = createServiceClient()
  const authDb  = await createClient()

  // ── ユーザー認証状態を確認 ──────────────────────────────
  const { data: { user } } = await authDb.auth.getUser()

  // 管理者チェック
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email)

  // プレミアムチェック
  let isPremium = false
  if (user && !isAdmin) {
    const { data: profile } = await db
      .from("profiles").select("is_premium").eq("id", user.id).single()
    isPremium = profile?.is_premium ?? false
  }

  const unlimited = isAdmin || isPremium

  // ── 無料ユーザーの日次制限チェック ──────────────────────
  if (!unlimited) {
    const today = new Date().toISOString().split("T")[0]

    if (user) {
      // ログイン済み無料ユーザー：DBで管理
      const { data: usage } = await db
        .from("daily_usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("date", today)
        .single()

      const currentCount = usage?.count ?? 0
      if (currentCount >= FREE_DAILY_LIMIT) {
        return NextResponse.json({
          data: null,
          error: "DAILY_LIMIT_REACHED",
          limit: FREE_DAILY_LIMIT,
          used: currentCount,
        }, { status: 403 })
      }
    }
    // 未ログインユーザー：クライアント側のlocalStorageで管理（サーバーでは制限しない）
    // ※ 厳密な制限はログイン必須にすることで実現
  }

  // ── 問題取得 ────────────────────────────────────────────
  const fetchLimit = 100

  function applyFilters(q: ReturnType<typeof db.from>) {
    if (module === "MIXED") q = q.in("module", ["SC", "AIF"])
    else if (module)        q = q.eq("module", module)
    if (difficulty)         q = q.eq("difficulty", parseInt(difficulty))
    return q
  }

  let pool: Record<string, unknown>[] = []

  if (category) {
    let q = applyFilters(db.from("question_bank").select(PUBLIC_QUESTION_COLUMNS))
    q = q.eq("category", category).limit(fetchLimit)
    const { data, error } = await q
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    pool = data ?? []
  }

  if (pool.length < limit) {
    let q = applyFilters(db.from("question_bank").select(PUBLIC_QUESTION_COLUMNS))
    q = q.limit(fetchLimit)
    const { data, error } = await q
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    const existingIds = new Set(pool.map((r) => r.id))
    const extra = (data ?? []).filter((r: Record<string, unknown>) => !existingIds.has(r.id))
    pool = [...pool, ...extra]
  }

  const result = shuffle ? shuffleArray(pool).slice(0, limit) : pool.slice(0, limit)

  // ── ログイン済み無料ユーザーの使用数を更新 ──────────────
  if (!unlimited && user) {
    const today = new Date().toISOString().split("T")[0]
    await db.from("daily_usage").upsert({
      user_id: user.id,
      date:    today,
      count:   result.length,
    }, { onConflict: "user_id,date", ignoreDuplicates: false })
      .eq("user_id", user.id).eq("date", today)

    // increment方式
    await db.rpc("increment_daily_usage", {
      p_user_id: user.id,
      p_date:    today,
      p_count:   result.length,
    }).catch(() => {
      // RPCがなければupsertにフォールバック（初回）
    })
  }

  return NextResponse.json({ data: result, error: null })
}
