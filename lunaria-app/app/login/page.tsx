'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'magic' | 'login' | 'signup'
type Status = 'idle' | 'sending' | 'sent' | 'error'

const tabStyle = (active: boolean) => ({
  flex: 1,
  minHeight: 38,
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 6,
  background: active ? '#c8a060' : '#0f0d0a',
  color: active ? '#0e0d0b' : '#ddd5c5',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
})

const inputStyle = {
  width: '100%',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 6,
  background: '#0f0d0a',
  color: '#ddd5c5',
  font: 'inherit',
  fontSize: 15,
  padding: '11px 12px',
}

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const resetFeedback = (nextMode: AuthMode) => {
    setMode(nextMode)
    setStatus('idle')
    setMessage('')
  }

  const redirectAfterLogin = () => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next')
    window.location.href = next?.startsWith('/') ? next : '/'
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const needsPassword = mode !== 'magic'

    if (!trimmedEmail || status === 'sending') return

    if (needsPassword && password.length < 8) {
      setStatus('error')
      setMessage('パスワードは8文字以上で入力してください。')
      return
    }

    setStatus('sending')
    setMessage('')

    const supabase = createClient()

    if (mode === 'magic') {
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
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setStatus('error')
        setMessage('新規登録に失敗しました。入力内容を確認して、もう一度お試しください。')
        return
      }

      setStatus('sent')
      setMessage('登録を受け付けました。確認メールが届いている場合は、メール内のリンクを開いてください。')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (error) {
      setStatus('error')
      setMessage('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
      return
    }

    setStatus('sent')
    setMessage('ログインしました。')
    redirectAfterLogin()
  }

  const buttonLabel = (() => {
    if (status === 'sending') return mode === 'magic' ? '送信中...' : '処理中...'
    if (mode === 'magic') return 'ログインリンクを送信'
    if (mode === 'signup') return 'メールとパスワードで登録'
    return 'メールとパスワードでログイン'
  })()

  const submitDisabled =
    status === 'sending' || !email.trim() || (mode !== 'magic' && password.length < 8)

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
        width: 'min(100%, 440px)',
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
            マジックリンク、またはメールアドレスとパスワードでログインできます。
          </p>
        </div>

        <div role="tablist" aria-label="ログイン方法" style={{ display: 'flex', gap: 8 }}>
          <button type="button" role="tab" aria-selected={mode === 'magic'} onClick={() => resetFeedback('magic')} style={tabStyle(mode === 'magic')}>
            マジックリンク
          </button>
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => resetFeedback('login')} style={tabStyle(mode === 'login')}>
            ログイン
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => resetFeedback('signup')} style={tabStyle(mode === 'signup')}>
            新規登録
          </button>
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
            style={inputStyle}
          />
        </label>

        {mode !== 'magic' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#bdb4a3' }}>
            パスワード
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="8文字以上"
              disabled={status === 'sending'}
              style={inputStyle}
            />
          </label>
        )}

        <button
          type="submit"
          disabled={submitDisabled}
          style={{
            minHeight: 44,
            border: 0,
            borderRadius: 6,
            background: '#c8a060',
            color: '#0e0d0b',
            font: 'inherit',
            fontWeight: 700,
            cursor: submitDisabled ? 'not-allowed' : 'pointer',
            opacity: submitDisabled ? .55 : 1,
          }}
        >
          {buttonLabel}
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
