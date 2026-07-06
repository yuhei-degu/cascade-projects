const games = [
  {
    title: '終末世界サバイバル',
    status: 'ルート復旧待ち',
    summary: 'ルート本体、上部ナビゲーション、ビルド対象、引き継ぎ文言をひとまとまりの変更として復旧します。',
  },
  {
    title: '記憶の引き継ぎ',
    status: '利用できます',
    summary: 'ゲーム由来の記憶は確認棚に入り、承認後は会話の文脈へ戻せます。',
  },
]

const carryoverSteps = [
  'ゲーム結果を完了、または保留します。',
  '記憶を開き、ゲーム引き継ぎ候補を承認します。',
  '部屋へ戻ると、次の会話でルナが承認済みの結果を参照できます。',
]

export default function GamesPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#0e0d0b', color: '#ddd5c5', fontFamily: '"Hiragino Sans","Noto Sans JP","Meiryo",sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div>
          <div style={{ color: '#c8a060', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase' }}>ゲーム</div>
          <h1 style={{ fontSize: 22, lineHeight: 1.2, margin: '4px 0 0' }}>Lunaria ゲームルート</h1>
        </div>
        <nav aria-label="ゲームのナビゲーション" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="/" aria-label="Lunariaの部屋に戻る" style={{ color: '#bba989', fontSize: 13, textDecoration: 'none' }}>部屋</a>
          <a href="/memory" aria-label="記憶を開く" style={{ color: '#bba989', fontSize: 13, textDecoration: 'none' }}>記憶</a>
        </nav>
      </header>

      <section aria-label="ゲームルートの状態" style={{ padding: 18, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {games.map(game => (
          <article key={game.title} style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 16, background: '#15130f', minHeight: 168 }}>
            <div style={{ color: '#8f8372', fontSize: 12, marginBottom: 10 }}>{game.status}</div>
            <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{game.title}</h2>
            <p style={{ color: '#b3a896', fontSize: 14, lineHeight: 1.65, margin: '12px 0 0' }}>{game.summary}</p>
          </article>
        ))}
      </section>

      <section aria-label="ゲーム引き継ぎの流れ" style={{ padding: '0 18px 22px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.35 }}>会話への引き継ぎ</h2>
          <ol style={{ margin: '12px 0 0', paddingLeft: 20, color: '#b3a896', fontSize: 14, lineHeight: 1.7 }}>
            {carryoverSteps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  )
}
