# Root Cause: PROMOTE-MERGE-RESCOPE-LUN-AUTO-122-2

Task: `ROOTCAUSE-PROMOTE-PROMOTE-MERGE-RESCOPE-LUN-AUTO-122-2`
Checked at: 2026-06-03 JST

## Decision

Automatic promotion must stop for `PROMOTE-MERGE-RESCOPE-LUN-AUTO-122-2`.

Do not create another `PROMOTE-MERGE` task for this same reviewed slice. The reviewed work is obsolete against the current source checkout, and applying it automatically would overwrite unrelated local product work.

## Evidence

- Current source repo `C:\Users\yuuve\CascadeProjects\lunaria-app` is on `codex/ai-dev-orchestrator-claude-intake` at `ff99cf8`, but has large uncommitted local changes.
- The active local source changes include the same files the promotion wants to touch:
  - `app/api/chat/route.ts`
  - `lib/lunaria/topic.ts`
  - `package.json`
  - `scripts/auto-dev-guard.js`
  - `scripts/lunaria-chat-smoke.js`
  - `scripts/lunaria-improvement-cycle.js`
- The reviewed worktree `rescope-lun-auto-122-2-20260603-015850` adds a lazy Gemini client slice:
  - imports `getGeminiClient`
  - replaces direct module-scope Gemini usage in `app/api/chat/route.ts` and `lib/lunaria/topic.ts`
  - adds package scripts for `chat:smoke`, `auto:guard`, and `lunaria:cycle`
  - adds related scripts and `lib/lunaria/gemini-client.ts`
- The prior promotion worktree `promote-merge-rescope-lun-auto-122-2-20260603-025030` contains the same product-file overlap plus generated `.next` deletions under sibling `note-processor/.next`. Generated build folders are not deliverables and should not be promoted.
- The current source checkout already has a much larger chat-route rewrite and a broader script set in `package.json`. The reviewed lazy-client patch no longer applies as a smallest safe product increment.

## Stop Condition Hit

Safe merge would overwrite unrelated local work.

The reviewed patch is also obsolete compared with the current source changes. A manual owner must first reconcile the current source implementation, then decide whether lazy Gemini/Supabase/client guard behavior is still missing.

## Safe Next Step

Inspect the current source repo's uncommitted Lunaria changes directly and resolve them as one intentional source-side change set. After that, run the current source repo's own verification scripts. Do not promote this stale `RESCOPE-LUN-AUTO-122-2` slice automatically.
