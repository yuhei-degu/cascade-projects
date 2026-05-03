'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
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

const statusLabels: Record<string, string> = {
  active: '育てている記憶',
  candidate: '候補',
  confirmed: '確認済み',
  archived: '保留棚',
  deleted: '削除済み',
}

const typeLabels: Record<string, string> = {
  value: '大事にしていること',
  pattern: '傾向',
  goal: '目標',
  trigger: 'きっかけ',
  mid: '中期メモ',
  other: 'メモ',
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
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
              {formatDate(memory.source_date)} の日記
            </Link>
          )}
        </div>
        <span style={{ color: '#c8a060', fontSize: 12, whiteSpace: 'nowrap' }}>score {memory.score ?? '-'}</span>
      </div>

      <p style={memoryContentStyle}>{memory.content}</p>

      <div style={memoryMetaGridStyle}>
        <Stat label="確信度" value={confidenceLabel(memory.confidence)} />
        <Stat label="見かけた回数" value={memory.hit_count ?? '-'} />
        <Stat label="最終参照" value={formatTime(memory.last_seen)} />
        <Stat label="作成元" value={memory.created_by} />
      </div>

      {memory.notes && <p style={notesStyle}>{memory.notes}</p>}
    </article>
  )
}

export default function MemoryPage() {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('active')
  const [includeProfile, setIncludeProfile] = useState(false)
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [stats, setStats] = useState<MemoryResponse['stats']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMemories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status, limit: '120' })
      if (date) params.set('date', date)
      if (includeProfile) params.set('profile', '1')
      const res = await fetch(`/api/memory?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json() as MemoryResponse
      if (!res.ok || !data.ok) throw new Error('load_failed')
      setMemories(Array.isArray(data.memories) ? data.memories : [])
      setStats(data.stats)
    } catch {
      setError('記憶の棚を開けませんでした。少し時間を置いてもう一度試してみてください。')
      setMemories([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [date, includeProfile, status])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  const grouped = useMemo(() => {
    const map = new Map<string, MemoryItem[]>()
    for (const memory of memories) {
      const key = memory.source_date ?? '日付なし'
      map.set(key, [...(map.get(key) ?? []), memory])
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [memories])

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <Link href="/" style={backLinkStyle}>← ルナの部屋へ</Link>
            <p style={eyebrowStyle}>Lunaria Memory</p>
            <h1 style={titleStyle}>記憶の月棚</h1>
            <p style={leadStyle}>
              ルナが長く覚えておきたいことを、出どころと確信度つきで見返す場所。日記はその日の記録、記憶はこれからも参照する小さな灯りです。
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/diary" style={pillLinkStyle}>日記へ</Link>
            <Link href="/gacha" style={pillLinkStyle}>月箱へ</Link>
          </div>
        </header>

        <section style={toolbarStyle}>
          <input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
            style={dateInputStyle}
            aria-label="記憶の出どころ日付"
          />
          <button onClick={() => setDate(todayJst())} style={navButtonStyle}>今日</button>
          <button onClick={() => setDate('')} style={navButtonStyle}>全期間</button>
          <select value={status} onChange={event => setStatus(event.target.value)} style={selectStyle}>
            <option value="active">育てている記憶</option>
            <option value="candidate">候補だけ</option>
            <option value="confirmed">確認済みだけ</option>
            <option value="archived">保留棚だけ</option>
            <option value="all">すべて</option>
          </select>
          <label style={checkLabelStyle}>
            <input type="checkbox" checked={includeProfile} onChange={event => setIncludeProfile(event.target.checked)} />
            プロフィール系も見る
          </label>
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={contentGridStyle}>
          <div style={{ display: 'grid', gap: 16 }}>
            <Section title={date ? `${formatDate(date)} の記憶` : 'すべての記憶'}>
              {loading ? (
                <p style={mutedTextStyle}>記憶の棚を開いています...</p>
              ) : grouped.length === 0 ? (
                <div>
                  <p style={emptyTitleStyle}>この条件では記憶が見つかりませんでした。</p>
                  <p style={mutedTextStyle}>日付を外すか、「すべて」を選ぶと、まだ出どころが古い形式の記憶も見つかるかもしれません。</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 18 }}>
                  {grouped.map(([groupDate, items]) => (
                    <div key={groupDate} style={{ display: 'grid', gap: 10 }}>
                      <h3 style={groupTitleStyle}>{groupDate === '日付なし' ? groupDate : formatDate(groupDate)}</h3>
                      {items.map(memory => <MemoryCard key={memory.id} memory={memory} />)}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Section title="棚の状態">
              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <Stat label="表示中" value={`${stats?.total ?? memories.length}件`} />
                <Stat label="出どころ日付あり" value={`${stats?.with_source_date ?? 0}件`} />
                <Stat label="候補" value={`${stats?.by_status?.candidate ?? 0}件`} />
                <Stat label="育成中" value={`${stats?.by_status?.active ?? 0}件`} />
                <Stat label="確認済み" value={`${stats?.by_status?.confirmed ?? 0}件`} />
              </div>
            </Section>

            <Section title="見方">
              <div style={{ display: 'grid', gap: 10 }}>
                <p style={mutedTextStyle}>日記は「その日を思い出すための記録」です。</p>
                <p style={mutedTextStyle}>記憶は「これからの会話でルナが参照するかもしれない情報」です。</p>
                <p style={mutedTextStyle}>確信度や出どころが空のものは、古い形式で保存された記憶かもしれません。</p>
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
}

const memoryCardStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 18,
  background: 'linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018))',
  padding: 14,
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
