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
  joy: 'Joy',
  anger: 'Anger',
  sadness: 'Sadness',
  shyness: 'Shyness',
  loneliness: 'Loneliness',
  anxiety: 'Anxiety',
}

const memoryActionLabels: Record<string, string> = {
  candidate: 'Candidate',
  saved: 'Saved',
  confirmed: 'Confirmed',
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
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
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
      setError('The diary shelf could not be opened. Please wait a moment and try again.')
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
          ? 'There is not enough conversation from this day to write a diary yet.'
          : 'Luna found the day, but could not weave it into a diary this time. Please try again.')
      }
      await loadDay(date)
      await loadMonth(date)
    } catch {
      setError('Moonlight slipped while writing the diary. Please try again.')
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
            <Link href="/" aria-label="Back to Lunaria room" style={backLinkStyle}>Back to Luna's room</Link>
            <p style={eyebrowStyle}>Lunaria Diary</p>
            <h1 style={titleStyle}>Day Shelf</h1>
            <p style={leadStyle}>
              A quiet place where Luna gathers what you talked about, what lingered, and what might be worth carrying forward.
            </p>
          </div>

          <nav aria-label="Diary navigation" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/memory" aria-label="Open memory" style={moonboxLinkStyle}>Memory</Link>
            <Link href="/gacha" aria-label="Open gacha" style={moonboxLinkStyle}>Moonbox</Link>
          </nav>
        </header>

        <section style={toolbarStyle}>
          <button onClick={() => setDate(shiftDate(date, -1))} style={navButtonStyle}>Previous day</button>
          <input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value || todayJst())}
            style={dateInputStyle}
          />
          <button onClick={() => setDate(shiftDate(date, 1))} style={navButtonStyle}>Next day</button>
          <button onClick={() => setDate(todayJst())} style={navButtonStyle}>Today</button>
          <button onClick={generateDiary} disabled={generating} style={{
            ...navButtonStyle,
            marginLeft: 'auto',
            color: generating ? '#6f665a' : '#0e0d0b',
            background: generating ? '#2a251f' : 'linear-gradient(135deg, #d8b66d, #9fcfbd)',
            borderColor: 'rgba(200,160,96,.5)',
            fontWeight: 700,
          }}>
            {generating ? 'Weaving diary...' : 'Write this day'}
          </button>
        </section>

        {error && <div style={errorStyle}>{error}</div>}

        {loading ? (
          <div style={loadingStyle}>Opening the shelf...</div>
        ) : (
          <div style={contentGridStyle}>
            <div style={{ display: 'grid', gap: 16 }}>
              <Section title={hasDiary ? `${formatDateLabel(date)} Diary` : `${formatDateLabel(date)} Empty Shelf`} accent="rgba(200,160,96,.18)">
                {hasDiary ? (
                  <div>
                    <div style={datePillStyle}>{date}</div>
                    {diary?.title && <h2 style={diaryTitleStyle}>{diary.title}</h2>}
                    <p style={lunaCommentStyle}>
                      {diary?.luna_comment || 'A few quiet words are still resting here.'}
                    </p>
                    <p style={summaryStyle}>
                      {diary?.summary || 'This day has not found its full shape yet.'}
                    </p>
                    <div style={softStatusStyle}>{hasDiary ? 'Diary available' : 'Not generated yet'}</div>
                  </div>
                ) : (
                  <div>
                    <p style={summaryStyle}>Luna has not placed a diary on this shelf yet.</p>
                    <p style={mutedTextStyle}>If there is conversation from this day, use "Write this day" to generate one.</p>
                  </div>
                )}
              </Section>

              <Section title="What happened" accent="rgba(127,179,213,.16)">
                <ListBlock items={asList(diary?.events)} empty="No events have settled into words yet." />
              </Section>

              {talkedAbout.length > 0 && (
                <Section title="Talked about" accent="rgba(159,207,189,.15)">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {talkedAbout.map(topic => <span key={topic} style={topicPillStyle}>{topic}</span>)}
                  </div>
                </Section>
              )}

              <Section title="Still open" accent="rgba(230,165,141,.13)">
                <ListBlock items={asList(diary?.unresolved_issues)} empty="No unresolved threads are calling for attention right now." />
              </Section>

              <Section title="Next time" accent="rgba(200,160,96,.15)">
                <ListBlock items={asList(diary?.next_topics)} empty="Luna has not found a next topic yet." />
              </Section>

              {memoryChanges.length > 0 && (
                <Section title="Memory candidates" accent="rgba(159,207,189,.14)">
                  <details style={detailsStyle}>
                    <summary style={summaryToggleStyle}>Things Luna may remember ({memoryChanges.length})</summary>
                    <p style={mutedTextStyle}>These are reviewable candidates, not final facts. You stay in control of what becomes memory.</p>
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

              <Section title="Source conversation" accent="rgba(230,165,141,.1)">
                <details style={detailsStyle}>
                  <summary style={summaryToggleStyle}>Source conversation for this day ({messages.length})</summary>
                  <div style={messageListStyle} className="scroll-thin">
                    {messages.length === 0 ? (
                      <p style={mutedTextStyle}>No source conversation was found for this day.</p>
                    ) : messages.map((message, index) => (
                      <div key={`${message.ts}-${index}`} style={{
                        border: '1px solid rgba(255,255,255,.07)',
                        borderRadius: 15,
                        padding: 11,
                        background: message.role === 'assistant' ? 'rgba(127,179,213,.06)' : 'rgba(200,160,96,.06)',
                      }}>
                        <div style={{ color: '#766d60', fontSize: 11, marginBottom: 5 }}>
                          {message.role === 'assistant' ? 'Luna' : 'You'} / {formatTime(message.ts)}
                        </div>
                        <div style={{ color: '#d8cebd', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{message.content}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </Section>
            </div>

            <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              <Section title="Month shelf" accent="rgba(200,160,96,.13)">
                {monthDays.length === 0 ? (
                  <p style={mutedTextStyle}>No days are lined up for this month yet.</p>
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
                          {day.generated ? 'diary' : 'talk'} / {day.message_count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Emotion trace" accent="rgba(159,207,189,.12)">
                {emotionEntries.length === 0 ? (
                  <p style={mutedTextStyle}>No strong emotion trace yet.</p>
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

              <Section title="Diary source details" accent="rgba(127,179,213,.13)">
                <details style={detailsStyle}>
                  <summary style={summaryToggleStyle}>Technical details</summary>
                  <div style={{ display: 'grid', gap: 10, color: '#b8ad9c', fontSize: 13, marginTop: 10 }}>
                    <Stat label="Messages" value={sourceCounts.message_count} />
                    <Stat label="Extractions" value={sourceCounts.extraction_count} />
                    <Stat label="Importance" value={diary?.importance ?? '-'} />
                    <Stat label="Source messages" value={diary?.source_message_count ?? '-'} />
                    <Stat label="Generated at" value={diary?.generated_at ? formatTime(Date.parse(diary.generated_at)) : '-'} />
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
    radial-gradient(circle at 18% 8%, rgba(127,179,213,.18), transparent 34%),
    radial-gradient(circle at 82% 16%, rgba(200,160,96,.14), transparent 28%),
    radial-gradient(circle at 50% 100%, rgba(159,207,189,.08), transparent 34%),
    linear-gradient(180deg, #0e0d0b 0%, #15120f 58%, #0b0a09 100%)
  `,
  color: '#ddd5c5',
  padding: '18px clamp(16px, 4vw, 46px) 40px',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
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
  maxWidth: 620,
}

const moonboxLinkStyle: CSSProperties = {
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

const navButtonStyle: CSSProperties = {
  background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 999,
  color: '#c8bda9',
  cursor: 'pointer',
  fontSize: 12,
  padding: '9px 13px',
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
  border: '1px solid rgba(230,210,170,.13)',
  background: 'linear-gradient(145deg, rgba(31,27,21,.86), rgba(15,14,12,.94))',
  borderRadius: 24,
  padding: 18,
  boxShadow: '0 18px 60px rgba(0,0,0,.28)',
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
  letterSpacing: '.16em',
  color: '#c8a060',
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
