'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface DiaryLog {
  diary_date: string
  summary: string | null
  events: string[] | null
  emotions: Record<string, number> | null
  luna_comment: string | null
  unresolved_issues: string[] | null
  next_topics: string[] | null
  importance: number | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

function todayJst(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(new Date())
}

function asList(value: string[] | null | undefined): string[] {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days, 12))
  return next.toISOString().slice(0, 10)
}

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour:     '2-digit',
    minute:   '2-digit',
  }).format(new Date(ts))
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      border: '1px solid rgba(230,210,170,.12)',
      background: 'linear-gradient(145deg, rgba(31,27,21,.84), rgba(16,15,13,.92))',
      borderRadius: 22,
      padding: 18,
      boxShadow: '0 18px 60px rgba(0,0,0,.26)',
    }}>
      <h2 style={{ fontSize: 13, letterSpacing: '.16em', color: '#c8a060', marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  )
}

function ListBlock({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p style={{ color: '#6f665a', fontSize: 13, lineHeight: 1.8 }}>{empty}</p>
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((item, index) => (
        <div key={`${item}-${index}`} style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          color: '#d8cebd',
          fontSize: 14,
          lineHeight: 1.75,
        }}>
          <span style={{ color: '#7fb3d5', marginTop: 1 }}>＊</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

export default function DiaryPage() {
  const [date, setDate] = useState(todayJst)
  const [diary, setDiary] = useState<DiaryLog | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMessages, setShowMessages] = useState(false)

  const loadDay = useCallback(async (targetDate: string) => {
    setLoading(true)
    setError(null)
    try {
      const [diaryRes, messagesRes] = await Promise.all([
        fetch(`/api/diary?date=${encodeURIComponent(targetDate)}`, { cache: 'no-store' }),
        fetch(`/api/messages?date=${encodeURIComponent(targetDate)}`, { cache: 'no-store' }),
      ])
      if (!diaryRes.ok || !messagesRes.ok) throw new Error('load_failed')
      setDiary(await diaryRes.json())
      const messageData = await messagesRes.json()
      setMessages(Array.isArray(messageData.messages) ? messageData.messages : [])
    } catch {
      setError('この日の記録をうまく開けませんでした。')
      setDiary(null)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDay(date)
  }, [date, loadDay])

  const generateDiary = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/diary', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ date }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError('この日は、まだ日記にできる記録が少ないみたいです。')
      }
      await loadDay(date)
    } catch {
      setError('日記を綴る途中で、月明かりが途切れました。')
    } finally {
      setGenerating(false)
    }
  }

  const emotionEntries = useMemo(() => {
    return Object.entries(diary?.emotions ?? {}).filter(([, value]) => Number(value) > 0)
  }, [diary])

  const hasDiary = Boolean(diary)

  return (
    <main style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      background: `
        radial-gradient(circle at 18% 8%, rgba(127,179,213,.16), transparent 34%),
        radial-gradient(circle at 82% 16%, rgba(200,160,96,.13), transparent 28%),
        linear-gradient(180deg, #0e0d0b 0%, #15120f 58%, #0b0a09 100%)
      `,
      color: '#ddd5c5',
      padding: '18px clamp(16px, 4vw, 46px) 40px',
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 26 }}>
          <div>
            <Link href="/" style={{ color: '#766d60', textDecoration: 'none', fontSize: 12 }}>← ルナの部屋へ</Link>
            <h1 style={{ fontSize: 'clamp(28px, 6vw, 56px)', lineHeight: 1.05, marginTop: 12, letterSpacing: '.04em' }}>
              日々の棚
            </h1>
            <p style={{ color: '#8f8372', fontSize: 14, lineHeight: 1.9, marginTop: 10 }}>
              ルナが、その日に話したことをそっとしまっておく場所。
            </p>
          </div>

          <Link href="/gacha" style={{
            color: '#c8a060',
            textDecoration: 'none',
            border: '1px solid rgba(200,160,96,.24)',
            borderRadius: 999,
            padding: '9px 13px',
            fontSize: 12,
            background: 'rgba(200,160,96,.06)',
            whiteSpace: 'nowrap',
          }}>
            月箱へ
          </Link>
        </header>

        <section style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          border: '1px solid rgba(255,255,255,.08)',
          background: 'rgba(14,13,11,.62)',
          borderRadius: 20,
          padding: 12,
          marginBottom: 18,
        }}>
          <button onClick={() => setDate(shiftDate(date, -1))} style={navButtonStyle}>前の日</button>
          <input
            type="date"
            value={date}
            onChange={event => setDate(event.target.value || todayJst())}
            style={{
              colorScheme: 'dark',
              background: '#171410',
              color: '#ddd5c5',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 12,
              padding: '9px 12px',
              fontSize: 14,
            }}
          />
          <button onClick={() => setDate(shiftDate(date, 1))} style={navButtonStyle}>次の日</button>
          <button onClick={() => setDate(todayJst())} style={navButtonStyle}>今日</button>
          <button onClick={generateDiary} disabled={generating} style={{
            ...navButtonStyle,
            marginLeft: 'auto',
            color: generating ? '#6f665a' : '#0e0d0b',
            background: generating ? '#2a251f' : '#c8a060',
            borderColor: 'rgba(200,160,96,.5)',
          }}>
            {generating ? '綴っています...' : 'この日をまとめる'}
          </button>
        </section>

        {error && (
          <div style={{ color: '#e6a58d', fontSize: 13, marginBottom: 14, padding: '10px 12px', border: '1px solid rgba(230,165,141,.22)', borderRadius: 14 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#766d60', padding: 28 }}>棚を開いています...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <Section title={hasDiary ? `${date} の日記` : `${date} の棚`}>
                {hasDiary ? (
                  <div>
                    <p style={{ color: '#eee0ca', fontSize: 20, lineHeight: 1.75, marginBottom: 16 }}>
                      {diary?.luna_comment || '今日は、言葉の輪郭だけが静かに残っているみたい。'}
                    </p>
                    <p style={{ color: '#b8ad9c', fontSize: 14, lineHeight: 1.9 }}>
                      {diary?.summary || 'この日の要約はまだ短いままです。'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#b8ad9c', fontSize: 15, lineHeight: 1.9 }}>
                      この日は、まだルナの棚に日記がありません。
                    </p>
                    <p style={{ color: '#766d60', fontSize: 13, lineHeight: 1.8, marginTop: 10 }}>
                      会話が残っている日なら、「この日をまとめる」から日記を生成できます。
                    </p>
                  </div>
                )}
              </Section>

              <Section title="この日にあったこと">
                <ListBlock items={asList(diary?.events)} empty="まだ出来事は並んでいません。" />
              </Section>

              <Section title="まだ続きそうな話">
                <ListBlock items={asList(diary?.unresolved_issues)} empty="未解決の話題はありません。" />
              </Section>

              <Section title="次に話せそうなこと">
                <ListBlock items={asList(diary?.next_topics)} empty="次の話題はまだ見つかっていません。" />
              </Section>
            </div>

            <aside style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
              <Section title="記録の気配">
                <div style={{ display: 'grid', gap: 10, color: '#b8ad9c', fontSize: 13 }}>
                  <div>会話数: <span style={{ color: '#ddd5c5' }}>{messages.length}</span></div>
                  <div>重要度: <span style={{ color: '#ddd5c5' }}>{diary?.importance ?? '-'}</span></div>
                  <div>日記: <span style={{ color: hasDiary ? '#9fcfbd' : '#8f8372' }}>{hasDiary ? 'あり' : '未生成'}</span></div>
                </div>
              </Section>

              <Section title="感情の残響">
                {emotionEntries.length === 0 ? (
                  <p style={{ color: '#6f665a', fontSize: 13, lineHeight: 1.8 }}>まだ薄い月明かりです。</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {emotionEntries.map(([key, value]) => (
                      <div key={key} style={{ display: 'grid', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8ad9c', fontSize: 12 }}>
                          <span>{key}</span>
                          <span>{value}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(Number(value) * 10, 100)}%`, height: '100%', background: '#7fb3d5' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="その日の会話">
                <button onClick={() => setShowMessages(value => !value)} style={navButtonStyle}>
                  {showMessages ? '閉じる' : '会話を開く'}
                </button>
                {showMessages && (
                  <div style={{ display: 'grid', gap: 10, marginTop: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }} className="scroll-thin">
                    {messages.length === 0 ? (
                      <p style={{ color: '#6f665a', fontSize: 13, lineHeight: 1.8 }}>この日の会話ログは見つかりませんでした。</p>
                    ) : messages.map((message, index) => (
                      <div key={`${message.ts}-${index}`} style={{
                        border: '1px solid rgba(255,255,255,.07)',
                        borderRadius: 14,
                        padding: 10,
                        background: message.role === 'assistant' ? 'rgba(127,179,213,.06)' : 'rgba(200,160,96,.06)',
                      }}>
                        <div style={{ color: '#766d60', fontSize: 11, marginBottom: 5 }}>
                          {message.role === 'assistant' ? 'Luna' : 'You'} / {formatTime(message.ts)}
                        </div>
                        <div style={{ color: '#d8cebd', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{message.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
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
