# Lunaria AI_DEV_OS Experiment Log

作成日: 2026-05-09

## 目的

AI_DEV_OS の試験導入によって、Lunaria 開発の効率・安全性・引き継ぎ品質が改善するかを測る。

## 記録単位

原則として、1タスクまたは1PRごとに1行記録する。

## Metrics

| 項目 | 説明 | 記録例 |
|---|---|---|
| Task ID | `TASK_EVALUATION.md` の ID | `LUN-REA-001` |
| Date | 作業日 | `2026-05-09` |
| Owner AI | 主担当 AI | `Codex` |
| Reviewer AI | レビュー担当 AI | `Claude Code` / `Codex self-review` |
| Task Type | docs / ui / api / db / security / release | `ui` |
| Difficulty | Low / Medium / High / Critical | `Low` |
| Risk | Low / Medium / High / Critical | `Low` |
| Human Approval Required | Yes / No / Conditional | `No` |
| Human Approval Wait Time | 人間判断待ち時間 | `0m` |
| Start Time | 開始時刻 | `13:00` |
| End Time | 終了時刻 | `13:25` |
| Elapsed | 所要時間 | `25m` |
| Files Changed | 変更ファイル数 | `2` |
| Build Passed | Yes / No / N/A | `Yes` |
| Typecheck Passed | Yes / No / N/A | `Yes` |
| Test/Smoke Passed | Yes / No / N/A | `N/A` |
| Rework Count | 手戻り回数 | `0` |
| Blocker Count | ブロック数 | `0` |
| Context Repeated | 同じ説明を再入力した回数 | `0` |
| PR URL | GitHub PR | `https://...` |
| Outcome | Done / Deferred / Blocked / Reverted | `Done` |
| Notes | 補足 | `DB untouched` |

## Experiment Entries

| Task ID | Date | Owner AI | Reviewer AI | Task Type | Difficulty | Risk | Human Approval | Wait | Elapsed | Files | Build | Typecheck | Smoke | Rework | Blockers | Context Repeated | Outcome | PR URL | Notes |
|---|---|---|---|---|---:|---:|---|---:|---:|---:|---|---|---|---:|---:|---:|---|---|---|
| LUN-AI-001 | 2026-05-09 | Codex | Human skim | docs | Low | Low | No | 0m | ~20m | 8 | N/A | N/A | N/A | 0 | 0 | 0 | Done |  | AI_DEV_OS 記録ファイル作成 |
| LUN-REA-001 | 2026-05-09 | Codex | Codex self-review | ui | Low | Low | No | 0m | ~25m | 5 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | `/gacha` result modal now uses `LunariaPortrait`; DB/env/auth untouched |

## 2026-05-09 Trial Notes

- The trial made task scope clearer before implementation.
- `TASK_EVALUATION.md` helped pick a low-risk task that avoided DB, auth, env, payments, and production.
- The first implementation stayed small: one UI surface plus record updates.
- Build and typecheck gave fast objective verification.
- Visual confirmation is still a human task because "Lunariaらしさ" cannot be fully measured by tests.

## Daily Summary Template

```text
Date:
Completed Tasks:
Total Elapsed:
PRs:
Build Failures:
Typecheck Failures:
Human Decisions:
Rework:
Repeated Context:
Biggest Friction:
What Improved:
Next Experiment:
```

## 判断したいこと

- タスク開始前の迷いが減ったか。
- PR 単位が小さくなったか。
- Claude / Codex の役割分担が明確になったか。
- DB / 本番 / env などの危険作業で自然に止まれたか。
- 引き継ぎ時に読むファイルが明確になったか。
- 同じ説明を繰り返す回数が減ったか。

## Assumptions

- まずは手動記録で始める。
- 数日分溜まってから、記録項目を削るか増やす。

## Questions

- 記録粒度は「1PRごと」か「1タスクごと」か。
- 所要時間は厳密に測るか、概算でよいか。
| LUN-CLAUDE-001 | 2026-05-09 | Codex 5.5 | Codex self-review | docs+mock-ui | Medium | Medium | No | 0m | ~45m | 30 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Claude handoff accepted; `/items` and `/character` remain mock-only; DB/env/auth/prod untouched |
| LUN-DB-020-021 | 2026-05-09 | Codex 5.5 | Codex self-review | db-design | Medium | High | Yes before apply | 0m | ~40m | 8 | Yes | Yes | N/A | 0 | 0 | 0 | Review |  | Candidate migrations created only; Supabase not touched |
| LUN-DB-RUNBOOK-020-021 | 2026-05-09 | Codex 5.5 | Codex self-review | ops-docs | Low | Medium | No | 0m | ~30m | 7 | Yes | Yes | N/A | 0 | 0 | 0 | Done |  | Runbook/security review/scripts added; DB untouched |
