import { NextRequest, NextResponse } from 'next/server'
import { generateDiary } from '@/lib/lunaria/diary'
import { updateAffinity } from '@/lib/lunaria/affinity'
import { supabaseAdmin } from '@/lib/supabase'

const USER_ID = '00000000-0000-0000-0000-000000000001'

// POST /api/diary  セッション終了時 or 日次バッチで呼ぶ
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const date: string = body.date ?? new Date().toISOString().split('T')[0]

    // 1. 当日の extraction から日記を生成
    const diary = await generateDiary(date)
    if (!diary) {
      return NextResponse.json({ ok: false, reason: 'no extractions' })
    }

    // 2. 当日の affinity_delta を合算して親密度を更新
    const { data: extractions } = await supabaseAdmin
      .from('lunaria_extractions')
      .select('affinity_delta')
      .eq('user_id', USER_ID)
      .eq('session_date', date)

    const totalDelta = (extractions ?? []).reduce(
      (s: number, e: any) => s + (e.affinity_delta ?? 0), 0
    )
    const affinity = await updateAffinity(totalDelta)

    return NextResponse.json({ ok: true, diary, affinity })
  } catch (e) {
    console.error('[diary]', e)
    return NextResponse.json({ ok: false, error: true }, { status: 500 })
  }
}

// GET /api/diary?date=YYYY-MM-DD  日記取得
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
    ?? new Date().toISOString().split('T')[0]

  const { data } = await supabaseAdmin
    .from('lunaria_diary_logs')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('diary_date', date)
    .single()

  return NextResponse.json(data ?? null)
}
