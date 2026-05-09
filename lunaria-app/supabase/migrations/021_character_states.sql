-- migration 021: character state scaffold
--
-- Purpose:
--   Add a small, future-friendly state table for Lunaria's current visible state
--   without coupling chat text, diary, memory, or gacha history together.
--
-- Notes:
--   - This migration is a candidate file. Do not apply to production until reviewed.
--   - It intentionally avoids a character_profiles foreign key because that catalog
--     is still design-only in this repo.
--   - Item references point to lunaria_gacha_pool(id) for compatibility with the
--     current Phase G schema. A later catalog split can migrate these columns.

create table if not exists public.lunaria_character_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,
  character_profile_id text not null default 'lunaria',

  current_outfit_pool_id uuid references public.lunaria_gacha_pool(id) on delete set null,
  current_background_pool_id uuid references public.lunaria_gacha_pool(id) on delete set null,
  current_diary_skin_pool_id uuid references public.lunaria_gacha_pool(id) on delete set null,
  equipped_accessory_pool_ids uuid[] not null default '{}',
  room_item_pool_ids uuid[] not null default '{}',

  current_expression text not null default 'normal',
  current_motion text not null default 'idle',

  affinity_level integer not null default 0 check (affinity_level >= 0 and affinity_level <= 100),
  affinity_streak_days integer not null default 0 check (affinity_streak_days >= 0),

  unlocked_expressions text[] not null default array['normal','gentle_smile','thinking','sad','serious'],
  unlocked_motions text[] not null default array['idle','nod','tilt_head'],
  unlocked_voices text[] not null default '{}',

  last_interaction_at timestamptz,
  last_diary_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  unique (user_id, character_profile_id)
);

alter table public.lunaria_character_states enable row level security;

drop policy if exists "lunaria_own_character_states_select" on public.lunaria_character_states;
create policy "lunaria_own_character_states_select"
  on public.lunaria_character_states
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "lunaria_own_character_states_insert" on public.lunaria_character_states;
create policy "lunaria_own_character_states_insert"
  on public.lunaria_character_states
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "lunaria_own_character_states_update" on public.lunaria_character_states;
create policy "lunaria_own_character_states_update"
  on public.lunaria_character_states
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "lunaria_own_character_states_delete" on public.lunaria_character_states;
create policy "lunaria_own_character_states_delete"
  on public.lunaria_character_states
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists lunaria_character_states_user_profile_idx
  on public.lunaria_character_states(user_id, character_profile_id)
  where deleted_at is null;

create index if not exists lunaria_character_states_last_interaction_idx
  on public.lunaria_character_states(user_id, last_interaction_at desc)
  where deleted_at is null;

create or replace function public.lunaria_touch_character_states_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lunaria_character_states_touch_updated_at on public.lunaria_character_states;
create trigger lunaria_character_states_touch_updated_at
  before update on public.lunaria_character_states
  for each row execute function public.lunaria_touch_character_states_updated_at();

-- Create default Lunaria state rows for existing users. Do not infer equipment.
insert into public.lunaria_character_states (
  user_id,
  character_profile_id,
  metadata
)
select
  u.id,
  'lunaria',
  jsonb_build_object('source', '021_character_states_default_seed')
from public.lunaria_users u
on conflict (user_id, character_profile_id) do nothing;

-- Verification queries:
-- select count(*) from public.lunaria_character_states;
-- select user_id, character_profile_id, current_expression, current_motion, affinity_level
--   from public.lunaria_character_states
--  order by updated_at desc
--  limit 20;
