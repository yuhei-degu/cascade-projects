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
