-- lunaria migration 008: サブスクリプション管理 + 記憶表出タイムスタンプ
-- Supabase SQL Editor にそのまま貼り付けて Run

-- 1. lunaria_users に plan カラムを追加
--    free（デフォルト）: 記憶保持7日 / premium: 記憶保持無制限
alter table public.lunaria_users
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'premium'));

-- 2. lunaria_core_memory に decay 用インデックスを追加
--    （last_seen が古い記憶を効率的にスキャンするため）
create index if not exists lunaria_core_memory_last_seen_idx
  on public.lunaria_core_memory(user_id, last_seen asc)
  where memory_category is distinct from 'profile';

-- 3. lunaria_extractions に importance_score インデックスを追加
--    （getContextualMemory / getMemoryForProbe のクエリ高速化）
create index if not exists lunaria_extractions_importance_idx
  on public.lunaria_extractions(user_id, importance_score desc, created_at desc);

-- ── 確認用クエリ（任意で実行） ─────────────────────────────
-- select id, plan from public.lunaria_users;
-- select id, content, score, last_seen, memory_category from public.lunaria_core_memory order by last_seen asc;
