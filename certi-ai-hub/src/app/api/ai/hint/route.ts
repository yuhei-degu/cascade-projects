// src/app/api/ai/hint/route.ts
import { NextRequest, NextResponse } from "next/server"
import { generateHint } from "@/lib/ai/hint"
import { z } from "zod"

const HintSchema = z.object({
  question_id:  z.string().uuid(),
  question:     z.string(),
  user_answer:  z.string().optional(),
})

const rateLimitMap = new Map<string, { count: number; reset: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (entry && now < entry.reset && entry.count >= 10) {
    return NextResponse.json({ data: null, error: "Rate limit exceeded" }, { status: 429 })
  }
  rateLimitMap.set(ip, {
    count: (entry && now < entry.reset ? entry.count : 0) + 1,
    reset: entry && now < entry.reset ? entry.reset : now + 60_000,
  })

  const body = HintSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ data: null, error: body.error.message }, { status: 400 })

  try {
    const hint = await generateHint(body.data)
    return NextResponse.json({ data: hint, error: null })
  } catch (e: any) {
    return NextResponse.json({ data: null, error: e.message }, { status: 500 })
  }
}
