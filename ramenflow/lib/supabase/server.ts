// lib/supabase/server.ts
// Server Components・Server Actions 用 Supabase クライアント
// cookies() を使うため Server 環境でのみ動作する

import { createServerClient } from '@supabase/ssr'
import type { SetAllCookies } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // Next.js 15 では cookies() が非同期
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component から呼ばれた場合は set できないが問題なし
            // middleware.ts 側で cookie の更新を行っているため
          }
        },
      },
    }
  )
}
