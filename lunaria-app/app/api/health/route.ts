import { NextResponse } from 'next/server'
import { supabaseAdmin, T } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

// DB 到達性まで検査する。到達不能なら 503 を返す。
// 理由: フォールバック表示で画面が動いてしまうため、DB が死んでいても気づけない事故が実際に起きた。
export async function GET() {
  const started = Date.now()
  let db: 'ok' | 'unreachable' = 'unreachable'
  let detail: string | null = null

  try {
    const { error } = await supabaseAdmin.from(T.messages).select('id').limit(1)
    if (error) detail = error.message
    else db = 'ok'
  } catch (e) {
    detail = e instanceof Error ? e.message : 'unknown error'
  }

  return NextResponse.json(
    {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      detail,
      latency_ms: Date.now() - started,
      checked_at: new Date().toISOString(),
    },
    { status: db === 'ok' ? 200 : 503 },
  )
}
