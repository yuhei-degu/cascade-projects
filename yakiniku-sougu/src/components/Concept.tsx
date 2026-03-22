'use client'
// ────────────────────────────────────────────────────────────────────────────
// Concept — コンセプト
// 📌 LINES → 店の雰囲気を伝える短文（3行以内）
// ────────────────────────────────────────────────────────────────────────────

const LINES = [
  '炭火で焼くホルモンと肉。',
  '一人でも気軽に入れて、',
  'ちゃんと旨い時間を過ごせる店です。',
];

export default function Concept() {
  return (
    <section style={{ background: 'var(--surface)', padding: '88px 28px 96px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* 左寄せ amber ライン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <span style={{ width: 32, height: 2, background: 'var(--red)', display: 'block', flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.28em', color: 'var(--amber)', fontWeight: 500 }}>
            CONCEPT
          </span>
        </div>

        {/* コンセプト文 */}
        <div>
          {LINES.map((line, i) => (
            <p
              key={i}
              style={{
                fontWeight: i === 0 ? 500 : 300,
                fontSize: 'clamp(1.05rem, 4.5vw, 1.25rem)',
                letterSpacing: '0.08em',
                lineHeight: 2.0,
                color: i === 0
                  ? 'var(--cream)'
                  : 'rgba(226,216,206,0.72)',
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* 下部ライン */}
        <div style={{ marginTop: 40, width: 48, height: 1, background: 'var(--border2)' }} />
      </div>
    </section>
  );
}
