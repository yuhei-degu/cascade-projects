import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '../_auth'
import { getWeeklyReview, generateWeeklyReview, getJstWeekStart } from '../../../lib/lunaria/weekly-review'

function normalizeWeekStart(value: string | null | undefined): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return getJstWeekStart(value)
  }
  return getJstWeekStart()
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUserId()
  if ('response' in auth) return auth.response
  const { userId } = auth

  const weekStart = normalizeWeekStart(req.nextUrl.searchParams.get('date'))

  try {
    const result = await getWeeklyReview(userId, weekStart)
    if (result === 'table_missing') {
      return NextResponse.json({ ok: false, error: 'weekly_reviews_table_missing', week_start: weekStart }, { status: 409 })
    }
    return NextResponse.json({ ok: true, week_start: weekStart, review: result })
  } catch (error) {
    console.error('[weekly-review] get failed', error)
    return NextResponse.json({ ok: false, error: 'weekly_review_get_failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUserId()
  if ('response' in auth) return auth.response
  const { userId } = auth

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // body なしは今週扱い
  }
  const weekStart = normalizeWeekStart(body?.date)

  try {
    const result = await generateWeeklyReview(userId, weekStart)
    if ('reason' in result) {
      const status = result.reason === 'table_missing' ? 409 : 200
      return NextResponse.json({ ok: false, reason: result.reason, week_start: weekStart }, { status })
    }
    return NextResponse.json({ ok: true, week_start: weekStart, review: result.review })
  } catch (error) {
    console.error('[weekly-review] generate failed', error)
    return NextResponse.json({ ok: false, error: 'weekly_review_generate_failed' }, { status: 500 })
  }
}
