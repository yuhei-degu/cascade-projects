'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ApiErrorState, { DEFAULT_API_ERROR_MESSAGE } from '@/components/ApiErrorState'

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
type MemoryAction = 'archive' | 'restore' | 'confirm' | 'edit'

const statusLabels: Record<string, string> = {
  active: '有効な記憶',
  candidate: '候補',
  confirmed: '確認済み',
  archived: 'アーカイブ済み',
  deleted: '削除済み',
}

const typeLabels: Record<string, string> = {
  value: '価値観',
  pattern: '傾向',
  goal: '目標',
  trigger: 'きっかけ',
  mid: '中期メモ',
  other: 'メモ',
}

const sourceTypeLabels: Record<string, string> = {
  conversation: '会話',
  diary: '日記',
  profile: 'プロフィール',
  manual: '手動メモ',
  game: 'ゲーム引き継ぎ',
}

const candidateStatusLabels: Record<string, string> = {
  pending: '確認待ち',
  archived: 'あとで確認',
  rejected: '外した候補',
  merged: '記憶済み',
  all: 'すべて',
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
  if (!value) return '日付なし'
  const date = new Date(`${value}T12:00:00+09:00`)
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function formatTime(value: string | null): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function confidenceLabel(value: number | null): string {
  if (typeof value !== 'number') return '未設定'
  return `${Math.round(value * 100)}%`
}

function sourceTypeLabel(value: string): string {
  return sourceTypeLabels[value] ?? value
}

function sourceDateLabel(value: string): string {
  return value === 'game' ? 'ゲームの日' : '日記'
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
      <span style={{ color: 'var(--luna-muted)' }}>{label}</span>
      <span style={{ color: 'var(--luna-text-soft)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div aria-label={label} style={{ display: 'grid', gap: 12 }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="luna-skeleton" style={{ height: 118, padding: 14 }}>
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '34%', marginBottom: 16 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '92%', marginBottom: 10 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '76%' }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="luna-empty">
      <span className="luna-empty-icon" aria-hidden="true">◇</span>
      <strong className="luna-empty-title">{title}</strong>
      <p className="luna-empty-copy">{copy}</p>
    </div>
  )
}

function MemoryCard({
  memory,
  busy,
  onAction,
}: {
  memory: MemoryItem
  busy: boolean
  onAction: (memory: MemoryItem, action: MemoryAction) => void
}) {
  const isArchived = memory.status === 'archived'
  const isDeleted = memory.status === 'deleted'

  return (
    <article style={memoryCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={typeBadgeStyle}>{typeLabels[memory.type] ?? memory.type}</span>
          <span style={statusBadgeStyle}>{statusLabels[memory.status] ?? memory.status}</span>
          {memory.source_date && (
            <Link href={`/diary?date=${encodeURIComponent(memory.source_date)}`} style={dateBadgeStyle}>
              {formatDate(memory.source_date)}の日記
            </Link>
          )}
        </div>
        <span style={{ color: 'var(--luna-gold-strong)', fontSize: 12, whiteSpace: 'nowrap' }}>スコア {memory.score ?? '-'}</span>
      </div>

      <p style={memoryContentStyle}>{memory.content}</p>

      <div style={memoryMetaGridStyle}>
        <Stat label="確信度" value={confidenceLabel(memory.confidence)} />
        <Stat label="参照回数" value={memory.hit_count ?? '-'} />
        <Stat label="最後の参照" value={formatTime(memory.last_seen)} />
        <Stat label="作成者" value={memory.created_by} />
      </div>

      {memory.notes && <p style={notesStyle}>{memory.notes}</p>}

      {!isDeleted && (
        <div style={candidateActionRowStyle}>
          {!isArchived && memory.status !== 'confirmed' && (
            <button type="button" onClick={() => onAction(memory, 'confirm')} disabled={busy} style={primaryActionButtonStyle}>
              {busy ? '保存中...' : '記憶を確認'}
            </button>
          )}
          {!isArchived && (
            <button type="button" onClick={() => onAction(memory, 'archive')} disabled={busy} style={secondaryActionButtonStyle}>
              {busy ? '保存中...' : 'アーカイブ'}
            </button>
          )}
          {isArchived && (
            <button type="button" onClick={() => onAction(memory, 'restore')} disabled={busy} style={secondaryActionButtonStyle}>
              {busy ? '復元中...' : '復元'}
            </button>
          )}
          <button type="button" onClick={() => onAction(memory, 'edit')} disabled={busy} style={quietActionButtonStyle}>
            文面を編集
          </button>
        </div>
      )}
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
  const isPending = candidate.status === 'pending'
  const canRestore = candidate.status === 'archived' || candidate.status === 'rejected'
  const isGameCandidate = candidate.source_type === 'game'

  return (
    <article style={candidateCardStyle}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={typeBadgeStyle}>{typeLabels[candidate.candidate_type] ?? candidate.candidate_type}</span>
        <span style={candidateBadgeStyle}>{candidate.status === 'pending' ? '確認待ち' : (statusLabels[candidate.status] ?? candidate.status)}</span>
        {candidate.source_date && (
          <Link href={`/diary?date=${encodeURIComponent(candidate.source_date)}`} style={dateBadgeStyle}>
            {formatDate(candidate.source_date)} {sourceDateLabel(candidate.source_type)}
          </Link>
        )}
      </div>
      <p style={memoryContentStyle}>{candidate.content}</p>
      {candidate.reason && <p style={notesStyle}>ルナが気づいた理由: {candidate.reason}</p>}
      <div style={memoryMetaGridStyle}>
        <Stat label="確信度" value={confidenceLabel(candidate.confidence)} />
        <Stat label="出典" value={sourceTypeLabel(candidate.source_type)} />
        <Stat label="作成者" value={candidate.created_by} />
        <Stat label="作成日時" value={formatTime(candidate.created_at)} />
      </div>
      {(isPending || canRestore) && (
        <div style={candidateActionRowStyle}>
          {isPending && (
            <>
              <button type="button" onClick={() => onAction(candidate.id, 'approve')} disabled={busy} style={primaryActionButtonStyle}>
                {busy ? '保存中...' : 'これを覚える'}
              </button>
              <button type="button" onClick={() => onAction(candidate.id, 'archive')} disabled={busy} style={secondaryActionButtonStyle}>
                あとで確認
              </button>
              <button type="button" onClick={() => onAction(candidate.id, 'reject')} disabled={busy} style={quietActionButtonStyle}>
                棚から外す
              </button>
            </>
          )}
          {canRestore && (
            <button type="button" onClick={() => onAction(candidate.id, 'pending')} disabled={busy} style={secondaryActionButtonStyle}>
              {busy ? '復元中...' : '確認待ちに戻す'}
            </button>
          )}
        </div>
      )}
      {isGameCandidate && (
        <div aria-label="Game carryover return" style={gameCarryoverReturnStyle}>
          <span>承認後、部屋に戻ってこの結果を使うようルナに話しかけてください。</span>
          <Link href="/" aria-label="承認したゲーム引き継ぎを持ってLunariaの部屋に戻る" style={returnRoomLinkStyle}>
            部屋へ
          </Link>
        </div>
      )}
    </article>
  )
}

export default function MemoryPage() {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('active')
  const [includeProfile, setIncludeProfile] = useState(false)
  const [candidateStatus, setCandidateStatus] = useState('pending')
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [stats, setStats] = useState<MemoryResponse['stats']>(null)
  const [candidateTableReady, setCandidateTableReady] = useState(false)
  const [candidates, setCandidates] = useState<MemoryCandidate[]>([])
  const [candidateStats, setCandidateStats] = useState<MemoryCandidateResponse['stats']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [memoryBusyId, setMemoryBusyId] = useState<string | null>(null)
  const [candidateBusyId, setCandidateBusyId] = useState<string | null>(null)

  const loadMemories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status, limit: '120' })
      if (date) params.set('date', date)
      if (includeProfile) params.set('profile', '1')
      const candidateParams = new URLSearchParams({ status: candidateStatus, limit: '40' })
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
      setError(DEFAULT_API_ERROR_MESSAGE)
      setMemories([])
      setStats(null)
      setCandidateTableReady(false)
      setCandidates([])
      setCandidateStats(null)
    } finally {
      setLoading(false)
    }
  }, [candidateStatus, date, includeProfile, status])

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
      await loadMemories()
    } catch {
      setError('記憶候補を更新できませんでした。もう一度お試しください。')
    } finally {
      setCandidateBusyId(null)
    }
  }, [loadMemories])

  const updateMemory = useCallback(async (memory: MemoryItem, action: MemoryAction) => {
    setMemoryBusyId(memory.id)
    setError(null)

    let content: string | undefined
    if (action === 'edit') {
      const nextContent = window.prompt('記憶の文面を編集', memory.content)
      if (nextContent === null) {
        setMemoryBusyId(null)
        return
      }
      content = nextContent.trim()
      if (!content || content === memory.content.trim()) {
        setMemoryBusyId(null)
        return
      }
    }

    try {
      const res = await fetch('/api/memory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memory.id, action, content }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? 'memory_update_failed')
      await loadMemories()
    } catch {
      setError('記憶を更新できませんでした。もう一度お試しください。')
    } finally {
      setMemoryBusyId(null)
    }
  }, [loadMemories])

  const grouped = useMemo(() => {
    const map = new Map<string, MemoryItem[]>()
    for (const memory of memories) {
      const key = memory.source_date ?? '日付なし'
      map.set(key, [...(map.get(key) ?? []), memory])
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [memories])
  const gameCandidateCount = useMemo(() => candidates.filter(candidate => candidate.source_type === 'game').length, [candidates])

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <Link href="/" aria-label="Lunariaの部屋に戻る" style={backLinkStyle}>ルナの部屋に戻る</Link>
            <p style={eyebrowStyle}>Lunaria 記憶</p>
            <h1 style={titleStyle}>記憶の棚</h1>
            <p style={leadStyle}>
              ルナが次へ持っていくかもしれないことを確認する場所です。日記は一日を、記憶はあとで参照できる小さな灯りを残します。
            </p>
          </div>
          <nav aria-label="記憶のナビゲーション" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/diary" aria-label="日記を開く" style={pillLinkStyle}>日記</Link>
            <Link href="/work" aria-label="しごとの記録を開く" style={pillLinkStyle}>しごと</Link>
            {process.env.NEXT_PUBLIC_SHOW_PLAYFUL === '1' && (<>
              <Link href="/games" aria-label="ゲームを開く" style={pillLinkStyle}>ゲーム</Link>
              <Link href="/gacha" aria-label="ガチャを開く" style={pillLinkStyle}>月箱</Link>
            </>)}
          </nav>
        </header>

        <section style={toolbarStyle}>
          <input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
            style={dateInputStyle}
            aria-label="記憶の元日付"
          />
          <button onClick={() => setDate(todayJst())} style={navButtonStyle}>今日</button>
          <button onClick={() => setDate('')} style={navButtonStyle}>すべての日付</button>
          <select value={status} onChange={event => setStatus(event.target.value)} style={selectStyle} aria-label="記憶の状態">
            <option value="active">有効な記憶</option>
            <option value="candidate">候補</option>
            <option value="confirmed">確認済み</option>
            <option value="archived">アーカイブ済み</option>
            <option value="all">すべての状態</option>
          </select>
          <label style={checkLabelStyle}>
            <input type="checkbox" checked={includeProfile} onChange={event => setIncludeProfile(event.target.checked)} />
            プロフィールに近い記憶も含める
          </label>
          <select value={candidateStatus} onChange={event => setCandidateStatus(event.target.value)} style={selectStyle} aria-label="候補の状態">
            <option value="pending">確認待ちの候補</option>
            <option value="archived">あとで確認する棚</option>
            <option value="rejected">外した候補</option>
            <option value="merged">記憶済みの候補</option>
            <option value="all">すべての候補</option>
          </select>
        </section>

        {error && <ApiErrorState message={error} onRetry={loadMemories} style={{ marginBottom: 14 }} />}

        <div style={contentGridStyle}>
          <div style={{ display: 'grid', gap: 16 }}>
            <Section title={date ? `${formatDate(date)}の記憶` : 'すべての記憶'}>
              {loading ? (
                <LoadingPanel label="記憶を読み込み中" />
              ) : grouped.length === 0 ? (
                <EmptyState
                  title="この条件に合う記憶はまだありません。"
                  copy="日付や状態の条件を外すと、ほかの記憶が見つかるかもしれません。"
                />
              ) : (
                <div style={{ display: 'grid', gap: 18 }}>
                  {grouped.map(([groupDate, items]) => (
                    <div key={groupDate} style={{ display: 'grid', gap: 10 }}>
                      <h3 style={groupTitleStyle}>{groupDate === '日付なし' ? groupDate : formatDate(groupDate)}</h3>
                      {items.map(memory => (
                        <MemoryCard
                          key={memory.id}
                          memory={memory}
                          busy={memoryBusyId === memory.id}
                          onAction={updateMemory}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Section title="記憶候補">
              {loading ? (
                <LoadingPanel label="記憶候補を読み込み中" />
              ) : !candidateTableReady ? (
                <EmptyState
                  title="記憶候補の棚はまだ準備中です。"
                  copy="候補テーブルが有効になると、Lunariaが気づいたことをここで確認できます。"
                />
              ) : candidates.length === 0 ? (
                <EmptyState
                  title="確認待ちの記憶候補はありません。"
                  copy="会話やゲームから候補が見つかると、この欄に表示されます。"
                />
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

            <Section title="棚の状態">
              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <Stat label="表示数" value={stats?.total ?? memories.length} />
                <Stat label="元日付あり" value={stats?.with_source_date ?? 0} />
                <Stat label="候補" value={stats?.by_status?.candidate ?? 0} />
                <Stat label="有効" value={stats?.by_status?.active ?? 0} />
                <Stat label="確認済み" value={stats?.by_status?.confirmed ?? 0} />
                <Stat label="候補フィルター" value={candidateStatusLabels[candidateStatus] ?? candidateStatus} />
                <Stat label="候補行数" value={candidateTableReady ? (candidateStats?.total ?? candidates.length) : '未適用'} />
                <Stat label="ゲーム引き継ぎ" value={candidateTableReady ? gameCandidateCount : '未適用'} />
              </div>
            </Section>

            <Section title="見方">
              <div style={{ display: 'grid', gap: 10 }}>
                <p style={mutedTextStyle}>日記は一日の記録です。記憶はルナがあとで使うかもしれない内容です。</p>
                <p style={mutedTextStyle}>候補は提案です。あなたが承認したときだけ、長く残る記憶になります。</p>
                <p style={mutedTextStyle}>プロフィールに近い記憶は、日々の記憶と混ざらないよう初期状態では非表示です。</p>
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
    radial-gradient(circle at 14% 8%, rgba(241,199,127,.15), transparent 32%),
    radial-gradient(circle at 84% 12%, rgba(127,179,213,.08), transparent 30%),
    radial-gradient(circle at 50% 95%, rgba(127,179,213,.11), transparent 34%),
    linear-gradient(180deg, var(--luna-bg) 0%, var(--luna-bg-soft) 58%, #0b0a09 100%)
  `,
  color: 'var(--luna-text)',
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
  color: 'var(--luna-faint)',
  textDecoration: 'none',
  fontSize: 12,
}

const eyebrowStyle: CSSProperties = {
  color: 'var(--luna-gold)',
  fontSize: 11,
  letterSpacing: '.22em',
  marginTop: 18,
  textTransform: 'uppercase',
}

const titleStyle: CSSProperties = {
  fontSize: 'clamp(34px, 7vw, 68px)',
  lineHeight: .98,
  marginTop: 10,
  letterSpacing: 0,
}

const leadStyle: CSSProperties = {
  color: 'var(--luna-muted)',
  fontSize: 14,
  lineHeight: 1.9,
  marginTop: 12,
  maxWidth: 650,
}

const pillLinkStyle: CSSProperties = {
  color: 'var(--luna-gold)',
  textDecoration: 'none',
  border: '1px solid var(--luna-border)',
  borderRadius: 999,
  padding: '9px 13px',
  fontSize: 12,
  background: 'rgba(241,199,127,.065)',
  whiteSpace: 'nowrap',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
  border: '1px solid var(--luna-border)',
  background: 'rgba(8,7,6,.72)',
  borderRadius: 'var(--luna-radius-lg)',
  padding: 12,
  marginBottom: 18,
  backdropFilter: 'blur(12px)',
}

const dateInputStyle: CSSProperties = {
  colorScheme: 'dark',
  background: 'rgba(8,7,6,.72)',
  color: 'var(--luna-text)',
  border: '1px solid var(--luna-border)',
  borderRadius: 'var(--luna-radius-md)',
  padding: '9px 12px',
  fontSize: 14,
}

const selectStyle: CSSProperties = {
  ...dateInputStyle,
  minWidth: 150,
}

const navButtonStyle: CSSProperties = {
  background: 'rgba(241,199,127,.07)',
  border: '1px solid var(--luna-border)',
  borderRadius: 'var(--luna-radius-sm)',
  color: 'var(--luna-text-soft)',
  cursor: 'pointer',
  fontSize: 12,
  padding: '9px 13px',
}

const checkLabelStyle: CSSProperties = {
  display: 'inline-flex',
  gap: 7,
  alignItems: 'center',
  color: 'var(--luna-muted)',
  fontSize: 12,
}

const contentGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: 16,
}

const sectionStyle: CSSProperties = {
  border: '1px solid var(--luna-border)',
  background: 'linear-gradient(145deg, rgba(31,27,21,.86), rgba(15,14,12,.94))',
  borderRadius: 'var(--luna-radius-lg)',
  padding: 18,
  boxShadow: 'var(--luna-shadow)',
}

const sectionTitleStyle: CSSProperties = {
  color: 'var(--luna-gold)',
  fontSize: 12,
  letterSpacing: '.16em',
  marginBottom: 12,
  textTransform: 'uppercase',
}

const memoryCardStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 'var(--luna-radius-lg)',
  background: 'linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018))',
  padding: 14,
}

const candidateCardStyle: CSSProperties = {
  ...memoryCardStyle,
  borderColor: 'rgba(216,182,109,.18)',
  background: 'linear-gradient(145deg, rgba(216,182,109,.07), rgba(255,255,255,.02))',
}

const memoryContentStyle: CSSProperties = {
  color: 'var(--luna-text)',
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
  color: 'var(--luna-gold-strong)',
  border: '1px solid rgba(216,182,109,.24)',
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  background: 'rgba(216,182,109,.08)',
}

const dateBadgeStyle: CSSProperties = {
  color: 'var(--luna-gold-strong)',
  border: '1px solid rgba(216,182,109,.2)',
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  background: 'rgba(216,182,109,.07)',
  textDecoration: 'none',
}

const notesStyle: CSSProperties = {
  color: 'var(--luna-muted)',
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

const gameCarryoverReturnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  borderTop: '1px solid rgba(255,255,255,.07)',
  color: '#b3a896',
  fontSize: 12,
  lineHeight: 1.6,
  marginTop: 12,
  paddingTop: 12,
}

const returnRoomLinkStyle: CSSProperties = {
  color: '#0f0d0a',
  background: 'var(--luna-gold-strong)',
  borderRadius: 'var(--luna-radius-sm)',
  padding: '5px 10px',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
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
  color: 'var(--luna-text-soft)',
  fontSize: 15,
  lineHeight: 1.8,
  marginBottom: 8,
}

const mutedTextStyle: CSSProperties = {
  color: 'var(--luna-faint)',
  fontSize: 13,
  lineHeight: 1.8,
}

const errorStyle: CSSProperties = {
  color: '#e6a58d',
  fontSize: 13,
  marginBottom: 14,
  padding: '10px 12px',
  border: '1px solid rgba(230,165,141,.22)',
  borderRadius: 'var(--luna-radius-lg)',
  background: 'rgba(230,165,141,.06)',
}
