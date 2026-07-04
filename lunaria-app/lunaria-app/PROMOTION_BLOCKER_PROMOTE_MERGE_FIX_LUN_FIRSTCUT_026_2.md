# Promotion Blocker: PROMOTE-MERGE-FIX-LUN-FIRSTCUT-026-2

Date: 2026-06-01

Automatic promotion must stop for `PROMOTE-MERGE-FIX-LUN-FIRSTCUT-026-2`.

## Decision

Do not copy the reviewed worktree into the source repo.

The reviewed worktree changes target four files:

- `app/page.tsx`
- `package.json`
- `scripts/auto-dev-guard.js`
- `scripts/lunaria-improvement-cycle.js`

The current source repo already has local changes on all four targets. These are not byte-identical to the reviewed files, and the source versions contain newer, broader Lunaria work. Copying the reviewed files would overwrite unrelated local work and regress current product and guard coverage.

## Root Cause

The promotion gate is treating "target has local changes" as a repeatable merge-fix task, but this case is not automatically mergeable. The source repo has moved on since the reviewed worktree was created:

- `app/page.tsx` in source is now a larger current home/chat experience with navigation, game handoff state, richer Japanese UI, and a different layout structure.
- `package.json` in source already contains `auto:guard` and `lunaria:cycle`, plus newer chat/game/endworld verification scripts.
- `scripts/auto-dev-guard.js` in source is a richer repo-wide guard that checks docs, Japanese UI hygiene, connected APIs, game routes, and conversation case coverage.
- `scripts/lunaria-improvement-cycle.js` in source runs multiple current checks and writes the continuous-improvement report.

The reviewed worktree versions are narrower and older. They cannot be safely copied over the active source files.

## Evidence

Promotion report:

- `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\REPORTS\PRODUCT_PROMOTION_REPORT.md`
- Status for this item: `blocked`
- Skipped because every reviewed target has local source changes:
  - `M lunaria-app/app/page.tsx`
  - `M lunaria-app/package.json`
  - `?? lunaria-app/scripts/auto-dev-guard.js`
  - `?? lunaria-app/scripts/lunaria-improvement-cycle.js`

Reviewed worktree:

- `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\promote-merge-fix-lun-firstcut-026-2-20260530-034245`

Reviewed branch refs in this clone currently resolve to the same commit as source HEAD (`ff99cf8`), so the promotable content is only available as worktree file state / run-summary diff, not as a clean branch delta.

## Verification

- Compared source repo status and reviewed worktree file hashes for the four target files: all four source files differ from reviewed versions.
- Checked source `package.json`: `auto:guard` and `lunaria:cycle` already exist alongside newer verification scripts.
- Ran in source repo: `npm run auto:guard` -> pass.

## Required Follow-up

Mark this promotion item as blocked or superseded with this note. Do not create another `PROMOTE-MERGE` task for it unless a human first confirms a fresh merge target and allowed file-level resolution against the current source checkout.
