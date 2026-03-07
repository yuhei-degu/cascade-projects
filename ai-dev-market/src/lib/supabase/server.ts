/**
 * Supabase クライアント（サーバーサイド専用 — service_role key）
 * フロントエンドからの直接DBアクセスは禁止。API Route経由のみ。
 */
import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  throw new Error("Supabase 環境変数が設定されていません");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
