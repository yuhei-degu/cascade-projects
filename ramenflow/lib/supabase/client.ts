// lib/supabase/client.ts
// ブラウザ（Client Components）用 Supabase クライアント
// 'use client' なコンポーネント内でのみ使用すること

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
