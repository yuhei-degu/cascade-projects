# Lunaria AI_DEV_OS Experiment Log

Date: 2026-05-09
Purpose: Measure whether AI_DEV_OS improves Lunaria development speed, safety, and handoff quality.

## Metric Definitions

| Field | Meaning | Example |
|---|---|---|
| Task ID | ID from `lunaria/TASK_EVALUATION.md` | `LUN-REA-001` |
| Date | Work date | `2026-05-09` |
| Owner AI | Main executor | `Codex 5.5` |
| Reviewer AI | Reviewer or self-review | `Codex self-review` |
| Task Type | docs / ui / api / db / security / release | `ui` |
| Difficulty | Low / Medium / High / Critical | `Low` |
| Risk | Low / Medium / High / Critical | `Low` |
| Human Approval | Yes / No / Conditional | `No` |
| Wait | Human decision wait time | `0m` |
| Elapsed | Rough work time | `~25m` |
| Files | Number of changed files | `5` |
| Build | Build result | `Yes` / `No` / `N/A` |
| Typecheck | Typecheck result | `Yes` / `No` / `N/A` |
| Smoke | Smoke/manual check result | `Yes` / `No` / `N/A` |
| Rework | Rework count | `0` |
| Blockers | Blocker count | `0` |
| Context Repeated | How many times context had to be restated | `0` |
| Outcome | Done / Deferred / Blocked / Reverted | `Done` |
| PR URL | GitHub PR or branch link | optional |
| Notes | Short result summary | `DB untouched` |

## Experiment Entries

| Task ID | Date | Owner AI | Reviewer AI | Task Type | Difficulty | Risk | Human Approval | Wait | Elapsed | Files | Build | Typecheck | Smoke | Rework | Blockers | Context Repeated | Outcome | PR URL | Notes |
|---|---|---|---|---|---:|---:|---|---:|---:|---:|---|---|---|---:|---:|---:|---|---|---|
| LUN-AI-001 | 2026-05-09 | Codex 5.5 | Human skim | docs | Low | Low | No | 0m | ~20m | 8 | N/A | N/A | N/A | 0 | 0 | 0 | Done |  | AI_DEV_OS trial files created |
| LUN-REA-001 | 2026-05-09 | Codex 5.5 | Codex self-review | ui | Low | Low | No | 0m | ~25m | 5 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | `/gacha` result modal uses `LunariaPortrait`; DB/env/auth untouched |
| LUN-CLAUDE-001 | 2026-05-09 | Codex 5.5 | Codex self-review | docs+mock-ui | Medium | Medium | No | 0m | ~45m | 30 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Claude handoff accepted; `/items` and `/character` mock layer recorded; DB/env/auth/prod untouched |
| LUN-DB-020-021 | 2026-05-09 | Codex 5.5 | Codex self-review | db-design | Medium | High | Yes before apply | 0m | ~40m | 8 | Yes | Yes | N/A | 0 | 0 | 0 | Review |  | Candidate migrations created only; Supabase not touched |
| LUN-DB-RUNBOOK-020-021 | 2026-05-09 | Codex 5.5 | Codex self-review | ops-docs | Low | Medium | No | 0m | ~30m | 7 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Runbook/security review/scripts added; DB untouched |
| LUN-CHAR-API-001 | 2026-05-09 | Codex 5.5 | Codex self-review | api+ui | Medium | Medium | No | 0m | ~45m | 8 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | `/items` and `/character` use DB-aware read APIs with safe fallback; DB untouched |
| LUN-STATUS-001 | 2026-05-09 | Codex 5.5 | Codex self-review | planning-docs | Low | Low | No | 0m | ~25m | 4 | N/A | N/A | N/A | 0 | 0 | 0 | Done |  | Added completion snapshot and rewrote task evaluation in readable ASCII; no app code touched |

| LUN-DIA-001 | 2026-05-09 | Codex 5.5 | Codex self-review | planning-docs | Low | Low | No | 0m | ~20m | 2 | N/A | N/A | N/A | 0 | 0 | 0 | Done |  | Extracted diary UI Must-A/B/C into an implementation checklist; no app code touched |

| LUN-DIA-002 | 2026-05-09 | Codex 5.5 | Codex self-review | ui | Medium | Medium | No | 0m | ~45m | 4 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Implemented diary Must-A/B/C UI fixes; DB/API/env untouched |

| LUN-BATCH-003 | 2026-05-09 | Codex 5.5 | Codex self-review | ui+planning-docs | Medium | Medium | No | 0m | ~60m | 8 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Memory UI copy stabilized; restore/edit, AssistantReply, and portrait consolidation plans added; DB/API/env untouched |

| LUN-ASSIST-002 | 2026-05-09 | Codex 5.5 | Codex self-review | lib | Low | Low | No | 0m | ~20m | 4 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Added AssistantReply parser and shared visual-state types; no runtime chat changes |

| LUN-BATCH-004 | 2026-05-09 | Codex 5.5 | Codex self-review | ui+refactor | Medium | Medium | No | 0m | ~50m | 5 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Candidate restore UI and portrait mock cleanup; DB/API/env untouched |

| LUN-MEM-003 | 2026-05-09 | Codex 5.5 | Codex self-review | api+ui | High | Medium | Conditional | 0m | ~45m | 4 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Core memory confirm/archive/restore/edit added through guarded API/UI; no hard delete, no schema/env/prod changes |

| LUN-ASSIST-001 | 2026-05-09 | Codex 5.5 | Codex self-review | api | Medium | Medium | No | 0m | ~30m | 4 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Chat final output parses AssistantReply and emits optional `assistantMeta`; text reply contract preserved |

## Trial Notes

- Task scope is clearer when each work item has risk, owner, and stop conditions.
- The largest current bottleneck is not code volume; it is DB-state confidence and memory governance policy.
- Next.js `next build` and standalone `tsc --noEmit` should run sequentially in this repo to avoid generated `.next/types` races.
- ASCII-heavy shared docs are safer for multi-agent handoff on this Windows workspace.

## Questions To Revisit

- Should metrics be recorded per commit, per task, or per PR?
- Which fields create useful signal versus documentation overhead?
- Does Solo Developer Fast Mode reduce human wait time without increasing rework?
