'use client'
// ────────────────────────────────────────────────────────────────────────────
// Gallery — 店内の雰囲気
// 📌 PHOTOS[0] → カウンター席の写真（必須）
// 📌 PHOTOS[1] → 暖色照明の全体写真
// 📌 PHOTOS[2] → 炭火・網の写真
// ────────────────────────────────────────────────────────────────────────────

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
    alt: 'カウンター席',
    caption: '一人でもゆっくりできるカウンター',
  },
  {
    src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
    alt: '店内の雰囲気',
    caption: '',
  },
  {
    src: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
    alt: '炭火焼き',
    caption: '',
  },
];

export default function Gallery() {
  const [main, ...subs] = PHOTOS;

  return (
    <section style={{ background: 'var(--surface)', padding: '88px 28px 96px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <span style={{ width: 32, height: 2, background: 'var(--red)', display: 'block', flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.28em', color: 'var(--amber)', fontWeight: 500 }}>
            ATMOSPHERE
          </span>
        </div>
        <h2 style={{
          fontWeight: 700,
          fontSize: 'clamp(1.5rem, 5vw, 1.9rem)',
          letterSpacing: '0.06em',
          marginBottom: 32,
          color: 'var(--cream)',
        }}>
          店内の雰囲気
        </h2>

        {/* フィーチャー写真（幅いっぱい） */}
        <div style={{ position: 'relative', overflow: 'hidden', marginBottom: 3 }}>
          <div style={{ paddingTop: '56%', position: 'relative' }}>
            <img
              src={main.src}
              alt={main.alt}
              loading="lazy"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s ease',
              }}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseOut={e  => (e.currentTarget.style.transform = 'scale(1)')}
            />
            {/* 暖色オーバーレイ（雰囲気強調） */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(19,13,8,0.60) 0%, transparent 50%)',
              pointerEvents: 'none',
            }} />
          </div>
          {/* キャプション */}
          {main.caption && (
            <p style={{
              position: 'absolute', bottom: 16, left: 20,
              fontSize: '0.75rem',
              color: 'rgba(240,232,220,0.75)',
              letterSpacing: '0.12em',
              fontWeight: 300,
            }}>
              {main.caption}
            </p>
          )}
        </div>

        {/* サブ写真 2枚 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          {subs.map((p) => (
            <div key={p.src} style={{ position: 'relative', overflow: 'hidden', paddingTop: '68%' }}>
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.6s ease',
                }}
                onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={e  => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
