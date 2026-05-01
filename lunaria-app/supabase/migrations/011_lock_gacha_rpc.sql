-- lunaria migration 011: lock down gacha RPC execution
-- The gacha MVP is operated only through Next.js API routes using service_role.
-- Revoke PUBLIC as well as anon/authenticated so RPC cannot be called directly
-- from browser-side Supabase clients with arbitrary user ids.

revoke execute on function public.draw_gacha(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.grant_gacha_ticket(uuid, integer) from public, anon, authenticated;
grant execute on function public.draw_gacha(uuid, uuid, text) to service_role;
grant execute on function public.grant_gacha_ticket(uuid, integer) to service_role;
