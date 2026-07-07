'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface DiaryLog {
  diary_date: string
  title: string | null
  summary: string | null
  events: string[] | null
  talked_about: string[] | null
  emotions: Record<string, number> | null
  luna_comment: string | null
  unresolved_issues: string[] | null
  next_topics: string[] | null
  memory_changes: Array<{ type?: string; content?: string; action?: string; source_message_count?: number }> | null
  importance: number | null
  source_message_count: number | null
  generated_at: string | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

interface DiaryMetaResponse {
  date: string
  generated: boolean
  diary: DiaryLog | null
  extraction_count: number
  message_count: number
}

interface MonthDay {
  date: string
  generated: boolean
  message_count: number
  extraction_count: number
  importance: number | null
  luna_comment: string | null
}

const emotionLabels: Record<string, string> = {
  joy: '喜び',
  anger: '怒り',
  sadness: '悲しみ',
  shyness: '照れ',
  loneliness: '寂しさ',
  anxiety: '不安',
}

const memoryActionLabels: Record<string, string> = {
  candidate: '候補',
  saved: '保存済み',
  confirmed: '確認済み',
}

function todayJst(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function initialDate(): string {
  if (typeof window === 'undefined') return todayJst()
  return new URLSearchParams(window.location.search).get('date') ?? todayJst()
}

function asList(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value.filter(item => item.trim().length > 0) : []
}

function asMemoryChanges(value: DiaryLog['memory_changes'] | undefined): Array<{ content: string; action?: string }> {
  return Array.isArray(value)
    ? value
        .filter((item): item is { content: string; action?: string } => typeof item?.content === 'string' && item.content.trim().length > 0)
        .slice(0, 6)
    : []
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days, 12))
  return next.toISOString().slice(0, 10)
}

function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

function Section({ title, accent, children }: { title: string; accent?: string; children: ReactNode }) {
  return (
    <section style={sectionStyle}>
      <div style={{ ...sectionGlowStyle, background: `radial-gradient(circle, ${accent ?? 'rgba(200,160,96,.16)'}, transparent 68%)` }} />
      <h2 style={sectionTitleStyle}>{title}</h2>
      <div style={{ position: 'relative' }}>{children}</div>
    </section>
  )
}

