'use client'
// ────────────────────────────────────────────────────────────────────────────
// Footer
// 📌 INSTAGRAM_URL → 実際のURL
// 📌 PHONE / TEL   → 実際の電話番号
// ────────────────────────────────────────────────────────────────────────────

const INSTAGRAM_URL = 'https://www.instagram.com/yakiniku_sougu/';
const PHONE         = '076-XXX-XXXX';
const TEL           = 'tel:076XXXXXXX';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '60px 28px 52px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* 上段：店名＋電話 */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 24,
          marginBottom: 36,
          paddingBottom: 32,
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <p style={{
              fontSize: '0.68rem', fontWeight: 500,
              letterSpacing: '0.3em', color: 'var(--amber)',
              marginBottom: 8,
            }}>
              YAKINIKU · HORUMON
            </p>
            <h2 style={{
              fontWeight: 700,
              fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
              letterSpacing: '0.08em',
              color: 'var(--cream)',
            }}>
              焼肉ホルモンそうご
            </h2>
          </div>

          <a
            href={TEL}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'var(--red)',
              color: 'var(--cream)',
              padding: '13px 22px',
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.15em',
              transition: 'background 0.18s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'var(--red-h)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'var(--red)')}
          >
            <PhoneIcon />
            {PHONE}
          </a>
        </div>

        {/* 下段：Instagram＋コピーライト */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--muted)',
              fontSize: '0.75rem',
              letterSpacing: '0.22em',
              fontWeight: 500,
              transition: 'color 0.18s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--cream)')}
            onMouseOut={e  => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <IgIcon />
            Instagram
          </a>

          <p style={{ fontSize: '0.72rem', color: 'var(--dim)', letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} 焼肉ホルモンそうご
          </p>
        </div>
      </div>
    </footer>
  );
}

function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function IgIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  );
}
