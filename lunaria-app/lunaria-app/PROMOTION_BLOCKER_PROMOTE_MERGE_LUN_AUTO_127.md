# Promotion blocker: PROMOTE-MERGE-LUN-AUTO-127

Date: 2026-06-02

Decision: stop automatic promotion for `PROMOTE-MERGE-LUN-AUTO-127`.

## Reason

The reviewed promotion worktree is approved for integration, but the current source repo already has local changes on every target path listed in the promotion report. A safe automatic copy would overwrite or replace unrelated local work, including untracked source files with the same names as reviewed promotion files.

Promotion report checked: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\REPORTS\PRODUCT_PROMOTION_REPORT.md`

Reviewed worktree checked: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\promote-merge-lun-auto-127-20260601-193322`

Current source repo checked: `C:\Users\yuuve\CascadeProjects\lunaria-app`

## Blocked paths

- `app/api/chat/route.ts`: source has local modification; reviewed promotion differs.
- `lib/lunaria/assistant-reply.ts`: source has local modification; reviewed promotion differs.
- `lib/lunaria/topic.ts`: source has local modification; reviewed promotion differs.
- `package.json`: source has local modification; reviewed promotion differs.
- `docs/LUNARIA_CONTINUOUS_IMPROVEMENT.md`: source has untracked local file; reviewed promotion differs.
- `scripts/auto-dev-guard.js`: source has untracked local file; reviewed promotion differs.
- `scripts/conversation-casebook-check.js`: source has untracked local file; reviewed promotion differs.
- `scripts/conversation-cases.json`: source has untracked local file; reviewed promotion differs.
- `scripts/lunaria-chat-smoke.js`: source has untracked local file; reviewed promotion differs.
- `scripts/lunaria-improvement-cycle.js`: source has untracked local file; reviewed promotion differs.

## Verification notes

- `PRODUCT_PROMOTION_REPORT.md` reports `Status: blocked` and skipped all 10 paths because the target source repo has local changes.
- `REV-PROMOTE-MERGE-LUN-AUTO-127` recommended `integrate`, but its integration note explicitly requires all newly listed untracked files to be included.
- Hash comparison across source, reviewed, and promotion worktrees showed no target path can be treated as already identical.

## Required manual resolution

Automatic promotion must not create another `PROMOTE-MERGE` task for this item. A human or dedicated integration task should first reconcile the current source-local Lunaria work with the reviewed promotion changes, then commit or otherwise preserve the source-local versions before applying any reviewed replacement.
