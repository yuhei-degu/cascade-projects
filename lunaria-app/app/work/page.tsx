'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ApiErrorState from '@/components/ApiErrorState'

// pivot Phase 1: 会話から抽出された作業記録の閲覧+1タップ修正。
// 「壊れた管理情報は信頼を殺す」(pivot-plan.md) ので、修正コストを最小にする。

interface WorkItem {
  id: string
  date: string
  project: string | null
  kind: string
  content: string
  source_message_id: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

interface WorkItemsResponse {
  ok: boolean
  error?: string
  items: WorkItem[]
  stats?: { total: number; by_kind: Record<string, number> } | null
}

const KINDS = ['did', 'done', 'stuck', 'decided', 'next'] as const

const kindLabels: Record<string, string> = {
  did: 'やった',
  done: 'できた',
  stuck: 'つまずき',
  decided: '決めた',
  next: '次やる',
}

const kindColors: Record<string, string> = {
  did: 'var(--luna-muted)',
  done: 'var(--luna-gold-strong)',
  stuck: '#c96f5e',
  decided: '#7fb3d5',
  next: '#4d8f7a',
}

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00+09:00`)
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
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

function LoadingPanel() {
  return (
    <div aria-label="しごとの記録を読み込み中" style={{ display: 'grid', gap: 12 }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="luna-skeleton" style={{ height: 84, padding: 14 }}>
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '28%', marginBottom: 14 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '88%' }} />
        </div>
      ))}
    </div>
  )
}

function WorkItemCard({
  item,
  busy,
  onKindChange,
  onDelete,
}: {
  item: WorkItem
  busy: boolean
  onKindChange: (item: WorkItem, kind: string) => void
  onDelete: (item: WorkItem) => void
}) {
  return (
    <article style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...kindBadgeStyle, color: kindColors[item.kind] ?? 'var(--luna-muted)', borderColor: 'var(--luna-border)' }}>
            {kindLabels[item.kind] ?? item.kind}
          </span>
          {item.project && <span style={projectBadgeStyle}>{item.project}</span>}
        </div>
        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={busy}
          aria-label="この記録を外す"
          style={deleteButtonStyle}
        >
          外す
        </button>
      </div>

      <p style={contentStyle}>{item.content}</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} aria-label="分類を修正">
        {KINDS.filter(kind => kind !== item.kind).map(kind => (
          <button
            key={kind}
            type="button"
            onClick={() => onKindChange(item, kind)}
            disabled={busy}
            style={kindChipStyle}
          >
            → {kindLabels[kind]}
          </button>
        ))}
      </div>
    </article>
  )
}

export default function WorkPage() {
  const [days, setDays] = useState(7)
  const [items, setItems] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableMissing, setTableMissing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setTableMissing(false)
    try {
      const res = await fetch(`/api/work-items?days=${days}`)
      const data: WorkItemsResponse = await res.json()
      if (!data.ok) {
        if (data.error === 'work_items_table_missing') {
          setTableMissing(true)
          setItems([])
          return
        }
        throw new Error(data.error ?? 'load_failed')
      }
      setItems(data.items)
    } catch {
      setError('しごとの記録を読み込めませんでした。')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const patchItem = useCallback(async (item: WorkItem, body: Record<string, unknown>) => {
    setBusyId(item.id)
    try {
      const res = await fetch('/api/work-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...body }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'patch_failed')
      await load()
    } catch {
      setError('修正を保存できませんでした。')
    } finally {
      setBusyId(null)
    }
  }, [load])

  const onKindChange = useCallback((item: WorkItem, kind: string) => {
    patchItem(item, { action: 'edit', kind })
  }, [patchItem])

  const onDelete = useCallback((item: WorkItem) => {
    patchItem(item, { action: 'delete' })
  }, [patchItem])

  const grouped = useMemo(() => {
    const map = new Map<string, WorkItem[]>()
    for (const item of items) {
      const list = map.get(item.date) ?? []
      list.push(item)
      map.set(item.date, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [items])

  const kindCounts = useMemo(() => {
    return items.reduce((acc: Record<string, number>, item) => {
      acc[item.kind] = (acc[item.kind] ?? 0) + 1
      return acc
    }, {})
  }, [items])

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <Link href="/" aria-label="Lunariaの部屋に戻る" style={backLinkStyle}>ルナの部屋に戻る</Link>
            <p style={eyebrowStyle}>Lunaria しごと</p>
            <h1 style={titleStyle}>しごとの記録</h1>
            <p style={leadStyle}>
              ルナに話したことから、やったこと・できたこと・つまずきを拾って並べています。
              違っていたらワンタップで直してください。直したことはルナも次から参考にします。
            </p>
          </div>
          <nav aria-label="しごとのナビゲーション" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/diary" aria-label="日記を開く" style={pillLinkStyle}>日記</Link>
            <Link href="/memory" aria-label="記憶を開く" style={pillLinkStyle}>記憶</Link>
          </nav>
        </header>

        <section style={toolbarStyle}>
          {[7, 14, 31].map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              style={{ ...rangeButtonStyle, ...(days === option ? rangeButtonActiveStyle : null) }}
              aria-pressed={days === option}
            >
              直近{option}日
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--luna-faint)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {KINDS.map(kind => (
              <span key={kind}>
                <span style={{ color: kindColors[kind] }}>{kindLabels[kind]}</span> {kindCounts[kind] ?? 0}
              </span>
            ))}
          </span>
        </section>

        {error && <ApiErrorState message={error} onRetry={load} style={{ marginBottom: 14 }} />}

        {loading ? (
          <LoadingPanel />
        ) : tableMissing ? (
          <EmptyState
            title="しごとの記録はまだ準備中です。"
            copy="記録用のテーブルが有効になると、会話から拾った作業がここに並びます。"
          />
        ) : grouped.length === 0 ? (
          <EmptyState
            title="この期間のしごとの記録はまだありません。"
            copy="今日やったことをルナに話すと、ここに自動で並びます。報告のつもりじゃなくて大丈夫です。"
          />
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            {grouped.map(([date, dateItems]) => (
              <section key={date} style={{ display: 'grid', gap: 10 }}>
                <h2 style={groupTitleStyle}>{formatDate(date)}</h2>
                {dateItems.map(item => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    busy={busyId === item.id}
                    onKindChange={onKindChange}
                    onDelete={onDelete}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
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

const rangeButtonStyle: CSSProperties = {
  background: 'rgba(241,199,127,.07)',
  border: '1px solid var(--luna-border)',
  borderRadius: 'var(--luna-radius-sm)',
  color: 'var(--luna-text-soft)',
  cursor: 'pointer',
  fontSize: 12,
  padding: '9px 13px',
}

const rangeButtonActiveStyle: CSSProperties = {
  background: 'rgba(241,199,127,.16)',
  color: 'var(--luna-gold-strong)',
  borderColor: 'var(--luna-gold)',
}

const groupTitleStyle: CSSProperties = {
  fontSize: 15,
  color: 'var(--luna-gold-strong)',
  letterSpacing: '.06em',
  margin: 0,
}

const cardStyle: CSSProperties = {
  border: '1px solid var(--luna-border)',
  background: 'rgba(8,7,6,.72)',
  borderRadius: 'var(--luna-radius-lg)',
  padding: 14,
  display: 'grid',
  gap: 10,
}

const kindBadgeStyle: CSSProperties = {
  border: '1px solid',
  borderRadius: 999,
  padding: '3px 10px',
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

const projectBadgeStyle: CSSProperties = {
  color: 'var(--luna-faint)',
  border: '1px solid var(--luna-border)',
  borderRadius: 999,
  padding: '3px 10px',
  fontSize: 11,
  whiteSpace: 'nowrap',
}

const contentStyle: CSSProperties = {
  margin: 0,
  fontSize: 14.5,
  lineHeight: 1.8,
  color: 'var(--luna-text-soft)',
}

const kindChipStyle: CSSProperties = {
  background: 'none',
  border: '1px solid var(--luna-border)',
  borderRadius: 999,
  color: 'var(--luna-faint)',
  cursor: 'pointer',
  fontSize: 11,
  padding: '4px 10px',
}

const deleteButtonStyle: CSSProperties = {
  background: 'none',
  border: '1px solid var(--luna-border)',
  borderRadius: 'var(--luna-radius-sm)',
  color: 'var(--luna-faint)',
  cursor: 'pointer',
  fontSize: 11,
  padding: '4px 10px',
  whiteSpace: 'nowrap',
}
