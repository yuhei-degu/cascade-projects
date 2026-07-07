'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const games = [
  {
    title: '終末世界サバイバル',
    status: 'ループ復旧待ち',
    summary: 'ループ本体、上部ナビゲーション、ビルド対象、引き継ぎ文脈をひとまとまりの変更として復旧します。',
  },
  {
    title: '記憶の引き継ぎ',
    status: '利用できます',
    summary: 'ゲーム由来の記憶は確認棚に入り、承認後の会話の文脈へ戻せます。',
  },
]

const carryoverSteps = [
  'ゲーム結果を完了、または保存します。',
  '記憶を開き、ゲーム引き継ぎ候補を承認します。',
  '部屋へ戻ると、次の会話でLunariaが承認済みの結果を参照できます。',
]

function GamesSkeleton() {
  return (
    <section aria-label="ゲームを読み込み中" style={{ padding: 18, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
      {Array.from({ length: 2 }).map((_, index) => (
        <article key={index} className="luna-skeleton" style={{ minHeight: 168, padding: 16 }}>
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '36%', marginBottom: 18 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '70%', height: 18, marginBottom: 18 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '96%', marginBottom: 10 }} />
          <div className="luna-skeleton luna-skeleton-line" style={{ width: '82%' }} />
        </article>
      ))}
    </section>
  )
}

function GamesEmpty() {
  return (
    <section style={{ padding: 18 }}>
      <div className="luna-empty">
        <span className="luna-empty-icon" aria-hidden="true">◇</span>
        <strong className="luna-empty-title">遊べるゲームはまだありません。</strong>
        <p className="luna-empty-copy">新しいゲームが準備できると、この一覧に表示されます。</p>
      </div>
    </section>
  )
}

export default function GamesPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <main style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      color: 'var(--luna-text)',
      background: 'radial-gradient(circle at 18% 8%, rgba(241,199,127,.15), transparent 34%), radial-gradient(circle at 84% 14%, rgba(127,179,213,.08), transparent 28%), linear-gradient(180deg, var(--luna-bg), var(--luna-bg-soft))',
    }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 18px', borderBottom: '1px solid var(--luna-border-soft)', background: 'rgba(8,7,6,.82)' }}>
        <div>
          <div style={{ color: 'var(--luna-gold)', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase' }}>ゲーム</div>
          <h1 style={{ fontSize: 22, lineHeight: 1.2, margin: '4px 0 0' }}>Lunaria ゲームルーム</h1>
        </div>
        <nav aria-label="ゲームのナビゲーション" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link href="/" aria-label="Lunariaの部屋に戻る" className="luna-chip-link">部屋</Link>
          <Link href="/memory" aria-label="記憶を開く" className="luna-chip-link">記憶</Link>
        </nav>
      </header>

      {loading ? (
        <GamesSkeleton />
      ) : games.length === 0 ? (
        <GamesEmpty />
      ) : (
        <section aria-label="ゲームルームの状態" style={{ padding: 18, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {games.map(game => (
            <article key={game.title} style={{ border: '1px solid var(--luna-border)', borderRadius: 8, padding: 16, background: 'linear-gradient(145deg, rgba(27,23,17,.9), rgba(14,13,11,.96))', minHeight: 168, boxShadow: 'var(--luna-shadow)' }}>
              <div style={{ color: 'var(--luna-faint)', fontSize: 12, marginBottom: 10 }}>{game.status}</div>
              <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{game.title}</h2>
              <p style={{ color: 'var(--luna-text-soft)', fontSize: 14, lineHeight: 1.65, margin: '12px 0 0' }}>{game.summary}</p>
            </article>
          ))}
        </section>
      )}

      <section aria-label="ゲーム引き継ぎの流れ" style={{ padding: '0 18px 22px' }}>
        <div style={{ borderTop: '1px solid var(--luna-border-soft)', paddingTop: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.35, color: 'var(--luna-gold)' }}>会話への引き継ぎ</h2>
          <ol style={{ margin: '12px 0 0', paddingLeft: 20, color: 'var(--luna-text-soft)', fontSize: 14, lineHeight: 1.7 }}>
            {carryoverSteps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  )
}
