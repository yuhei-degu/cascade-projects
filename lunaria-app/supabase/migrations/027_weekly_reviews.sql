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
