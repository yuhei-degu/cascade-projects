// src/lib/supabase/auth.ts
import { createBrowserClient } from "@supabase/ssr"

export function createAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const FREE_DAILY_LIMIT = 10  // 無料プランの1日あたり最大問題数
