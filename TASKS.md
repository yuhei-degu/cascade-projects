# TASKS.md

Created: 2026-05-09
Status: AI_DEV_OS task board for active Lunaria development

## Priority Legend

- P0: Blocks local development or can cause data loss/security issues.
- P1: Important for completing the current MVP safely.
- P2: Useful product polish or next-phase foundation.
- P3: Deferred expansion.

## Task Board

| Priority | Task | Owner AI | Status | Dependencies | Done When |
|---|---|---|---|---|---|
| P0 | Investigate `/gacha` HTTP 500 on localhost | Implement Agent | DONE | Local dev server/logs | Cause identified as stale `.next` dev cache; `.next` rebuilt; `npm run gacha:smoke` passes |
| P0 | Review remaining uncommitted docs and classify them | Review Agent | DONE | Current git status | `lunaria/DOC_TRIAGE_2026-05-09.md` classifies accepted docs and defers `lunaria-app/docs/` |
| P1 | Confirm Supabase migration state `014` through `019` | Human + Ops Agent | TODO | Supabase SQL Editor access | `supabase:verify`, `gacha:verify`, and relevant smoke checks match expected DB state |
| P1 | Verify memory candidate review actions with real data | Implement Agent | TODO | Migration `019` applied | Candidate can be approved to confirmed core memory, archived, and rejected without errors |
| P1 | Add memory governance restore path for archived candidates/core memories | Implement Agent | PARTIAL | Current memory APIs | Candidate restore UI is implemented using existing `pending` action; core memory restore/edit remains design-ready |
| P1 | Add memory candidate restore UI | Codex 5.5 | DONE | Existing candidate PATCH `pending` action | `/memory` can filter archived/rejected/merged/all candidates and restore archived/rejected candidates to review |
| P1 | Add review log for memory candidate behavior | Review Agent | TODO | Memory candidate verification | `REVIEW_LOG.md` includes findings, risks, and next actions |
| P1 | Review migration candidates `020` / `021` before Supabase apply | Security + Review Agent | TODO | `020_user_items.sql`, `021_character_states.sql` | RLS, backfill, dependency order, and rollback notes are approved before SQL Editor use |
| P2 | Add `lib/lunaria/reactions.ts` foundation | Tech Lead + Implement Agent | DONE | `lunaria/LUNARIA_REACTION_MVP_SPEC.md` | Reaction IDs, context mapping, and fallback order are centralized without changing chat behavior; build passes |
| P2 | Add `LunariaPortrait` placeholder component | Implement Agent | DONE | Reaction foundation | Component can consume reaction/outfit IDs and falls back to a CSS placeholder when portrait assets are missing; build passes |
| P2 | Wire `LunariaPortrait` into one low-risk surface | Implement + UX Agent | DONE | Placeholder component | `/gacha` result modal uses the portrait component without requiring final art assets or changing chat response format; build passes |
| P2 | Intake Claude visual/items mock UI and docs | Codex 5.5 | DONE | Claude handoff summary | `lunaria-app/docs/`, `/items`, `/character`, and `components/character/LunariaPortrait.tsx` are reviewed, verified, and recorded; build/typecheck pass |
| P2 | Add migration candidates for user items and character states | Codex 5.5 | DONE | Claude DB docs + current migrations | `020_user_items.sql` and `021_character_states.sql` exist as additive candidates; not applied to Supabase |
| P2 | Add `020/021` apply runbook and verification scripts | Codex 5.5 | DONE | Migration candidates | Runbook, security review, SQL bundle generator, and read-only verifier exist |
| P2 | Wire `/items` and `/character` to DB-aware read APIs with fallback | Codex 5.5 | DONE | `020/021` migration candidates | Pages prefer DB data when available and fall back safely before migrations are applied |
| P2 | Update root `DECISIONS.md` with current AI_DEV_OS adoption decision | PM Agent | DONE | This initialization | Decision entry explains why AI_DEV_OS was applied and its scope |
| P2 | Add whole-project completion snapshot and percent remaining view | Codex 5.5 | DONE | Current task board and progress docs | `lunaria/PROJECT_COMPLETION_SNAPSHOT_2026-05-09.md` explains remaining work by area |
| P2 | Draft `user_communication_profiles` design | Tech Lead + Security Agent | TODO | Memory/profile docs | Design separates style preferences from core memory and avoids sensitive over-inference |
| P2 | Improve `/memory` UX copy after real use | UX Agent | DONE | Candidate review verification | `/memory` copy is readable ASCII and clarifies diary vs memory vs candidates |
| P2 | Stabilize `/memory` copy and readable states | Codex 5.5 | DONE | Current memory page | Page text is readable and existing candidate actions remain unchanged |
| P2 | Extract diary UI Must-A/B/C acceptance checklist | Claude Code or Codex | DONE | `lunaria/DIARY_UI_REVIEW_2026-05-04.md` | `lunaria/DIARY_UI_ACCEPTANCE_CHECKLIST_2026-05-09.md` defines exact acceptance criteria before implementation |
| P2 | Implement diary UI Must-A/B/C fixes | Codex 5.5 | DONE | Diary checklist | `/diary` hides memory candidates/source conversation by default and moves raw stats into technical details; build/typecheck pass |
| P2 | Plan AssistantReply schema integration | Claude/Gemini + Codex | DONE | `lunaria-app/docs/ASSISTANT_REPLY_SCHEMA.md` | `lunaria/ASSISTANT_REPLY_INTEGRATION_PLAN_2026-05-09.md` defines staged parser-first rollout |
| P2 | Add AssistantReply parser foundation | Codex 5.5 | DONE | AssistantReply integration plan | `lib/lunaria/assistant-reply.ts` parses structured replies with raw-text fallback and does not change chat behavior |
| P2 | Consolidate duplicate portrait component strategy | Tech Lead Agent | DONE | Existing two portrait components | `lunaria/PORTRAIT_COMPONENT_CONSOLIDATION_PLAN_2026-05-09.md` recommends short-term separation and staged consolidation |
| P2 | Add shared visual-state types | Codex 5.5 | DONE | Portrait consolidation plan | `lib/lunaria/visual-state.ts` defines expression/motion unions for future component consolidation |
| P2 | Clean character portrait mock component | Codex 5.5 | DONE | Portrait consolidation plan | `components/character/LunariaPortrait.tsx` uses shared visual-state types and no longer contains mojibake comments |
| P3 | End-world game MVP scope doc | PM/UX Agent | DEFERRED | Core diary/memory/character stable | Scope is cut to a future weekly text MVP; no implementation started |
| P3 | Live2D / 3D asset pipeline | Tech Lead Agent | DEFERRED | Reaction layer stable | Pipeline proposal exists with cost/risk notes |
| P3 | Stripe/payment readiness | Security + Release Agent | DEFERRED | Product monetization decision | Stripe checklist and env separation are ready before any payment code |
| P3 | `life_events` implementation | Tech Lead + Security Agent | DEFERRED | Core diary/memory stable | Event architecture is designed before external integrations |

## Recommended Next Autonomous Work

1. Review current `/diary` implementation against existing diary UI review docs.
2. Implement only low/medium-risk diary UI fixes that do not touch DB schema.
3. Prepare memory restore/edit design before adding write behavior.
4. Plan AssistantReply schema integration before changing chat response contracts.

## Human-Gated Work

- Confirm Supabase migration state `014` through `019`.
- Apply `020_user_items.sql` and `021_character_states.sql`.
- Production deploy.
- Stripe/live payments.
- Irreversible user data deletion.

## Working Rules

- Check `git status --short` before changing files.
- Do not revert unrelated changes.
- Medium-risk tasks may proceed in Solo Developer Fast Mode if they avoid production DB, deploy, Stripe, secrets, irreversible migrations, and user data deletion.
- Use Markdown files for Codex/Claude/Cursor/Gemini handoff.
- Run relevant verification after implementation changes.
