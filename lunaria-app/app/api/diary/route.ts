import { NextRequest, NextResponse } from 'next/server'
import { generateDiary } from '../../../lib/lunaria/diary'
import { updateAffinity } from '../../../lib/lunaria/affinity'
import { supabaseAdmin } from '../../../lib/supabase'
import { getJstDateString, getJstDayRange } from '../../../lib/lunaria/date'

const USER_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const date: string = body.date ?? getJstDateString()
    const stats = await getDiaryDayStats(date)

    const diary = await generateDiary(date)
    if (!diary) {
      return NextResponse.json({
        ok: false,
        reason: stats.message_count > 0 ? 'generation_failed' : 'no_source',
        date,
        ...stats,
      })
    }

    const { data: extractions } = await supabaseAdmin
      .from('lunaria_extractions')
      .select('affinity_delta')
      .eq('user_id', USER_ID)
      .eq('session_date', date)

    const totalDelta = (extractions ?? []).reduce(
      (sum: number, extraction: any) => sum + (extraction.affinity_delta ?? 0),
      0,
    )
    const affinity = await updateAffinity(totalDelta)

    return NextResponse.json({ ok: true, date, diary, affinity, ...stats })
  } catch (error) {
    console.error('[diary]', error)
    return NextResponse.json({ ok: false, error: true }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? getJstDateString()
  const meta = req.nextUrl.searchParams.get('meta') === '1'

  const { data } = await supabaseAdmin
    .from('lunaria_diary_logs')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('diary_date', date)
    .maybeSingle()

  if (!meta) return NextResponse.json(data ?? null)

  const stats = await getDiaryDayStats(date)
  return NextResponse.json({
    date,
    generated: Boolean(data),
    diary: data ?? null,
    ...stats,
  })
}

async function getDiaryDayStats(date: string): Promise<{ extraction_count: number; message_count: number }> {
  const range = getJstDayRange(date)
  const [extractions, messages] = await Promise.all([
    supabaseAdmin
      .from('lunaria_extractions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', USER_ID)
      .eq('session_date', date),
    supabaseAdmin
      .from('lunaria_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', USER_ID)
      .gte('created_at', range.startIso)
      .lt('created_at', range.endIso),
  ])

  return {
    extraction_count: extractions.count ?? 0,
    message_count:   messages.count ?? 0,
  }
}
