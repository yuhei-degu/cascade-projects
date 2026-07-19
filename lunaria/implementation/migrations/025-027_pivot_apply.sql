-- ピボットmigration一括適用ファイル(025+026+027の結合。各ファイルは冪等・再実行可)
-- 適用後の検証・動作確認: lunaria/SUPABASE_025_027_APPLY_RUNBOOK.md
-- 適用が済んだらこのファイルは implementation/ の運用ルールに従い削除してよい(正本は lunaria-app/supabase/migrations/)

-- migration 025: work items (pivot Phase 1)
-- Apply after 024_usage_events.sql.
--
-- Conversation extraction (service_role, bypasses RLS) writes work items.
-- Users read / correct / delete their own rows (1-tap correction UI reads this).
-- Policy style follows migration 023 (operation-specific, (select auth.uid())).

create table if not exists public.lunaria_work_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,
  date date not null,
  project text,
  kind text not null check (kind in ('did', 'done', 'stuck', 'decided', 'next')),
  content text not null,
  source_message_id uuid references public.lunaria_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, date, kind, content)
);

alter table public.lunaria_work_items enable row level security;

drop policy if exists "lunaria_work_items_select_own" on public.lunaria_work_items;
drop policy if exists "lunaria_work_items_insert_own" on public.lunaria_work_items;
drop policy if exists "lunaria_work_items_update_own" on public.lunaria_work_items;
drop policy if exists "lunaria_work_items_delete_own" on public.lunaria_work_items;

create policy "lunaria_work_items_select_own"
  on public.lunaria_work_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_work_items_insert_own"
  on public.lunaria_work_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_work_items_update_own"
  on public.lunaria_work_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_work_items_delete_own"
  on public.lunaria_work_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 「明日の一手」(Phase 2) は直近7日を user 単位で読むのでこの並び
create index if not exists lunaria_work_items_user_date_idx
  on public.lunaria_work_items(user_id, date desc)
  where deleted_at is null;

create index if not exists lunaria_work_items_user_project_idx
  on public.lunaria_work_items(user_id, project, date desc)
  where project is not null and deleted_at is null;

create or replace function public.lunaria_touch_work_items_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lunaria_work_items_touch_updated_at on public.lunaria_work_items;
create trigger lunaria_work_items_touch_updated_at
  before update on public.lunaria_work_items
  for each row execute function public.lunaria_touch_work_items_updated_at();

-- migration 026: tomorrow step (pivot Phase 2)
-- Apply after 025_work_items.sql.
--
-- 日記生成時に work_items(直近7日) + unresolved_issues から「明日の一手」を1件生成し、
-- 翌朝の第一声で LLM 呼び出しなしに即返すための保存先。
-- 列がない環境では生成をスキップするだけで日記自体は壊れない。

alter table public.lunaria_diary_logs
  add column if not exists tomorrow_step text;

-- migration 027: weekly reviews (pivot Phase 3)
-- Apply after 026_diary_tomorrow_step.sql.
--
-- 週次レビュー「今週のルナとの7日間」。
-- 生成はサーバー(service_role)のみ。ユーザーは自分の行の読み取りだけ
-- (023 の server-managed テーブルと同じ方針)。

create table if not exists public.lunaria_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,
  week_start date not null,
  title text not null default '',
  progressed jsonb not null default '[]',
  stalled jsonb not null default '[]',
  condition_note text,
  next_week_step text,
  luna_comment text,
  stats jsonb not null default '{}',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.lunaria_weekly_reviews enable row level security;

drop policy if exists "lunaria_weekly_reviews_select_own" on public.lunaria_weekly_reviews;
create policy "lunaria_weekly_reviews_select_own"
  on public.lunaria_weekly_reviews for select to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists lunaria_weekly_reviews_user_week_idx
  on public.lunaria_weekly_reviews(user_id, week_start desc);

create or replace function public.lunaria_touch_weekly_reviews_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lunaria_weekly_reviews_touch_updated_at on public.lunaria_weekly_reviews;
create trigger lunaria_weekly_reviews_touch_updated_at
  before update on public.lunaria_weekly_reviews
  for each row execute function public.lunaria_touch_weekly_reviews_updated_at();
