# Promotion Blocker: FIX-PROMOTE-MERGE-FIX-LUN-AUTO-125

Date: 2026-06-01

## Decision

Stop automatic promotion for `FIX-PROMOTE-MERGE-FIX-LUN-AUTO-125`.

The reviewed promotion worktree is obsolete compared with the current source repo local changes. A safe automatic merge would overwrite unrelated local Lunaria product work in the source repo, including the current `app/api/chat/route.ts` flow and expanded guard scripts.

## Evidence

- Reviewed worktree: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\fix-promote-merge-fix-lun-auto-125-20260601-134811`
- Source repo: `C:\Users\yuuve\CascadeProjects\lunaria-app`
- Source branch and HEAD at task start: `codex/ai-dev-orchestrator-claude-intake` at `ff99cf8`
- Promotion review `rev-promote-merge-fix-lun-auto-125-2-20260601-174850` recommended integration only after dependency-backed smoke/build verification, and explicitly noted the promotion files were untracked in that reviewed worktree.
- The current source repo has local modifications on every promotion target checked:
  - `app/api/chat/route.ts`
  - `lib/lunaria/assistant-reply.ts`
  - `lib/lunaria/prompt-builder.ts`
  - `lib/lunaria/topic.ts`
  - `package.json`
  - `lib/lunaria/conversation-polish.ts`
  - `scripts/auto-dev-guard.js`
  - `scripts/lunaria-chat-smoke.js`
  - `scripts/lunaria-improvement-cycle.js`
- File hashes differ for all of those files between the reviewed worktree and the current source repo.
- The source-local `app/api/chat/route.ts` has a large local delta from `HEAD` (`1989` changed lines in `git diff --stat`) and now contains game-context handling, weekday/calendar handling, and a different `polishAssistantReply` integration. The reviewed promotion route is the older Supabase/routing pipeline using `buildConversationPolishInstruction`.

## Root Cause

Promotion retried the same reviewed patch after the source repo had accumulated newer local product changes in the same files. Because the promotion target files are no longer the same base as the reviewed worktree, path allow-listing is insufficient: replacing or copying the reviewed files would discard newer local work.

## Required Human Action

Do not create another `PROMOTE-MERGE` task for this reviewed worktree.

A human or implementation task should first decide whether the reviewed changes are still relevant, then manually rebase only the still-needed ideas onto the current source-local implementation. In particular, verify whether the current source already covers:

- production-safe handling of any chat `testMode` behavior,
- reply JSON/fence cleanup,
- prompt hygiene,
- local guard/smoke script coverage.

Only after that manual reconciliation should a new reviewed implementation be produced from the current source state.

