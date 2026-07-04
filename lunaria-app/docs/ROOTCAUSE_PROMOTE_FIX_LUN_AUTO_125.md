# ROOTCAUSE-PROMOTE-FIX-LUN-AUTO-125

Date: 2026-06-02

## Decision

Automatic promotion for `FIX-LUN-AUTO-125` must stop. Do not create another `PROMOTE-MERGE` task for this reviewed worktree.

## Reason

The reviewed worktree is no longer a safe promotion source for the current source repo. The source repo has local changes or untracked files at every path that earlier promotion tasks were allowed to touch:

- `app/api/chat/route.ts`
- `lib/lunaria/assistant-reply.ts`
- `lib/lunaria/prompt-builder.ts`
- `lib/lunaria/topic.ts`
- `package.json`
- `lib/lunaria/conversation-polish.ts`
- `scripts/auto-dev-guard.js`
- `scripts/lunaria-chat-smoke.js`
- `scripts/lunaria-improvement-cycle.js`

Hash comparison also showed that none of those files are byte-for-byte identical between the reviewed worktree and the current source repo. The largest risk is `app/api/chat/route.ts`: the current source repo has a broad local rewrite around game context, deterministic replies, and streaming behavior, while the reviewed worktree contains a narrower chat hygiene and Gemini initialization patch. Applying the reviewed file or patch automatically would overwrite unrelated local work.

## Reviewed Inputs

- Reviewed worktree: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\fix-lun-auto-125-20260601-123317`
- Source repo: `C:\Users\yuuve\CascadeProjects\lunaria-app`
- Promotion review: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\REVIEW_RUNS\rev-promote-merge-fix-lun-auto-125-20260601-133316\SUMMARY.md`

The promotion review found no blocking issue in the reviewed source changes, but it did not make those changes safe to apply over the later source repo edits.

## Safe Next Step

Manually re-implement only the still-needed behavior from `FIX-LUN-AUTO-125` on top of the current source repo:

- robust assistant reply cleanup for malformed JSON or fenced output
- output hygiene prompt guardrails
- local smoke or guard scripts that fit the current script set
- lazy Gemini client initialization if still relevant

That work should be a new implementation on current source, not another automatic promotion of the obsolete reviewed worktree.
