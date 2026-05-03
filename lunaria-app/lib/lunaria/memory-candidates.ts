import { supabaseAdmin } from '../supabase'
import { saveCoreMemory } from './memory'

const USER_ID = '00000000-0000-0000-0000-000000000001'
const T = { candidates: 'lunaria_memory_candidates' } as const

export type MemoryCandidateType = 'value' | 'pattern' | 'goal' | 'trigger' | 'name' | 'other'
export type MemoryCandidateSourceType = 'conversation' | 'diary' | 'profile' | 'manual'
export type MemoryCandidateStatus = 'pending' | 'approved' | 'rejected' | 'merged' | 'archived'

export interface SaveMemoryCandidateOptions {
  sourceType?: MemoryCandidateSourceType
  sourceId?: string | null
  sourceDate?: string | null
  sourceMessageIds?: string[]
  confidence?: number | null
  reason?: string | null
  createdBy?: 'llm' | 'user_explicit' | 'system' | 'migration'
  legacyFallbackToCoreMemory?: boolean
}

function isMissingCandidateTable(error: any): boolean {
  const message = String(error?.message ?? '')
  return error?.code === '42P01' || error?.code === 'PGRST205' || /lunaria_memory_candidates|schema cache/i.test(message)
}

function normalizeConfidence(confidence: number | null | undefined): number | null {
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return null
  return Math.min(1, Math.max(0, Number(confidence.toFixed(2))))
}

function normalizeType(type: string): MemoryCandidateType {
  return type === 'value' || type === 'pattern' || type === 'goal' || type === 'trigger' || type === 'name'
    ? type
    : 'other'
}

export async function saveMemoryCandidate(
  type: string,
  content: string,
  options: SaveMemoryCandidateOptions = {},
): Promise<{ saved: boolean; fallback: boolean }> {
  const normalized = (content ?? '').trim()
  if (!normalized) return { saved: false, fallback: false }

  const candidateType = normalizeType(type)
  const payload = {
    user_id: USER_ID,
    candidate_type: candidateType,
    content: normalized,
    source_type: options.sourceType ?? 'conversation',
    source_id: options.sourceId ?? null,
    source_date: options.sourceDate ?? null,
    source_message_ids: options.sourceMessageIds ?? [],
    confidence: normalizeConfidence(options.confidence),
    status: 'pending' as MemoryCandidateStatus,
    reason: options.reason ?? null,
    created_by: options.createdBy ?? 'llm',
  }

  const { error } = await supabaseAdmin
    .from(T.candidates)
    .upsert(payload, { onConflict: 'user_id,source_type,source_date,candidate_type,content' })

  if (!error) return { saved: true, fallback: false }

  if (!isMissingCandidateTable(error)) throw error

  if (options.legacyFallbackToCoreMemory !== false && candidateType !== 'name') {
    await saveCoreMemory(candidateType, normalized, {
      sourceDate: options.sourceDate,
      confidence: options.confidence,
      status: 'candidate',
      createdBy: 'llm',
      notes: 'legacy fallback from memory candidate before 019_memory_candidates was applied',
    })
    return { saved: true, fallback: true }
  }

  return { saved: false, fallback: false }
}
