-- Lunaria PROD INIT bundle (BOM-stripped, regenerated)
-- migrations 001..024 in order, EXCLUDING 003_seed_dev_user.sql

-- ===== BEGIN 001_lunaria_init.sql =====
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
-- ===== END 001_lunaria_init.sql =====

-- ===== BEGIN 002_routing_review.sql =====
-- ルナリア 育成ログ設計 migration 002 (v2)
-- チャッピー案ベース + ルナリア固有フラグを追加

-- ── 1. route_master（ルート定義マスタ）────────────────────────
create table if not exists public.lunaria_route_master (
  route_key   varchar(50) primary key,
  route_name  varchar(100) not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.lunaria_route_master (route_key, route_name, description) values
  ('light_normal',   '通常会話',   'Groq Llamaによる雑談・日常会話'),
  ('light_probe',    '軽い聞き返し', 'テンプレート固定の軽いprobe'),
  ('claude_serious', '深い会話',   'Claude Sonnetによる真剣モード')
on conflict do nothing;

-- ── 2. routing_log 拡張（チャッピー案 + 現行案の融合）──────────
alter table public.lunaria_routing_log
  add column if not exists conversation_id      uuid,
  add column if not exists turn_index           int,
  add column if not exists user_message         text,
  add column if not exists normalized_input     text,
  add column if not exists window_score         int  not null default 0,
  add column if not exists heavy_signal_count   int  not null default 0,
  add column if not exists candidate_routes     jsonb,
  add column if not exists confidence           numeric(5,4),
  add column if not exists selected_template_id text,
  add column if not exists model_used           text,
  add column if not exists prompt_version       varchar(20),
  add column if not exists rules_version        varchar(20),
  add column if not exists reason_summary       text,
  add column if not exists reason_json          jsonb,
  add column if not exists assistant_response   text,
  add column if not exists execution_result     varchar(20) default 'success',
  add column if not exists response_latency_ms  int;

create index if not exists lunaria_log_route_idx
  on public.lunaria_routing_log(route_type);
create index if not exists lunaria_log_created_idx
  on public.lunaria_routing_log(created_at desc);

-- ── 3. routing_review（チャッピー案 + ルナリア固有フラグ）───────
create table if not exists public.lunaria_routing_review (
  id              uuid primary key default gen_random_uuid(),
  routing_log_id  uuid not null references public.lunaria_routing_log(id) on delete cascade,

  -- レビュー主体
  review_source   varchar(20) not null default 'auto'
                  check (review_source in ('human','llm','auto')),
  reviewer_id     varchar(100),

  -- 正誤判定（手動・LLM評価時に埋める）
  is_correct      boolean,
  expected_route  varchar(50) references public.lunaria_route_master(route_key),

  -- エラー分類（チャッピー案の8種）
  error_type      varchar(30) check (error_type in (
                    'false_positive','false_negative',
                    'over_confident','low_confidence',
                    'bad_fallback','unclear_input',
                    'policy_miss','tool_miss'
                  )),
  severity        varchar(20) check (severity in ('low','medium','high','critical')),

  -- ルナリア固有フラグ（現行案から引き継ぎ）
  manual_flag_reason        varchar(20) check (manual_flag_reason in (
                              'too_light','too_heavy','off_topic',
                              'too_long','not_lunaria','good'
                            )),
  user_followup_sentiment   varchar(20) check (user_followup_sentiment in (
                              'escalated','neutral','resolved','dropped'
                            )),
  route_mismatch_suspected  boolean not null default false,
  character_break_suspected boolean not null default false,

  -- 詳細メモ
  review_comment            text,
  improvement_suggestion    text,
  review_payload            jsonb,

  created_at timestamptz not null default now()
);

create index if not exists lunaria_review_log_idx
  on public.lunaria_routing_review(routing_log_id);
create index if not exists lunaria_review_correct_idx
  on public.lunaria_routing_review(is_correct);
create index if not exists lunaria_review_error_idx
  on public.lunaria_routing_review(error_type);
create index if not exists lunaria_review_flag_idx
  on public.lunaria_routing_review(route_mismatch_suspected, character_break_suspected);

-- ── 4. RLS ─────────────────────────────────────────────────────
alter table public.lunaria_route_master    enable row level security;
alter table public.lunaria_routing_review  enable row level security;

create policy "lunaria_route_master_read"
  on public.lunaria_route_master for select using (true);

create policy "lunaria_own_review"
  on public.lunaria_routing_review for all using (
    exists (
      select 1 from public.lunaria_routing_log l
      where l.id = routing_log_id and l.user_id = auth.uid()
    )
  );

-- ── 5. 改善分析クエリ例（コメント）──────────────────────────────
-- ルートごとの正確率
-- select rl.route_type, count(*) total,
--   round(avg(case when rr.is_correct then 1.0 else 0.0 end)*100,2) accuracy_pct
-- from lunaria_routing_log rl
-- join lunaria_routing_review rr on rr.routing_log_id = rl.id
-- group by rl.route_type;

-- 高confidence なのに外したケース
-- select rl.user_message, rl.confidence, rr.expected_route, rr.error_type
-- from lunaria_routing_log rl
-- join lunaria_routing_review rr on rr.routing_log_id = rl.id
-- where rr.is_correct = false and rl.confidence >= 0.8
-- order by rl.confidence desc;

-- rules_versionごとの精度推移
-- select rl.rules_version, count(*) total,
--   round(avg(case when rr.is_correct then 1.0 else 0.0 end)*100,2) accuracy_pct
-- from lunaria_routing_log rl
-- join lunaria_routing_review rr on rr.routing_log_id = rl.id
-- group by rl.rules_version order by rl.rules_version;
-- ===== END 002_routing_review.sql =====

-- ===== SKIPPED: 003_seed_dev_user.sql =====
-- ===== BEGIN 004_lunaria_diary.sql =====
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

drop policy if exists "lunaria_own_emotion"  on public.lunaria_emotion_state;
drop policy if exists "lunaria_own_affinity" on public.lunaria_affinity;
drop policy if exists "lunaria_own_extract"  on public.lunaria_extractions;
drop policy if exists "lunaria_own_diary"    on public.lunaria_diary_logs;

create policy "lunaria_own_emotion"  on public.lunaria_emotion_state for all using (auth.uid() = user_id);
create policy "lunaria_own_affinity" on public.lunaria_affinity      for all using (auth.uid() = user_id);
create policy "lunaria_own_extract"  on public.lunaria_extractions   for all using (auth.uid() = user_id);
create policy "lunaria_own_diary"    on public.lunaria_diary_logs    for all using (auth.uid() = user_id);
-- ===== END 004_lunaria_diary.sql =====

-- ===== BEGIN 005_lunaria_state.sql =====
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
-- ===== END 005_lunaria_state.sql =====

-- ===== BEGIN 006_user_profile.sql =====
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
-- ===== END 006_user_profile.sql =====

-- ===== BEGIN 007_core_memory_normalize.sql =====
-- lunaria_core_memory に memory_key / memory_category を追加
alter table public.lunaria_core_memory
  add column if not exists memory_key      text,
  add column if not exists memory_category text,
  add column if not exists updated_at      timestamptz not null default now();

-- memory_key がある場合はユニーク制約（user_id + memory_key で1件に絞る）
create unique index if not exists lunaria_core_memory_key_idx
  on public.lunaria_core_memory(user_id, memory_key)
  where memory_key is not null;

-- 既存データの正規化
-- 1. 断片語「男性」を削除
delete from public.lunaria_core_memory
  where content = '男性' and type = 'value';

-- 2. 「ユーザーの性別: 男性」に memory_key を付与
update public.lunaria_core_memory
  set memory_key = 'user_gender', memory_category = 'profile'
  where content = 'ユーザーの性別: 男性';

-- 3. name タイプに memory_key を付与
update public.lunaria_core_memory
  set memory_key = 'user_name', memory_category = 'profile'
  where type = 'name';
-- ===== END 007_core_memory_normalize.sql =====

-- ===== BEGIN 008_subscription_and_memory_surface.sql =====
-- lunaria migration 008: サブスクリプション管理 + 記憶表出タイムスタンプ
-- Supabase SQL Editor にそのまま貼り付けて Run

-- 1. lunaria_users に plan カラムを追加
--    free（デフォルト）: 記憶保持7日 / premium: 記憶保持無制限
alter table public.lunaria_users
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'premium'));

-- 2. lunaria_core_memory に decay 用インデックスを追加
--    （last_seen が古い記憶を効率的にスキャンするため）
create index if not exists lunaria_core_memory_last_seen_idx
  on public.lunaria_core_memory(user_id, last_seen asc)
  where memory_category is distinct from 'profile';

