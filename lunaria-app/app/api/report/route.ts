import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, T } from '../../../lib/supabase'
import { getAuthenticatedUserId } from '../_auth'

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUserId()
  if ('response' in auth) return auth.response
  const { userId } = auth

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: logs } = await supabaseAdmin
    .from(T.routingLog)
    .select(`id, route_type, msg_score, win_score, model_used, selected_template_id, response_latency_ms, created_at,
             lunaria_routing_review(manual_flag_reason, user_followup_sentiment, route_mismatch_suspected, character_break_suspected, auto_flags)`)
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (!logs || logs.length === 0) {
    return NextResponse.json({ report: 'データなし', logs: [] })
  }

  const total = logs.length
  const reviews = logs.flatMap((l: any) => l.lunaria_routing_review ?? [])

  const mismatch    = reviews.filter((r: any) => r.route_mismatch_suspected).length
  const charBreak   = reviews.filter((r: any) => r.character_break_suspected).length
  const escalated   = reviews.filter((r: any) => r.user_followup_sentiment === 'escalated').length
  const dropped     = reviews.filter((r: any) => r.user_followup_sentiment === 'dropped').length

  const routeCounts = logs.reduce((acc: any, l: any) => {
    acc[l.route_type] = (acc[l.route_type] ?? 0) + 1
    return acc
  }, {})

  const avgLatency = Math.round(
    logs.reduce((s: number, l: any) => s + (l.response_latency_ms ?? 0), 0) / total
  )

  const templateMismatches = logs
    .filter((l: any) => l.route_type === 'light_probe')
    .filter((l: any) => (l.lunaria_routing_review ?? []).some((r: any) => r.route_mismatch_suspected))
    .map((l: any) => l.selected_template_id)
    .filter(Boolean)

  const charBreakDetails: string[] = reviews
    .flatMap((r: any) => r.auto_flags?.characterBreakReasons ?? [])

  const report = {
    period:     '直近24時間',
    total,
    routeCounts,
    avgLatencyMs: avgLatency,
    issues: {
      routeMismatch:    { count: mismatch,  pct: pct(mismatch, total) },
      characterBreak:   { count: charBreak, pct: pct(charBreak, total) },
      escalatedAfter:   { count: escalated, pct: pct(escalated, total) },
      dropped:          { count: dropped,   pct: pct(dropped, total) },
    },
    suggestions: buildSuggestions({ mismatch, charBreak, escalated, dropped, total, templateMismatches, charBreakDetails }),
  }

  return NextResponse.json({ report, logs: logs.slice(0, 20) })
}

function pct(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100)
}

function buildSuggestions(stats: any): string[] {
  const s: string[] = []
  if (stats.mismatch / stats.total > 0.1)
    s.push(`ルートミスマッチ ${pct(stats.mismatch, stats.total)}%：window_score の閾値を調整する可能性あり`)
  if (stats.charBreak / stats.total > 0.1)
    s.push(`キャラ崩れ ${pct(stats.charBreak, stats.total)}%：${[...new Set(stats.charBreakDetails)].join(' / ')} を重点修正`)
  if (stats.escalated / stats.total > 0.15)
    s.push(`escalated ${pct(stats.escalated, stats.total)}%：light_normal が軽すぎる可能性`)
  if (stats.dropped / stats.total > 0.2)
    s.push(`dropped ${pct(stats.dropped, stats.total)}%：返答がユーザーの気持ちとズレている可能性`)
  if (stats.templateMismatches.length > 0)
    s.push(`probe テンプレ要確認：${[...new Set(stats.templateMismatches)].join(', ')}`)
  if (s.length === 0) s.push('現時点で改善候補なし（良好）')
  return s
}
