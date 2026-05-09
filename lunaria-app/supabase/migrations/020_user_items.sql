-- migration 020: user items ownership projection
--
-- Purpose:
--   Introduce lunaria_user_items as the future source of truth for item ownership,
--   while remaining compatible with the existing gacha tables.
--
-- Notes:
--   - This migration is a candidate file. Do not apply to production until reviewed.
--   - Existing gacha inventory/history tables are preserved.
--   - Backfill reads from lunaria_gacha_inventory and lunaria_gacha_history.
--   - Item IDs reference lunaria_gacha_pool(id) because the current schema does not
--     yet have a separate lunaria_items catalog.

create table if not exists public.lunaria_user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,
  pool_id uuid not null references public.lunaria_gacha_pool(id) on delete cascade,

  obtained_from text not null default 'gacha' check (obtained_from in (
    'gacha', 'free_grant', 'event_reward', 'subscription_grant', 'admin_grant', 'streak_bonus', 'migration'
  )),
  obtained_at timestamptz not null default now(),
  is_equipped boolean not null default false,

  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  last_obtained_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  unique (user_id, pool_id)
);

alter table public.lunaria_user_items enable row level security;

drop policy if exists "lunaria_own_user_items_select" on public.lunaria_user_items;
create policy "lunaria_own_user_items_select"
  on public.lunaria_user_items
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "lunaria_own_user_items_insert" on public.lunaria_user_items;
create policy "lunaria_own_user_items_insert"
  on public.lunaria_user_items
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "lunaria_own_user_items_update" on public.lunaria_user_items;
create policy "lunaria_own_user_items_update"
  on public.lunaria_user_items
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "lunaria_own_user_items_delete" on public.lunaria_user_items;
create policy "lunaria_own_user_items_delete"
  on public.lunaria_user_items
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists lunaria_user_items_user_obtained_idx
  on public.lunaria_user_items(user_id, obtained_at desc)
  where deleted_at is null;

create index if not exists lunaria_user_items_pool_idx
  on public.lunaria_user_items(pool_id)
  where deleted_at is null;

create index if not exists lunaria_user_items_user_equipped_idx
  on public.lunaria_user_items(user_id, is_equipped)
  where is_equipped and deleted_at is null;

create or replace function public.lunaria_touch_user_items_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lunaria_user_items_touch_updated_at on public.lunaria_user_items;
create trigger lunaria_user_items_touch_updated_at
  before update on public.lunaria_user_items
  for each row execute function public.lunaria_touch_user_items_updated_at();

-- Backfill ownership from the existing unique inventory table.
insert into public.lunaria_user_items (
  user_id,
  pool_id,
  obtained_from,
  obtained_at,
  duplicate_count,
  last_obtained_at,
  metadata,
  created_at,
  updated_at
)
select
  inv.user_id,
  inv.pool_id,
  'migration' as obtained_from,
  inv.acquired_at as obtained_at,
  coalesce(hist.duplicate_count, 0) as duplicate_count,
  coalesce(hist.last_obtained_at, inv.acquired_at) as last_obtained_at,
  jsonb_build_object('source', 'lunaria_gacha_inventory') as metadata,
  now() as created_at,
  now() as updated_at
from public.lunaria_gacha_inventory inv
left join lateral (
  select
    count(*) filter (where h.was_duplicate) as duplicate_count,
    max(h.pulled_at) as last_obtained_at
  from public.lunaria_gacha_history h
  where h.user_id = inv.user_id
    and h.pool_id = inv.pool_id
) hist on true
on conflict (user_id, pool_id) do update
  set duplicate_count = greatest(lunaria_user_items.duplicate_count, excluded.duplicate_count),
      last_obtained_at = greatest(lunaria_user_items.last_obtained_at, excluded.last_obtained_at),
      metadata = lunaria_user_items.metadata || excluded.metadata,
      updated_at = now();

-- Verification queries:
-- select count(*) from public.lunaria_user_items;
-- select ui.user_id, gp.name, gp.rarity, ui.duplicate_count
--   from public.lunaria_user_items ui
--   join public.lunaria_gacha_pool gp on gp.id = ui.pool_id
--  order by ui.obtained_at desc
--  limit 20;
