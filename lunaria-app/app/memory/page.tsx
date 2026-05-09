'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface MemoryItem {
  id: string
  type: string
  content: string
  score: number | null
  hit_count: number | null
  last_seen: string | null
  created_at: string | null
  updated_at: string | null
  memory_key: string | null
  memory_category: string | null
  source_date: string | null
  source_message_id: string | null
  confidence: number | null
  status: string
  last_confirmed_at: string | null
  created_by: string
  notes: string | null
}

interface MemoryResponse {
  ok: boolean
  date: string | null
  status: string
  memories: MemoryItem[]
  stats: { total: number; by_status: Record<string, number>; with_source_date: number } | null
}

interface MemoryCandidate {
  id: string
  candidate_type: string
  content: string
  source_type: string
  source_date: string | null
  source_message_ids: string[]
  confidence: number | null
  status: string
  reason: string | null
  created_by: string
  created_at: string | null
}

interface MemoryCandidateResponse {
  ok: boolean
  table_ready: boolean
  status: string
  candidates: MemoryCandidate[]
  stats: { total: number; by_status: Record<string, number> } | null
}

type CandidateAction = 'approve' | 'reject' | 'archive' | 'pending'

const statusLabels: Record<string, string> = {
  active: 'Active memory',
  candidate: 'Candidate',
  confirmed: 'Confirmed',
  archived: 'Archived',
  deleted: 'Deleted',
}

const typeLabels: Record<string, string> = {
  value: 'Value',
  pattern: 'Pattern',
  goal: 'Goal',
  trigger: 'Trigger',
  mid: 'Mid-term note',
  other: 'Memo',
}

