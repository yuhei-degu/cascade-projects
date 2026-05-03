import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getJstDateString, getJstMonthRange } from '../../../../lib/lunaria/date'

const USER_ID = '00000000-0000-0000-0000-000000000001'

interface MonthDay {
  date: string
  generated: boolean
  message_count: number
  extraction_count: number
  importance: number | null
  luna_comment: string | null
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month') ?? getJstDateString().slice(0, 7)

  let range
  try {
    range = getJstMonthRange(month)
  } catch {
    return NextResponse.json({ error: 'invalid_month', days: [] }, { status: 400 })
  }

  const [diaries, messages, extractions] = await Promise.all([
    supabaseAdmin
      .from('lunaria_diary_logs')
      .select('diary_date, importance, luna_comment')
      .eq('user_id', USER_ID)
      .gte('diary_date', range.startDate)
      .lt('diary_date', range.endDate)
      .order('diary_date', { ascending: false }),
    supabaseAdmin
      .from('lunaria_messages')
      .select('created_at')
      .eq('user_id', USER_ID)
      .gte('created_at', range.startIso)
      .lt('created_at', range.endIso)
      .limit(5000),
    supabaseAdmin
      .from('lunaria_extractions')
      .select('session_date')
      .eq('user_id', USER_ID)
      .gte('session_date', range.startDate)
      .lt('session_date', range.endDate)
      .limit(1000),
  ])

  if (diaries.error || messages.error || extractions.error) {
    return NextResponse.json({ error: 'query_failed', days: [] }, { status: 500 })
  }

  const byDate = new Map<string, MonthDay>()
  const messageCounts = new Map<string, number>()
  const extractionCounts = new Map<string, number>()

  for (const row of messages.data ?? []) {
    increment(messageCounts, getJstDateString(new Date(row.created_at)))
  }

  for (const row of extractions.data ?? []) {
    if (row.session_date) increment(extractionCounts, String(row.session_date))
  }

  for (const row of diaries.data ?? []) {
    const date = String(row.diary_date)
    byDate.set(date, {
      date,
      generated: true,
      message_count: messageCounts.get(date) ?? 0,
      extraction_count: extractionCounts.get(date) ?? 0,
      importance: row.importance ?? null,
      luna_comment: row.luna_comment ?? null,
    })
  }

  for (const [date, count] of messageCounts.entries()) {
    if (!byDate.has(date)) {
      byDate.set(date, {
        date,
        generated: false,
        message_count: count,
        extraction_count: extractionCounts.get(date) ?? 0,
        importance: null,
        luna_comment: null,
      })
    }
  }

  for (const [date, count] of extractionCounts.entries()) {
    const existing = byDate.get(date)
    if (existing) {
      existing.extraction_count = count
    } else {
      byDate.set(date, {
        date,
        generated: false,
        message_count: 0,
        extraction_count: count,
        importance: null,
        luna_comment: null,
      })
    }
  }

  const days = Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date))
  return NextResponse.json({ month, days })
}

