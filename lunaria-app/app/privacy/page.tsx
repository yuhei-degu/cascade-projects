import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Lunaria',
}

const sections = [
  {
    title: '1. 基本方針',
    body: [
      '【運営者情報】（以下「運営者」といいます。）は、Lunaria（以下「本サービス」といいます。）におけるユーザーの個人情報および関連情報を、本プライバシーポリシーに従って取り扱います。',
    ],
  },
  {
    title: '2. 取得する情報',
    body: [
      '運営者は、本サービスの提供にあたり、メールアドレス、会話ログ、利用イベント（ログイン、画面表示、機能利用、エラー等の利用状況に関する情報）を取得することがあります。',
      'ユーザーが会話内で入力した内容には、個人に関する情報が含まれる場合があります。ユーザーは、入力内容を自己の判断と責任において送信するものとします。',
    ],
  },
  {
    title: '3. 利用目的',
    body: [
      '取得した情報は、アカウント認証、本サービスの提供、会話体験の維持・改善、不具合調査、不正利用防止、問い合わせ対応、利用状況の分析のために利用します。',
      '会話ログおよび利用イベントは、サービス品質の改善、機能改善、障害調査、安全性の確保のために利用することがあります。',
    ],
  },
  {
    title: '4. AI生成コンテンツに関する注意',
    body: [
      '本サービスの応答は、AIにより人工的に生成されるものであり、正確性、完全性、有用性、最新性を保証するものではありません。',
      '本サービスの応答は、医療、法律、金融、心理、その他専門的助言ではありません。重要な判断を行う場合は、必ず専門家に相談してください。',
    ],
  },
  {
    title: '5. 外部サービスへの委託',
    body: [
      '運営者は、本サービスの認証、データ保存、データ処理等のため、Supabaseに情報の取扱いを委託することがあります。',
      '運営者は、AI応答生成のため、Google Gemini APIに会話内容その他必要な情報の処理を委託することがあります。',
      'これらの委託先には、本サービスの提供に必要な範囲で情報が送信される場合があります。',
    ],
  },
  {
    title: '6. 第三者提供',
    body: [
      '運営者は、法令に基づく場合、ユーザーの同意がある場合、生命・身体・財産の保護に必要な場合、その他法令上認められる場合を除き、個人情報を第三者に提供しません。',
    ],
  },
  {
    title: '7. 安全管理',
    body: [
      '運営者は、取得した情報の漏えい、滅失、毀損、不正アクセス等を防止するため、合理的な安全管理措置を講じます。',
    ],
  },
  {
    title: '8. 退会時の削除',
    body: [
      'ユーザーが退会した場合、運営者は、法令上または運営上保存が必要な情報を除き、ユーザーに紐づくメールアドレス、会話ログ、利用イベント等を合理的な期間内に削除します。',
      'バックアップ、ログ、外部委託先の保存仕様等により、削除が反映されるまで一定期間を要する場合があります。',
    ],
  },
  {
    title: '9. 開示・訂正・削除等',
    body: [
      'ユーザーは、法令に基づき、自己の個人情報について開示、訂正、利用停止、削除等を求めることができます。',
      '手続きの詳細は、下記の連絡先までお問い合わせください。',
    ],
  },
  {
    title: '10. 18歳未満の利用制限',
    body: [
      '本サービスは18歳以上の方を対象としています。18歳未満の方は本サービスを利用できません。',
    ],
  },
  {
    title: '11. 改定',
    body: [
      '運営者は、必要に応じて本プライバシーポリシーを改定できます。',
      '改定後の内容は、本サービス上に掲示した時点から効力を生じるものとします。',
    ],
  },
  {
    title: '12. 運営者情報・連絡先',
    body: ['運営者名および連絡先：【運営者情報】'],
  },
]

export default function PrivacyPage() {
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
        <h1 style={{ marginTop: 24, color: 'var(--luna-text-bright)', fontSize: 32, lineHeight: 1.3 }}>プライバシーポリシー</h1>
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
          <a href="/terms" style={{ color: 'var(--luna-gold-strong)' }}>利用規約</a>
          <a href="/login" style={{ color: 'var(--luna-gold-strong)' }}>ログイン</a>
        </nav>
      </article>
    </main>
  )
}
