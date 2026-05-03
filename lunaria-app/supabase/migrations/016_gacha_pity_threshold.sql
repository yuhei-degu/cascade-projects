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

