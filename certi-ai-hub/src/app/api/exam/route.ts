// src/app/api/exam/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { z } from "zod"

const CreateSchema = z.object({
  module:     z.enum(["SC", "AIF", "MIXED"]),
  num_questions: z.number().min(5).max(60).default(25),
  time_limit: z.number().min(600).max(10800).default(9000),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })

  const body = CreateSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ data: null, error: body.error.message }, { status: 400 })

  const db = createServiceClient()
  // 問題をランダムに取得
  const modFilter = body.data.module === "MIXED"
    ? ["SC", "AIF"] : [body.data.module]

  const { data: questions } = await db
    .from("question_bank")
    .select("id")
    .in("module", modFilter)
    .limit(body.data.num_questions * 3)

  const ids = (questions ?? [])
    .sort(() => Math.random() - 0.5)
    .slice(0, body.data.num_questions)
    .map((q: any) => q.id)

  const { data: session, error } = await db
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      module: body.data.module,
      time_limit: body.data.time_limit,
      question_ids: ids,
      total: ids.length,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data: session, error: null }, { status: 201 })
}
