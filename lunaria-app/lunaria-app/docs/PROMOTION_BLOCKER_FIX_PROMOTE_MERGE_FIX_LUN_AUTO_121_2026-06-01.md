# Promotion Blocker: FIX-PROMOTE-MERGE-FIX-LUN-AUTO-121

Date: 2026-06-01

## Decision

Do not automatically promote `FIX-PROMOTE-MERGE-FIX-LUN-AUTO-121` into the current source repo, and do not create another `PROMOTE-MERGE` task.

## Evidence

The reviewed-ready worktree `fix-promote-merge-fix-lun-auto-121-20260531-133017` contains a narrow reviewed change to `lunaria-app/app/api/chat/route.ts`: buffer Gemini streaming deltas before emitting `chunk` events. The review at `REVIEW_RUNS/rev-fix-promote-merge-fix-lun-auto-121-20260531-133500/SUMMARY.md` recommends integration for that 18-line backend streaming change.

The current source repo already has unrelated local work in the same file. Its `lunaria-app/app/api/chat/route.ts` diff is a large replacement of the chat route into a one-shot sanitized reply path, with `1,488` insertions and `439` deletions against the same base. Applying the reviewed 18-line patch there would overwrite or rebase through substantial unreviewed local work in the source repo.

## Blocker

Automatic promotion must stop because the reviewed worktree is obsolete compared with current source changes in the same product file. There is no smallest safe non-conflicting product merge left for this task without a human decision about the newer source-route rewrite.

## Follow-up

- Preserve the current source repo local changes.
- If this behavior is still needed, evaluate it manually against the newer `app/api/chat/route.ts` implementation rather than re-promoting the old worktree.
- Keep `FIX-PROMOTE-MERGE-FIX-LUN-AUTO-121` closed as blocked/obsolete for automatic promotion.
