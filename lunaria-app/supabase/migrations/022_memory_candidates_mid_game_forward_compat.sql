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
