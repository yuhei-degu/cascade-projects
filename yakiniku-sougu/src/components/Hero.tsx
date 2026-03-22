'use client';

const PHONE     = '076-XXX-XXXX';
const PHONE_TEL = 'tel:076XXXXXXX';
const IMAGE_URL = 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=1600&q=80';

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.06 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

export default function Hero() {
  return (
    <>
      <style>{`
        @keyframes hfade { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        .hf  { animation: hfade .8s ease both; }
        .hf1 { animation-delay: .1s; }
        .hf2 { animation-delay: .3s; }
        .hf3 { animation-delay: .5s; }
        .hf4 { animation-delay: .7s; }
      `}</style>

      <section style={{
        position: 'relative',
        height: '100svh',
        minHeight: 640,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 背景写真 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${IMAGE_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.38)',
        }} />

        {/* ── トップバー ── */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(20px,3vw,36px) clamp(24px,5vw,56px)',
        }}>
          {/* ロゴ（黒→白反転） */}
          <div className="hf hf1">
            <img
              src="/images/sougu-logo.png"
              alt="焼肉ホルモン そうご"
              style={{
                width: 'clamp(180px, 24vw, 320px)',
                height: 'auto',
                display: 'block',
                filter: 'invert(1)',
                opacity: 0.95,
              }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* 電話番号 */}
          <a
            href={PHONE_TEL}
            className="hf hf1"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--cream)', fontSize: 'clamp(0.78rem,1.6vw,1rem)',
              fontWeight: 500, letterSpacing: '0.14em', whiteSpace: 'nowrap',
              opacity: 0.9,
            }}
          >
            <PhoneIcon />{PHONE}
          </a>
        </div>

        {/* ── 中央コンテンツ ── */}
        <div style={{
          position: 'relative', zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 clamp(24px,6vw,80px) clamp(60px,8vh,80px)',
        }}>
          {/* サブラベル */}
          <div className="hf hf2" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <span style={{ width: 32, height: 1, background: 'var(--amber)', opacity: .7 }} />
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.32em', color: 'var(--amber)', fontWeight: 500 }}>
              金沢・焼肉ホルモン
            </span>
            <span style={{ width: 32, height: 1, background: 'var(--amber)', opacity: .7 }} />
          </div>

          {/* キャッチコピー */}
          <p className="hf hf3" style={{
            fontSize: 'clamp(1rem,3.2vw,1.18rem)',
            letterSpacing: '0.12em',
            color: 'rgba(240,232,220,0.82)',
            fontWeight: 300,
            lineHeight: 1.8,
            marginBottom: 40,
          }}>
            気軽に来れて、ちゃんと旨い。
          </p>

          {/* CTAボタン */}
          <div className="hf hf4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href={PHONE_TEL}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'var(--red)', color: 'var(--cream)',
                padding: '14px 28px', fontSize: '0.82rem', fontWeight: 500,
                letterSpacing: '0.16em', transition: 'background .18s', whiteSpace: 'nowrap',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--red-h)')}
              onMouseOut={e  => (e.currentTarget.style.background = 'var(--red)')}
            >
              <PhoneIcon />{PHONE}
            </a>
            <a
              href="#access"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                border: '1px solid rgba(240,232,220,0.35)', color: 'rgba(240,232,220,0.82)',
                padding: '13px 24px', fontSize: '0.82rem', fontWeight: 400,
                letterSpacing: '0.12em', whiteSpace: 'nowrap',
                transition: 'border-color .18s, color .18s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'rgba(240,232,220,0.7)';
                e.currentTarget.style.color = 'rgba(240,232,220,1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(240,232,220,0.35)';
                e.currentTarget.style.color = 'rgba(240,232,220,0.82)';
              }}
            >
              <MapIcon />アクセス
            </a>
          </div>
        </div>

        {/* 下部グラデーション */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 80,
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
          pointerEvents: 'none',
        }} />
      </section>
    </>
  );
}
