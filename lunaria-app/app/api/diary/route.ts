import { NextRequest, NextResponse } from 'next/server'
import { generateDiary } from '../../../lib/lunaria/diary'
import { updateAffinity } from '../../../lib/lunaria/affinity'
import { supabaseAdmin } from '../../../lib/supabase'
import { getJstDateString, getJstDayRange } from '../../../lib/lunaria/date'
import { getAuthenticatedUserId } from '../_auth'

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserId()
    if ('response' in auth) return auth.response
    const { userId } = auth

    const body = await req.json()
    const date: string = body.date ?? getJstDateString()
    const stats = await getDiaryDayStats(date, userId)

    const diary = await generateDiary(date, userId)
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
      .eq('user_id', userId)
      .eq('session_date', date)

    const totalDelta = (extractions ?? []).reduce(
      (sum: number, extraction: any) => sum + (extraction.affinity_delta ?? 0),
      0,
    )
    const affinity = await updateAffinity(totalDelta, userId)

    return NextResponse.json({ ok: true, date, diary, affinity, ...stats })
  } catch (error) {
    console.error('[diary]', error)
    return NextResponse.json({ ok: false, error: true }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUserId()
  if ('response' in auth) return auth.response
  const { userId } = auth

  const date = req.nextUrl.searchParams.get('date') ?? getJstDateString()
  const meta = req.nextUrl.searchParams.get('meta') === '1'

  const { data } = await supabaseAdmin
    .from('lunaria_diary_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('diary_date', date)
    .maybeSingle()

  if (!meta) return NextResponse.json(data ?? null)

  const stats = await getDiaryDayStats(date, userId)
  return NextResponse.json({
    date,
    generated: Boolean(data),
    diary: data ?? null,
    ...stats,
  })
}

async function getDiaryDayStats(date: string, userId: string): Promise<{ extraction_count: number; message_count: number }> {
  const range = getJstDayRange(date)
  const [extractions, messages] = await Promise.all([
    supabaseAdmin
      .from('lunaria_extractions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('session_date', date),
    supabaseAdmin
      .from('lunaria_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', range.startIso)
      .lt('created_at', range.endIso),
  ])

  return {
    extraction_count: extractions.count ?? 0,
    message_count:   messages.count ?? 0,
  }
}
