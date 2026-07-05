import Link from 'next/link'
import CheckoutButton from './CheckoutButton'
import { getStripeBillingStatus } from '@/lib/stripe/billing'

export const dynamic = 'force-dynamic'

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string }>
}) {
  const billing = getStripeBillingStatus()
  const checkout = (await searchParams)?.checkout

  return (
    <main style={{
      minHeight: '100dvh',
      overflowY: 'auto',
      background: '#0e0d0b',
      color: '#ddd5c5',
      padding: '28px 18px',
      fontFamily: '"Hiragino Sans","Noto Sans JP","Meiryo",sans-serif',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: 22 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <p style={{ color: '#8f8372', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Lunaria Premium
            </p>
            <h1 style={{ marginTop: 8, color: '#f0dfbd', fontSize: 28, fontWeight: 700 }}>
              料金プラン
            </h1>
          </div>
          <Link href="/" style={{ color: '#8f8372', fontSize: 13, textDecoration: 'none' }}>
            戻る
          </Link>
        </header>

        {checkout === 'success' && (
          <div role="status" style={{
            border: '1px solid rgba(77,143,122,.55)',
            borderRadius: 6,
            background: 'rgba(77,143,122,.12)',
            color: '#a8d7c7',
            padding: 14,
            fontSize: 13,
            lineHeight: 1.7,
          }}>
            Checkoutから戻りました。課金反映はまだ有効化していません。
          </div>
        )}

        {checkout === 'cancel' && (
          <div role="status" style={{
            border: '1px solid rgba(200,150,60,.45)',
            borderRadius: 6,
            background: 'rgba(200,150,60,.11)',
            color: '#d8bb82',
            padding: 14,
            fontSize: 13,
            lineHeight: 1.7,
          }}>
            Checkoutをキャンセルしました。
          </div>
        )}

        <section style={{
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 8,
          background: '#15130f',
          padding: 20,
          display: 'grid',
          gap: 18,
        }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ color: '#f0dfbd', fontSize: 20, fontWeight: 700 }}>
              Premium
            </h2>
            <p style={{ color: '#a99d8c', fontSize: 14, lineHeight: 1.8 }}>
              長く使う人向けのサブスクリプション枠です。現在は準備中のため、実際の課金導線は停止しています。
            </p>
          </div>

          <div style={{ display: 'grid', gap: 8, color: '#c9bfae', fontSize: 14, lineHeight: 1.8 }}>
            <div>・記憶保持まわりのPremium枠</div>
            <div>・将来のサブスクリプション管理に接続予定</div>
            <div>・有効化時期は人間が判断</div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,.07)',
            paddingTop: 16,
            display: 'grid',
            gap: 12,
          }}>
            <CheckoutButton disabled={!billing.enabled} />
            <p style={{ color: '#7f7568', fontSize: 12, lineHeight: 1.7 }}>
              Status: {billing.enabled ? 'ready' : billing.reason}
              {billing.missing.length > 0 ? ` (${billing.missing.join(', ')})` : ''}
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
