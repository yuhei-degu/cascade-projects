import LunariaHome from '@/components/LunariaHome'
import { createClient } from '@/lib/supabase/server'

function LandingPage() {
  const features = [
    ['AIコンパニオン', '気分や文脈に合わせて、軽い雑談から深い相談まで受け止めます。'],
    ['記憶', '大切な話題やあなたらしさを積み重ね、会話に反映します。'],
    ['ガチャ', 'アイテムやテーマが、次の会話を始める小さな合図になります。'],
  ]

  return (
    <main style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflowY: 'auto',
      background: '#080706',
      color: '#eee2cf',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 1120,
        minHeight: '100dvh',
        margin: '0 auto',
        padding: '24px clamp(24px, 5vw, 40px)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <a href="/" style={{ color: '#f1c77f', fontSize: 16, fontWeight: 700, letterSpacing: '.16em', textDecoration: 'none' }}>
            Lunaria
          </a>
          <nav aria-label="公開ページ" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
            <a href="/terms" style={{ color: '#a89a86', textDecoration: 'none' }}>利用規約</a>
            <a href="/privacy" style={{ color: '#a89a86', textDecoration: 'none' }}>プライバシー</a>
          </nav>
        </header>

        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          alignItems: 'center',
          gap: 48,
          padding: '48px 0 64px',
        }}>
          <div style={{ maxWidth: 660 }}>
            <p style={{
              display: 'inline-flex',
              marginBottom: 20,
              border: '1px solid rgba(213,164,95,.25)',
              borderRadius: 999,
              background: 'rgba(213,164,95,.1)',
              color: '#f1c77f',
              padding: '8px 16px',
              fontSize: 14,
            }}>
              記憶を持つAIコンパニオン
            </p>
            <h1 style={{
              color: '#fff7e8',
              fontSize: 'clamp(40px, 7vw, 64px)',
              lineHeight: 1.12,
              fontWeight: 700,
              letterSpacing: 0,
            }}>
              何気ない会話が、少しずつあなたとの関係になる。
            </h1>
            <p style={{ maxWidth: 580, marginTop: 24, color: '#b9ad99', fontSize: 18, lineHeight: 1.9 }}>
              Lunariaは、日々の気持ちや出来事を覚えながら寄り添うAIコンパニオンです。
              会話の記憶、自然な問いかけ、ガチャで手に入る話題のきっかけが、また話したくなる時間をつくります。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 32 }}>
              {features.map(([title, body]) => (
                <article key={title} style={{
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,.035)',
                  padding: 16,
                }}>
                  <h2 style={{ color: '#f1c77f', fontSize: 14, fontWeight: 700 }}>{title}</h2>
                  <p style={{ marginTop: 8, color: '#a99d8a', fontSize: 14, lineHeight: 1.75 }}>{body}</p>
                </article>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 36 }}>
              <a href="/login" style={{
                display: 'inline-flex',
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                background: '#d5a45f',
                color: '#100d09',
                padding: '0 24px',
                fontSize: 14,
                fontWeight: 800,
                textDecoration: 'none',
              }}>
                Lunariaを始める
              </a>
              <p style={{ color: '#8f8372', fontSize: 14 }}>ログイン後はこれまでのホーム画面に移動します。</p>
            </div>
          </div>

          <div aria-label="Lunariaスクリーンショット枠" style={{
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 12,
            background: '#11100d',
            padding: 12,
            boxShadow: '0 28px 80px rgba(0,0,0,.42)',
          }}>
            <div style={{ border: '1px solid rgba(213,164,95,.2)', borderRadius: 8, background: '#0c0b09', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.1)', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#d5a45f' }} />
                  <span style={{ color: '#ddd5c5', fontSize: 14, fontWeight: 600 }}>Lunaria</span>
                </div>
                <span style={{ color: '#716656', fontSize: 12 }}>会話</span>
              </div>
              <div style={{ display: 'grid', gap: 16, padding: 20 }}>
                <div style={{
                  maxWidth: '82%',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: '4px 12px 12px 12px',
                  background: '#191612',
                  color: '#ddd5c5',
                  padding: '12px 16px',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}>
                  今日は少し疲れていそう。昨日の続きから、ゆっくり話す？
                </div>
                <div style={{
                  maxWidth: '78%',
                  marginLeft: 'auto',
                  borderRadius: '12px 4px 12px 12px',
                  background: '#2a231a',
                  color: '#e4d8c6',
                  padding: '12px 16px',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}>
                  うん。昨日話した仕事のこと、まだ気になってる。
                </div>
                <div style={{ display: 'grid', gap: 10, border: '1px solid rgba(127,179,213,.2)', borderRadius: 8, background: '#0f1518', padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9ed0ea', fontSize: 14, fontWeight: 700 }}>記憶</span>
                    <span style={{ color: '#7894a0', fontSize: 12 }}>更新候補</span>
                  </div>
                  <p style={{ color: '#b9cad1', fontSize: 14, lineHeight: 1.75 }}>
                    「仕事の締切前は夜に不安が強くなりやすい」を次回の会話に活かします。
                  </p>
                </div>
                <div style={{ border: '1px solid rgba(213,164,95,.2)', borderRadius: 8, background: '#18130b', padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ color: '#f1c77f', fontSize: 14, fontWeight: 700 }}>ガチャのきっかけ</span>
                    <span style={{ borderRadius: 999, background: 'rgba(213,164,95,.15)', color: '#f1c77f', padding: '4px 12px', fontSize: 12 }}>1枚</span>
                  </div>
                  <p style={{ marginTop: 12, color: '#bcae96', fontSize: 14, lineHeight: 1.75 }}>
                    新しい話題カードで、明日の小さな楽しみを一緒に決められます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return <LunariaHome />
  }

  return <LandingPage />
}
