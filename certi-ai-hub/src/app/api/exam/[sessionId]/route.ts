// src/app/api/exam/[sessionId]/route.ts — TASK-012
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { z } from "zod"

const AnswerSchema = z.object({
  question_id: z.string().uuid(),
  answer:      z.string(),
  time_spent:  z.number().default(0),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })

  const body = AnswerSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ data: null, error: body.error.message }, { status: 400 })

  const db = createServiceClient()
  const { data: session } = await db.from("exam_sessions")
    .select("*").eq("id", sessionId).eq("user_id", user.id).single()
  if (!session) return NextResponse.json({ data: null, error: "Session not found" }, { status: 404 })

  const { data: q } = await db.from("question_bank")
    .select("id,answer").eq("id", body.data.question_id).single()
  if (!q) return NextResponse.json({ data: null, error: "Question not found" }, { status: 404 })

  const is_correct = body.data.answer.trim().toUpperCase() === q.answer.trim().toUpperCase()

  await db.from("user_answers").insert({
    user_id: user.id, question_id: body.data.question_id,
    session_id: sessionId, is_correct, time_spent: body.data.time_spent,
  })

  const newAnswers = { ...(session.answers ?? {}), [body.data.question_id]: body.data.answer }
  await db.from("exam_sessions").update({
    answers: newAnswers,
    score: (session.score ?? 0) + (is_correct ? 1 : 0),
  }).eq("id", sessionId)

  return NextResponse.json({ data: { is_correct, correct_answer: q.answer }, error: null })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 })

  const db = createServiceClient()
  const { data: session, error } = await db.from("exam_sessions")
    .select("*").eq("id", sessionId).eq("user_id", user.id).single()
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 404 })
  return NextResponse.json({ data: session, error: null })
}
