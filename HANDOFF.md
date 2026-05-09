# HANDOFF.md

Created: 2026-05-09
Status: initial handoff after applying AI_DEV_OS templates to the active Lunaria project

## Current State

Repository root:

```text
C:\Users\yuuve\CascadeProjects
```

Active app:

```text
C:\Users\yuuve\CascadeProjects\lunaria-app
```

Active docs:

```text
C:\Users\yuuve\CascadeProjects\lunaria
```

AI_DEV_OS source:

```text
C:\Users\yuuve\CascadeProjects\ai-dev-os\AI_DEV_OS
```

AI_DEV_OS `PROJECT_TEMPLATE` files have been copied to the repository root:

- `SPEC.md`
- `PROGRESS.md`
- `DECISIONS.md`
- `TASKS.md`
- `SECURITY.md`
- `REVIEW_LOG.md`
- `RELEASE_CHECKLIST.md`
- `HANDOFF.md`

This handoff describes the active Lunaria project, not every project folder in the monorepo.

## Recent Changes

- Root-level AI_DEV_OS templates were added.
- `SPEC.md`, `PROGRESS.md`, `TASKS.md`, and `HANDOFF.md` were initialized from existing code/docs.
- No application code was intentionally changed as part of this AI_DEV_OS application.
- No DB migration was intentionally changed as part of this AI_DEV_OS application.
- `/gacha` HTTP 500 was investigated and resolved. It was caused by a stale/corrupt `.next` dev cache, not by gacha business logic.
- Remaining doc backlog was triaged. `lunaria-app/docs/` is deferred source material; `lunaria/LUNARIA_REACTION_MVP_SPEC.md` is the current reaction MVP source of truth.
- `lunaria-app/lib/lunaria/reactions.ts` now provides reaction IDs, context mapping, and fallback path helpers without changing runtime UI/API behavior.
- `lunaria-app/components/lunaria/LunariaPortrait.tsx` now provides a safe placeholder portrait component.
- `/gacha` result modal now uses `LunariaPortrait` as the first AI_DEV_OS low-risk trial implementation.
- AI_DEV_OS trial records live under `lunaria/AI_DEV_OS_TRIAL_PLAN.md`, `lunaria/TASK_EVALUATION.md`, `lunaria/AI_ROUTING.md`, `lunaria/METRICS/`, and `lunaria/REPORTS/`.

## Existing Important Context

Read these first:

1. `SPEC.md`
2. `PROGRESS.md`
3. `TASKS.md`
4. `lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md`
5. `lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md`
6. `lunaria-app/package.json`
7. `lunaria-app/supabase/migrations/`

Important architecture rule:

```text
AI reply != diary != long-term memory != profile != character state != gacha event
```

## Current Git Caution

Before starting work, check:

```powershell
cd C:\Users\yuuve\CascadeProjects
git status --short --branch
```

Known uncommitted changes that existed before this AI_DEV_OS initialization:

- `lunaria/DIARY_UI_REVIEW_2026-05-04.md`
- `lunaria/MEMORY_VIEWER_NEXT_PHASE_PLAN.md`
- `lunaria-app/docs/`
- `lunaria/NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md`

Do not revert or overwrite these without explicit user approval.

## Next Recommended Work

1. Confirm Supabase migration application state for `014` through `019`.
2. Verify `/memory` candidate review actions with real candidate rows.
3. Continue memory governance restore/edit UX.
4. Confirm Supabase migration application state for `014` through `019`.

## Verification Commands

Use from `lunaria-app/`:

```powershell
npm run build
npm run gacha:smoke
npm run gacha:verify
npm run supabase:verify
npm run gacha:report
```

Notes:

- `npm run build` passed after memory candidate action work.
- `npm run gacha:smoke` passes after clearing stale `.next`.
- If `.next` stale chunk errors appear (`Cannot find module './*.js'`), stop dev server, delete `.next`, rebuild, and restart dev server.

## Assumptions

- Human is final decision maker.
- AI agents should propose, implement, review, and document; they should not silently change product scope.
- Markdown files are the shared async memory between Codex, Claude Code, Cursor, Gemini, and Copilot.
- For risky work, use separate implementation and review agents.

## Risks

- Multiple agents working at the same time can collide on docs and migrations.
- Supabase SQL Editor state can diverge from Git migration state.
- Root-level AI_DEV_OS docs may be mistaken as applying to every folder. For now, they apply to current Lunaria work.
- Existing docs may include older assumptions; prefer latest merged code plus architecture principles when conflicts appear.

## Prompt For Next Agent

```text
You are working in C:\Users\yuuve\CascadeProjects.
This is a multi-project repository, but the current active project is Lunaria:
- app: lunaria-app/
- docs: lunaria/

First read:
- SPEC.md
- PROGRESS.md
- TASKS.md
- HANDOFF.md
- lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md
- lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md

Do not edit implementation yet unless explicitly asked.
Check git status before changing files.
Do not revert existing uncommitted changes.
Use Markdown files for handoff notes.
```

## Claude Intake Completed

Claude's visual/items handoff has been reviewed and accepted as a mock/design layer:

- `lunaria-app/docs/` contains the current character, item, visual, brand, and DB proposal docs from Claude.
- `lunaria-app/app/items/page.tsx` is a mock-only item catalog page.
- `lunaria-app/app/character/page.tsx` is a mock-only character state preview page.
- `lunaria-app/components/character/LunariaPortrait.tsx` is a second portrait placeholder component for the character preview area.
- Existing `/`, `/diary`, `/memory`, `/gacha`, and `/admin/gacha` behavior was not changed by this intake.

Verification:

- `npm run build`: passed.
- `npx tsc --noEmit -p tsconfig.mocks.json --pretty false`: passed.
- `npx tsc --noEmit --pretty false`: passed.

Residual cautions:

- There are now two portrait components: `components/lunaria/LunariaPortrait.tsx` for the earlier reaction foundation, and `components/character/LunariaPortrait.tsx` for Claude's mock character preview. Consolidate later, not during intake.
- `/items` and `/character` must remain clearly marked as mock until `character_states` and `user_items` are implemented.

## 2026-05-09 Migration Candidate Addendum

New candidate migrations exist but are not applied:

- `lunaria-app/supabase/migrations/020_user_items.sql`
- `lunaria-app/supabase/migrations/021_character_states.sql`

Use them as review material for the next DB step. They intentionally adapt Claude's design docs to the current real schema by referencing `lunaria_gacha_pool` instead of a not-yet-existing `lunaria_items` table.

Stop before applying if:

- Supabase `014` through `019` are not confirmed applied.
- Any production DB target is involved.
- RLS policy behavior has not been reviewed.

Verification note: if `npx tsc --noEmit --pretty false` reports missing `.next/types` files after a successful `next build`, remove ignored `lunaria-app/tsconfig.tsbuildinfo` and rerun. This is a local TypeScript incremental cache issue, not a source change.
