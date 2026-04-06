-- ============================================================
-- 001_init.sql  シン — 初期スキーマ
-- ============================================================

-- users (Supabase Auth と連携)
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  timezone    text not null default 'Asia/Tokyo',
  created_at  timestamptz not null default now()
);

-- conversations
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  summary     text,
  started_at  timestamptz not null default now()
);
create index on public.conversations(user_id, started_at desc);

-- messages
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  conv_id     uuid references public.conversations(id) on delete set null,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index on public.messages(user_id, created_at desc);

-- memories  (3層記憶: type で区別)
-- type: 'value' | 'pattern' | 'goal' | 'trigger' | 'mid'
create table if not exists public.memories (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  type             text not null check (type in ('value','pattern','goal','trigger','mid')),
  content          text not null,
  importance_score int  not null default 3 check (importance_score between 1 and 5),
  last_accessed    timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  unique (user_id, type, content)
);
create index on public.memories(user_id, type, importance_score desc);

-- character_states  (1ユーザー1行)
create table if not exists public.character_states (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.users(id) on delete cascade,
  mood        text not null default 'calm' check (mood in ('calm','happy','tired','worried')),
  affinity    int  not null default 20  check (affinity between 0 and 100),
  trust       int  not null default 10  check (trust   between 0 and 100),
  updated_at  timestamptz not null default now()
);

-- trigger_cache  (スロット別・日付別キャッシュ)
create table if not exists public.trigger_cache (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  cache_key   text not null,   -- e.g. "morning_2026-04-01"
  text        text not null,
  slot        text not null check (slot in ('morning','day','night')),
  created_at  timestamptz not null default now(),
  unique (user_id, cache_key)
);
create index on public.trigger_cache(user_id, cache_key);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.users            enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;
alter table public.memories         enable row level security;
alter table public.character_states enable row level security;
alter table public.trigger_cache    enable row level security;

-- 自分のデータだけ読み書き可
create policy "own_users"   on public.users            for all using (auth.uid() = id);
create policy "own_convs"   on public.conversations    for all using (auth.uid() = user_id);
create policy "own_msgs"    on public.messages         for all using (auth.uid() = user_id);
create policy "own_mems"    on public.memories         for all using (auth.uid() = user_id);
create policy "own_cs"      on public.character_states for all using (auth.uid() = user_id);
create policy "own_trigger" on public.trigger_cache    for all using (auth.uid() = user_id);

-- ============================================================
-- Helper: 新規ユーザー作成時に初期レコードを自動生成
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id) values (new.id) on conflict do nothing;
  insert into public.character_states (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
