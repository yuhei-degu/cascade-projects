import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import {
  getStripeBillingStatus,
  getStripeWebhookSecret,
  isStripeBillingFlagEnabled,
} from '@/lib/stripe/billing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type StripeEvent = {
  id?: string
  type?: string
  data?: { object?: unknown }
}

function parseStripeSignature(header: string): { timestamp: string; signatures: string[] } {
  const parts = header.split(',')
  const timestamp = parts.find(part => part.startsWith('t='))?.slice(2) ?? ''
  const signatures = parts
    .filter(part => part.startsWith('v1='))
    .map(part => part.slice(3))
    .filter(Boolean)

  return { timestamp, signatures }
}

function secureCompareHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const { timestamp, signatures } = parseStripeSignature(header)
  if (!timestamp || signatures.length === 0) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex')

  return signatures.some(signature => secureCompareHex(expected, signature))
}

export async function POST(req: Request) {
  const payload = await req.text()

  if (!isStripeBillingFlagEnabled()) {
    return NextResponse.json({
      received: true,
      billingEnabled: false,
      reason: 'feature_disabled',
    })
  }

  const billing = getStripeBillingStatus()
  if (!billing.enabled) {
    return NextResponse.json(
      {
        error: 'stripe_billing_not_configured',
        billingEnabled: false,
        reason: billing.reason,
        missing: billing.missing,
      },
      { status: 503 },
    )
  }

  const signature = req.headers.get('stripe-signature') ?? ''
  if (!verifyStripeSignature(payload, signature, getStripeWebhookSecret())) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
      console.info('[stripe/webhook]', event.type, event.id ?? '')
      break
    default:
      console.info('[stripe/webhook] unhandled', event.type ?? 'unknown', event.id ?? '')
  }

  return NextResponse.json({ received: true })
}
