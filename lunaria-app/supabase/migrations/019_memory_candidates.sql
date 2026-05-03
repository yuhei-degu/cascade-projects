-- migration 019: memory candidates review queue
-- Apply after 018_core_memory_provenance.sql.

create table if not exists public.lunaria_memory_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,
  candidate_type text not null check (candidate_type in ('value', 'pattern', 'goal', 'trigger', 'name', 'other')),
  content text not null,
  source_type text not null default 'conversation' check (source_type in ('conversation', 'diary', 'profile', 'manual')),
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

create policy if not exists "lunaria_own_memory_candidates"
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
