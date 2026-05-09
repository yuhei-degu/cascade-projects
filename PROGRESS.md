# PROGRESS.md

Created: 2026-05-09
Status: initial AI_DEV_OS progress snapshot for active Lunaria development

## Current State

The active project is Lunaria inside the `CascadeProjects` monorepo.

Current high-level state:

- GitHub root repo is active and synced with `origin/master` after recent PR merges.
- `lunaria-app` is a Next.js 15 app with Supabase-backed chat, diary, memory, and gacha features.
- `lunaria` contains product, design, migration, runbook, and Claude/Codex handoff documentation.
- AI_DEV_OS project templates have been copied into the repository root.

## Completed Recently

Recent merged work:

- Product strategy synthesis added:
  - `lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md`
  - `lunaria/CLAUDE_HANDOFF_TASKS_2026-05-09.md`
- Supabase memory candidate policy made safer for SQL Editor usage:
  - `019_memory_candidates.sql`
  - `014_019_lunaria_apply_bundle.sql`
- Memory candidate review actions added:
  - `PATCH /api/memory/candidates`
  - `/memory` buttons for `覚えてて`, `あとで見る`, `棚から外す`
- Build check passed after memory candidate action work:
  - `npm run build`
- `/gacha` localhost 500 was investigated and resolved:
  - Cause was stale/corrupt `.next` dev cache: `Cannot find module './828.js'`
  - Fixed by stopping the Next dev server, deleting `lunaria-app/.next`, rebuilding, and restarting dev
  - `npm run gacha:smoke` now passes
- Documentation backlog was triaged:
  - `lunaria/DOC_TRIAGE_2026-05-09.md` records accepted/deferred docs
  - `lunaria/LUNARIA_REACTION_MVP_SPEC.md` extracts the useful visual/expression/motion notes into a reaction-first MVP spec
- Reaction foundation was added:
  - `lunaria-app/lib/lunaria/reactions.ts` defines the MVP reaction IDs, context defaults, and portrait fallback path order
  - No UI, API, or DB behavior was changed yet
- Portrait placeholder was added:
  - `lunaria-app/components/lunaria/LunariaPortrait.tsx` can consume reaction/outfit IDs and show a CSS fallback when image assets are missing
  - It is not wired into any page yet, so existing UI behavior remains unchanged
- AI_DEV_OS trial started in Lunaria:
  - Trial records were added under `lunaria/`
  - The first low-risk trial task wired `LunariaPortrait` into the `/gacha` result modal
  - `npm run build` and `npx tsc --noEmit --pretty false` passed

Functional areas already present:

- Chat page and chat API.
- Diary page and diary APIs.
- Memory page, memory API, and memory candidate API.
- Gacha page, inventory page, admin gacha page, and gacha APIs.
- Supabase migration files `001` through `019`.
- Verification scripts for gacha, Supabase, smoke, reports, and SQL bundle generation.

## In Progress / Partially Done

- Memory governance MVP:
  - Candidate table and candidate review actions exist.
  - Need real-world/manual verification after migration `019` is applied in Supabase.
  - Need better approve/reject/restore UX and possibly inline edit later.

- Gacha / Moon Box:
  - Core implementation is present.
  - Latest smoke passes after clearing stale `.next` dev cache.
  - If `Cannot find module './*.js'` appears again, stop dev, remove `.next`, rebuild, and restart.

- Documentation integration:
  - Current root AI_DEV_OS docs are the source of truth for active tasks.
  - `lunaria-app/docs/` remains uncommitted as deferred source material and should not be treated as current status.

## Not Started / Deferred

- Full Live2D or 3D implementation.
- `character_state` migration and UI integration.
- `user_communication_profiles` design and implementation.
- `life_events` implementation.
- End-world weekly game implementation.
- Stripe/payment production flow.
- Production Vercel launch as a primary priority.

## Known Blocks / Cautions

- Supabase migrations may need manual SQL Editor application in order.
- Supabase CLI is not assumed to be available locally.
- Existing uncommitted changes before this AI_DEV_OS application:
  - `lunaria/DIARY_UI_REVIEW_2026-05-04.md`
  - `lunaria/MEMORY_VIEWER_NEXT_PHASE_PLAN.md`
  - `lunaria-app/docs/`
  - `lunaria/NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md`
- Do not overwrite or revert those without explicit review.
- `/gacha` HTTP 500 observed during smoke should be investigated before treating the app as fully green.

## Next To Do

Recommended next order:

1. Confirm Supabase migration state, especially `014` through `019`.
2. Verify memory candidate review actions against a real candidate row.
3. Continue memory governance UX: archive/restore/edit for core memories.
4. Confirm Supabase migration state, especially `014` through `019`.
5. Update `REVIEW_LOG.md` and `DECISIONS.md` after each review/decision cycle.

## Assumptions

- This progress file is repository-root coordination for Lunaria, not a replacement for detailed docs in `lunaria/`.
- Existing project docs remain authoritative for deep feature details.
- Future agents should read this file first, then `SPEC.md`, then `HANDOFF.md`.

## 2026-05-09 Claude Visual/Items Mock UI Intake

Claude's visual/items handoff has been reviewed and accepted as a mock/design layer.

Completed:
- `lunaria-app/docs/` now contains visual, item, brand, character, and DB design handoff docs.
- `/items` and `/character` are mock-only pages and do not touch DB/auth/env/production.
- `components/character/LunariaPortrait.tsx` is a separate mock portrait component for the new character preview area.
- Existing `/`, `/diary`, `/memory`, `/gacha`, and `/admin/gacha` behavior was not changed by this intake.

Verification:
- `npm run build`: passed.
- `npx tsc --noEmit -p tsconfig.mocks.json --pretty false`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- Secret/env pattern scan over the new docs and mock UI: no matches.

Next:
- Keep `/items` and `/character` clearly mock-only until `character_states` and `user_items` are implemented.
- Treat `lunaria-app/docs/DB_*.md` as design input, not applied migrations.
- Consolidate duplicate portrait components after the character-state path is fixed.
