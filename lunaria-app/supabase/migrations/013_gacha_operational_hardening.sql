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
