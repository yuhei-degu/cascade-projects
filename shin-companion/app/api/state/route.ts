import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, T } from '@/lib/supabase'
import type { CharacterState } from '@/lib/types'

// GET: 現在の状態取得
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const { data } = await supabaseAdmin
    .from(T.charStates)
    .select('mood, affinity, trust')
    .eq('user_id', userId)
    .single()

  return NextResponse.json(data ?? { mood: 'calm', affinity: 20, trust: 10 })
}

// PUT: 状態を直接更新（管理用）
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, ...cs }: { userId: string } & CharacterState = body

    await supabaseAdmin.from(T.charStates).upsert({
      user_id: userId, ...cs,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
