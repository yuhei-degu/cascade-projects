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
