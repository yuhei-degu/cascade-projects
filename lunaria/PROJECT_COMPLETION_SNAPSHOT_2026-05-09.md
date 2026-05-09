# Lunaria Completion Snapshot

Date: 2026-05-09
Owner: Codex 5.5
Mode: AI_DEV_OS / Solo Developer Fast Mode
Scope: `lunaria/` docs + `lunaria-app/` implementation

## Executive Summary

Lunaria is past the toy prototype stage. The app already has working foundations for chat, diary, memory, gacha, visual placeholders, and AI-agent handoff operations.

Estimated state:

| Target | Estimated Done | Estimated Remaining | Meaning |
|---|---:|---:|---|
| Local MVP / Private Alpha | 66% | 34% | Usable locally, core loops exist, diary/memory UI is clearer, but DB verification and restore/edit implementation remain |
| Public Beta | 40% | 60% | Needs auth/profile hardening, production deployment flow, stronger UX, and migration confidence |
| Full Life-log OS Vision | 18% | 82% | Long-term vision includes Live2D, life_events, integrations, profiles, external apps, monetization |

These percentages are planning estimates, not exact engineering metrics. They are weighted by product risk, not just file count.

## Area Breakdown

| Area | Done | Remaining | Status | Notes |
|---|---:|---:|---|---|
| AI_DEV_OS operation | 70% | 30% | Active | Templates, task board, metrics, handoff, lessons learned exist. Needs ongoing cleanup and routine use. |
| Chat core | 70% | 30% | Functional | Chat route and prompt foundation exist. AssistantReply schema integration remains. |
| Diary | 64% | 36% | Functional and clearer | Must-A/B/C UI polish is done. Edit/delete/regenerate hardening and memory source handling remain. |
| Memory governance | 52% | 48% | Foundation present | Candidate review APIs/UI exist and copy is clearer. Needs real-data verification and restore/edit implementation. |
| Gacha / Moonbox | 68% | 32% | Mostly functional locally | Gacha draw, inventory, admin, pity candidate design, reports exist. Needs migration-state verification and item integration. |
| Character items/state | 38% | 62% | Staged | Mock UI, docs, migration candidates, read APIs, fallback pages exist. Needs Supabase apply, verification, equip writes. |
| Visual expression / portrait | 34% | 66% | Prototype | Placeholder components and shared visual-state types exist. Needs schema unification, assets, final reaction-to-view wiring. |
| User profile / personality tuning | 18% | 82% | Design-heavy | Product direction exists. Needs schema, UI, prompt injection rules, privacy review. |
| life_events / external integrations | 8% | 92% | Deferred | Architecture direction exists. No implementation yet. |
| Production readiness | 25% | 75% | Deferred by current constraints | Build checks exist. Vercel/free-plan and Supabase apply flow remain gated. |
| Monetization / Stripe | 0% | 100% | Deferred | Correctly not started. High-risk future work. |
| End-world game loop | 5% | 95% | Deferred | Rough concept only. Should wait until diary/memory/character are steadier. |

## Current Work Buckets

### Bucket A: Human-gated / Stop Before Action

These should not be auto-run by Codex without explicit human action or confirmation.

| Task | Why It Is Gated | Next Safe Step |
|---|---|---|
| Confirm Supabase migrations `014`-`019` | Requires actual Supabase project state | Human runs SQL/checks; Codex can read pasted results |
| Apply `020_user_items.sql` / `021_character_states.sql` | DB schema change | Use existing runbook; apply only after review and DB state confirmation |
| Production Vercel deploy | Deployment + plan constraints | Defer for now |
| Stripe/live payments | High financial/security risk | Defer |
| User data deletion or irreversible cleanup | Data-loss risk | Requires explicit approval |

### Bucket B: Codex Can Continue Autonomously

| Task | Risk | Value | Suggested Next Action |
|---|---|---|---|
| Clean task/status docs | Low | High | Keep TASKS, PROGRESS, HANDOFF, metrics synchronized |
| Improve `/items` and `/character` fallback UX | Low-Medium | Medium | Add clearer empty/error states and source indicators |
| AssistantReply schema planning | Medium | High | Write integration plan before touching chat output |
| Memory restore/edit design | Medium | High | Create API/UI design doc and risk review before implementation |
| Diary UI review follow-up | Medium | High | Implement Must-A/B/C only after checking current diary code |
| Consolidate duplicate portrait components | Medium | Medium | Plan first; do not refactor blindly |

### Bucket C: Claude/Cursor/Gemini-Friendly Tasks

| Task | Best Agent | Prompt Size | Notes |
|---|---|---:|---|
| UX copy review for `/memory` governance | Claude | Medium | Non-code or low-code; good for tone/safety review |
| AssistantReply schema integration review | Claude/Gemini | Medium | Ask for risks before Codex implements |
| Diary UI Must-A/B/C checklist extraction | Claude | Small | Convert review doc into exact acceptance criteria |
| Character item flavor/copy refinement | Claude | Medium | No DB needed |
| Production readiness checklist review | Gemini/Claude | Medium | Good external review task |

## Private Alpha Exit Criteria

Private Alpha means the user can run Lunaria locally and use the major loops without frequent agent rescue.

Required remaining work:

| Requirement | Current State | Remaining |
|---|---|---|
| App builds cleanly | Done | Keep checking after each change |
| Chat works | Mostly done | Verify current happy path periodically |
| Diary works | Partial | Fix priority diary UI/behavior items |
| Memory candidate flow works with real DB | Partial | Confirm migrations and test approve/archive/reject |
| Gacha works locally | Mostly done | Confirm DB state and admin/report checks |
| Items/character pages do not break | Done | Apply DB migrations later and verify source switches |
| User-visible safety/control | Partial | Restore/edit memory UX and copy |
| Handoff docs reflect reality | Improving | Continue AI_DEV_OS metrics and progress updates |

Estimated Private Alpha remaining: about 34%.

## Public Beta Exit Criteria

Public Beta means a non-developer user can safely use the app without direct local intervention.

Major remaining work:

- Real auth/profile handling instead of fixed dev user assumptions.
- Production Supabase migration confidence and rollback notes.
- Vercel deployment strategy that fits plan constraints.
- Stronger error states, empty states, and mobile polish.
- Privacy/security review for diary, memory, profile, and logs.
- Basic observability and support runbook.
- Clear onboarding and data-control UI.

Estimated Public Beta remaining: about 60%.

## Recommended Next Sequence

1. Finish documentation consistency and completion tracking. Status: this snapshot.
2. Review current `/diary` implementation against existing diary UI review docs.
3. Implement only low/medium-risk diary UI fixes that do not touch DB schema.
4. Prepare a memory restore/edit design doc before coding writes.
5. When human is ready, confirm Supabase `014`-`019`, then apply/verify `020/021` using the runbook.
6. After `020/021`, convert `/items` and `/character` from fallback mode to verified DB mode.

## Notes For Future Agents

- Do not treat Full Life-log OS remaining percentage as failure. The product intentionally starts with a smaller AI diary/companion core.
- The most valuable near-term progress is not adding more features; it is making diary, memory, gacha, and character state reliable and understandable.
- Avoid mixing AI reply, diary, memory, character state, and gacha event data.