function ListBlock({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p style={mutedTextStyle}>{empty}</p>
  return (
    <div style={{ display: 'grid', gap: 9 }}>
      {items.map((item, index) => (
        <div key={`${item}-${index}`} style={listItemStyle}>
          <span style={{ color: '#7fb3d5', marginTop: 1 }}>-</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
      <span style={{ color: '#8f8372' }}>{label}</span>
      <span style={{ color: '#ddd5c5', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function DiaryPage() {
  const [date, setDate] = useState(initialDate)
  const [diary, setDiary] = useState<DiaryLog | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sourceCounts, setSourceCounts] = useState({ extraction_count: 0, message_count: 0 })
  const [monthDays, setMonthDays] = useState<MonthDay[]>([])

  const loadMonth = useCallback(async (targetDate: string) => {
    const month = targetDate.slice(0, 7)
    try {
      const res = await fetch(`/api/diary/month?month=${encodeURIComponent(month)}`, { cache: 'no-store' })
      const data = res.ok ? await res.json() : { days: [] }
      setMonthDays(Array.isArray(data.days) ? data.days : [])
    } catch {
      setMonthDays([])
    }
  }, [])

  const loadDay = useCallback(async (targetDate: string) => {
    setLoading(true)
    setError(null)
    try {
      const [diaryRes, messagesRes] = await Promise.all([
        fetch(`/api/diary?date=${encodeURIComponent(targetDate)}&meta=1`, { cache: 'no-store' }),
        fetch(`/api/messages?date=${encodeURIComponent(targetDate)}`, { cache: 'no-store' }),
      ])
      if (!diaryRes.ok || !messagesRes.ok) throw new Error('load_failed')
      const diaryData = await diaryRes.json() as DiaryMetaResponse
      setDiary(diaryData.diary)
      setSourceCounts({
        extraction_count: diaryData.extraction_count ?? 0,
        message_count: diaryData.message_count ?? 0,
      })
      const messageData = await messagesRes.json()
      setMessages(Array.isArray(messageData.messages) ? messageData.messages : [])
    } catch {
      setError('日記の棚を開けませんでした。少し待ってからもう一度お試しください。')
      setDiary(null)
      setMessages([])
      setSourceCounts({ extraction_count: 0, message_count: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDay(date)
  }, [date, loadDay])

  useEffect(() => {
    loadMonth(date)
  }, [date, loadMonth])

  const generateDiary = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.reason === 'no_source'
          ? 'この日の会話がまだ少ないため、日記を書けません。'
          : 'ルナはこの日を見つけましたが、今回は日記にまとめられませんでした。もう一度お試しください。')
      }
      await loadDay(date)
      await loadMonth(date)
    } catch {
      setError('日記を書いている途中で失敗しました。もう一度お試しください。')
    } finally {
      setGenerating(false)
    }
  }

  const emotionEntries = useMemo(() => {
    return Object.entries(diary?.emotions ?? {}).filter(([, value]) => Number(value) > 0)
  }, [diary])

  const talkedAbout = asList(diary?.talked_about)
  const memoryChanges = asMemoryChanges(diary?.memory_changes)
  const hasDiary = Boolean(diary)

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <Link href="/" aria-label="Lunariaの部屋に戻る" style={backLinkStyle}>ルナの部屋に戻る</Link>
            <p style={eyebrowStyle}>Lunaria 日記</p>
            <h1 style={titleStyle}>日々の棚</h1>
            <p style={leadStyle}>
              ルナが話したこと、心に残ったこと、次へ持っていきたいことをそっと集める場所です。
            </p>
          </div>

          <nav aria-label="日記のナビゲーション" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/memory" aria-label="記憶を開く" style={moonboxLinkStyle}>記憶</Link>
            <Link href="/gacha" aria-label="ガチャを開く" style={moonboxLinkStyle}>月箱</Link>
          </nav>
        </header>

        <section style={toolbarStyle}>
          <button onClick={() => setDate(shiftDate(date, -1))} style={navButtonStyle}>前の日</button>
          <input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value || todayJst())}
            style={dateInputStyle}
          />
          <button onClick={() => setDate(shiftDate(date, 1))} style={navButtonStyle}>次の日</button>
          <button onClick={() => setDate(todayJst())} style={navButtonStyle}>今日</button>
          <button onClick={generateDiary} disabled={generating} style={{
            ...navButtonStyle,
            marginLeft: 'auto',
            color: generating ? '#6f665a' : '#0e0d0b',
            background: generating ? '#2a251f' : 'linear-gradient(135deg, #d8b66d, #9fcfbd)',
            borderColor: 'rgba(200,160,96,.5)',
            fontWeight: 700,
          }}>
            {generating ? '日記を書いています...' : 'この日を書く'}
          </button>
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        {loading ? (
          <div style={loadingStyle}>棚を開いています...</div>
        ) : (
          <div style={contentGridStyle}>
            <div style={{ display: 'grid', gap: 16 }}>
              <Section title={hasDiary ? `${formatDateLabel(date)}の日記` : `${formatDateLabel(date)}の空の棚`} accent="rgba(200,160,96,.18)">
                {hasDiary ? (
                  <div>
                    <div style={datePillStyle}>{date}</div>
                    {diary?.title && <h2 style={diaryTitleStyle}>{diary.title}</h2>}
                    <p style={lunaCommentStyle}>
                      {diary?.luna_comment || '静かな言葉が、まだここで休んでいます。'}
                    </p>
                    <p style={summaryStyle}>
                      {diary?.summary || 'この日は、まだはっきりした形になっていません。'}
                    </p>
                    <div style={softStatusStyle}>{hasDiary ? '日記あり' : '未生成'}</div>
                  </div>
                ) : (
                  <div>
                    <p style={summaryStyle}>ルナはまだこの棚に日記を置いていません。</p>
                    <p style={mutedTextStyle}>この日の会話がある場合は「この日を書く」から生成できます。</p>
                  </div>
                )}
              </Section>

              <Section title="起きたこと" accent="rgba(127,179,213,.16)">
                <ListBlock items={asList(diary?.events)} empty="まだ言葉になった出来事はありません。" />
              </Section>

              {talkedAbout.length > 0 && (
                <Section title="話したこと" accent="rgba(159,207,189,.15)">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {talkedAbout.map(topic => <span key={topic} style={topicPillStyle}>{topic}</span>)}
                  </div>
                </Section>
              )}

              <Section title="まだ開いていること" accent="rgba(230,165,141,.13)">
                <ListBlock items={asList(diary?.unresolved_issues)} empty="今すぐ気にかける未解決の話題はありません。" />
              </Section>

              <Section title="次に話すこと" accent="rgba(200,160,96,.15)">
                <ListBlock items={asList(diary?.next_topics)} empty="ルナはまだ次の話題を見つけていません。" />
              </Section>

              {memoryChanges.length > 0 && (
                <Section title="記憶候補" accent="rgba(159,207,189,.14)">
                  <details style={detailsStyle}>
                    <summary style={summaryToggleStyle}>ルナが覚えるかもしれないこと ({memoryChanges.length})</summary>
                    <p style={mutedTextStyle}>これは確認用の候補で、確定した事実ではありません。何を記憶にするかはあなたが決められます。</p>
                    <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                      {memoryChanges.map((item, index) => (
                        <div key={`${item.content}-${index}`} style={memoryCardStyle}>
                          <span>{item.content}</span>
                          {item.action && <span style={memoryBadgeStyle}>{memoryActionLabels[item.action] ?? item.action}</span>}
                        </div>
                      ))}
                    </div>
                  </details>
                </Section>
              )}

              <Section title="元の会話" accent="rgba(230,165,141,.1)">
                <details style={detailsStyle}>
                  <summary style={summaryToggleStyle}>この日の元会話 ({messages.length})</summary>
                  <div style={messageListStyle} className="scroll-thin">
                    {messages.length === 0 ? (
                      <p style={mutedTextStyle}>この日の元会話は見つかりませんでした。</p>
                    ) : messages.map((message, index) => (
                      <div key={`${message.ts}-${index}`} style={{
                        border: '1px solid rgba(255,255,255,.07)',
                        borderRadius: 15,
                        padding: 11,
                        background: message.role === 'assistant' ? 'rgba(127,179,213,.06)' : 'rgba(200,160,96,.06)',
                      }}>
                        <div style={{ color: '#766d60', fontSize: 11, marginBottom: 5 }}>
                          {message.role === 'assistant' ? 'ルナ' : 'あなた'} / {formatTime(message.ts)}
                        </div>
                        <div style={{ color: '#d8cebd', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{message.content}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </Section>
            </div>

            <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              <Section title="月の棚" accent="rgba(200,160,96,.13)">
                {monthDays.length === 0 ? (
                  <p style={mutedTextStyle}>この月にはまだ日が並んでいません。</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {monthDays.map(day => (
                      <button
                        key={day.date}
                        onClick={() => setDate(day.date)}
                        style={{
                          ...monthDayButtonStyle,
                          borderColor: day.date === date ? 'rgba(200,160,96,.55)' : 'rgba(255,255,255,.08)',
                          background: day.date === date ? 'rgba(200,160,96,.12)' : 'rgba(255,255,255,.035)',
                        }}
                      >
                        <span style={{ color: '#ddd5c5', fontSize: 13 }}>{day.date.slice(5)}</span>
                        <span style={{ color: day.generated ? '#9fcfbd' : '#8f8372', fontSize: 11 }}>
                          {day.generated ? '日記' : '会話'} / {day.message_count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="感情のあと" accent="rgba(159,207,189,.12)">
                {emotionEntries.length === 0 ? (
                  <p style={mutedTextStyle}>強い感情のあとがまだありません。</p>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {emotionEntries.map(([key, value]) => (
                      <div key={key} style={{ display: 'grid', gap: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8ad9c', fontSize: 12 }}>
                          <span>{emotionLabels[key] ?? key}</span>
                          <span>{value}</span>
                        </div>
                        <div style={meterStyle}>
                          <div style={{ width: `${Math.min(Number(value) * 10, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #7fb3d5, #d8b66d)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="日記の元データ" accent="rgba(127,179,213,.13)">
                <details style={detailsStyle}>
                  <summary style={summaryToggleStyle}>技術的な詳細</summary>
                  <div style={{ display: 'grid', gap: 10, color: '#b8ad9c', fontSize: 13, marginTop: 10 }}>
                    <Stat label="メッセージ数" value={sourceCounts.message_count} />
                    <Stat label="抽出数" value={sourceCounts.extraction_count} />
                    <Stat label="重要度" value={diary?.importance ?? '-'} />
                    <Stat label="元メッセージ数" value={diary?.source_message_count ?? '-'} />
                    <Stat label="生成日時" value={diary?.generated_at ? formatTime(Date.parse(diary.generated_at)) : '-'} />
                  </div>
                </details>
              </Section>
            </aside>
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
    radial-gradient(circle at 18% 8%, rgba(241,199,127,.15), transparent 34%),
    radial-gradient(circle at 82% 16%, rgba(127,179,213,.08), transparent 28%),
    radial-gradient(circle at 50% 100%, rgba(241,199,127,.07), transparent 34%),
    linear-gradient(180deg, var(--luna-bg) 0%, var(--luna-bg-soft) 58%, #0b0a09 100%)
  `,
  color: 'var(--luna-text)',
  padding: '18px clamp(16px, 4vw, 46px) 40px',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
  marginBottom: 26,
  flexWrap: 'wrap',
}

const backLinkStyle: CSSProperties = {
  color: '#766d60',
  textDecoration: 'none',
  fontSize: 12,
}

const eyebrowStyle: CSSProperties = {
  color: 'var(--luna-gold)',
  fontSize: 11,
  letterSpacing: '.16em',
  marginTop: 18,
  textTransform: 'uppercase',
}

const titleStyle: CSSProperties = {
  color: '#fff7e8',
  fontSize: 'clamp(32px, 6vw, 58px)',
  lineHeight: 1.08,
  marginTop: 10,
  letterSpacing: 0,
}

const leadStyle: CSSProperties = {
  color: '#9f9485',
  fontSize: 14,
  lineHeight: 1.9,
  marginTop: 12,
  maxWidth: 620,
}

const moonboxLinkStyle: CSSProperties = {
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
  borderRadius: 18,
  padding: 12,
  marginBottom: 18,
  backdropFilter: 'blur(12px)',
}

const navButtonStyle: CSSProperties = {
  background: 'rgba(241,199,127,.07)',
  border: '1px solid var(--luna-border)',
  borderRadius: 8,
  color: 'var(--luna-text-soft)',
  cursor: 'pointer',
  fontSize: 12,
  padding: '9px 13px',
}

const dateInputStyle: CSSProperties = {
  colorScheme: 'dark',
  background: 'rgba(8,7,6,.72)',
  color: 'var(--luna-text)',
  border: '1px solid var(--luna-border)',
  borderRadius: 12,
  padding: '9px 12px',
  fontSize: 14,
  minHeight: 42,
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

const loadingStyle: CSSProperties = {
  color: '#766d60',
  padding: 28,
}

const contentGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: 16,
}

const sectionStyle: CSSProperties = {
  border: '1px solid var(--luna-border)',
  background: 'linear-gradient(145deg, rgba(27,23,17,.9), rgba(14,13,11,.96))',
  borderRadius: 16,
  padding: 18,
  boxShadow: 'var(--luna-shadow)',
  position: 'relative',
  overflow: 'hidden',
}

const sectionGlowStyle: CSSProperties = {
  position: 'absolute',
  inset: '0 auto auto 0',
  width: 120,
  height: 120,
  opacity: .9,
  pointerEvents: 'none',
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: '.12em',
  color: 'var(--luna-gold)',
  marginBottom: 12,
  position: 'relative',
  textTransform: 'uppercase',
}

const datePillStyle: CSSProperties = {
  display: 'inline-flex',
  color: '#9fcfbd',
  border: '1px solid rgba(159,207,189,.18)',
  borderRadius: 999,
  padding: '5px 9px',
  fontSize: 11,
  marginBottom: 12,
  background: 'rgba(159,207,189,.06)',
}

const diaryTitleStyle: CSSProperties = {
  color: '#f1dfbd',
  fontSize: 25,
  lineHeight: 1.35,
  marginBottom: 12,
}

const lunaCommentStyle: CSSProperties = {
  color: '#eee0ca',
  fontSize: 20,
  lineHeight: 1.75,
  marginBottom: 16,
}

const summaryStyle: CSSProperties = {
  color: '#b8ad9c',
  fontSize: 14,
  lineHeight: 1.9,
}

const mutedTextStyle: CSSProperties = {
  color: '#746b60',
  fontSize: 13,
  lineHeight: 1.8,
}

const softStatusStyle: CSSProperties = {
  color: '#9fcfbd',
  border: '1px solid rgba(159,207,189,.18)',
  borderRadius: 999,
  display: 'inline-flex',
  fontSize: 11,
  marginTop: 14,
  padding: '5px 9px',
}

const listItemStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  color: '#d8cebd',
  fontSize: 14,
  lineHeight: 1.75,
}

const topicPillStyle: CSSProperties = {
  border: '1px solid rgba(127,179,213,.22)',
  borderRadius: 999,
  color: '#b9d8e8',
  fontSize: 12,
  padding: '6px 10px',
  background: 'rgba(127,179,213,.07)',
}

const detailsStyle: CSSProperties = {
  color: '#d8cebd',
}

const summaryToggleStyle: CSSProperties = {
  color: '#c8bda9',
  cursor: 'pointer',
  fontSize: 13,
  lineHeight: 1.6,
}

const memoryCardStyle: CSSProperties = {
  border: '1px solid rgba(200,160,96,.14)',
  borderRadius: 15,
  color: '#d8cebd',
  fontSize: 13,
  lineHeight: 1.75,
  padding: '10px 12px',
  background: 'rgba(200,160,96,.045)',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
}

const memoryBadgeStyle: CSSProperties = {
  color: '#9fcfbd',
  border: '1px solid rgba(159,207,189,.2)',
  borderRadius: 999,
  padding: '2px 8px',
  fontSize: 11,
  whiteSpace: 'nowrap',
}

const monthDayButtonStyle: CSSProperties = {
  alignItems: 'center',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 14,
  color: '#c8bda9',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 12px',
  textAlign: 'left',
}

const meterStyle: CSSProperties = {
  height: 5,
  borderRadius: 999,
  background: 'rgba(255,255,255,.07)',
  overflow: 'hidden',
}

const messageListStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 12,
  maxHeight: 420,
  overflowY: 'auto',
  paddingRight: 4,
}
