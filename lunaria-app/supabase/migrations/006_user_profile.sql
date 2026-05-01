-- ユーザー基本情報テーブル
create table if not exists public.lunaria_user_profile (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.lunaria_users(id) on delete cascade,
  field      text not null,   -- 'gender' | 'age' | 'marital_status' | 'occupation' | 'living_situation'
  value      text not null,
  source     text not null default 'setting', -- 'setting' | 'confirmed'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, field)
);

-- 旧情報アーカイブ（削除せず保持）
create table if not exists public.lunaria_profile_archive (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.lunaria_users(id) on delete cascade,
  field      text not null,
  old_value  text not null,
  new_value  text not null,
  archived_at timestamptz not null default now()
);

-- 矛盾検出・確認待ちテーブル
create table if not exists public.lunaria_pending_profile_updates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.lunaria_users(id) on delete cascade,
  field           text not null,
  detected_value  text not null,
  trigger_message text not null,
  created_at      timestamptz not null default now(),
  unique (user_id, field)
);

-- RLS
alter table public.lunaria_user_profile           enable row level security;
alter table public.lunaria_profile_archive        enable row level security;
alter table public.lunaria_pending_profile_updates enable row level security;

create policy "lunaria_own_profile"   on public.lunaria_user_profile           for all using (auth.uid() = user_id);
create policy "lunaria_own_archive"   on public.lunaria_profile_archive        for all using (auth.uid() = user_id);
create policy "lunaria_own_pending"   on public.lunaria_pending_profile_updates for all using (auth.uid() = user_id);
