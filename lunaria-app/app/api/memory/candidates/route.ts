import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { saveCoreMemory } from '../../../../lib/lunaria/memory'

const USER_ID = '00000000-0000-0000-0000-000000000001'

function isMissingCandidateTable(error: any): boolean {
  const message = String(error?.message ?? '')
  return error?.code === '42P01' || error?.code === 'PGRST205' || /lunaria_memory_candidates|schema cache/i.test(message)
}

function clampLimit(value: string | null): number {
  const parsed = Number(value ?? '80')
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 200) : 80
}

function normalizeStatus(value: string | null): string {
  return value === 'all' || value === 'pending' || value === 'approved' || value === 'rejected' || value === 'merged' || value === 'archived'
    ? value
    : 'pending'
}

function toCandidate(row: any) {
  return {
    id: row.id,
    candidate_type: row.candidate_type ?? 'other',
    content: row.content ?? '',
    source_type: row.source_type ?? 'conversation',
    source_id: row.source_id ?? null,
    source_date: row.source_date ?? null,
    source_message_ids: row.source_message_ids ?? [],
    confidence: row.confidence ?? null,
    status: row.status ?? 'pending',
    reason: row.reason ?? null,
    created_by: row.created_by ?? 'llm',
    reviewed_at: row.reviewed_at ?? null,
    reviewed_by: row.reviewed_by ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  }
}

function normalizeAction(value: unknown): 'approve' | 'reject' | 'archive' | 'pending' | null {
  return value === 'approve' || value === 'reject' || value === 'archive' || value === 'pending'
    ? value
    : null
}

function statusForAction(action: 'approve' | 'reject' | 'archive' | 'pending'): 'merged' | 'rejected' | 'archived' | 'pending' {
  if (action === 'approve') return 'merged'
  if (action === 'reject') return 'rejected'
  if (action === 'archive') return 'archived'
  return 'pending'
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const status = normalizeStatus(req.nextUrl.searchParams.get('status'))
  const limit = clampLimit(req.nextUrl.searchParams.get('limit'))

  let query = supabaseAdmin
    .from('lunaria_memory_candidates')
    .select('id, candidate_type, content, source_type, source_id, source_date, source_message_ids, confidence, status, reason, created_by, reviewed_at, reviewed_by, created_at, updated_at')
    .eq('user_id', USER_ID)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (date) query = query.eq('source_date', date)
  if (status !== 'all') query = query.eq('status', status)

  const { data, error } = await query

  if (error && isMissingCandidateTable(error)) {
    return NextResponse.json({ ok: true, table_ready: false, date: date ?? null, status, candidates: [], stats: { total: 0, by_status: {} } })
  }

  if (error) {
    console.error('[memory-candidates] list failed', error)
    return NextResponse.json({ ok: false, table_ready: true, candidates: [], stats: null }, { status: 500 })
  }

  const candidates = (data ?? []).map(toCandidate).filter(candidate => candidate.content.trim().length > 0)
  const stats = {
    total: candidates.length,
    by_status: candidates.reduce((acc: Record<string, number>, candidate) => {
      acc[candidate.status] = (acc[candidate.status] ?? 0) + 1
      return acc
    }, {}),
  }

  return NextResponse.json({ ok: true, table_ready: true, date: date ?? null, status, candidates, stats })
}

export async function PATCH(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const id = typeof body?.id === 'string' ? body.id : ''
  const action = normalizeAction(body?.action)

  if (!id || !action) {
    return NextResponse.json({ ok: false, error: 'invalid_candidate_action' }, { status: 400 })
  }

  const { data: row, error: findError } = await supabaseAdmin
    .from('lunaria_memory_candidates')
    .select('id, candidate_type, content, source_type, source_id, source_date, source_message_ids, confidence, status, reason, created_by, reviewed_at, reviewed_by, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', USER_ID)
    .is('deleted_at', null)
    .maybeSingle()

  if (findError && isMissingCandidateTable(findError)) {
    return NextResponse.json({ ok: false, table_ready: false, error: 'candidate_table_missing' }, { status: 409 })
  }

  if (findError) {
    console.error('[memory-candidates] review lookup failed', findError)
    return NextResponse.json({ ok: false, table_ready: true, error: 'candidate_lookup_failed' }, { status: 500 })
  }

  if (!row) {
    return NextResponse.json({ ok: false, table_ready: true, error: 'candidate_not_found' }, { status: 404 })
  }

  if (action === 'approve') {
    await saveCoreMemory(row.candidate_type ?? 'other', row.content ?? '', {
      sourceDate: row.source_date ?? null,
      sourceMessageId: Array.isArray(row.source_message_ids) ? row.source_message_ids[0] ?? null : null,
      confidence: row.confidence ?? null,
      status: 'confirmed',
      lastConfirmedAt: new Date().toISOString(),
      createdBy: 'user_explicit',
      notes: `approved from memory candidate ${row.id}`,
    })
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('lunaria_memory_candidates')
    .update({
      status: statusForAction(action),
      reviewed_at: new Date().toISOString(),
      reviewed_by: USER_ID,
    })
    .eq('id', id)
    .eq('user_id', USER_ID)
    .select('id, candidate_type, content, source_type, source_id, source_date, source_message_ids, confidence, status, reason, created_by, reviewed_at, reviewed_by, created_at, updated_at')
    .maybeSingle()

  if (updateError) {
    console.error('[memory-candidates] review update failed', updateError)
    return NextResponse.json({ ok: false, table_ready: true, error: 'candidate_update_failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    table_ready: true,
    action,
    candidate: updated ? toCandidate(updated) : toCandidate({ ...row, status: statusForAction(action) }),
  })
}
