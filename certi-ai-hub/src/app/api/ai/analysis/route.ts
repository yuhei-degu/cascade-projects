// src/app/api/ai/analysis/route.ts — TASK-014
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { generateAnalysis } from "@/lib/ai/analysis"

export async function POST(_: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })

  const db = createServiceClient()

  // 弱いカテゴリを集計
  const { data: rows } = await db.rpc("get_weak_categories", { uid: user.id }).select("*")
  const { count } = await db.from("user_answers")
    .select("*", { count: "exact", head: true }).eq("user_id", user.id)

  const weakCategories = (rows ?? []).map((r: any) => ({
    category: r.category,
    accuracy: r.accuracy,
  }))

  try {
    const report = await generateAnalysis(weakCategories, count ?? 0)
    return NextResponse.json({ data: report, error: null })
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 })
  }
}
