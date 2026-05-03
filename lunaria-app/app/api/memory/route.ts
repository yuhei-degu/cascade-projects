import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

const USER_ID = '00000000-0000-0000-0000-000000000001'
const ACTIVE_STATUSES = ['candidate', 'active', 'confirmed']

function isMissingProvenanceColumn(error: any): boolean {
  const message = String(error?.message ?? '')
  return error?.code === 'PGRST204' || /source_date|source_message_id|confidence|status|last_confirmed_at|created_by|notes/i.test(message)
}

function clampLimit(value: string | null): number {
  const parsed = Number(value ?? '80')
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 200) : 80
}

function normalizeStatus(value: string | null): string {
  return value === 'all' || value === 'candidate' || value === 'active' || value === 'confirmed' || value === 'archived'
    ? value
    : 'active'
}

function toMemory(row: any) {
  return {
    id: row.id,
    type: row.type ?? 'other',
    content: row.content ?? '',
    score: row.score ?? null,
    hit_count: row.hit_count ?? null,
    last_seen: row.last_seen ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    memory_key: row.memory_key ?? null,
    memory_category: row.memory_category ?? null,
    source_date: row.source_date ?? null,
    source_message_id: row.source_message_id ?? null,
    confidence: row.confidence ?? null,
    status: row.status ?? 'active',
    last_confirmed_at: row.last_confirmed_at ?? null,
    created_by: row.created_by ?? 'llm',
    notes: row.notes ?? null,
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const status = normalizeStatus(req.nextUrl.searchParams.get('status'))
  const includeProfile = req.nextUrl.searchParams.get('profile') === '1'
  const limit = clampLimit(req.nextUrl.searchParams.get('limit'))

  let query = supabaseAdmin
    .from('lunaria_core_memory')
    .select('id, type, content, score, hit_count, last_seen, created_at, updated_at, memory_key, memory_category, source_date, source_message_id, confidence, status, last_confirmed_at, created_by, notes')
    .eq('user_id', USER_ID)
    .order('source_date', { ascending: false, nullsFirst: false })
    .order('last_seen', { ascending: false })
    .limit(limit)

  if (date) query = query.eq('source_date', date)
  if (status === 'active') query = query.in('status', ACTIVE_STATUSES)
  if (status !== 'all' && status !== 'active') query = query.eq('status', status)
  if (!includeProfile) query = query.or('memory_category.is.null,memory_category.neq.profile')

  let { data, error }: { data: any[] | null; error: any } = await query

  if (error && isMissingProvenanceColumn(error)) {
    let legacy = supabaseAdmin
      .from('lunaria_core_memory')
      .select('id, type, content, score, hit_count, last_seen, created_at, updated_at, memory_key, memory_category')
      .eq('user_id', USER_ID)
      .order('last_seen', { ascending: false })
      .limit(limit)

    if (!includeProfile) legacy = legacy.or('memory_category.is.null,memory_category.neq.profile')
    const legacyResult = await legacy
    data = legacyResult.data
    error = legacyResult.error
  }

  if (error) {
    console.error('[memory] list failed', error)
    return NextResponse.json({ ok: false, memories: [], stats: null }, { status: 500 })
  }

  const memories = (data ?? []).map(toMemory).filter(memory => memory.content.trim().length > 0)
  const stats = {
    total: memories.length,
    by_status: memories.reduce((acc: Record<string, number>, memory) => {
      acc[memory.status] = (acc[memory.status] ?? 0) + 1
      return acc
    }, {}),
    with_source_date: memories.filter(memory => Boolean(memory.source_date)).length,
  }

  return NextResponse.json({ ok: true, date: date ?? null, status, include_profile: includeProfile, memories, stats })
}
