export type BillingStatus = {
  enabled: boolean
  reason: 'feature_disabled' | 'missing_env' | 'ready'
  missing: string[]
}

const REQUIRED_STRIPE_ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
] as const

export function isStripeBillingFlagEnabled(): boolean {
  return process.env.LUNARIA_STRIPE_BILLING_ENABLED === '1'
}

export function getStripeBillingStatus(): BillingStatus {
  if (!isStripeBillingFlagEnabled()) {
    return { enabled: false, reason: 'feature_disabled', missing: [] }
  }

  const missing = REQUIRED_STRIPE_ENV.filter(key => !process.env[key]?.trim())
  if (missing.length > 0) {
    return { enabled: false, reason: 'missing_env', missing }
  }

  return { enabled: true, reason: 'ready', missing: [] }
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.LUNARIA_BASE_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function getStripePriceId(): string {
  return process.env.STRIPE_PRICE_ID?.trim() ?? ''
}

export function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? ''
}

export function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
}