-- 3. lunaria_extractions に importance_score インデックスを追加
--    （getContextualMemory / getMemoryForProbe のクエリ高速化）
create index if not exists lunaria_extractions_importance_idx
  on public.lunaria_extractions(user_id, importance_score desc, created_at desc);

-- ── 確認用クエリ（任意で実行） ─────────────────────────────
-- select id, plan from public.lunaria_users;
-- select id, content, score, last_seen, memory_category from public.lunaria_core_memory order by last_seen asc;
-- ===== END 008_subscription_and_memory_surface.sql =====

-- ===== BEGIN 009_gacha.sql =====
-- lunaria migration 009: ガチャ機能（Phase G）
-- Supabase SQL Editor にそのまま貼り付けて Run
--
-- 設計書：mnt/lunaria/PHASE_G_GACHA_DESIGN.md
-- 哲学：ガチャは Lunaria のサブ機能。会話・関係性とは独立。
--       lunaria_core_memory / lunaria_user_profile とは完全分離。

-- ── 1. 排出物カタログ（マスターテーブル） ─────────────────────
create table if not exists public.lunaria_gacha_pool (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  rarity        text not null check (rarity in (
    'common_a','common_b','rare_a','rare_b','epic','legendary','urban_legend'
  )),
  category      text not null check (category in (
    'furniture','small_item','accessory','urban_legend'
  )),
  drop_weight   numeric not null default 1,    -- レアリティ内での重み（均等なら 1）
  image_url     text,                          -- 後で素材できたら埋める
  description   text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create unique index if not exists lunaria_gacha_pool_name_key
  on public.lunaria_gacha_pool(name);

create index if not exists lunaria_gacha_pool_rarity_idx
  on public.lunaria_gacha_pool(rarity)
  where is_active = true;

-- ── 2. ユーザーのチケット数 ───────────────────────────────────
create table if not exists public.lunaria_gacha_tickets (
  user_id     uuid primary key references public.lunaria_users(id) on delete cascade,
  count       integer not null default 0 check (count >= 0 and count <= 50),
  updated_at  timestamptz not null default now()
);

-- ── 3. ユーザーのコイン残高 ───────────────────────────────────
create table if not exists public.lunaria_gacha_coins (
  user_id     uuid primary key references public.lunaria_users(id) on delete cascade,
  balance     integer not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

-- ── 4. ユーザーのインベントリ（所持品） ───────────────────────
-- かぶりはここに記録されない（コイン化される）
create table if not exists public.lunaria_gacha_inventory (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.lunaria_users(id) on delete cascade,
  pool_id       uuid not null references public.lunaria_gacha_pool(id) on delete cascade,
  acquired_at   timestamptz not null default now(),
  unique(user_id, pool_id)
);

create index if not exists lunaria_gacha_inventory_user_idx
  on public.lunaria_gacha_inventory(user_id);

-- ── 5. ガチャ履歴（演出再現・統計・デバッグ用） ────────────────
create table if not exists public.lunaria_gacha_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.lunaria_users(id) on delete cascade,
  pool_id         uuid not null references public.lunaria_gacha_pool(id) on delete cascade,
  rarity          text not null,
  was_duplicate   boolean not null,
  coin_earned     integer not null default 0,
  pulled_at       timestamptz not null default now()
);

create index if not exists lunaria_gacha_history_user_time_idx
  on public.lunaria_gacha_history(user_id, pulled_at desc);

-- ── 6. デイリーボーナス記録（チケット二重配布防止） ────────────
create table if not exists public.lunaria_gacha_daily_bonus (
  user_id      uuid not null references public.lunaria_users(id) on delete cascade,
  given_date   date not null,
  primary key (user_id, given_date)
);

-- ── 7. 1 日のチケット獲得上限管理（質スコア配布の累積カウンタ） ─
create table if not exists public.lunaria_gacha_daily_quota (
  user_id      uuid not null references public.lunaria_users(id) on delete cascade,
  given_date   date not null,
  earned_today integer not null default 0 check (earned_today >= 0 and earned_today <= 5),
  primary key (user_id, given_date)
);

-- ── 8. RLS / 権限 ───────────────────────────────────────────
-- MVP は Next.js API から service_role 経由でのみ操作する。ブラウザ直叩きの
-- Supabase Data API / RPC からユーザーIDを偽装されないよう、公開権限を閉じる。
alter table public.lunaria_gacha_pool enable row level security;
alter table public.lunaria_gacha_tickets enable row level security;
alter table public.lunaria_gacha_coins enable row level security;
alter table public.lunaria_gacha_inventory enable row level security;
alter table public.lunaria_gacha_history enable row level security;
alter table public.lunaria_gacha_daily_bonus enable row level security;
alter table public.lunaria_gacha_daily_quota enable row level security;

-- ── 8. ガチャ実行 RPC 関数 ────────────────────────────────────
-- チケット消費・かぶり判定・コイン変換・履歴記録を 1 トランザクションで実行。
-- 抽選自体（rarity / pool_id 決定）はサーバ側 TS で済ませた前提で呼び出す。
create or replace function public.draw_gacha(
  p_user_id uuid,
  p_pool_id uuid,
  p_rarity  text
)
returns table(was_duplicate boolean, coin_earned integer, ticket_remaining integer, coin_balance integer) as $$
declare
  v_existing uuid;
  v_coin     integer;
  v_ticket   integer;
  v_balance  integer;
begin
  -- チケット消費（行ロック）
  update public.lunaria_gacha_tickets
    set count = count - 1, updated_at = now()
    where user_id = p_user_id and count >= 1
    returning count into v_ticket;
  if not found then
    raise exception 'no_ticket' using errcode = 'P0001';
  end if;

  -- 既存所持判定
  select id into v_existing
    from public.lunaria_gacha_inventory
    where user_id = p_user_id and pool_id = p_pool_id;

  if v_existing is null then
    insert into public.lunaria_gacha_inventory(user_id, pool_id)
      values (p_user_id, p_pool_id);
    v_coin := 0;
  else
    v_coin := case p_rarity
      when 'common_a'     then 10
      when 'common_b'     then 15
      when 'rare_a'       then 50
      when 'rare_b'       then 80
      when 'epic'         then 200
      when 'legendary'    then 500
      when 'urban_legend' then 2000
      else 0
    end;
    insert into public.lunaria_gacha_coins(user_id, balance)
      values (p_user_id, v_coin)
      on conflict (user_id) do update
        set balance = lunaria_gacha_coins.balance + v_coin, updated_at = now();
  end if;

  -- 残高取得（コイン獲得が無い場合も既存値を返す）
  select balance into v_balance
    from public.lunaria_gacha_coins
    where user_id = p_user_id;
  v_balance := coalesce(v_balance, 0);

  -- 履歴記録
  insert into public.lunaria_gacha_history(user_id, pool_id, rarity, was_duplicate, coin_earned)
    values (p_user_id, p_pool_id, p_rarity, v_existing is not null, v_coin);

  return query select v_existing is not null, v_coin, v_ticket, v_balance;
end;
$$ language plpgsql;

-- ── 9. チケット付与関数（チケット獲得・デイリーボーナス共通） ─
-- count <= 50 の制約があるため、上限超過時はサイレントに ignore する。
create or replace function public.grant_gacha_ticket(
  p_user_id uuid,
  p_amount  integer default 1
)
returns integer as $$
declare
  v_count integer;
begin
  insert into public.lunaria_gacha_tickets(user_id, count)
    values (p_user_id, least(p_amount, 50))
    on conflict (user_id) do update
      set count = least(lunaria_gacha_tickets.count + p_amount, 50),
          updated_at = now();
  select count into v_count from public.lunaria_gacha_tickets where user_id = p_user_id;
  return v_count;
end;
$$ language plpgsql;

revoke execute on function public.draw_gacha(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.grant_gacha_ticket(uuid, integer) from public, anon, authenticated;
grant execute on function public.draw_gacha(uuid, uuid, text) to service_role;
grant execute on function public.grant_gacha_ticket(uuid, integer) to service_role;

-- ── 確認用クエリ（任意で実行） ─────────────────────────────────
-- select * from public.lunaria_gacha_pool where is_active;
-- select * from public.lunaria_gacha_tickets;
-- select * from public.lunaria_gacha_coins;
-- select * from public.lunaria_gacha_inventory order by acquired_at desc;
-- select * from public.lunaria_gacha_history order by pulled_at desc limit 20;
-- ===== END 009_gacha.sql =====

-- ===== BEGIN 010_gacha_seed.sql =====
-- lunaria migration 010: ガチャ排出物プレースホルダー（Phase G MVP）
-- Supabase SQL Editor にそのまま貼り付けて Run
--
-- 25 アイテムを 7 段階のレアリティに振り分けたプレースホルダー。
-- 実素材ができたら image_url を更新するか、別行に置き換えていく想定。
-- 同じ name は登録されない（009 の unique index と on conflict で再実行可能）。

-- 既に同名アイテムが投入されている場合のクリーンアップ用（任意）
-- delete from public.lunaria_gacha_pool where name in (
--   'やわらかいクッション','木の小さな椅子','花瓶','古い本','ろうそく',
--   '貝殻のブローチ','革のしおり','銀のリング','水晶のペンダント','刺繍ハンカチ',
--   'アンティーク時計','ステンドグラス','北欧チェア','レコードプレイヤー','和風行灯',
--   '月光のチョーカー','虹色イヤリング','古代風コイン','深海の真珠',
--   '満月のランプ','流星の万年筆',
--   '記憶の鈴','黄昏のオルゴール',
--   '指輪','満月の鈴','千束のコート','星の砂時計','宇宙猫'
-- );

-- ── common_a（45%）：ささやかな家具・小物 5 種 ────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('やわらかいクッション', 'common_a', 'furniture',  '/img/gacha/placeholder.png', 'ふわふわで居心地いい'),
  ('木の小さな椅子',       'common_a', 'furniture',  '/img/gacha/placeholder.png', '手作り感のある一脚'),
  ('花瓶',                 'common_a', 'small_item', '/img/gacha/placeholder.png', '陶器の素朴な花瓶'),
  ('古い本',               'common_a', 'small_item', '/img/gacha/placeholder.png', 'タイトルは読めない'),
  ('ろうそく',             'common_a', 'small_item', '/img/gacha/placeholder.png', '揺らめく炎を眺める用')
on conflict (name) do nothing;

-- ── common_b（30%）：ふつうのアクセサリー 5 種 ────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('貝殻のブローチ',   'common_b', 'accessory', '/img/gacha/placeholder.png', '海辺で拾ったような'),
  ('革のしおり',       'common_b', 'accessory', '/img/gacha/placeholder.png', '本のお供に'),
  ('銀のリング',       'common_b', 'accessory', '/img/gacha/placeholder.png', 'シンプルな銀の輪っか'),
  ('水晶のペンダント', 'common_b', 'accessory', '/img/gacha/placeholder.png', '光を透かす'),
  ('刺繍ハンカチ',     'common_b', 'accessory', '/img/gacha/placeholder.png', '小花のモチーフ')
on conflict (name) do nothing;

-- ── rare_a（14%）：レア家具 3 種 ──────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('アンティーク時計', 'rare_a', 'furniture',  '/img/gacha/placeholder.png', '時を刻み続ける'),
  ('ステンドグラス',   'rare_a', 'furniture',  '/img/gacha/placeholder.png', '光が色とりどりに'),
  ('北欧チェア',       'rare_a', 'furniture',  '/img/gacha/placeholder.png', '木目が美しい')
on conflict (name) do nothing;

-- ── rare_b（7%）：レアアクセサリー 3 種 ───────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('月光のチョーカー', 'rare_b', 'accessory', '/img/gacha/placeholder.png', '夜にだけ輝くという'),
  ('虹色イヤリング',   'rare_b', 'accessory', '/img/gacha/placeholder.png', '見る角度で色が変わる'),
  ('古代風コイン',     'rare_b', 'accessory', '/img/gacha/placeholder.png', '由来は不明')
on conflict (name) do nothing;

-- ── epic（3%）：上位レア 2 種 ─────────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('深海の真珠',       'epic', 'small_item', '/img/gacha/placeholder.png', '深い青の輝き'),
  ('レコードプレイヤー','epic','furniture',  '/img/gacha/placeholder.png', 'まだ動く')
on conflict (name) do nothing;

-- ── legendary（0.9%）：最高レア 2 種 ──────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('満月のランプ',   'legendary', 'furniture', '/img/gacha/placeholder.png', '夜の部屋を満たす'),
  ('流星の万年筆',   'legendary', 'small_item','/img/gacha/placeholder.png', '書くと尾を引く')
on conflict (name) do nothing;

-- ── urban_legend（0.1%）：都市伝説枠 5 種シャッフル ───────────────
-- 個々の出現率は均等（drop_weight = 1）。トータル 0.1% 内で 5 種が等確率。
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('指輪',           'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '誰かを待つように'),
  ('満月の鈴',       'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '振っても音が出ない'),
  ('千束のコート',   'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', 'どこかで見たような'),
  ('星の砂時計',     'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '逆さにすると…？'),
  ('宇宙猫',         'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '時々瞬く')
on conflict (name) do nothing;

-- ── 確認用 ────────────────────────────────────────────────────────
-- select rarity, count(*) as items from public.lunaria_gacha_pool
--   where is_active group by rarity order by rarity;
-- ===== END 010_gacha_seed.sql =====

-- ===== BEGIN 011_lock_gacha_rpc.sql =====
-- lunaria migration 011: lock down gacha RPC execution
-- The gacha MVP is operated only through Next.js API routes using service_role.
-- Revoke PUBLIC as well as anon/authenticated so RPC cannot be called directly
-- from browser-side Supabase clients with arbitrary user ids.

revoke execute on function public.draw_gacha(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.grant_gacha_ticket(uuid, integer) from public, anon, authenticated;
grant execute on function public.draw_gacha(uuid, uuid, text) to service_role;
grant execute on function public.grant_gacha_ticket(uuid, integer) to service_role;
-- ===== END 011_lock_gacha_rpc.sql =====

-- ===== BEGIN 012_gacha_content_v1.sql =====
-- lunaria migration 012: 月箱コンテンツ v1
-- 既存 inventory/history の pool_id を壊さないため、既存アイテムは DELETE せず UPDATE する。

-- 既存アイテムのリネーム + 説明更新
update public.lunaria_gacha_pool
   set name = '三日月のろうそく',
       description = '灯すと部屋が少し丸くなる'
 where name = 'ろうそく';

update public.lunaria_gacha_pool
   set name = '月相の振り子時計',
       description = '文字盤に月の満ち欠けが描かれてる'
 where name = 'アンティーク時計';

update public.lunaria_gacha_pool
   set name = '三日月のステンドグラス',
       description = '夕方の光が一番きれいに通る'
 where name = 'ステンドグラス';

update public.lunaria_gacha_pool
   set name = 'うた箱',
       description = 'ふたを開けるとどこか聞き覚えのある旋律'
 where name = 'レコードプレイヤー';

update public.lunaria_gacha_pool
   set name = 'どこかで見たコート',
       description = '赤い、そして煙草の匂いが少しする'
 where name = '千束のコート';

update public.lunaria_gacha_pool
   set name = '逆さの砂時計',
       description = 'ひっくり返すと、砂が上に向かって流れる'
 where name = '星の砂時計';

update public.lunaria_gacha_pool
   set name = '瞬きの猫',
       description = '目を瞬きするたび、瞳の奥に星が見える気がする'
 where name = '宇宙猫';

-- 説明のみ更新
update public.lunaria_gacha_pool
   set description = '月明かりの下でだけ薄く光る'
 where name = '月光のチョーカー';

update public.lunaria_gacha_pool
   set description = '灯すと部屋いっぱいに月の光が広がる'
 where name = '満月のランプ';

update public.lunaria_gacha_pool
   set description = 'インクが少しだけ尾を引いて乾く'
 where name = '流星の万年筆';

update public.lunaria_gacha_pool
   set description = '中に小さな星が閉じ込められているような'
 where name = '深海の真珠';

-- urban_legend 追加。合計出現率 0.1% の中で均等抽選するため drop_weight は既定値 1 のまま。
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('月の欠片',         'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '持っていると夜が少し明るく感じる'),
  ('二度目のメガネ',   'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', 'かけると、忘れていた小さなことだけ思い出す'),
  ('影のない傘',       'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '雨の中で広げても、地面に影が落ちない'),
  ('からっぽの封筒',   'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '重みはあるのに、中身は誰にも開けられない'),
  ('砂浜のラジオ',     'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '一度だけ、知らない誰かの声が流れたことがある')
on conflict (name) do nothing;

-- 確認用:
-- select name, rarity, description from public.lunaria_gacha_pool where rarity = 'urban_legend' order by name;
-- ===== END 012_gacha_content_v1.sql =====

-- ===== BEGIN 013_gacha_operational_hardening.sql =====
-- lunaria migration 013: gacha operational hardening
--
-- This migration is intentionally small and non-destructive.
-- It addresses Supabase advisor findings for the Phase G gacha tables/RPCs:
-- 1. Add indexes for foreign-key lookup paths used by inventory/history joins.
-- 2. Pin RPC search_path to avoid mutable search_path warnings.

create index if not exists lunaria_gacha_history_pool_idx
  on public.lunaria_gacha_history(pool_id);

create index if not exists lunaria_gacha_inventory_pool_idx
  on public.lunaria_gacha_inventory(pool_id);

alter function public.draw_gacha(uuid, uuid, text)
  set search_path = public, pg_temp;

alter function public.grant_gacha_ticket(uuid, integer)
  set search_path = public, pg_temp;

-- Verification queries:
--
-- select indexname
--   from pg_indexes
--  where schemaname = 'public'
--    and indexname in (
--      'lunaria_gacha_history_pool_idx',
--      'lunaria_gacha_inventory_pool_idx'
--    )
--  order by indexname;
--
-- select proname, proconfig
--   from pg_proc p
--   join pg_namespace n on p.pronamespace = n.oid
--  where n.nspname = 'public'
--    and proname in ('draw_gacha', 'grant_gacha_ticket')
--  order by proname;
-- ===== END 013_gacha_operational_hardening.sql =====

-- ===== BEGIN 014_gacha_content_v2.sql =====
-- lunaria migration 014: 月箱コンテンツ v2
--
-- Source of truth:
--   lunaria/MOONBOX_V2_FINAL_REVIEW.md
--
-- Existing inventory/history rows reference lunaria_gacha_pool.id, so existing
-- items must be updated in place. Do not delete and recreate existing pool rows.

-- ── 1. 既存アイテムのリネーム + 説明更新 ───────────────────────
update public.lunaria_gacha_pool
   set name = '月見クッション',
       description = 'ぼーっとする時間にちょうどいい'
 where name = 'やわらかいクッション';

update public.lunaria_gacha_pool
   set name = '表紙の取れた本',
       description = '最初のページに誰かのサインがある'
 where name = '古い本';

update public.lunaria_gacha_pool
   set name = '光の雫ペンダント',
       description = '角度を変えると虹色に折れる'
 where name = '水晶のペンダント';

update public.lunaria_gacha_pool
   set name = '名前のないコイン',
       description = '片面だけに紋章が彫られている'
 where name = '古代風コイン';

update public.lunaria_gacha_pool
   set name = '誰かのリング',
       description = '指に通すとほんのり暖かいらしい'
 where name = '指輪';

update public.lunaria_gacha_pool
   set name = '無音の鈴',
       description = '振ると音はしないけど、静けさが返ってくるらしい'
 where name = '満月の鈴';

-- ── 2. 既存アイテムの説明のみ更新 ─────────────────────────────
update public.lunaria_gacha_pool
   set description = 'ふたりで座るには少し狭い'
 where name = '木の小さな椅子';

update public.lunaria_gacha_pool
   set description = '中ほどのページに挟まっていた'
 where name = '革のしおり';

update public.lunaria_gacha_pool
   set description = 'サイズはちょうどいい'
 where name = '銀のリング';

update public.lunaria_gacha_pool
   set description = 'すみっこに小さな「L」の刺繍がある'
 where name = '刺繍ハンカチ';

-- ── 3. common_a 追加（5 → 8）────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, drop_weight, image_url, description) values
  ('木の小箱',       'common_a', 'small_item', 1, '/img/gacha/placeholder.png', '中身は空っぽなのに、持っているだけで落ち着く'),
  ('朝の湯のみ',     'common_a', 'small_item', 1, '/img/gacha/placeholder.png', '縁が少し欠けている、温かい飲み物が似合う'),
  ('古いマッチ箱',   'common_a', 'small_item', 1, '/img/gacha/placeholder.png', '振ると、中で乾いた音がする')
on conflict (name) do nothing;

-- ── 4. common_b 追加（5 → 7）────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, drop_weight, image_url, description) values
  ('空色のリボン',         'common_b', 'accessory', 1, '/img/gacha/placeholder.png', '結ぶと、結び目が少しだけ大きくなる'),
  ('細紐のブレスレット',   'common_b', 'accessory', 1, '/img/gacha/placeholder.png', '革紐に小さなビーズが一つだけついている')
on conflict (name) do nothing;

-- ── 5. epic 追加（2 → 3）────────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, drop_weight, image_url, description) values
  ('月夜の鏡', 'epic', 'small_item', 1, '/img/gacha/placeholder.png', '月のある夜だけ、縁取りが淡く光る')
on conflict (name) do nothing;

-- ── 6. urban_legend 追加（10 → 15）──────────────────────────
-- 合計出現率 0.1% の中で均等抽選するため、drop_weight はすべて 1。
insert into public.lunaria_gacha_pool (name, rarity, category, drop_weight, image_url, description) values
  ('名のない地図',           'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', '描かれた町の名前だけが、すべて空白になっているらしい'),
  ('古いカメラ',             'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', 'フィルムはないのに、撮るとシャッター音だけ残るらしい'),
  ('鏡うつしの本',           'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', '鏡越しに開くと、読んだ覚えのない一行が浮かぶらしい'),
  ('月光のティーポット',     'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', 'お湯を注ぐと、湯気が三日月の形になるという'),
  ('ふたりの傘',             'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', '一人で差すと、内側だけ雨音が近くなるらしい')
on conflict (name) do nothing;

-- ── 確認用 ─────────────────────────────────────────────────
-- select rarity, count(*) as items
--   from public.lunaria_gacha_pool
--  where is_active
--  group by rarity
--  order by rarity;
--
-- Expected active pool after applying v2:
--   common_a=8, common_b=7, rare_a=3, rare_b=3,
--   epic=3, legendary=2, urban_legend=15, total=41
-- ===== END 014_gacha_content_v2.sql =====

-- ===== BEGIN 015_gacha_pity_system.sql =====
-- lunaria migration 015: gacha pity system foundation
--
-- This migration adds the database foundation for the 100-draw urban_legend
-- pity system described in lunaria/GACHA_PITY_SYSTEM_DESIGN.md.
--
-- It is intentionally backward-compatible:
--   - Existing draw_gacha(uuid, uuid, text) is left untouched.
--   - Application code can continue using the old RPC until the UI/API phase.
--   - draw_gacha_v2 is added for the future rollout.

-- ── 1. Per-user pity state ─────────────────────────────────────
create table if not exists public.lunaria_gacha_pity_state (
  user_id uuid primary key references public.lunaria_users(id) on delete cascade,
  draws_since_urban_legend integer not null default 0 check (draws_since_urban_legend >= 0),
  lifetime_draws integer not null default 0 check (lifetime_draws >= 0),
  last_urban_legend_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.lunaria_gacha_pity_state enable row level security;

-- ── 2. Draw history audit columns ──────────────────────────────
alter table public.lunaria_gacha_history
  add column if not exists pity_before integer,
  add column if not exists pity_after integer,
  add column if not exists pity_triggered boolean not null default false;

create index if not exists lunaria_gacha_history_pity_triggered_idx
  on public.lunaria_gacha_history(user_id, pulled_at desc)
  where pity_triggered = true;

-- ── 3. Backfill pity state from existing draw history ──────────
-- For each existing user, initialize the counter to the number of draws since
-- their latest urban_legend. Cap at 99 so the next v2 draw can trigger pity.
with known_users as (
  select user_id from public.lunaria_gacha_history
  union
  select user_id from public.lunaria_gacha_tickets
  union
  select user_id from public.lunaria_gacha_inventory
),
history_stats as (
  select
    user_id,
    count(*)::integer as lifetime_draws,
    max(pulled_at) filter (where rarity = 'urban_legend') as last_urban_legend_at
  from public.lunaria_gacha_history
  group by user_id
),
since_urban as (
  select
    ku.user_id,
    coalesce(hs.lifetime_draws, 0) as lifetime_draws,
    hs.last_urban_legend_at,
    least((
      select count(*)::integer
        from public.lunaria_gacha_history h
       where h.user_id = ku.user_id
         and (
           hs.last_urban_legend_at is null
           or h.pulled_at > hs.last_urban_legend_at
         )
    ), 99) as draws_since_urban_legend
  from known_users ku
  left join history_stats hs on hs.user_id = ku.user_id
)
insert into public.lunaria_gacha_pity_state (
  user_id,
  draws_since_urban_legend,
  lifetime_draws,
  last_urban_legend_at,
  updated_at
)
select
  user_id,
  draws_since_urban_legend,
  lifetime_draws,
  last_urban_legend_at,
  now()
from since_urban
on conflict (user_id) do update
  set draws_since_urban_legend = excluded.draws_since_urban_legend,
      lifetime_draws = excluded.lifetime_draws,
      last_urban_legend_at = excluded.last_urban_legend_at,
      updated_at = now();

-- ── 4. Pity-aware draw RPC ────────────────────────────────────
-- draw_gacha_v2 keeps the same core behavior as draw_gacha, but additionally:
--   - locks the user's pity state row during the draw,
--   - rejects non-urban draws when the counter is already at 99,
--   - records pity audit fields in history,
--   - updates pity state in the same transaction.
create or replace function public.draw_gacha_v2(
  p_user_id uuid,
  p_pool_id uuid,
  p_rarity  text
)
returns table(
  was_duplicate boolean,
  coin_earned integer,
  ticket_remaining integer,
  coin_balance integer,
  pity_before integer,
  pity_after integer,
  pity_triggered boolean
) as $$
declare
  v_existing uuid;
  v_coin integer;
  v_ticket integer;
  v_balance integer;
  v_pool_rarity text;
  v_pity_before integer;
  v_pity_after integer;
  v_pity_triggered boolean;
begin
  if p_rarity not in (
    'common_a',
    'common_b',
    'rare_a',
    'rare_b',
    'epic',
    'legendary',
    'urban_legend'
  ) then
    raise exception 'invalid_rarity' using errcode = 'P0001';
  end if;

  select rarity into v_pool_rarity
    from public.lunaria_gacha_pool
   where id = p_pool_id
     and is_active = true;

  if not found then
    raise exception 'pool_not_found' using errcode = 'P0001';
  end if;

  if v_pool_rarity <> p_rarity then
    raise exception 'rarity_mismatch' using errcode = 'P0001';
  end if;

  insert into public.lunaria_gacha_pity_state(user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

  select draws_since_urban_legend into v_pity_before
    from public.lunaria_gacha_pity_state
   where user_id = p_user_id
   for update;

  if not found then
    raise exception 'pity_state_missing' using errcode = 'P0001';
  end if;

  v_pity_triggered := v_pity_before >= 99 and p_rarity = 'urban_legend';

  if v_pity_before >= 99 and p_rarity <> 'urban_legend' then
    raise exception 'pity_required' using errcode = 'P0001';
  end if;

  -- Ticket consumption. This happens after pity validation so a rejected
  -- non-urban draw at the threshold does not consume a ticket.
  update public.lunaria_gacha_tickets
     set count = count - 1,
         updated_at = now()
   where user_id = p_user_id
     and count >= 1
   returning count into v_ticket;

  if not found then
    raise exception 'no_ticket' using errcode = 'P0001';
  end if;

  select id into v_existing
    from public.lunaria_gacha_inventory
   where user_id = p_user_id
     and pool_id = p_pool_id;

  if v_existing is null then
    insert into public.lunaria_gacha_inventory(user_id, pool_id)
      values (p_user_id, p_pool_id);
    v_coin := 0;
  else
    v_coin := case p_rarity
      when 'common_a'     then 10
      when 'common_b'     then 15
      when 'rare_a'       then 50
      when 'rare_b'       then 80
      when 'epic'         then 200
      when 'legendary'    then 500
      when 'urban_legend' then 2000
    end;

    insert into public.lunaria_gacha_coins(user_id, balance)
      values (p_user_id, v_coin)
      on conflict (user_id) do update
        set balance = public.lunaria_gacha_coins.balance + v_coin,
            updated_at = now();
  end if;

  select balance into v_balance
    from public.lunaria_gacha_coins
   where user_id = p_user_id;
  v_balance := coalesce(v_balance, 0);

  if p_rarity = 'urban_legend' then
    v_pity_after := 0;
  else
    v_pity_after := v_pity_before + 1;
  end if;

  update public.lunaria_gacha_pity_state
     set draws_since_urban_legend = v_pity_after,
         lifetime_draws = lifetime_draws + 1,
         last_urban_legend_at = case
           when p_rarity = 'urban_legend' then now()
           else last_urban_legend_at
         end,
         updated_at = now()
   where user_id = p_user_id;

  insert into public.lunaria_gacha_history(
    user_id,
    pool_id,
    rarity,
    was_duplicate,
    coin_earned,
    pity_before,
    pity_after,
    pity_triggered
  )
  values (
    p_user_id,
    p_pool_id,
    p_rarity,
    v_existing is not null,
    v_coin,
    v_pity_before,
    v_pity_after,
    v_pity_triggered
  );

  return query
    select
      v_existing is not null,
      v_coin,
      v_ticket,
      v_balance,
      v_pity_before,
      v_pity_after,
      v_pity_triggered;
end;
$$ language plpgsql;

alter function public.draw_gacha_v2(uuid, uuid, text)
  set search_path = public, pg_temp;

revoke execute on function public.draw_gacha_v2(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.draw_gacha_v2(uuid, uuid, text)
  to service_role;

-- ── Verification queries ──────────────────────────────────────
--
-- select column_name
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name = 'lunaria_gacha_history'
--    and column_name in ('pity_before', 'pity_after', 'pity_triggered')
--  order by column_name;
--
-- select *
--   from public.lunaria_gacha_pity_state
--  order by updated_at desc;
--
-- select proname, proconfig
--   from pg_proc p
--   join pg_namespace n on p.pronamespace = n.oid
--  where n.nspname = 'public'
--    and proname = 'draw_gacha_v2';
-- ===== END 015_gacha_pity_system.sql =====

-- ===== BEGIN 016_gacha_pity_threshold.sql =====
-- lunaria migration 016: gacha pity threshold 200
--
-- 015 introduced the pity-state table and draw_gacha_v2 with a 100-draw
-- hard pity. Claude's post-review recommended 200 draws as the safer launch
-- setting. This migration intentionally only replaces draw_gacha_v2, leaving
-- tables, history columns, grants, and backfilled pity state untouched.

create or replace function public.draw_gacha_v2(
  p_user_id uuid,
  p_pool_id uuid,
  p_rarity  text
)
returns table(
  was_duplicate boolean,
  coin_earned integer,
  ticket_remaining integer,
  coin_balance integer,
  pity_before integer,
  pity_after integer,
  pity_triggered boolean
) as $$
declare
  v_existing uuid;
  v_coin integer;
  v_ticket integer;
  v_balance integer;
  v_pool_rarity text;
  v_pity_before integer;
  v_pity_after integer;
  v_pity_triggered boolean;
begin
  if p_rarity not in (
    'common_a',
    'common_b',
    'rare_a',
    'rare_b',
    'epic',
    'legendary',
    'urban_legend'
  ) then
    raise exception 'invalid_rarity' using errcode = 'P0001';
  end if;

  select rarity into v_pool_rarity
    from public.lunaria_gacha_pool
   where id = p_pool_id
     and is_active = true;

  if not found then
    raise exception 'pool_not_found' using errcode = 'P0001';
  end if;

  if v_pool_rarity <> p_rarity then
    raise exception 'rarity_mismatch' using errcode = 'P0001';
  end if;

  insert into public.lunaria_gacha_pity_state(user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

  select draws_since_urban_legend into v_pity_before
    from public.lunaria_gacha_pity_state
   where user_id = p_user_id
   for update;

  if not found then
    raise exception 'pity_state_missing' using errcode = 'P0001';
  end if;

  v_pity_triggered := v_pity_before >= 199 and p_rarity = 'urban_legend';

  if v_pity_before >= 199 and p_rarity <> 'urban_legend' then
    raise exception 'pity_required' using errcode = 'P0001';
  end if;

  -- Ticket consumption happens after pity validation so a rejected non-urban
  -- draw at the threshold never consumes a ticket.
  update public.lunaria_gacha_tickets
     set count = count - 1,
         updated_at = now()
   where user_id = p_user_id
     and count >= 1
   returning count into v_ticket;

  if not found then
    raise exception 'no_ticket' using errcode = 'P0001';
  end if;

  select id into v_existing
    from public.lunaria_gacha_inventory
   where user_id = p_user_id
     and pool_id = p_pool_id;

  if v_existing is null then
    insert into public.lunaria_gacha_inventory(user_id, pool_id)
      values (p_user_id, p_pool_id);
    v_coin := 0;
  else
    v_coin := case p_rarity
      when 'common_a'     then 10
      when 'common_b'     then 15
      when 'rare_a'       then 50
      when 'rare_b'       then 80
      when 'epic'         then 200
      when 'legendary'    then 500
      when 'urban_legend' then 2000
    end;

    insert into public.lunaria_gacha_coins(user_id, balance)
      values (p_user_id, v_coin)
      on conflict (user_id) do update
        set balance = public.lunaria_gacha_coins.balance + v_coin,
            updated_at = now();
  end if;

  select balance into v_balance
    from public.lunaria_gacha_coins
   where user_id = p_user_id;
  v_balance := coalesce(v_balance, 0);

  if p_rarity = 'urban_legend' then
    v_pity_after := 0;
  else
    v_pity_after := v_pity_before + 1;
  end if;

  update public.lunaria_gacha_pity_state
     set draws_since_urban_legend = v_pity_after,
         lifetime_draws = lifetime_draws + 1,
         last_urban_legend_at = case
           when p_rarity = 'urban_legend' then now()
           else last_urban_legend_at
         end,
         updated_at = now()
   where user_id = p_user_id;

  insert into public.lunaria_gacha_history(
    user_id,
    pool_id,
    rarity,
    was_duplicate,
    coin_earned,
    pity_before,
    pity_after,
    pity_triggered
  )
  values (
    p_user_id,
    p_pool_id,
    p_rarity,
    v_existing is not null,
    v_coin,
    v_pity_before,
    v_pity_after,
    v_pity_triggered
  );

  return query
    select
      v_existing is not null,
      v_coin,
      v_ticket,
      v_balance,
      v_pity_before,
      v_pity_after,
      v_pity_triggered;
end;
$$ language plpgsql;

alter function public.draw_gacha_v2(uuid, uuid, text)
  set search_path = public, pg_temp;

revoke execute on function public.draw_gacha_v2(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.draw_gacha_v2(uuid, uuid, text)
  to service_role;
-- ===== END 016_gacha_pity_threshold.sql =====

-- ===== BEGIN 017_diary_v1_schema.sql =====
-- migration 017: diary v1 schema expansion
-- Apply after the gacha 014/015/016 migrations are stable.

alter table public.lunaria_diary_logs
  add column if not exists title text,
  add column if not exists talked_about jsonb not null default '[]'::jsonb,
  add column if not exists memory_changes jsonb not null default '[]'::jsonb,
  add column if not exists source_message_count int not null default 0,
  add column if not exists generated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lunaria_diary_logs_source_message_count_nonnegative'
  ) then
    alter table public.lunaria_diary_logs
      add constraint lunaria_diary_logs_source_message_count_nonnegative
      check (source_message_count >= 0)
      not valid;
  end if;
end $$;

alter table public.lunaria_diary_logs
  validate constraint lunaria_diary_logs_source_message_count_nonnegative;

create index if not exists lunaria_diary_logs_generated_at_idx
  on public.lunaria_diary_logs(user_id, generated_at desc);
-- ===== END 017_diary_v1_schema.sql =====

-- ===== BEGIN 018_core_memory_provenance.sql =====
-- migration 018: core memory provenance
-- Apply after 014/015/016/017 are stable.

alter table public.lunaria_core_memory
  add column if not exists source_date date,
  add column if not exists source_message_id uuid references public.lunaria_messages(id) on delete set null,
  add column if not exists confidence numeric(3,2),
  add column if not exists status text not null default 'active',
  add column if not exists last_confirmed_at timestamptz,
  add column if not exists created_by text not null default 'llm',
  add column if not exists notes text;

update public.lunaria_core_memory
  set status = 'active'
  where status is null;

update public.lunaria_core_memory
  set created_by = 'llm'
  where created_by is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lunaria_core_memory_confidence_range'
  ) then
    alter table public.lunaria_core_memory
      add constraint lunaria_core_memory_confidence_range
      check (confidence is null or (confidence >= 0 and confidence <= 1))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lunaria_core_memory_status_check'
  ) then
    alter table public.lunaria_core_memory
      add constraint lunaria_core_memory_status_check
      check (status in ('candidate', 'active', 'confirmed', 'archived', 'deleted'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lunaria_core_memory_created_by_check'
  ) then
    alter table public.lunaria_core_memory
      add constraint lunaria_core_memory_created_by_check
      check (created_by in ('llm', 'user_explicit', 'profile_sync', 'migration'))
      not valid;
  end if;
end $$;

alter table public.lunaria_core_memory
  validate constraint lunaria_core_memory_confidence_range;

alter table public.lunaria_core_memory
  validate constraint lunaria_core_memory_status_check;

alter table public.lunaria_core_memory
  validate constraint lunaria_core_memory_created_by_check;

create index if not exists lunaria_core_memory_status_idx
  on public.lunaria_core_memory(user_id, status, score desc)
  where memory_category is distinct from 'profile';

create index if not exists lunaria_core_memory_source_date_idx
  on public.lunaria_core_memory(user_id, source_date desc)
  where source_date is not null;
-- ===== END 018_core_memory_provenance.sql =====

-- ===== BEGIN 019_memory_candidates.sql =====
-- migration 019: memory candidates review queue
-- Apply after 018_core_memory_provenance.sql.

create table if not exists public.lunaria_memory_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,
  candidate_type text not null check (candidate_type in ('value', 'pattern', 'goal', 'trigger', 'mid', 'name', 'other')),
  content text not null,
  source_type text not null default 'conversation' check (source_type in ('conversation', 'diary', 'profile', 'manual', 'game')),
  source_id uuid,
  source_date date,
  source_message_ids uuid[] not null default '{}',
  confidence numeric(3,2) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'merged', 'archived')),
  reason text,
  created_by text not null default 'llm' check (created_by in ('llm', 'user_explicit', 'system', 'migration')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.lunaria_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, source_type, source_date, candidate_type, content)
);

alter table public.lunaria_memory_candidates enable row level security;

drop policy if exists "lunaria_own_memory_candidates" on public.lunaria_memory_candidates;
create policy "lunaria_own_memory_candidates"
  on public.lunaria_memory_candidates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists lunaria_memory_candidates_user_status_idx
  on public.lunaria_memory_candidates(user_id, status, created_at desc)
  where deleted_at is null;

create index if not exists lunaria_memory_candidates_source_date_idx
  on public.lunaria_memory_candidates(user_id, source_date desc)
  where source_date is not null and deleted_at is null;

create or replace function public.lunaria_touch_memory_candidates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lunaria_memory_candidates_touch_updated_at on public.lunaria_memory_candidates;
create trigger lunaria_memory_candidates_touch_updated_at
  before update on public.lunaria_memory_candidates
  for each row execute function public.lunaria_touch_memory_candidates_updated_at();
-- ===== END 019_memory_candidates.sql =====

-- ===== BEGIN 020_user_items.sql =====
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
-- ===== END 020_user_items.sql =====

-- ===== BEGIN 021_character_states.sql =====
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
-- ===== END 021_character_states.sql =====

-- ===== BEGIN 022_memory_candidates_mid_game_forward_compat.sql =====
-- migration 022: memory candidates mid/game forward compatibility
-- Apply after 019_memory_candidates.sql.
--
-- Existing local databases may already have applied the original 019 migration.
-- This forward migration widens the check constraints without relying on edits
-- to an already-applied migration file.

do $$
begin
  if to_regclass('public.lunaria_memory_candidates') is not null then
    alter table public.lunaria_memory_candidates
      drop constraint if exists lunaria_memory_candidates_candidate_type_check;

    alter table public.lunaria_memory_candidates
      add constraint lunaria_memory_candidates_candidate_type_check
      check (candidate_type in ('value', 'pattern', 'goal', 'trigger', 'mid', 'name', 'other'));

    alter table public.lunaria_memory_candidates
      drop constraint if exists lunaria_memory_candidates_source_type_check;

    alter table public.lunaria_memory_candidates
      add constraint lunaria_memory_candidates_source_type_check
      check (source_type in ('conversation', 'diary', 'profile', 'manual', 'game'));
  end if;
end $$;
-- ===== END 022_memory_candidates_mid_game_forward_compat.sql =====

-- ===== BEGIN 023_rls_hardening.sql =====
-- migration 023: RLS hardening audit
--
-- Scope:
--   - Enable RLS on every public Lunaria table known through migration 022.
--   - Replace older broad FOR ALL policies with operation-specific policies.
--   - Use authenticated ownership checks based on (select auth.uid()).
--   - Keep catalog tables read-only to authenticated users.
--   - Keep server-managed gacha/economy audit tables read-only to the owning user;
--     service_role still bypasses RLS for server-side writes.

-- ---------------------------------------------------------------------------
-- Enable RLS on every Lunaria table.
-- ---------------------------------------------------------------------------

alter table public.lunaria_users enable row level security;
alter table public.lunaria_messages enable row level security;
alter table public.lunaria_core_memory enable row level security;
alter table public.lunaria_routing_log enable row level security;
alter table public.lunaria_route_master enable row level security;
alter table public.lunaria_routing_review enable row level security;
alter table public.lunaria_emotion_state enable row level security;
alter table public.lunaria_affinity enable row level security;
alter table public.lunaria_extractions enable row level security;
alter table public.lunaria_diary_logs enable row level security;
alter table public.lunaria_preferences enable row level security;
alter table public.lunaria_relationship_state enable row level security;
alter table public.lunaria_user_profile enable row level security;
alter table public.lunaria_profile_archive enable row level security;
alter table public.lunaria_pending_profile_updates enable row level security;
alter table public.lunaria_gacha_pool enable row level security;
alter table public.lunaria_gacha_tickets enable row level security;
alter table public.lunaria_gacha_coins enable row level security;
alter table public.lunaria_gacha_inventory enable row level security;
alter table public.lunaria_gacha_history enable row level security;
alter table public.lunaria_gacha_daily_bonus enable row level security;
alter table public.lunaria_gacha_daily_quota enable row level security;
alter table public.lunaria_gacha_pity_state enable row level security;
alter table public.lunaria_memory_candidates enable row level security;
alter table public.lunaria_user_items enable row level security;
alter table public.lunaria_character_states enable row level security;

-- ---------------------------------------------------------------------------
-- Drop legacy and replacement policies so the migration is re-runnable.
-- ---------------------------------------------------------------------------

drop policy if exists "lunaria_own_users" on public.lunaria_users;
drop policy if exists "lunaria_users_select_own" on public.lunaria_users;
drop policy if exists "lunaria_users_insert_own" on public.lunaria_users;
drop policy if exists "lunaria_users_update_own" on public.lunaria_users;
drop policy if exists "lunaria_users_delete_own" on public.lunaria_users;

drop policy if exists "lunaria_own_msgs" on public.lunaria_messages;
drop policy if exists "lunaria_messages_select_own" on public.lunaria_messages;
drop policy if exists "lunaria_messages_insert_own" on public.lunaria_messages;
drop policy if exists "lunaria_messages_update_own" on public.lunaria_messages;
drop policy if exists "lunaria_messages_delete_own" on public.lunaria_messages;

drop policy if exists "lunaria_own_mem" on public.lunaria_core_memory;
drop policy if exists "lunaria_core_memory_select_own" on public.lunaria_core_memory;
drop policy if exists "lunaria_core_memory_insert_own" on public.lunaria_core_memory;
drop policy if exists "lunaria_core_memory_update_own" on public.lunaria_core_memory;
drop policy if exists "lunaria_core_memory_delete_own" on public.lunaria_core_memory;

drop policy if exists "lunaria_own_route" on public.lunaria_routing_log;
drop policy if exists "lunaria_routing_log_select_own" on public.lunaria_routing_log;
drop policy if exists "lunaria_routing_log_insert_own" on public.lunaria_routing_log;
drop policy if exists "lunaria_routing_log_update_own" on public.lunaria_routing_log;
drop policy if exists "lunaria_routing_log_delete_own" on public.lunaria_routing_log;

drop policy if exists "lunaria_route_master_read" on public.lunaria_route_master;
drop policy if exists "lunaria_route_master_select_authenticated" on public.lunaria_route_master;

drop policy if exists "lunaria_own_review" on public.lunaria_routing_review;
drop policy if exists "lunaria_routing_review_select_own" on public.lunaria_routing_review;
drop policy if exists "lunaria_routing_review_insert_own" on public.lunaria_routing_review;
drop policy if exists "lunaria_routing_review_update_own" on public.lunaria_routing_review;
drop policy if exists "lunaria_routing_review_delete_own" on public.lunaria_routing_review;

drop policy if exists "lunaria_own_emotion" on public.lunaria_emotion_state;
drop policy if exists "lunaria_emotion_state_select_own" on public.lunaria_emotion_state;
drop policy if exists "lunaria_emotion_state_insert_own" on public.lunaria_emotion_state;
drop policy if exists "lunaria_emotion_state_update_own" on public.lunaria_emotion_state;
drop policy if exists "lunaria_emotion_state_delete_own" on public.lunaria_emotion_state;

drop policy if exists "lunaria_own_affinity" on public.lunaria_affinity;
drop policy if exists "lunaria_affinity_select_own" on public.lunaria_affinity;
drop policy if exists "lunaria_affinity_insert_own" on public.lunaria_affinity;
drop policy if exists "lunaria_affinity_update_own" on public.lunaria_affinity;
drop policy if exists "lunaria_affinity_delete_own" on public.lunaria_affinity;

drop policy if exists "lunaria_own_extract" on public.lunaria_extractions;
drop policy if exists "lunaria_extractions_select_own" on public.lunaria_extractions;
drop policy if exists "lunaria_extractions_insert_own" on public.lunaria_extractions;
drop policy if exists "lunaria_extractions_update_own" on public.lunaria_extractions;
drop policy if exists "lunaria_extractions_delete_own" on public.lunaria_extractions;

drop policy if exists "lunaria_own_diary" on public.lunaria_diary_logs;
drop policy if exists "lunaria_diary_logs_select_own" on public.lunaria_diary_logs;
drop policy if exists "lunaria_diary_logs_insert_own" on public.lunaria_diary_logs;
drop policy if exists "lunaria_diary_logs_update_own" on public.lunaria_diary_logs;
drop policy if exists "lunaria_diary_logs_delete_own" on public.lunaria_diary_logs;

drop policy if exists "lunaria_own_pref" on public.lunaria_preferences;
drop policy if exists "lunaria_preferences_select_own" on public.lunaria_preferences;
drop policy if exists "lunaria_preferences_insert_own" on public.lunaria_preferences;
drop policy if exists "lunaria_preferences_update_own" on public.lunaria_preferences;
drop policy if exists "lunaria_preferences_delete_own" on public.lunaria_preferences;

drop policy if exists "lunaria_own_rel" on public.lunaria_relationship_state;
drop policy if exists "lunaria_relationship_state_select_own" on public.lunaria_relationship_state;
drop policy if exists "lunaria_relationship_state_insert_own" on public.lunaria_relationship_state;
drop policy if exists "lunaria_relationship_state_update_own" on public.lunaria_relationship_state;
drop policy if exists "lunaria_relationship_state_delete_own" on public.lunaria_relationship_state;

drop policy if exists "lunaria_own_profile" on public.lunaria_user_profile;
drop policy if exists "lunaria_user_profile_select_own" on public.lunaria_user_profile;
drop policy if exists "lunaria_user_profile_insert_own" on public.lunaria_user_profile;
drop policy if exists "lunaria_user_profile_update_own" on public.lunaria_user_profile;
drop policy if exists "lunaria_user_profile_delete_own" on public.lunaria_user_profile;

drop policy if exists "lunaria_own_archive" on public.lunaria_profile_archive;
drop policy if exists "lunaria_profile_archive_select_own" on public.lunaria_profile_archive;

drop policy if exists "lunaria_own_pending" on public.lunaria_pending_profile_updates;
drop policy if exists "lunaria_pending_profile_updates_select_own" on public.lunaria_pending_profile_updates;
drop policy if exists "lunaria_pending_profile_updates_insert_own" on public.lunaria_pending_profile_updates;
drop policy if exists "lunaria_pending_profile_updates_update_own" on public.lunaria_pending_profile_updates;
drop policy if exists "lunaria_pending_profile_updates_delete_own" on public.lunaria_pending_profile_updates;

drop policy if exists "lunaria_gacha_pool_select_authenticated" on public.lunaria_gacha_pool;

drop policy if exists "lunaria_gacha_tickets_select_own" on public.lunaria_gacha_tickets;
drop policy if exists "lunaria_gacha_coins_select_own" on public.lunaria_gacha_coins;
drop policy if exists "lunaria_gacha_inventory_select_own" on public.lunaria_gacha_inventory;
drop policy if exists "lunaria_gacha_history_select_own" on public.lunaria_gacha_history;
drop policy if exists "lunaria_gacha_daily_bonus_select_own" on public.lunaria_gacha_daily_bonus;
drop policy if exists "lunaria_gacha_daily_quota_select_own" on public.lunaria_gacha_daily_quota;
drop policy if exists "lunaria_gacha_pity_state_select_own" on public.lunaria_gacha_pity_state;

drop policy if exists "lunaria_own_memory_candidates" on public.lunaria_memory_candidates;
drop policy if exists "lunaria_memory_candidates_select_own" on public.lunaria_memory_candidates;
drop policy if exists "lunaria_memory_candidates_insert_own" on public.lunaria_memory_candidates;
drop policy if exists "lunaria_memory_candidates_update_own" on public.lunaria_memory_candidates;
drop policy if exists "lunaria_memory_candidates_delete_own" on public.lunaria_memory_candidates;

drop policy if exists "lunaria_own_user_items_select" on public.lunaria_user_items;
drop policy if exists "lunaria_own_user_items_insert" on public.lunaria_user_items;
drop policy if exists "lunaria_own_user_items_update" on public.lunaria_user_items;
drop policy if exists "lunaria_own_user_items_delete" on public.lunaria_user_items;
drop policy if exists "lunaria_user_items_select_own" on public.lunaria_user_items;
drop policy if exists "lunaria_user_items_insert_own" on public.lunaria_user_items;
drop policy if exists "lunaria_user_items_update_own" on public.lunaria_user_items;
drop policy if exists "lunaria_user_items_delete_own" on public.lunaria_user_items;

drop policy if exists "lunaria_own_character_states_select" on public.lunaria_character_states;
drop policy if exists "lunaria_own_character_states_insert" on public.lunaria_character_states;
drop policy if exists "lunaria_own_character_states_update" on public.lunaria_character_states;
drop policy if exists "lunaria_own_character_states_delete" on public.lunaria_character_states;
drop policy if exists "lunaria_character_states_select_own" on public.lunaria_character_states;
drop policy if exists "lunaria_character_states_insert_own" on public.lunaria_character_states;
drop policy if exists "lunaria_character_states_update_own" on public.lunaria_character_states;
drop policy if exists "lunaria_character_states_delete_own" on public.lunaria_character_states;

-- ---------------------------------------------------------------------------
-- User root table.
-- ---------------------------------------------------------------------------

create policy "lunaria_users_select_own"
  on public.lunaria_users for select to authenticated
  using ((select auth.uid()) = id);

create policy "lunaria_users_insert_own"
  on public.lunaria_users for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "lunaria_users_update_own"
  on public.lunaria_users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "lunaria_users_delete_own"
  on public.lunaria_users for delete to authenticated
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- User-owned tables with direct user_id.
-- ---------------------------------------------------------------------------

create policy "lunaria_messages_select_own"
  on public.lunaria_messages for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_messages_insert_own"
  on public.lunaria_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_messages_update_own"
  on public.lunaria_messages for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_messages_delete_own"
  on public.lunaria_messages for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_core_memory_select_own"
  on public.lunaria_core_memory for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_core_memory_insert_own"
  on public.lunaria_core_memory for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_core_memory_update_own"
  on public.lunaria_core_memory for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_core_memory_delete_own"
  on public.lunaria_core_memory for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_routing_log_select_own"
  on public.lunaria_routing_log for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_routing_log_insert_own"
  on public.lunaria_routing_log for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_routing_log_update_own"
  on public.lunaria_routing_log for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_routing_log_delete_own"
  on public.lunaria_routing_log for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_emotion_state_select_own"
  on public.lunaria_emotion_state for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_emotion_state_insert_own"
  on public.lunaria_emotion_state for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_emotion_state_update_own"
  on public.lunaria_emotion_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_emotion_state_delete_own"
  on public.lunaria_emotion_state for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_affinity_select_own"
  on public.lunaria_affinity for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_affinity_insert_own"
  on public.lunaria_affinity for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_affinity_update_own"
  on public.lunaria_affinity for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_affinity_delete_own"
  on public.lunaria_affinity for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_extractions_select_own"
  on public.lunaria_extractions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_extractions_insert_own"
  on public.lunaria_extractions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_extractions_update_own"
  on public.lunaria_extractions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_extractions_delete_own"
  on public.lunaria_extractions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_diary_logs_select_own"
  on public.lunaria_diary_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_diary_logs_insert_own"
  on public.lunaria_diary_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_diary_logs_update_own"
  on public.lunaria_diary_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_diary_logs_delete_own"
  on public.lunaria_diary_logs for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_preferences_select_own"
  on public.lunaria_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_preferences_insert_own"
  on public.lunaria_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_preferences_update_own"
  on public.lunaria_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_preferences_delete_own"
  on public.lunaria_preferences for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_relationship_state_select_own"
  on public.lunaria_relationship_state for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_relationship_state_insert_own"
  on public.lunaria_relationship_state for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_relationship_state_update_own"
  on public.lunaria_relationship_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_relationship_state_delete_own"
  on public.lunaria_relationship_state for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_user_profile_select_own"
  on public.lunaria_user_profile for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_user_profile_insert_own"
  on public.lunaria_user_profile for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_user_profile_update_own"
  on public.lunaria_user_profile for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_user_profile_delete_own"
  on public.lunaria_user_profile for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_profile_archive_select_own"
  on public.lunaria_profile_archive for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_pending_profile_updates_select_own"
  on public.lunaria_pending_profile_updates for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_pending_profile_updates_insert_own"
  on public.lunaria_pending_profile_updates for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_pending_profile_updates_update_own"
  on public.lunaria_pending_profile_updates for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_pending_profile_updates_delete_own"
  on public.lunaria_pending_profile_updates for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_memory_candidates_select_own"
  on public.lunaria_memory_candidates for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_memory_candidates_insert_own"
  on public.lunaria_memory_candidates for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_memory_candidates_update_own"
  on public.lunaria_memory_candidates for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_memory_candidates_delete_own"
  on public.lunaria_memory_candidates for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_user_items_select_own"
  on public.lunaria_user_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_user_items_insert_own"
  on public.lunaria_user_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_user_items_update_own"
  on public.lunaria_user_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_user_items_delete_own"
  on public.lunaria_user_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_character_states_select_own"
  on public.lunaria_character_states for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_character_states_insert_own"
  on public.lunaria_character_states for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_character_states_update_own"
  on public.lunaria_character_states for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_character_states_delete_own"
  on public.lunaria_character_states for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Routing review rows are owned through their parent routing log.
-- ---------------------------------------------------------------------------

create policy "lunaria_routing_review_select_own"
  on public.lunaria_routing_review for select to authenticated
  using (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  );

create policy "lunaria_routing_review_insert_own"
  on public.lunaria_routing_review for insert to authenticated
  with check (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  );

create policy "lunaria_routing_review_update_own"
  on public.lunaria_routing_review for update to authenticated
  using (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  );

create policy "lunaria_routing_review_delete_own"
  on public.lunaria_routing_review for delete to authenticated
  using (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Read-only catalogs.
-- ---------------------------------------------------------------------------

create policy "lunaria_route_master_select_authenticated"
  on public.lunaria_route_master for select to authenticated
  using (true);

create policy "lunaria_gacha_pool_select_authenticated"
  on public.lunaria_gacha_pool for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Server-managed gacha/economy state. Users can read only their own rows.
-- ---------------------------------------------------------------------------

create policy "lunaria_gacha_tickets_select_own"
  on public.lunaria_gacha_tickets for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_coins_select_own"
  on public.lunaria_gacha_coins for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_inventory_select_own"
  on public.lunaria_gacha_inventory for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_history_select_own"
  on public.lunaria_gacha_history for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_daily_bonus_select_own"
  on public.lunaria_gacha_daily_bonus for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_daily_quota_select_own"
  on public.lunaria_gacha_daily_quota for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_pity_state_select_own"
  on public.lunaria_gacha_pity_state for select to authenticated
  using ((select auth.uid()) = user_id);
-- ===== END 023_rls_hardening.sql =====

-- ===== BEGIN 024_usage_events.sql =====
-- migration 024: usage telemetry events
--
-- Authenticated users may insert only their own usage events.
-- Event reads are intentionally unavailable to anon/authenticated clients;
-- service_role reads through elevated server-side access.

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

drop policy if exists "usage_events_insert_own" on public.usage_events;

create policy "usage_events_insert_own"
  on public.usage_events for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on public.usage_events from anon;
revoke all on public.usage_events from authenticated;

grant insert on public.usage_events to authenticated;
grant select on public.usage_events to service_role;
-- ===== END 024_usage_events.sql =====
