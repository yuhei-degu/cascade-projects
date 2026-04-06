-- ルナリア 初期スキーマ（Certi-AI Hub 相乗り・lunaria_ prefix）
-- Supabase SQL Editor にそのまま貼り付けて Run

create table if not exists public.lunaria_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.lunaria_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.lunaria_users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  route_type text check (route_type in ('light_normal','light_probe','claude_serious')),
  created_at timestamptz not null default now()
);
create index if not exists lunaria_messages_user_idx
  on public.lunaria_messages(user_id, created_at desc);

create table if not exists public.lunaria_core_memory (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.lunaria_users(id) on delete cascade,
  type       text not null check (type in ('value','pattern','goal','trigger','mid')),
  content    text not null,
  score      int  not null default 3 check (score between 1 and 5),
  hit_count  int  not null default 1,
  last_seen  timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, type, content)
);
create index if not exists lunaria_core_memory_user_idx
  on public.lunaria_core_memory(user_id, score desc);

create table if not exists public.lunaria_routing_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.lunaria_users(id) on delete cascade,
  route_type text not null,
  msg_score  int  not null,
  win_score  int  not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.lunaria_users        enable row level security;
alter table public.lunaria_messages     enable row level security;
alter table public.lunaria_core_memory  enable row level security;
alter table public.lunaria_routing_log  enable row level security;

create policy "lunaria_own_users"  on public.lunaria_users       for all using (auth.uid() = id);
create policy "lunaria_own_msgs"   on public.lunaria_messages    for all using (auth.uid() = user_id);
create policy "lunaria_own_mem"    on public.lunaria_core_memory for all using (auth.uid() = user_id);
create policy "lunaria_own_route"  on public.lunaria_routing_log for all using (auth.uid() = user_id);

-- 新規ユーザー自動登録
create or replace function public.lunaria_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.lunaria_users (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists lunaria_on_auth_user_created on auth.users;
create trigger lunaria_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.lunaria_handle_new_user();
