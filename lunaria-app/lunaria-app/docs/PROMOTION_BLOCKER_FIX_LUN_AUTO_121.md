# Promotion blocker: FIX-LUN-AUTO-121

Date: 2026-06-01
Task: ROOTCAUSE-PROMOTE-FIX-LUN-AUTO-121
Reviewed worktree: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\fix-lun-auto-121-20260531-123830`
Source repo: `C:\Users\yuuve\CascadeProjects\lunaria-app`

## Decision

Automatic promotion must stop for `FIX-LUN-AUTO-121`.

The reviewed fix is valid in its own worktree, but it is obsolete relative to the current source repo local work. The promotion report already skipped every relevant product file because the source repo has local changes. Replaying the reviewed patch would overwrite unrelated, newer chat-route work in the source repo.

## Evidence

- Review `REV-FIX-LUN-AUTO-121` recommended integrate for the reviewed worktree.
- The promotion report recorded `promotion_status: root-cause-needed` and skipped these target paths because they already have local source changes:
  - `app/api/chat/route.ts`
  - `lib/lunaria/assistant-reply.ts`
  - `lib/lunaria/date.ts`
  - `lib/lunaria/prompt-builder.ts`
  - `lib/lunaria/routing.ts`
  - `lib/lunaria/topic.ts`
  - `package.json`
  - `lib/lunaria/conversation-polish.ts`
  - `scripts/auto-dev-guard.js`
  - `scripts/lunaria-chat-smoke.js`
  - `scripts/lunaria-improvement-cycle.js`
- Reviewed worktree diff against `ff99cf8` for the shared tracked files is small: 173 insertions and 26 deletions across 7 files.
- Current source repo local diff against its HEAD for those same tracked files is much larger and newer: 1,825 insertions and 526 deletions across 7 files.
- The central reviewed product fix was in `app/api/chat/route.ts`: buffer raw Gemini deltas server-side, parse with `parseAssistantReply()`, then emit only canonical user-visible text.
- The current source repo's `app/api/chat/route.ts` has already been rewritten around a different local chat implementation and emits a single sanitized `chunk` after `cleanReply()` / `polishAssistantReply()` rather than forwarding raw model deltas.

## Stop condition hit

The reviewed worktree is obsolete compared with current source changes, and a safe merge would overwrite unrelated local work.

## Required next action

Do not create another `PROMOTE-MERGE` task for `FIX-LUN-AUTO-121`.

If this functionality still needs verification in the source repo, create a fresh task against the current source state that adds or runs an API-level NDJSON test proving `/api/chat` never emits JSON wrapper text in user-visible `chunk` events. That task should not replay files from `fix-lun-auto-121-20260531-123830`.
