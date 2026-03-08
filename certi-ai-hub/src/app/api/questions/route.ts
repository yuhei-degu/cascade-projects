// src/app/api/questions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const module     = searchParams.get("module")   // SC | AIF
  const category   = searchParams.get("category")
  const difficulty = searchParams.get("difficulty")
  const limit      = parseInt(searchParams.get("limit") ?? "20")
  const shuffle    = searchParams.get("shuffle") === "true"

  const db = createServiceClient()
  let query = db.from("question_bank").select("*")

  if (module)     query = query.eq("module", module)
  if (category)   query = query.eq("category", category)
  if (difficulty) query = query.eq("difficulty", parseInt(difficulty))
  query = query.limit(Math.min(limit, 100))
  if (shuffle)    query = query.order("created_at", { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}
