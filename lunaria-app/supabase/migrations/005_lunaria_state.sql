-- lunaria migration 005: 記憶・状態層の拡充

-- ユーザーの好み・価値観
create table if not exists public.lunaria_preferences (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.lunaria_users(id) on delete cascade,
  category   text not null,   -- food / work / hobby / relationship / value
  key        text not null,   -- ramen_type / stress_pattern 等
  value      text not null,
  confidence numeric(3,2) default 0.7,
  source     text,
  updated_at timestamptz not null default now(),
  unique (user_id, category, key)
);

-- 関係性の状態スナップショット（週次）
create table if not exists public.lunaria_relationship_state (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.lunaria_users(id) on delete cascade,
  snapshot_date    date not null,
  trust_level      int default 0,
  openness_level   int default 0,
  inside_jokes     jsonb default '[]',
  shared_memories  jsonb default '[]',
  current_concerns jsonb default '[]',
  created_at       timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

alter table public.lunaria_preferences        enable row level security;
alter table public.lunaria_relationship_state enable row level security;

create policy "lunaria_own_pref" on public.lunaria_preferences
  for all using (auth.uid() = user_id);
create policy "lunaria_own_rel"  on public.lunaria_relationship_state
  for all using (auth.uid() = user_id);
