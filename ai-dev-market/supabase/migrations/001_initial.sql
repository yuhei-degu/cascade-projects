-- 4. データベース設計 — AI Dev Market (Supabase PostgreSQL)
-- supabase/migrations/001_initial.sql

-- 有効化
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- ENUM 定義
-- ─────────────────────────────────────────────────────────
create type request_status as enum (
  'pending',         -- 投稿直後
  'reviewing',       -- AI審査中
  'rejected',        -- 却下
  'prototype_ready', -- プロトタイプ生成済み・確認待ち
  'prototype_ok',    -- 依頼者承認
  'payment_pending', -- 決済待ち
  'paid',            -- 決済完了・開発中
  'delivered',       -- 納品完了
  'revision',        -- 修正中
  'closed'           -- 完了
);

create type ai_verdict as enum ('A', 'B', 'C');

create type request_category as enum (
  'script',       -- スクリプト・自動化
  'web_tool',     -- Webツール・計算ツール
  'api_integration', -- API連携
  'dashboard',    -- ダッシュボード
  'website',      -- Webサイト・LP
  'other'
);

create type budget_range as enum (
  'under_10k', 'under_20k', 'under_30k', 'negotiable'
);

-- ─────────────────────────────────────────────────────────
-- テーブル: requests（依頼メイン）
-- ─────────────────────────────────────────────────────────
create table requests (
  id              uuid primary key default uuid_generate_v4(),
  title           varchar(100) not null,
  description     text not null,
  category        request_category not null,
  budget          budget_range not null,
  deadline        date,
  email           varchar(255) not null,  -- 通知用のみ・個人情報配慮
  status          request_status not null default 'pending',

  -- AI審査結果
  ai_verdict      ai_verdict,
  ai_score        smallint,               -- 0-100
  ai_estimated_hours int,
  ai_estimated_price int,

  -- プロトタイプ
  prototype_code  text,                   -- 生成されたコード
  prototype_lang  varchar(20),            -- 'html' | 'python' | 'js'
  prototype_note  text,

  -- プレビュートークン（UUID, 7日有効）
  preview_token   uuid unique default uuid_generate_v4(),
  preview_expires_at timestamptz default now() + interval '7 days',

  -- 納品情報
  deliverable_url text,
  deliverable_note text,

  -- Stripe
  stripe_session_id varchar(255),
  paid_amount     int,
  paid_at         timestamptz,

  -- 修正
  free_revision_used boolean default false,

  -- メタ
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- テーブル: ai_evaluations（AI審査ログ）
-- ─────────────────────────────────────────────────────────
create table ai_evaluations (
  id              uuid primary key default uuid_generate_v4(),
  request_id      uuid not null references requests(id) on delete cascade,
  model           varchar(50) not null,   -- 'gpt-4o' | 'gemini-1.5-pro'
  verdict         ai_verdict not null,
  score           smallint not null,      -- 0-100
  estimated_hours int,
  estimated_price int,
  concerns        text[],
  suggestions     text,
  raw_response    text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- テーブル: messages（チャット・コメント）
-- ─────────────────────────────────────────────────────────
create table messages (
  id              uuid primary key default uuid_generate_v4(),
  request_id      uuid not null references requests(id) on delete cascade,
  author          varchar(20) not null,   -- 'admin' | 'client' | 'system'
  content         text not null,
  is_internal     boolean default false,  -- 管理者専用メモ
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- テーブル: activity_logs（操作履歴）
-- ─────────────────────────────────────────────────────────
create table activity_logs (
  id              uuid primary key default uuid_generate_v4(),
  request_id      uuid not null references requests(id) on delete cascade,
  action          varchar(50) not null,
  detail          text,
  actor           varchar(20),
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────────────────────
-- インデックス
-- ─────────────────────────────────────────────────────────
create index idx_requests_status    on requests(status);
create index idx_requests_email     on requests(email);
create index idx_requests_created   on requests(created_at desc);
create index idx_requests_preview   on requests(preview_token);
create index idx_messages_request   on messages(request_id, created_at);
create index idx_activity_request   on activity_logs(request_id, created_at desc);

-- ─────────────────────────────────────────────────────────
-- updated_at 自動更新トリガー
-- ─────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_requests_updated_at
  before update on requests
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────
-- RLS (Row Level Security) — 管理者のみ全データ閲覧
-- ─────────────────────────────────────────────────────────
alter table requests enable row level security;
alter table ai_evaluations enable row level security;
alter table messages enable row level security;
alter table activity_logs enable row level security;

-- 公開API用: service_role key でのみアクセス (API Routeから)
-- フロントエンドはanon keyで直接DBアクセスしない設計
