# Promotion blocker: LUN-AUTO-128

Date: 2026-06-02

Decision: stop automatic promotion for `LUN-AUTO-128`.

## Reason

Automatic promotion is not safe. The reviewed worktree is not a clean file-level copy target anymore because the current source repo already has local changes on every path listed by the promotion report. Copying the reviewed or promotion worktree files would overwrite unrelated source-local Lunaria work.

Promotion report checked: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\REPORTS\PRODUCT_PROMOTION_REPORT.md`

Reviewed worktree checked: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\lun-auto-128-20260602-021956`

Promotion worktrees checked:

- `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\promote-merge-lun-auto-128-20260602-033356`
- `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\promote-merge-lun-auto-128-2-20260602-080355`

Current source repo checked: `C:\Users\yuuve\CascadeProjects\lunaria-app`

## Evidence

- `PRODUCT_PROMOTION_REPORT.md` reports `LUN-AUTO-128` as blocked and lists no promoted or already-identical files.
- Source repo HEAD is `ff99cf8` on `codex/ai-dev-orchestrator-claude-intake`.
- Source repo has local modifications on all tracked promotion targets: `app/api/chat/route.ts`, `lib/lunaria/assistant-reply.ts`, `lib/lunaria/date.ts`, `lib/lunaria/prompt-builder.ts`, `lib/lunaria/routing.ts`, `lib/lunaria/topic.ts`, and `package.json`.
- Source repo has untracked local files on all new-file promotion targets: `docs/LUNARIA_CONTINUOUS_IMPROVEMENT.md`, `lib/lunaria/conversation-polish.ts`, `scripts/auto-dev-guard.js`, `scripts/lunaria-chat-smoke.js`, and `scripts/lunaria-improvement-cycle.js`.
- Hash comparison across source, reviewed, and second promotion worktrees showed every target file differs; none can be treated as already integrated.
- The second promotion review `REV-PROMOTE-MERGE-LUN-AUTO-128-2` requested fixes for game-context routing before integration, so the latest promotion attempt is not an approved clean integration candidate.
- The current root-cause task has no allowed product paths listed, so there is no scoped path where an automatic merge can be applied safely.

## Required Resolution

Do not create another `PROMOTE-MERGE` task for `LUN-AUTO-128`.

Before any future integration, a human or explicitly scoped integration agent must first preserve or commit the current source-local Lunaria changes, then reconcile the reviewed conversation-quality changes file by file against the current source versions. In particular, the game-context deterministic reply blocker from `REV-PROMOTE-MERGE-LUN-AUTO-128-2` must be fixed before integration.
