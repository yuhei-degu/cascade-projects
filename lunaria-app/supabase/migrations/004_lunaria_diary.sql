-- migration 004: AI日記ルナリア 追加テーブル
-- Supabase SQL Editor に貼り付けて Run

-- 感情値（6軸）
create table if not exists public.lunaria_emotion_state (
  user_id    uuid primary key references public.lunaria_users(id) on delete cascade,
  joy        int not null default 1,
  anger      int not null default 0,
  sadness    int not null default 1,
  shyness    int not null default 0,
  loneliness int not null default 2,
  anxiety    int not null default 1,
  updated_at timestamptz not null default now()
);

-- 親密度
create table if not exists public.lunaria_affinity (
  user_id        uuid primary key references public.lunaria_users(id) on delete cascade,
  bond_score     int not null default 0,
  closeness_level int not null default 0,
  unlock_casual  boolean not null default false,
  unlock_honest  boolean not null default false,
  unlock_secret  boolean not null default false,
  updated_at     timestamptz not null default now()
);

-- 抽出結果
create table if not exists public.lunaria_extractions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.lunaria_users(id) on delete cascade,
  session_date         date not null default current_date,
  summary              text,
  emotions             jsonb,
  importance_score     int check (importance_score between 1 and 5),
  self_disclosure_depth int check (self_disclosure_depth between 0 and 3),
  affinity_delta       int default 0,
  status_updates       jsonb,
  unresolved_issues    jsonb,
  long_term_candidate  jsonb,
  created_at           timestamptz not null default now()
);
create index if not exists lunaria_extract_user_date
  on public.lunaria_extractions(user_id, session_date desc);

-- 日記ログ
create table if not exists public.lunaria_diary_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.lunaria_users(id) on delete cascade,
  diary_date       date not null,
  summary          text,
  events           jsonb,
  emotions         jsonb,
  luna_comment     text,
  unresolved_issues jsonb,
  next_topics      jsonb,
  importance       int default 3,
  created_at       timestamptz not null default now(),
  unique (user_id, diary_date)
);

-- RLS
alter table public.lunaria_emotion_state enable row level security;
alter table public.lunaria_affinity      enable row level security;
alter table public.lunaria_extractions   enable row level security;
alter table public.lunaria_diary_logs    enable row level security;

create policy "lunaria_own_emotion"  on public.lunaria_emotion_state for all using (auth.uid() = user_id);
create policy "lunaria_own_affinity" on public.lunaria_affinity      for all using (auth.uid() = user_id);
create policy "lunaria_own_extract"  on public.lunaria_extractions   for all using (auth.uid() = user_id);
create policy "lunaria_own_diary"    on public.lunaria_diary_logs    for all using (auth.uid() = user_id);
