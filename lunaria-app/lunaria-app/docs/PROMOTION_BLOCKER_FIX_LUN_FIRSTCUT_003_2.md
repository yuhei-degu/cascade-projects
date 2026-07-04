# Promotion blocker: FIX-LUN-FIRSTCUT-003-2

Date: 2026-05-29

## Decision

Automatic promotion must stop for `FIX-LUN-FIRSTCUT-003-2`.

The reviewed worktree only changes `lunaria-app/app/page.tsx`, but the current source repo has unrelated local work in the same file. Replacing or patch-applying the reviewed file as a normal promotion would overwrite or collide with that newer source-local homepage work.

## Evidence

- Promotion report for `FIX-LUN-FIRSTCUT-003-2` skipped `app/page.tsx` because the target has local changes.
- The promotion loop was capped after 3 attempts and marked `root-cause-needed`.
- Reviewed fix worktree: `C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\fix-lun-firstcut-003-2-20260529-105547`
- Source repo: `C:\Users\yuuve\CascadeProjects\lunaria-app`
- Blocked path: `app/page.tsx`

The reviewed fix itself is small:

- Persist recent messages to `luna_msgs` as a browser fallback.
- Prevent Enter submission while Japanese IME composition is active.

The current source `app/page.tsx` is no longer the same integration target. It already contains the recent-message `luna_msgs` fallback, but it is a broader, divergent homepage with Endworld/game context, a different layout, and local uncommitted source changes. The remaining useful behavior from the reviewed fix is the IME guard, but applying it directly to the source repo would require editing a user-modified file outside this task worktree.

## Required manual follow-up

Apply only this semantic change to the current source `app/page.tsx` after confirming the local source changes are intended:

```tsx
const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
    event.preventDefault()
    send()
  }
}
```

Do not create another `PROMOTE-MERGE` task for this reviewed worktree. Treat `FIX-LUN-FIRSTCUT-003-2` as superseded by the current source-local homepage work, with the IME guard as the only remaining hand-merge candidate.

## Verification

- Inspected `IMPLEMENTATION_QUEUE.json` promotion fields and review summaries.
- Compared reviewed worktree intent with current source `app/page.tsx`.
- Did not modify the source repo.
- Did not run production deploys, migrations, secrets, or data operations.
