// lib/supabase/admin.ts
// Service Role Key を使う管理者クライアント
// ⚠️ RLS をバイパスするため Server Actions の中でのみ使用すること
// ⚠️ クライアントコンポーネントや公開 API には絶対に使わないこと

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      '[createAdminClient] NEXT_PUBLIC_SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です。'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      // Service Role では自動でセッション管理しない
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
