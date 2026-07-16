import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { getAuthenticatedUserId } from '../_auth'
import { WORK_ITEM_KINDS } from '../../../lib/lunaria/types'
import type { WorkItemKind } from '../../../lib/lunaria/types'
import { getJstDateString } from '../../../lib/lunaria/date'

const T = 'lunaria_work_items'
const SELECT = 'id, date, project, kind, content, source_message_id, created_at, updated_at, deleted_at'

type WorkItemAction = 'edit' | 'delete' | 'restore'

function isMissingWorkItemsTable(error: any): boolean {
  const message = String(error?.message ?? '')
  return error?.code === '42P01' || error?.code === 'PGRST205' || /lunaria_work_items|schema cache/i.test(message)
}

function clampDays(value: string | null): number {
  const parsed = Number(value ?? '7')
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 31) : 7
}

function normalizeAction(value: unknown): WorkItemAction | null {
  return value === 'edit' || value === 'delete' || value === 'restore' ? value : null
}

function normalizeKind(value: unknown): WorkItemKind | null {
  return typeof value === 'string' && (WORK_ITEM_KINDS as readonly string[]).includes(value)
    ? (value as WorkItemKind)
    : null
}

function normalizeContent(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const content = value.trim()
  return content.length > 0 && content.length <= 300 ? content : null
}

function normalizeProject(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const project = value.trim()
  return project.length > 0 && project.length <= 100 ? project : null
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUserId()
  if ('response' in auth) return auth.response
  const { userId } = auth

  const date = req.nextUrl.searchParams.get('date')
  const days = clampDays(req.nextUrl.searchParams.get('days'))
  const includeDeleted = req.nextUrl.searchParams.get('deleted') === '1'

  let query = supabaseAdmin
    .from(T)
    .select(SELECT)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(300)

  if (date) {
    query = query.eq('date', date)
  } else {
    const since = getJstDateString(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000))
    query = query.gte('date', since)
  }
  if (!includeDeleted) query = query.is('deleted_at', null)

  const { data, error } = await query

  if (error) {
    if (isMissingWorkItemsTable(error)) {
      return NextResponse.json({ ok: false, error: 'work_items_table_missing', items: [] }, { status: 409 })
    }
    console.error('[work-items] list failed', error)
    return NextResponse.json({ ok: false, error: 'work_items_list_failed', items: [] }, { status: 500 })
  }

  const items = data ?? []
  const stats = {
    total: items.length,
    by_kind: items.reduce((acc: Record<string, number>, item: any) => {
      acc[item.kind] = (acc[item.kind] ?? 0) + 1
      return acc
    }, {}),
  }

  return NextResponse.json({ ok: true, date: date ?? null, days: date ? null : days, items, stats })
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthenticatedUserId()
  if ('response' in auth) return auth.response
  const { userId } = auth

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  const action = normalizeAction(body?.action)
  if (!id || !action) {
    return NextResponse.json({ ok: false, error: 'invalid_work_item_action' }, { status: 400 })
  }

  const { data: item, error: findError } = await supabaseAdmin
    .from(T)
    .select(SELECT)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (findError) {
    if (isMissingWorkItemsTable(findError)) {
      return NextResponse.json({ ok: false, error: 'work_items_table_missing' }, { status: 409 })
    }
    console.error('[work-items] find failed', findError)
    return NextResponse.json({ ok: false, error: 'work_item_find_failed' }, { status: 500 })
  }

  if (!item) {
    return NextResponse.json({ ok: false, error: 'work_item_not_found' }, { status: 404 })
  }

  const patch: Record<string, unknown> = {}

  if (action === 'delete') {
    patch.deleted_at = new Date().toISOString()
  }

  if (action === 'restore') {
    patch.deleted_at = null
  }

  if (action === 'edit') {
    const kind = normalizeKind(body?.kind)
    const content = body?.content !== undefined ? normalizeContent(body?.content) : undefined
    const projectProvided = body?.project !== undefined
    const project = projectProvided ? normalizeProject(body?.project) : undefined

    if (body?.kind !== undefined && !kind) {
      return NextResponse.json({ ok: false, error: 'invalid_work_item_kind' }, { status: 400 })
    }
    if (body?.content !== undefined && !content) {
      return NextResponse.json({ ok: false, error: 'invalid_work_item_content' }, { status: 400 })
    }
    if (kind) patch.kind = kind
    if (content) patch.content = content
    if (projectProvided) patch.project = project
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: 'empty_work_item_patch' }, { status: 400 })
    }
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from(T)
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select(SELECT)
    .maybeSingle()

  if (updateError) {
    // unique(user_id, date, kind, content) 衝突（kind/content の変更先が既存行と重複）
    if (updateError.code === '23505') {
      return NextResponse.json({ ok: false, error: 'duplicate_work_item' }, { status: 409 })
    }
    console.error('[work-items] update failed', updateError)
    return NextResponse.json({ ok: false, error: 'work_item_update_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, item: updated })
}
