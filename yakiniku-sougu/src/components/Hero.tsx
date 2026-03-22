'use client'
// ────────────────────────────────────────────────────────────────────────────
// Hero — ファーストビュー
// 📌 IMAGE_URL   → 肉が焼けている・煙が立っている写真
// 📌 PHONE_TEL   → tel:0XXXXXXXXXX 形式
// ────────────────────────────────────────────────────────────────────────────

const IMAGE_URL =
  'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1800&q=90';

const PHONE     = '076-XXX-XXXX';
const PHONE_TEL = 'tel:076XXXXXXX';

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        height: '100svh',
        minHeight: 640,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      {/* 背景写真 */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${IMAGE_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
        aria-hidden
      />

      {/* オーバーレイ */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: [
            'linear-gradient(to bottom,',
            '  rgba(10,6,4,0.08) 0%,',
            '  rgba(15,9,5,0.40) 32%,',
            '  rgba(18,11,7,0.70) 62%,',
            '  rgba(19,13,8,0.94) 100%)',
          ].join(''),
        }}
        aria-hidden
      />

      {/* トップバー：ロゴ左・電話右 */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(20px, 3vw, 32px) clamp(24px, 5vw, 48px)',
      }}>
        {/* ロゴ画像（左上） */}
        <img
          src="/images/sougu-logo.png"
          alt="焼肉ホルモン そうご"
          style={{ width: 'clamp(200px, 28vw, 380px)', height: 'auto', display: 'block' }}
          onError={e => {
            const el = e.currentTarget.parentElement!;
            el.innerHTML = `<h1 style="font-weight:700;font-size:clamp(1.4rem,4vw,2.2rem);letter-spacing:0.06em;color:var(--cream)">焼肉ホルモン そうご</h1>`;
          }}
        />
        {/* 電話番号（右上） */}
        <a
          href={PHONE_TEL}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            color: 'var(--cream)', fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
            fontWeight: 500, letterSpacing: '0.12em', whiteSpace: 'nowrap',
          }}
        >
          <PhoneIcon />{PHONE}
        </a>
      </div>

      {/* 中央：キャッチコピー＋CTA */}
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        padding: '0 clamp(24px, 5vw, 48px) clamp(60px, 10vh, 80px)',
      }}>
        <div className="fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ width: 28, height: 1, background: 'var(--amber)', opacity: 0.75 }} />
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.3em', color: 'var(--amber)', fontWeight: 500 }}>金沢・焼肉ホルモン</span>
          <span style={{ width: 28, height: 1, background: 'var(--amber)', opacity: 0.75 }} />
        </div>

        {/* キャッチコピー */}
        <p
          className="fade d2"
          style={{
            fontSize: 'clamp(0.9rem, 3.5vw, 1.05rem)',
            letterSpacing: '0.1em',
            color: 'rgba(240,232,220,0.76)',
            fontWeight: 300,
            marginBottom: 36,
            lineHeight: 1.7,
            textAlign: 'center',
          }}
        >
          気軽に来れて、ちゃんと旨い。
        </p>

        {/* CTA */}
        <div className="fade d3" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a
            href={PHONE_TEL}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              background: 'var(--red)', color: 'var(--cream)',
              padding: '15px 24px', fontSize: '0.85rem', fontWeight: 500,
              letterSpacing: '0.18em', transition: 'background 0.18s', whiteSpace: 'nowrap',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--red-h)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'var(--red)')}
          >
            <PhoneIcon />{PHONE}
          </a>
          <a
            href="#access"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              border: '1px solid rgba(240,232,220,0.30)', color: 'rgba(240,232,220,0.78)',
              padding: '14px 20px', fontSize: '0.85rem', fontWeight: 400,
              letterSpacing: '0.12em', whiteSpace: 'nowrap',
            }}
          >
            <MapIcon />アクセス
          </a>
        </div>
      </div>

      {/* スクロール */}
      <div style={{
        position: 'absolute', bottom: 28, right: 26,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.30,
      }}>
        <div style={{ width: 1, height: 40, background: 'var(--cream)' }} />
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.28em', color: 'var(--cream)', writingMode: 'vertical-rl' }}>
          SCROLL
        </span>
      </div>
    </section>
  );
}

function PhoneIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function MapIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
