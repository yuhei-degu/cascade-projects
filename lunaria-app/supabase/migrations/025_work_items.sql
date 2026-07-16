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
