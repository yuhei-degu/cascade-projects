'use client'
// ────────────────────────────────────────────────────────────────────────────
// Menu — 人気メニュー（3〜5品のみ）
// 📌 ITEMS の各フィールドを実際のメニューに変更してください
//    tag: 'popular' | 'rec' | 'new' | null
// ────────────────────────────────────────────────────────────────────────────

type Item = {
  name: string;
  price: string;
  comment: string;   // 店主の一言（短く・人間っぽく）
  image: string;
  tag: 'popular' | 'rec' | 'new' | null;
};

const TAG_TEXT = {
  popular: '一番人気',
  rec:     'とりあえずこれ',
  new:     '新メニュー',
};
const TAG_COLOR = {
  popular: 'var(--red)',
  rec:     '#5a3a1a',
  new:     '#1a3a2e',
};

const ITEMS: Item[] = [
  {
    name: '厚切り牛タン塩',
    price: '¥1,280',
    comment: '一番人気。分厚く切ってます。',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=85',
    tag: 'popular',
  },
  {
    name: 'ホルモン盛合せ',
    price: '¥980',
    comment: 'とりあえずこれ頼んどけ、な一皿。',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85',
    tag: 'rec',
  },
  {
    name: '特上カルビ',
    price: '¥1,580',
    comment: '脂の甘みが出てからが本番です。',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85',
    tag: null,
  },
  {
    name: 'ハラミ',
    price: '¥1,080',
    comment: '赤身好きならまずこれ。',
    image: 'https://images.unsplash.com/photo-1561758033-48d52648ae8b?auto=format&fit=crop&w=900&q=85',
    tag: null,
  },
  {
    name: '上ミノ',
    price: '¥980',
    comment: 'コリコリ感がくせになります。',
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=900&q=85',
    tag: null,
  },
];

export default function Menu() {
  return (
    <section id="menu" style={{ background: 'var(--bg)', padding: '88px 28px 96px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <span style={{ width: 32, height: 2, background: 'var(--red)', display: 'block', flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.28em', color: 'var(--amber)', fontWeight: 500 }}>
            POPULAR MENU
          </span>
        </div>
        <h2 style={{
          fontWeight: 700,
          fontSize: 'clamp(1.5rem, 5vw, 1.9rem)',
          letterSpacing: '0.06em',
          marginBottom: 40,
          color: 'var(--cream)',
        }}>
          人気メニュー
        </h2>

        {/* カードリスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {ITEMS.map((item) => <MenuCard key={item.name} item={item} />)}
        </div>

        <p style={{ marginTop: 28, fontSize: '0.72rem', color: 'var(--dim)', letterSpacing: '0.08em' }}>
          ※ 表示価格はすべて税込です
        </p>
      </div>
    </section>
  );
}

function MenuCard({ item }: { item: Item }) {
  return (
    <article
      style={{
        display: 'flex',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        minHeight: 140,
      }}
    >
      {/* 写真（左側） */}
      <div style={{ position: 'relative', width: '38%', maxWidth: 200, flexShrink: 0, overflow: 'hidden' }}>
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.5s ease',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={e  => (e.currentTarget.style.transform = 'scale(1)')}
        />
        {/* タグ */}
        {item.tag && (
          <span style={{
            position: 'absolute', top: 10, left: 0,
            background: TAG_COLOR[item.tag],
            color: 'var(--cream)',
            fontSize: '0.68rem',
            fontWeight: 500,
            letterSpacing: '0.1em',
            padding: '4px 10px',
          }}>
            {TAG_TEXT[item.tag]}
          </span>
        )}
      </div>

      {/* テキスト（右側） */}
      <div style={{
        flex: 1,
        padding: 'clamp(16px, 3vw, 24px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 10,
      }}>
        <h3 style={{
          fontWeight: 700,
          fontSize: 'clamp(1rem, 3.5vw, 1.2rem)',
          letterSpacing: '0.05em',
          color: 'var(--cream)',
        }}>
          {item.name}
        </h3>

        <p style={{
          fontSize: '0.78rem',
          color: 'var(--muted)',
          letterSpacing: '0.05em',
          lineHeight: 1.7,
        }}>
          {item.comment}
        </p>

        {/* 価格 */}
        <p style={{
          fontWeight: 500,
          fontSize: 'clamp(1.05rem, 3.5vw, 1.2rem)',
          color: 'var(--amber)',
          letterSpacing: '0.06em',
          marginTop: 4,
        }}>
          {item.price}
        </p>
      </div>
    </article>
  );
}
