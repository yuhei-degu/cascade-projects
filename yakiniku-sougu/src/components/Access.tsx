'use client'
// ────────────────────────────────────────────────────────────────────────────
// Access — アクセス
// 📌 INFO の各値を実際の店舗情報に変更してください
// 📌 MAP_SRC → Google Maps「共有→地図を埋め込む」の src URL
// ────────────────────────────────────────────────────────────────────────────

const INFO = {
  address:  '石川県金沢市○○町1-2-3 ○○ビル1F',
  hours: [
    { label: '平日',  time: '17:00 〜 24:00（L.O. 23:30）' },
    { label: '土日祝', time: '16:00 〜 24:00（L.O. 23:30）' },
  ],
  closed:  '不定休（Instagramで告知します）',
  phone:   '076-XXX-XXXX',
  tel:     'tel:076XXXXXXX',
  parking: '近隣にコインパーキングあり',
};

const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d51860!2d136.6256!3d36.5613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5ff8341ef970b75b%3A0xd47b1b3c8f5fcc41!2z6YOR5rGf5biC!5e0!3m2!1sja!2sjp!4v1700000000000';

export default function Access() {
  return (
    <section id="access" style={{ background: 'var(--bg)', padding: '88px 28px 96px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <span style={{ width: 32, height: 2, background: 'var(--red)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.28em', color: 'var(--amber)', fontWeight: 500 }}>
            ACCESS
          </span>
        </div>
        <h2 style={{
          fontWeight: 700,
          fontSize: 'clamp(1.5rem, 5vw, 1.9rem)',
          letterSpacing: '0.06em',
          marginBottom: 48,
          color: 'var(--cream)',
        }}>
          アクセス
        </h2>

        {/* 2カラム */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 48,
          alignItems: 'start',
        }}>

          {/* 店舗情報 */}
          <div>
            <Row label="住所">
              <p style={val}>{INFO.address}</p>
            </Row>
            <Row label="営業時間">
              {INFO.hours.map(h => (
                <div key={h.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <span style={{
                    background: 'var(--surface2)', color: 'var(--muted)',
                    fontSize: '0.7rem', letterSpacing: '0.08em',
                    padding: '3px 9px', flexShrink: 0, marginTop: 1,
                    border: '1px solid var(--border)',
                  }}>
                    {h.label}
                  </span>
                  <span style={{ ...val, lineHeight: 1.7 }}>{h.time}</span>
                </div>
              ))}
            </Row>
            <Row label="定休日">
              <p style={val}>{INFO.closed}</p>
            </Row>
            <Row label="電話番号">
              <a href={INFO.tel} style={{ ...val, letterSpacing: '0.15em', fontWeight: 500, color: 'var(--cream)' }}>
                {INFO.phone}
              </a>
            </Row>
            <Row label="駐車場">
              <p style={val}>{INFO.parking}</p>
            </Row>

            {/* 電話ボタン */}
            <a
              href={INFO.tel}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: 'var(--red)',
                color: 'var(--cream)',
                padding: '16px',
                width: '100%',
                fontSize: '0.88rem',
                fontWeight: 500,
                letterSpacing: '0.18em',
                marginTop: 28,
                transition: 'background 0.18s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--red-h)')}
              onMouseOut={e  => (e.currentTarget.style.background = 'var(--red)')}
            >
              <PhoneIcon />
              今すぐ電話する
            </a>
          </div>

          {/* Google Map */}
          <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
            <iframe
              src={MAP_SRC}
              width="100%"
              height="320"
              style={{
                border: 0, display: 'block',
                filter: 'grayscale(60%) brightness(0.82) sepia(15%)',
              }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="店舗地図"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const val: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 300,
  color: 'rgba(226,216,206,0.72)',
  letterSpacing: '0.06em',
  lineHeight: 1.85,
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '18px 0', firstChild: { paddingTop: 0 } as never }}>
      <p style={{
        fontSize: '0.7rem', fontWeight: 500,
        letterSpacing: '0.22em', color: 'var(--amber)',
        marginBottom: 8,
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
