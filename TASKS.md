# TASKS.md

Created: 2026-05-09
Status: initial AI_DEV_OS task board for active Lunaria development

## Priority Legend

- P0: blocks local development or can cause data loss/security issue.
- P1: important for completing the current MVP safely.
- P2: useful product polish or next-phase foundation.
- P3: deferred expansion.

## Task Board

| Priority | Task | Owner AI | Status | Dependencies | Done When |
|---|---|---|---|---|---|
| P0 | Investigate `/gacha` HTTP 500 on localhost | Implement Agent | DONE | Local dev server/logs | Cause identified as stale `.next` dev cache; `.next` rebuilt; `npm run gacha:smoke` passes |
| P0 | Review remaining uncommitted docs and classify them | Review Agent | DONE | Current git status | `lunaria/DOC_TRIAGE_2026-05-09.md` classifies accepted docs and defers `lunaria-app/docs/` |
| P1 | Confirm Supabase migration state `014` through `019` | Ops Agent | TODO | Supabase SQL Editor access | `supabase:verify`, `gacha:verify`, and relevant smoke checks match expected DB state |
| P1 | Verify memory candidate review actions with real data | Implement Agent | TODO | Migration `019` applied | Candidate can be approved to confirmed core memory, archived, and rejected without errors |
| P1 | Add memory governance restore path for archived candidates/core memories | Implement Agent | TODO | Current memory APIs | User can restore accidentally archived items from UI |
| P1 | Add review log for memory candidate behavior | Review Agent | TODO | Memory candidate verification | `REVIEW_LOG.md` includes findings, risks, and next actions |
| P2 | Add `lib/lunaria/reactions.ts` foundation | Tech Lead + Implement Agent | DONE | `lunaria/LUNARIA_REACTION_MVP_SPEC.md` | Reaction IDs, context mapping, and fallback order are centralized without changing chat behavior; build passes |
| P2 | Add `LunariaPortrait` placeholder component | Implement Agent | DONE | Reaction foundation | Component can consume reaction/outfit IDs and falls back to a CSS placeholder when portrait assets are missing; build passes |
| P2 | Design minimal `character_state` schema | Tech Lead Agent | TODO | Reaction foundation decision | Design doc exists; migration is not created until reviewed |
| P2 | Add migration candidates for user items and character states | Codex 5.5 | DONE | Claude DB docs + current migrations | `020_user_items.sql` and `021_character_states.sql` exist as additive candidates; not applied to Supabase |
| P1 | Review migration candidates `020` / `021` before Supabase apply | Security + Review Agent | TODO | `020_user_items.sql`, `021_character_states.sql` | RLS, backfill, dependency order, and rollback notes are approved before SQL Editor use |
| P2 | Draft `user_communication_profiles` design | Tech Lead + Security Agent | TODO | Memory/profile docs | Design separates style preferences from core memory and avoids sensitive over-inference |
| P2 | Improve `/memory` UX copy after real use | UX Agent | TODO | Candidate review verification | Copy makes user control clear and avoids surveillance feeling |
| P2 | Wire `LunariaPortrait` into one low-risk surface | Implement + UX Agent | DONE | Placeholder component | `/gacha` result modal uses the portrait component without requiring final art assets or changing chat response format; build passes |
| P2 | Intake Claude visual/items mock UI and docs | Codex 5.5 | DONE | Claude handoff summary | `lunaria-app/docs/`, `/items`, `/character`, and `components/character/LunariaPortrait.tsx` are reviewed, verified, and recorded; build/typecheck pass |
| P2 | Update root `DECISIONS.md` with current AI_DEV_OS adoption decision | PM Agent | TODO | This initialization | Decision entry explains why AI_DEV_OS was applied and its scope |
| P3 | End-world game MVP scope doc | PM/UX Agent | DEFERRED | Core diary/memory/character stable | Scope is cut to a future weekly text MVP; no implementation started |
| P3 | Live2D / 3D asset pipeline | Tech Lead Agent | DEFERRED | Reaction layer stable | Pipeline proposal exists with cost/risk notes |
| P3 | Stripe/payment readiness | Security + Release Agent | DEFERRED | Product monetization decision | Stripe checklist and env separation are ready before any payment code |

## Small-Fix Flow

Use for typo, copy, tiny UI adjustment, or small API bug:

1. Read `SPEC.md`, `PROGRESS.md`, and relevant source file.
2. State assumptions in the PR/commit message or `HANDOFF.md` if needed.
3. Change only the minimal files.
4. Run the smallest relevant check.
5. Update `PROGRESS.md` if user-facing state changed.

## Large-Feature Flow

Use for memory, diary, gacha, character state, DB, auth, payment, or release work:

1. PM Agent clarifies scope in `SPEC.md` or feature doc.
2. Tech Lead Agent writes design and risks.
3. Implement Agent changes code only after design is clear.
4. Review Agent checks behavior/regression risk.
5. Security Agent checks data, auth, RLS, logging, and secrets.
6. Release Agent checks deployment/migration order.
7. Human approves final direction.
8. Update `DECISIONS.md`, `PROGRESS.md`, and `HANDOFF.md`.

## Assumptions

- Tasks are for the active Lunaria project unless explicitly marked as monorepo/global.
- Claude/Codex/Cursor/Gemini should coordinate through Markdown files, not hidden chat context.
- Review and implementation should be separated when risk is non-trivial.

## Risks

- Running implementation before classifying existing uncommitted docs may mix unrelated work.
- DB verification depends on actual Supabase project state, not just migration files.
- `/gacha` 500 may be local server/cache state, DB mismatch, or a real app bug; do not assume until logs are read.
