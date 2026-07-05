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
