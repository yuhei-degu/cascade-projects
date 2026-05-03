import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { getJstDayRange } from '../../../lib/lunaria/date'

const USER_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '60')
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 500) : 60

  let query = supabaseAdmin
    .from('lunaria_messages')
    .select('role, content, created_at')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(date ? 500 : limit)

  if (date) {
    try {
      const range = getJstDayRange(date)
      query = query.gte('created_at', range.startIso).lt('created_at', range.endIso)
    } catch {
      return NextResponse.json({ messages: [], error: 'invalid_date' }, { status: 400 })
    }
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ messages: [] })
  }

  const messages = (data ?? [])
    .sort((a: any, b: any) => {
      const tDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (tDiff !== 0) return tDiff
      // 同じ created_at は user → assistant の順に固定
      return a.role === 'user' ? -1 : 1
    })
    .map((m: any) => ({
      role:    m.role === 'ai' ? 'assistant' : m.role,
      content: m.content,
      ts:      new Date(m.created_at).getTime(),
    }))

  return NextResponse.json({ date: date ?? null, messages })
}
