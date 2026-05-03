# Claude Task: Lunaria AI Diary / Memory Design Review

Repo:

`C:\Users\yuuve\CascadeProjects`

Primary file to review:

- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`

Related implementation context:

- `lunaria-app/app/api/diary/route.ts`
- `lunaria-app/lib/lunaria/diary.ts`
- `lunaria-app/app/api/messages/route.ts`
- `lunaria-app/supabase/migrations/004_lunaria_diary.sql`
- `lunaria-app/lib/lunaria/memory.ts`
- `lunaria/PROFILE_MEMORY_INTEGRATION.md`

## Goal

Review the proposed AI diary and memory browsing design before implementation.

The feature is **not the current top priority**. Gacha DB stabilization still comes first. This review is to preserve product direction and avoid building the wrong memory surface later.

## Please Review

1. Whether the diary concept feels Lunaria-like:
   - "a shelf where Luna keeps the days"
   - warm, selective, not a raw surveillance log

2. Whether the proposed split is correct:
   - Daily diary
   - Exact conversation transcript
   - Long-term memory changes

3. Whether the daily summary fields are enough:
   - `title`
   - `summary`
   - `user_day`
   - `talked_about`
   - `emotions`
   - `luna_comment`
   - `unresolved_issues`
   - `next_topics`
   - `memory_changes`
   - `importance`

4. Whether memory provenance needs stronger rules:
   - what was remembered
   - when
   - why
   - source message/date
   - confidence
   - delete/correct UX

5. Whether the implementation phases are in the right order:
   - D1 read-only diary page
   - D2 date-filtered messages
   - D3 generate-on-demand
   - D4 memory change surface

6. Risks:
   - privacy discomfort
   - over-inference about "what the user did"
   - diary sounding too clinical
   - raw transcript feeling too exposed
   - JST date bugs

## Output

Create:

- `lunaria/LUNARIA_DIARY_MEMORY_REVIEW.md`

Please include:

1. Overall verdict
2. Must-fix before implementation
3. Nice-to-have improvements
4. Suggested final diary schema v1
5. UX copy suggestions in Luna's tone
6. Implementation caution notes for Codex

Do not edit code.
Do not create migrations.

