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
