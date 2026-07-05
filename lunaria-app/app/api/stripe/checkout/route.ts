import { NextResponse } from 'next/server'
import {
  getAppUrl,
  getStripeBillingStatus,
  getStripePriceId,
  getStripeSecretKey,
} from '@/lib/stripe/billing'
import { getAuthenticatedUserId } from '../../_auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type StripeCheckoutSession = {
  id: string
  url: string | null
}

export async function POST() {
  const billing = getStripeBillingStatus()
  if (!billing.enabled) {
    return NextResponse.json(
      {
        error: 'stripe_billing_disabled',
        billingEnabled: false,
        reason: billing.reason,
        missing: billing.missing,
      },
      { status: 503 },
    )
  }

  const auth = await getAuthenticatedUserId()
  if ('response' in auth) return auth.response

  const appUrl = getAppUrl()
  const body = new URLSearchParams()
  body.set('mode', 'subscription')
  body.set('line_items[0][price]', getStripePriceId())
  body.set('line_items[0][quantity]', '1')
  body.set('success_url', `${appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`)
  body.set('cancel_url', `${appUrl}/pricing?checkout=cancel`)
  body.set('metadata[lunaria_user_id]', auth.userId)
  body.set('subscription_data[metadata][lunaria_user_id]', auth.userId)
  body.set('allow_promotion_codes', 'true')

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  const session = (await response.json()) as Partial<StripeCheckoutSession> & {
    error?: { message?: string }
  }

  if (!response.ok || !session.url) {
    console.error('[stripe/checkout]', session.error?.message ?? session)
    return NextResponse.json({ error: 'stripe_checkout_failed' }, { status: 502 })
  }

  return NextResponse.json({ url: session.url })
}
