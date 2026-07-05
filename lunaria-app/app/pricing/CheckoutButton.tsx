'use client'

import { useState } from 'react'

type CheckoutButtonProps = {
  disabled: boolean
}

export default function CheckoutButton({ disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startCheckout() {
    if (disabled || loading) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !data.url) {
        setError(data.error ?? 'checkout_unavailable')
        return
      }

      window.location.href = data.url
    } catch {
      setError('checkout_unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <button
        type="button"
        onClick={startCheckout}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        style={{
          minHeight: 42,
          borderRadius: 6,
          border: '1px solid rgba(200,160,96,.55)',
          background: disabled ? 'rgba(255,255,255,.05)' : '#c8a060',
          color: disabled ? '#81786a' : '#0e0d0b',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: 700,
          opacity: loading ? .75 : 1,
        }}
      >
        {loading ? '接続中...' : disabled ? '現在は受付停止中' : 'Checkoutへ進む'}
      </button>
      {error && (
        <p role="alert" style={{ color: '#d59a83', fontSize: 12, lineHeight: 1.6 }}>
          {error}
        </p>
      )}
    </div>
  )
}
