-- ============================================================
-- シン — 既存 Supabase プロジェクトへの相乗り版
-- 全テーブルに shin_ プレフィックスを付けて衝突を回避
-- ============================================================

create table if not exists public.shin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  timezone    text not null default 'Asia/Tokyo',
  created_at  timestamptz not null default now()
);

create table if not exists public.shin_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.shin_users(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists shin_messages_user_idx on public.shin_messages(user_id, created_at desc);

create table if not exists public.shin_memories (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.shin_users(id) on delete cascade,
  type             text not null check (type in ('value','pattern','goal','trigger','mid')),
  content          text not null,
  importance_score int  not null default 3 check (importance_score between 1 and 5),
  last_accessed    timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  unique (user_id, type, content)
);
create index if not exists shin_memories_user_idx on public.shin_memories(user_id, type, importance_score desc);

create table if not exists public.shin_character_states (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.shin_users(id) on delete cascade,
  mood        text not null default 'calm' check (mood in ('calm','happy','tired','worried')),
  affinity    int  not null default 20  check (affinity between 0 and 100),
  trust       int  not null default 10  check (trust   between 0 and 100),
  updated_at  timestamptz not null default now()
);

create table if not exists public.shin_trigger_cache (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.shin_users(id) on delete cascade,
  cache_key   text not null,
  text        text not null,
  slot        text not null check (slot in ('morning','day','night')),
  created_at  timestamptz not null default now(),
  unique (user_id, cache_key)
);
create index if not exists shin_trigger_cache_user_idx on public.shin_trigger_cache(user_id, cache_key);

-- RLS
alter table public.shin_users            enable row level security;
alter table public.shin_messages         enable row level security;
alter table public.shin_memories         enable row level security;
alter table public.shin_character_states enable row level security;
alter table public.shin_trigger_cache    enable row level security;

create policy "shin_own_users"   on public.shin_users            for all using (auth.uid() = id);
create policy "shin_own_msgs"    on public.shin_messages         for all using (auth.uid() = user_id);
create policy "shin_own_mems"    on public.shin_memories         for all using (auth.uid() = user_id);
create policy "shin_own_cs"      on public.shin_character_states for all using (auth.uid() = user_id);
create policy "shin_own_trigger" on public.shin_trigger_cache    for all using (auth.uid() = user_id);

-- 新規ユーザー作成時に shin_users / shin_character_states を自動生成
create or replace function public.shin_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.shin_users (id)
    values (new.id)
    on conflict do nothing;
  insert into public.shin_character_states (user_id)
    values (new.id)
    on conflict do nothing;
  return new;
end;
$$;

-- 既存トリガーがあれば一度削除してから再作成
drop trigger if exists shin_on_auth_user_created on auth.users;
create trigger shin_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.shin_handle_new_user();
