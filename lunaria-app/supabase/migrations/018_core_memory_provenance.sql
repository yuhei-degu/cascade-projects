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