function todayJst(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatDate(value: string | null): string {
  if (!value) return 'No date'
  const date = new Date(`${value}T12:00:00+09:00`)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function formatTime(value: string | null): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function confidenceLabel(value: number | null): string {
  if (typeof value !== 'number') return 'Unset'
  return `${Math.round(value * 100)}%`
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={statStyle}>
      <span style={{ color: '#8f8372' }}>{label}</span>
      <span style={{ color: '#ddd5c5', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function MemoryCard({ memory }: { memory: MemoryItem }) {
  return (
    <article style={memoryCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={typeBadgeStyle}>{typeLabels[memory.type] ?? memory.type}</span>
          <span style={statusBadgeStyle}>{statusLabels[memory.status] ?? memory.status}</span>
          {memory.source_date && (
            <Link href={`/diary?date=${encodeURIComponent(memory.source_date)}`} style={dateBadgeStyle}>
              {formatDate(memory.source_date)} diary
            </Link>
          )}
        </div>
        <span style={{ color: '#c8a060', fontSize: 12, whiteSpace: 'nowrap' }}>score {memory.score ?? '-'}</span>
      </div>

      <p style={memoryContentStyle}>{memory.content}</p>

      <div style={memoryMetaGridStyle}>
        <Stat label="Confidence" value={confidenceLabel(memory.confidence)} />
        <Stat label="Seen" value={memory.hit_count ?? '-'} />
        <Stat label="Last seen" value={formatTime(memory.last_seen)} />
        <Stat label="Created by" value={memory.created_by} />
      </div>

      {memory.notes && <p style={notesStyle}>{memory.notes}</p>}
    </article>
  )
}

function CandidateCard({
  candidate,
  busy,
  onAction,
}: {
  candidate: MemoryCandidate
  busy: boolean
  onAction: (id: string, action: CandidateAction) => void
}) {
  return (
    <article style={candidateCardStyle}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={typeBadgeStyle}>{typeLabels[candidate.candidate_type] ?? candidate.candidate_type}</span>
        <span style={candidateBadgeStyle}>Needs review</span>
        {candidate.source_date && (
          <Link href={`/diary?date=${encodeURIComponent(candidate.source_date)}`} style={dateBadgeStyle}>
            {formatDate(candidate.source_date)} diary
          </Link>
        )}
      </div>
      <p style={memoryContentStyle}>{candidate.content}</p>
      {candidate.reason && <p style={notesStyle}>Why Luna noticed it: {candidate.reason}</p>}
      <div style={memoryMetaGridStyle}>
        <Stat label="Confidence" value={confidenceLabel(candidate.confidence)} />
        <Stat label="Source" value={candidate.source_type} />
        <Stat label="Created by" value={candidate.created_by} />
        <Stat label="Created" value={formatTime(candidate.created_at)} />
      </div>
      <div style={candidateActionRowStyle}>
        <button type="button" onClick={() => onAction(candidate.id, 'approve')} disabled={busy} style={primaryActionButtonStyle}>
          {busy ? 'Saving...' : 'Remember this'}
        </button>
        <button type="button" onClick={() => onAction(candidate.id, 'archive')} disabled={busy} style={secondaryActionButtonStyle}>
          Review later
        </button>
        <button type="button" onClick={() => onAction(candidate.id, 'reject')} disabled={busy} style={quietActionButtonStyle}>
          Remove from shelf
        </button>
      </div>
    </article>
  )
}

export default function MemoryPage() {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('active')
  const [includeProfile, setIncludeProfile] = useState(false)
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [stats, setStats] = useState<MemoryResponse['stats']>(null)
  const [candidateTableReady, setCandidateTableReady] = useState(false)
  const [candidates, setCandidates] = useState<MemoryCandidate[]>([])
  const [candidateStats, setCandidateStats] = useState<MemoryCandidateResponse['stats']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [candidateBusyId, setCandidateBusyId] = useState<string | null>(null)

  const loadMemories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status, limit: '120' })
      if (date) params.set('date', date)
      if (includeProfile) params.set('profile', '1')
      const candidateParams = new URLSearchParams({ status: 'pending', limit: '40' })
      if (date) candidateParams.set('date', date)
      const [memoryRes, candidateRes] = await Promise.all([
        fetch(`/api/memory?${params.toString()}`, { cache: 'no-store' }),
        fetch(`/api/memory/candidates?${candidateParams.toString()}`, { cache: 'no-store' }),
      ])
      const data = await memoryRes.json() as MemoryResponse
      const candidateData = await candidateRes.json() as MemoryCandidateResponse
      if (!memoryRes.ok || !data.ok || !candidateRes.ok || !candidateData.ok) throw new Error('load_failed')
      setMemories(Array.isArray(data.memories) ? data.memories : [])
      setStats(data.stats)
      setCandidateTableReady(Boolean(candidateData.table_ready))
      setCandidates(Array.isArray(candidateData.candidates) ? candidateData.candidates : [])
      setCandidateStats(candidateData.stats)
    } catch {
      setError('The memory shelf could not be opened. Please wait a moment and try again.')
      setMemories([])
      setStats(null)
      setCandidateTableReady(false)
      setCandidates([])
      setCandidateStats(null)
    } finally {
      setLoading(false)
    }
  }, [date, includeProfile, status])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const reviewCandidate = useCallback(async (id: string, action: CandidateAction) => {
    setCandidateBusyId(id)
    setError(null)
    try {
      const res = await fetch('/api/memory/candidates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? 'review_failed')
      setCandidates(current => current.filter(candidate => candidate.id !== id))
      setCandidateStats(current => current
        ? {
            ...current,
            total: Math.max(0, current.total - 1),
            by_status: {
              ...current.by_status,
              pending: Math.max(0, (current.by_status.pending ?? 1) - 1),
            },
          }
        : current)
      if (action === 'approve') await loadMemories()
    } catch {
      setError('The memory candidate could not be updated. Please wait a moment and try again.')
    } finally {
      setCandidateBusyId(null)
    }
  }, [loadMemories])

  const grouped = useMemo(() => {
    const map = new Map<string, MemoryItem[]>()
    for (const memory of memories) {
      const key = memory.source_date ?? 'No date'
      map.set(key, [...(map.get(key) ?? []), memory])
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [memories])

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <Link href="/" style={backLinkStyle}>Back to Luna's room</Link>
            <p style={eyebrowStyle}>Lunaria Memory</p>
            <h1 style={titleStyle}>Memory Shelf</h1>
            <p style={leadStyle}>
              A place to review what Luna may carry forward. Diary entries remember the day; memories are the small lights Luna may reference later.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/diary" style={pillLinkStyle}>Diary</Link>
            <Link href="/gacha" style={pillLinkStyle}>Moonbox</Link>
          </div>
        </header>

        <section style={toolbarStyle}>
          <input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
            style={dateInputStyle}
            aria-label="Memory source date"
          />
          <button onClick={() => setDate(todayJst())} style={navButtonStyle}>Today</button>
          <button onClick={() => setDate('')} style={navButtonStyle}>All dates</button>
          <select value={status} onChange={event => setStatus(event.target.value)} style={selectStyle} aria-label="Memory status">
            <option value="active">Active memories</option>
            <option value="candidate">Candidates</option>
            <option value="confirmed">Confirmed</option>
            <option value="archived">Archived</option>
            <option value="all">All statuses</option>
          </select>
          <label style={checkLabelStyle}>
            <input type="checkbox" checked={includeProfile} onChange={event => setIncludeProfile(event.target.checked)} />
            Include profile-like memories
          </label>
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={contentGridStyle}>
          <div style={{ display: 'grid', gap: 16 }}>
            <Section title={date ? `${formatDate(date)} memories` : 'All memories'}>
              {loading ? (
                <p style={mutedTextStyle}>Opening the memory shelf...</p>
              ) : grouped.length === 0 ? (
                <div>
                  <p style={emptyTitleStyle}>No memories match this filter yet.</p>
                  <p style={mutedTextStyle}>Try removing the date filter or switching to another status.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 18 }}>
                  {grouped.map(([groupDate, items]) => (
                    <div key={groupDate} style={{ display: 'grid', gap: 10 }}>
                      <h3 style={groupTitleStyle}>{groupDate === 'No date' ? groupDate : formatDate(groupDate)}</h3>
                      {items.map(memory => <MemoryCard key={memory.id} memory={memory} />)}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Section title="Memory candidates">
              {loading ? (
                <p style={mutedTextStyle}>Opening candidate shelf...</p>
              ) : !candidateTableReady ? (
                <div>
                  <p style={emptyTitleStyle}>Candidate shelf is not ready yet.</p>
                  <p style={mutedTextStyle}>Apply `019_memory_candidates.sql` to review memory candidates here.</p>
                </div>
              ) : candidates.length === 0 ? (
                <p style={mutedTextStyle}>No pending memory candidates right now.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {candidates.slice(0, 5).map(candidate => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      busy={candidateBusyId === candidate.id}
                      onAction={reviewCandidate}
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Shelf status">
              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <Stat label="Shown" value={stats?.total ?? memories.length} />
                <Stat label="With source date" value={stats?.with_source_date ?? 0} />
                <Stat label="Candidates" value={stats?.by_status?.candidate ?? 0} />
                <Stat label="Active" value={stats?.by_status?.active ?? 0} />
                <Stat label="Confirmed" value={stats?.by_status?.confirmed ?? 0} />
                <Stat label="Pending review" value={candidateTableReady ? (candidateStats?.total ?? candidates.length) : 'not applied'} />
              </div>
            </Section>

            <Section title="How to read this">
              <div style={{ display: 'grid', gap: 10 }}>
                <p style={mutedTextStyle}>Diary is a record of a day. Memory is what Luna may use later.</p>
                <p style={mutedTextStyle}>Candidates are suggestions. They only become durable memory when you approve them.</p>
                <p style={mutedTextStyle}>Profile-like memories are hidden by default so stable settings do not get mixed with everyday memories.</p>
              </div>
            </Section>
          </aside>
        </div>
      </div>
    </main>
  )
}

const pageStyle: CSSProperties = {
  minHeight: '100dvh',
  overflowY: 'auto',
  background: `
    radial-gradient(circle at 14% 8%, rgba(159,207,189,.16), transparent 32%),
    radial-gradient(circle at 84% 12%, rgba(200,160,96,.14), transparent 30%),
    radial-gradient(circle at 50% 95%, rgba(127,179,213,.11), transparent 34%),
    linear-gradient(180deg, #0d0d0b 0%, #15120f 58%, #090908 100%)
  `,
  color: '#ddd5c5',
  padding: '18px clamp(16px, 4vw, 46px) 40px',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  marginBottom: 26,
}

const backLinkStyle: CSSProperties = {
  color: '#766d60',
  textDecoration: 'none',
  fontSize: 12,
}

const eyebrowStyle: CSSProperties = {
  color: '#9fcfbd',
  fontSize: 11,
  letterSpacing: '.22em',
  marginTop: 18,
  textTransform: 'uppercase',
}

const titleStyle: CSSProperties = {
  fontSize: 'clamp(34px, 7vw, 68px)',
  lineHeight: .98,
  marginTop: 10,
  letterSpacing: '.04em',
}

const leadStyle: CSSProperties = {
  color: '#9f9485',
  fontSize: 14,
  lineHeight: 1.9,
  marginTop: 12,
  maxWidth: 650,
}

const pillLinkStyle: CSSProperties = {
  color: '#c8a060',
  textDecoration: 'none',
  border: '1px solid rgba(200,160,96,.24)',
  borderRadius: 999,
  padding: '9px 13px',
  fontSize: 12,
  background: 'rgba(200,160,96,.06)',
  whiteSpace: 'nowrap',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
  border: '1px solid rgba(255,255,255,.08)',
  background: 'rgba(14,13,11,.62)',
  borderRadius: 22,
  padding: 12,
  marginBottom: 18,
  backdropFilter: 'blur(12px)',
}

const dateInputStyle: CSSProperties = {
  colorScheme: 'dark',
  background: '#171410',
  color: '#ddd5c5',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 12,
  padding: '9px 12px',
  fontSize: 14,
}

const selectStyle: CSSProperties = {
  ...dateInputStyle,
  minWidth: 150,
}

const navButtonStyle: CSSProperties = {
  background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 999,
  color: '#c8bda9',
  cursor: 'pointer',
  fontSize: 12,
  padding: '9px 13px',
}

const checkLabelStyle: CSSProperties = {
  display: 'inline-flex',
  gap: 7,
  alignItems: 'center',
  color: '#9f9485',
  fontSize: 12,
}

const contentGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: 16,
}

const sectionStyle: CSSProperties = {
  border: '1px solid rgba(230,210,170,.13)',
  background: 'linear-gradient(145deg, rgba(31,27,21,.86), rgba(15,14,12,.94))',
  borderRadius: 24,
  padding: 18,
  boxShadow: '0 18px 60px rgba(0,0,0,.28)',
}

const sectionTitleStyle: CSSProperties = {
  color: '#c8a060',
  fontSize: 12,
  letterSpacing: '.16em',
  marginBottom: 12,
  textTransform: 'uppercase',
}

const memoryCardStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 18,
  background: 'linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018))',
  padding: 14,
}

const candidateCardStyle: CSSProperties = {
  ...memoryCardStyle,
  borderColor: 'rgba(216,182,109,.18)',
  background: 'linear-gradient(145deg, rgba(216,182,109,.07), rgba(255,255,255,.02))',
}

const memoryContentStyle: CSSProperties = {
  color: '#eee0ca',
  fontSize: 15,
  lineHeight: 1.85,
  marginBottom: 13,
}

const memoryMetaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 8,
  fontSize: 12,
}

const typeBadgeStyle: CSSProperties = {
  color: '#b9d8e8',
  border: '1px solid rgba(127,179,213,.22)',
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  background: 'rgba(127,179,213,.07)',
}

const statusBadgeStyle: CSSProperties = {
  color: '#9fcfbd',
  border: '1px solid rgba(159,207,189,.22)',
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  background: 'rgba(159,207,189,.07)',
}

const candidateBadgeStyle: CSSProperties = {
  color: '#d8b66d',
  border: '1px solid rgba(216,182,109,.24)',
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  background: 'rgba(216,182,109,.08)',
}

const dateBadgeStyle: CSSProperties = {
  color: '#d8b66d',
  border: '1px solid rgba(216,182,109,.2)',
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  background: 'rgba(216,182,109,.07)',
  textDecoration: 'none',
}

const notesStyle: CSSProperties = {
  color: '#8f8372',
  borderTop: '1px solid rgba(255,255,255,.07)',
  fontSize: 12,
  lineHeight: 1.7,
  marginTop: 12,
  paddingTop: 10,
}

const candidateActionRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 14,
  paddingTop: 12,
  borderTop: '1px solid rgba(255,255,255,.07)',
}

const actionButtonBaseStyle: CSSProperties = {
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: 12,
  padding: '8px 11px',
}

const primaryActionButtonStyle: CSSProperties = {
  ...actionButtonBaseStyle,
  background: 'linear-gradient(135deg, rgba(216,182,109,.95), rgba(190,139,74,.95))',
  border: '1px solid rgba(255,236,179,.28)',
  color: '#15120f',
  fontWeight: 700,
}

const secondaryActionButtonStyle: CSSProperties = {
  ...actionButtonBaseStyle,
  background: 'rgba(159,207,189,.08)',
  border: '1px solid rgba(159,207,189,.22)',
  color: '#9fcfbd',
}

const quietActionButtonStyle: CSSProperties = {
  ...actionButtonBaseStyle,
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.1)',
  color: '#a79b8b',
}

const statStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
}

const groupTitleStyle: CSSProperties = {
  color: '#9fcfbd',
  fontSize: 13,
  letterSpacing: '.08em',
}

const emptyTitleStyle: CSSProperties = {
  color: '#ddd5c5',
  fontSize: 15,
  lineHeight: 1.8,
  marginBottom: 8,
}

const mutedTextStyle: CSSProperties = {
  color: '#746b60',
  fontSize: 13,
  lineHeight: 1.8,
}

const errorStyle: CSSProperties = {
  color: '#e6a58d',
  fontSize: 13,
  marginBottom: 14,
  padding: '10px 12px',
  border: '1px solid rgba(230,165,141,.22)',
  borderRadius: 14,
  background: 'rgba(230,165,141,.06)',
}
