# Lunaria Task Evaluation

Date: 2026-05-09
Owner: Codex 5.5
Mode: AI_DEV_OS / Solo Developer Fast Mode

## Purpose

This file classifies active Lunaria tasks by difficulty, risk, required AI level, review need, security need, and human approval need.

## Scale

| Field | Values |
|---|---|
| Difficulty | Low / Medium / High / Critical |
| Risk | Low / Medium / High / Critical |
| Suggested AI | Codex 5.5 / Claude Code / Gemini / Cursor / Human |
| Review Required | Yes / No |
| Security Review Required | Yes / No |
| Human Approval Required | Yes / Conditional / No |
| Task Size | Small / Medium / Large |
| Status | Todo / Doing / Review / Blocked / Done / Deferred |

## Active Evaluation

| ID | Task | Difficulty | Risk | Suggested AI | Review | Security | Human Approval | Size | Status | Reason |
|---|---|---:|---:|---|---|---|---|---|---|---|
| LUN-AI-001 | Create AI_DEV_OS trial files | Low | Low | Codex 5.5 | No | No | No | Small | Done | Documentation-only setup for operating the project with AI agents |
| LUN-REA-001 | Wire `LunariaPortrait` into `/gacha` result modal | Low | Low | Codex 5.5 | Yes | No | No | Small | Done | Low-risk UI integration; no DB/auth/env/prod changes |
| LUN-CLAUDE-001 | Intake Claude visual/items docs and mock UI | Medium | Medium | Codex 5.5 | Yes | No | No | Medium | Done | Reviewed docs/mock UI and accepted them into repo with build/typecheck passing |
| LUN-DB-020-021 | Create user_items and character_states migration candidates | Medium | High | Codex 5.5 | Yes | Yes | Yes before apply | Medium | Review | SQL candidates exist only; no Supabase apply; depends on `014`-`019` confirmation |
| LUN-DB-RUNBOOK-020-021 | Add runbook and verification support for `020/021` | Low | Medium | Codex 5.5 | Yes | Yes | No | Small | Done | Adds operator docs, SQL bundle generation, and read-only post-apply verifier |
| LUN-CHAR-API-001 | Add DB-aware read APIs for `/items` and `/character` with fallback | Medium | Medium | Codex 5.5 | Yes | No | No | Medium | Done | Read-only API/UI integration; no DB apply; fallback keeps current app usable |
| LUN-STATUS-001 | Add project completion snapshot and percent remaining view | Low | Low | Codex 5.5 | No | No | No | Small | Done | Planning/documentation only; improves prioritization and agent routing |
| LUN-OPS-001 | Confirm Supabase migration `014`-`019` applied state | Medium | High | Human + Ops Agent | Yes | Yes | Yes | Medium | Todo | Requires actual Supabase state, not just Git files |
| LUN-MEM-001 | Verify `/memory` candidate review actions with real data | Medium | Medium | Codex 5.5 | Yes | No | Conditional | Medium | Todo | Needs DB state ready and candidate rows to test approve/archive/reject |
| LUN-MEM-002 | Design memory restore/edit UX | Medium | Medium | Claude Code + Codex 5.5 | Yes | Yes | Yes | Medium | Done | Design doc exists; reversible actions prioritized and destructive deletion avoided |
| LUN-MEM-003 | Implement memory restore/edit UX | High | Medium | Codex 5.5 | Yes | Yes | Conditional | Large | Done | Core memory confirm/archive/restore/edit implemented through guarded API/UI; no hard delete |
| LUN-DIA-001 | Extract diary UI Must-A/B/C acceptance checklist | Low | Low | Claude Code | No | No | No | Small | Done | Acceptance checklist created |
| LUN-DIA-002 | Implement diary UI Must-A/B/C fixes | Medium | Medium | Codex 5.5 | Yes | No | No | Medium | Done | Limited UI changes shipped with build/typecheck passing |
| LUN-ASSIST-001 | Plan AssistantReply schema integration into chat path | Medium | Medium | Claude/Gemini + Codex 5.5 | Yes | No | Conditional | Medium | Done | Parser/types, integration plan, and guarded chat metadata response exist; current text reply contract unchanged |
| LUN-ASSIST-002 | Map AssistantReply metadata to chat portrait state | Medium | Medium | Codex 5.5 | Yes | No | No | Medium | Todo | Next step after metadata response; should not change persisted message format |
| LUN-CHAR-002 | Apply and verify `020/021` in Supabase | Medium | High | Human + Codex 5.5 | Yes | Yes | Yes | Medium | Blocked | Requires human DB action and migration state confirmation |
| LUN-CHAR-003 | Add equip/apply item writes for character state | High | High | Codex 5.5 | Yes | Yes | Yes | Large | Deferred | Should wait until `020/021` are applied and verified |
| LUN-PROF-001 | Design `user_communication_profiles` | High | High | Claude Code + Security Agent | Yes | Yes | Yes | Medium | Todo | Separates profile/style preferences from memory; privacy-sensitive |
| LUN-EVT-001 | Design and implement `life_events` | High | High | Claude Code + Gemini + Codex 5.5 | Yes | Yes | Yes | Large | Deferred | Core long-term architecture, but not needed before private alpha |
| LUN-PAY-001 | Stripe/payment readiness | Critical | Critical | Human + Security + Release | Yes | Yes | Yes | Large | Deferred | Financial and production risk; not current priority |
| LUN-LIVE-001 | Live2D / 3D asset pipeline | Critical | High | Human + Tech Lead | Yes | No | Yes | Large | Deferred | Requires asset creation and technical pipeline decisions |

## Current Blocked / Human Needed

| Task | Reason | Human Action |
|---|---|---|
| Supabase migration confirmation | Git migrations may not match actual DB | Confirm `014`-`019` state in Supabase |
| Applying `020/021` | DB schema change | Use runbook only after review and migration state confirmation |
| Production deployment | Vercel/free-plan constraint and production risk | Defer unless explicitly prioritized |
| Memory data deletion rules | User trust and data safety | Destructive deletion remains blocked; only archive/restore/edit are implemented |

## Next Low/Medium-Risk Codex Candidates

| Candidate | Why Next | Stop Conditions |
|---|---|---|
| Verify memory governance on real local DB rows | Confirms candidate + core memory control loop | Stop if Supabase schema is missing or production DB is involved |
| Chat portrait reaction from AssistantReply metadata | Makes structured reply visible without changing storage | Stop before changing persisted message format |
| Character item equip design | Needed before `/items` can affect `/character` | Stop before DB writes until `020/021` are applied |
| Portrait component consolidation follow-up | Reduces duplicate UI paths | Stop before broad refactor |

## Assumptions

- Medium risk tasks may proceed under Solo Developer Fast Mode if they do not touch production DB, deploy, Stripe, secrets, irreversible migrations, or user data deletion.
- Human remains final decision maker.
- Claude/Codex should coordinate through Markdown files rather than hidden chat context.
