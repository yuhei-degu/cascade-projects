// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient, createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, message, page_url } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 })
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "1000文字以内で入力してください" }, { status: 400 })
    }

    const authDb = await createClient()
    const { data: { user } } = await authDb.auth.getUser()
    const db = createServiceClient()

    await db.from("feedback").insert({
      user_id:   user?.id ?? null,
      email:     user?.email ?? null,
      category:  category ?? "general",
      message:   message.trim(),
      page_url:  page_url ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Feedback error:", err.message)
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 })
  }
}
