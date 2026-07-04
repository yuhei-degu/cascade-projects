const games = [
  {
    title: 'Endworld survival',
    status: 'Route restoration pending',
    summary: 'Restore this as one scoped change: route body, top navigation, build target, and carryover wording together.',
  },
  {
    title: 'Memory carryover',
    status: 'Available now',
    summary: 'Game-sourced memories already flow into the review shelf and can return to conversation context.',
  },
]

const carryoverSteps = [
  'Finish or park a game result.',
  'Open Memory and approve the game carryover candidate.',
  'Return to the room so Luna can reference the approved result in the next conversation.',
]

export default function GamesPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#0e0d0b', color: '#ddd5c5', fontFamily: '"Hiragino Sans","Noto Sans JP","Meiryo",sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div>
          <div style={{ color: '#c8a060', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase' }}>Games</div>
          <h1 style={{ fontSize: 22, lineHeight: 1.2, margin: '4px 0 0' }}>Lunaria game routes</h1>
        </div>
        <nav aria-label="Games navigation" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="/" aria-label="Back to Lunaria room" style={{ color: '#bba989', fontSize: 13, textDecoration: 'none' }}>Room</a>
          <a href="/memory" aria-label="Open memory" style={{ color: '#bba989', fontSize: 13, textDecoration: 'none' }}>Memory</a>
        </nav>
      </header>

      <section aria-label="Game route status" style={{ padding: 18, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {games.map(game => (
          <article key={game.title} style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 16, background: '#15130f', minHeight: 168 }}>
            <div style={{ color: '#8f8372', fontSize: 12, marginBottom: 10 }}>{game.status}</div>
            <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{game.title}</h2>
            <p style={{ color: '#b3a896', fontSize: 14, lineHeight: 1.65, margin: '12px 0 0' }}>{game.summary}</p>
          </article>
        ))}
      </section>

      <section aria-label="Game carryover handoff" style={{ padding: '0 18px 22px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.35 }}>Conversation handoff</h2>
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
