'use client'

import { useEffect, useState } from 'react'

// DB が落ちていても画面はフォールバックで動いてしまうため、気づけるように常時表示する。
// 実際に Supabase プロジェクト消失に気づかず偽データで操作していた事故があったための保険。
export default function DbStatusBanner() {
  const [degraded, setDegraded] = useState(false)

  useEffect(() => {
    let alive = true
    const check = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        if (alive) setDegraded(!res.ok)
      } catch {
        if (alive) setDegraded(true)
      }
    }
    check()
    const id = setInterval(check, 60_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  if (!degraded) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '8px 16px',
        fontSize: 13,
        textAlign: 'center',
        color: 'var(--luna-bg)',
        background: 'var(--luna-danger)',
        fontWeight: 600,
      }}
    >
      データベースに接続できていません。表示中の内容は一時データで、会話や日記は保存されません。
    </div>
  )
}
