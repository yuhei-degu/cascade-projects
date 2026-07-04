# Promotion Blocker: LOOPBREAK-LUNARI-PROMOTE-MERGE-FIX-PROMOT

Date: 2026-05-31

## Decision

Automatic promotion must stop for `LOOPBREAK-LUNARI-PROMOTE-MERGE-FIX-PROMOT`.

The reviewed worktree is obsolete compared with the current source checkout. The only prior allowed promotion paths were:

- `package.json`
- `scripts/auto-dev-guard.js`
- `scripts/lunaria-improvement-cycle.js`

Those paths already have local source-repo changes that differ from the reviewed worktree. Copying the reviewed payload into the source repo would overwrite or downgrade unrelated local work.

## Evidence

- Reviewed worktree:
  - `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\loopbreak-lunari-promote-merge-fix-promot-20260531-050858\lunaria-app`
  - Git branch: `codex/loopbreak-lunari-promote-merge-fix-promot-20260531-050858`
  - Git HEAD: `ff99cf8`
  - Local payload: `package.json` modified, `scripts/auto-dev-guard.js` untracked, `scripts/lunaria-improvement-cycle.js` untracked

- Current source repo:
  - `C:\Users\yuuve\CascadeProjects\lunaria-app`
  - Git branch: `codex/ai-dev-orchestrator-claude-intake`
  - Git HEAD: `ff99cf8`
  - The same target paths are locally modified or untracked, but their contents are not the same as the reviewed payload.

- The source `package.json` already contains `auto:guard` and `lunaria:cycle`, plus additional local script entries such as `chat:smoke`, `conversation:cases`, `endworld:check`, `endworld:paths`, `games:smoke`, `games:source`, and `weekend:smoke`.

- The source `scripts/auto-dev-guard.js` and `scripts/lunaria-improvement-cycle.js` are substantially different from the reviewed versions. The source versions validate broader Lunaria guardrails, conversation cases, Endworld paths, game source checks, and continuous improvement reporting.

## Root Cause

The promotion loop is retrying a reviewed worktree whose product changes are no longer the next safe delta for the source repo. Both the reviewed branch and the source branch point at the same committed HEAD (`ff99cf8`), so the promotion payload exists only as dirty worktree changes. The source checkout has since accumulated newer dirty changes on the same paths.

Because the promotion mechanism is path-copy based and the paths overlap, it cannot distinguish the stale reviewed automation scripts from the newer source-local automation scripts without overwriting local work.

## Required Human Action

Do not create another `PROMOTE-MERGE` task for this payload.

A human should decide whether the newer source-local versions should be committed as the canonical automation scripts. If so, commit the current source-local versions directly after normal review. If not, manually reconcile the reviewed scripts against the current source versions in a fresh implementation task with an explicit allowed path list.

## Source Preservation

No source-repo files were modified by this root-cause task.
