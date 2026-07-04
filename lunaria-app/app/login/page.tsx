'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail || status === 'sending') return

    setStatus('sending')
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setMessage('送信に失敗しました。メールアドレスを確認して、もう一度お試しください。')
      return
    }

    setStatus('sent')
    setMessage('ログイン用リンクを送信しました。メールを確認してください。')
  }

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      background: '#0e0d0b',
      color: '#ddd5c5',
    }}>
      <form onSubmit={submit} style={{
        width: 'min(100%, 420px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        padding: '28px 24px',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 8,
        background: '#15130f',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ fontSize: 24, lineHeight: 1.3, fontWeight: 600 }}>Lunaria にログイン</h1>
          <p style={{ color: '#9a907f', fontSize: 14, lineHeight: 1.7 }}>
            メールアドレスに届くマジックリンクからログインできます。
          </p>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#bdb4a3' }}>
          メールアドレス
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            disabled={status === 'sending'}
            style={{
              width: '100%',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 6,
              background: '#0f0d0a',
              color: '#ddd5c5',
              font: 'inherit',
              fontSize: 15,
              padding: '11px 12px',
            }}
          />
        </label>

        <button
          type="submit"
          disabled={status === 'sending' || !email.trim()}
          style={{
            minHeight: 44,
            border: 0,
            borderRadius: 6,
            background: '#c8a060',
            color: '#0e0d0b',
            font: 'inherit',
            fontWeight: 700,
            cursor: status === 'sending' || !email.trim() ? 'not-allowed' : 'pointer',
            opacity: status === 'sending' || !email.trim() ? .55 : 1,
          }}
        >
          {status === 'sending' ? '送信中...' : 'ログインリンクを送信'}
        </button>

        {message && (
          <p role="status" aria-live="polite" style={{
            minHeight: 24,
            color: status === 'error' ? '#e6a09a' : '#9bc7ad',
            fontSize: 13,
            lineHeight: 1.7,
          }}>
            {message}
          </p>
        )}
      </form>
    </main>
  )
}
