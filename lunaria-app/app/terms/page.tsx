import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約 | Lunaria',
}

const sections = [
  {
    title: '第1条（適用）',
    body: [
      '本利用規約（以下「本規約」といいます。）は、【運営者情報】（以下「運営者」といいます。）が提供する Lunaria（以下「本サービス」といいます。）の利用条件を定めるものです。',
      '本サービスを利用する方（以下「ユーザー」といいます。）は、本規約に同意したうえで本サービスを利用するものとします。',
    ],
  },
  {
    title: '第2条（利用資格）',
    body: [
      '本サービスは、18歳以上の方のみ利用できます。',
      '18歳未満の方は、本サービスを利用できません。',
    ],
  },
  {
    title: '第3条（アカウント管理）',
    body: [
      'ユーザーは、登録情報を正確に管理し、メールアドレス、パスワード、ログインリンク等を第三者に利用させないものとします。',
      'アカウントの管理不備、使用上の過誤、第三者による使用等によって生じた損害について、運営者は運営者に故意または重過失がある場合を除き責任を負いません。',
    ],
  },
  {
    title: '第4条（AI生成コンテンツ）',
    body: [
      '本サービスの応答、文章、提案、記録の要約その他の出力は、AIにより人工的に生成されるコンテンツです。',
      '運営者は、AI生成コンテンツの正確性、完全性、有用性、最新性、適法性、特定目的への適合性を保証しません。',
      'AI生成コンテンツは、医療、法律、金融、心理、その他専門的助言を提供するものではありません。必要に応じて、医師、弁護士、その他の専門家に相談してください。',
      'ユーザーは、AI生成コンテンツを自己の判断と責任において利用するものとします。',
    ],
  },
  {
    title: '第5条（禁止事項）',
    body: [
      'ユーザーは、法令または公序良俗に違反する行為、第三者の権利を侵害する行為、虚偽または過度に有害な情報を入力する行為、本サービスの運営を妨害する行為をしてはなりません。',
      'ユーザーは、本サービスを不正アクセス、リバースエンジニアリング、自動化された大量アクセス、その他不正または不適切な目的で利用してはなりません。',
    ],
  },
  {
    title: '第6条（サービスの変更・停止）',
    body: [
      '運営者は、必要に応じて本サービスの内容を変更、追加、中断、停止または終了できるものとします。',
      'これによりユーザーに損害が生じた場合でも、運営者は運営者に故意または重過失がある場合を除き責任を負いません。',
    ],
  },
  {
    title: '第7条（退会・データ削除）',
    body: [
      'ユーザーは、運営者所定の方法により退会を申し出ることができます。',
      '退会時には、法令上または運営上保存が必要な情報を除き、ユーザーに紐づく登録情報、会話ログ、利用イベント等を合理的な期間内に削除します。',
    ],
  },
  {
    title: '第8条（免責）',
    body: [
      '運営者は、本サービスに事実上または法律上の瑕疵がないことを保証しません。',
      '本サービスの利用または利用不能により生じた損害について、運営者は運営者に故意または重過失がある場合を除き責任を負いません。',
    ],
  },
  {
    title: '第9条（規約の変更）',
    body: [
      '運営者は、必要に応じて本規約を変更できます。',
      '変更後の規約は、本サービス上に掲示した時点から効力を生じるものとします。',
    ],
  },
  {
    title: '第10条（準拠法・協議）',
    body: [
      '本規約は日本法に準拠します。',
      '本サービスに関して紛争が生じた場合、ユーザーと運営者は誠実に協議するものとします。',
    ],
  },
  {
    title: '運営者情報',
    body: ['運営者名および連絡先：【運営者情報】'],
  },
]

export default function TermsPage() {
  return (
    <main style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      background: '#0e0d0b',
      color: 'var(--luna-text-soft)',
      padding: '40px 20px 64px',
    }}>
      <article style={{ width: 'min(100%, 840px)', margin: '0 auto' }}>
        <a href="/" style={{ color: 'var(--luna-gold-strong)', fontSize: 14, textDecoration: 'none' }}>Lunaria</a>
        <h1 style={{ marginTop: 24, color: 'var(--luna-text-bright)', fontSize: 32, lineHeight: 1.3 }}>利用規約</h1>
        <p style={{ marginTop: 12, color: '#9a907f', fontSize: 14 }}>制定日：2026年7月6日</p>

        <div style={{ display: 'grid', gap: 28, marginTop: 36 }}>
          {sections.map((section) => (
            <section key={section.title}>
              <h2 style={{ color: '#f1c77f', fontSize: 18, lineHeight: 1.5 }}>{section.title}</h2>
              <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                {section.body.map((paragraph) => (
                  <p key={paragraph} style={{ color: 'var(--luna-text-soft)', fontSize: 15, lineHeight: 1.9 }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <nav aria-label="関連ページ" style={{ display: 'flex', gap: 16, marginTop: 40, fontSize: 14 }}>
          <a href="/privacy" style={{ color: 'var(--luna-gold-strong)' }}>プライバシーポリシー</a>
          <a href="/login" style={{ color: 'var(--luna-gold-strong)' }}>ログイン</a>
        </nav>
      </article>
    </main>
  )
}
