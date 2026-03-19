-- 007_auth.sql — profiles + 日次利用カウント
-- ─────────────────────────────────────────────

-- profiles テーブル
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  is_premium    boolean not null default false,
  purchased_at  timestamptz,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  created_at    timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
create policy "users_read_own_profile"  on public.profiles for select using (auth.uid() = id);
create policy "users_update_own_profile" on public.profiles for update using (auth.uid() = id);

-- 日次利用カウント（無料ユーザーの問題数制限用）
create table if not exists public.daily_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  date       date not null default current_date,
  count      int not null default 0,
  unique(user_id, date)
);

alter table public.daily_usage enable row level security;
create policy "users_read_own_usage"   on public.daily_usage for select using (auth.uid() = user_id);
create policy "users_update_own_usage" on public.daily_usage for update using (auth.uid() = user_id);
create policy "users_insert_own_usage" on public.daily_usage for insert with check (auth.uid() = user_id);

-- 新規ユーザー登録時にprofileを自動作成するトリガー
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, email)
  values (new.id, new.email)
  on conflict(id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
