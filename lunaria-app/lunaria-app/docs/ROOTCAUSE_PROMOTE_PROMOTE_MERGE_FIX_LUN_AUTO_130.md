# ROOTCAUSE-PROMOTE-PROMOTE-MERGE-FIX-LUN-AUTO-130

Date: 2026-06-02

## Decision

Automatic promotion for `PROMOTE-MERGE-FIX-LUN-AUTO-130` must stop.

The reviewed worktree is no longer safe to apply automatically to the current source repo because the source repo contains substantial unrelated local product changes on the same files the promotion patch wants to modify. A forced patch or checkout-style merge would overwrite local work.

## Compared Inputs

- Reviewed worktree: `WORKTREES/lunaria/fix-lun-auto-130-20260602-114913/lunaria-app`
- Promotion-fix worktree: `WORKTREES/lunaria/promote-merge-fix-lun-auto-130-20260602-134905/lunaria-app`
- Current source repo: `C:/Users/yuuve/CascadeProjects/lunaria-app`
- Source branch/head: `codex/ai-dev-orchestrator-claude-intake` at `ff99cf8`

## Findings

The reviewed worktree changes are small and targeted:

- `app/api/chat/route.ts`: lazy Gemini client initialization.
- `lib/lunaria/topic.ts`: lazy Gemini client initialization.
- `lib/lunaria/routing.ts`: broader serious-routing keywords.
- `package.json`: adds automation/smoke scripts.
- `lib/ai.ts`, `lib/lunaria/extraction.ts`, `lib/lunaria/gacha-reaction.ts`, `lib/supabase.ts`: lazy client initialization.

The promotion-fix worktree narrowed that to four files:

- `app/api/chat/route.ts`
- `lib/lunaria/routing.ts`
- `lib/lunaria/topic.ts`
- `package.json`

Those four files are already dirty in the source repo. In particular, source `app/api/chat/route.ts` has been rewritten into a much larger game-context chat implementation, while the reviewed patch targets the older route shape. Source `lib/lunaria/routing.ts` also has a broader refactor and different keyword model than the reviewed patch. Source `package.json` already contains a larger script set than the reviewed promotion patch.

The source repo also has extensive unrelated local changes across Lunaria and sibling projects. That makes an automatic product merge unsafe under the task stop condition: safe merge would overwrite unrelated local work.

## Required Manual Path

Do not create another `PROMOTE-MERGE` task for this reviewed patch.

A human/manual promotion should cherry-pick only the intent, not the old file hunks:

- Keep the current source chat rewrite intact.
- Re-implement lazy API client initialization in the current source architecture only where module-load env access still exists.
- Reconcile serious-routing keywords against the current `lib/lunaria/routing.ts` model instead of replacing it.
- Treat package scripts as already superseded unless a specific reviewed script is missing.

## Verification

No product merge was applied. Verification was limited to repository comparison:

- Reviewed worktree `git diff --stat`: 8 files, 119 insertions, 35 deletions.
- Promotion-fix worktree `git diff --stat`: 4 files, 33 insertions, 12 deletions.
- Source repo `git diff --stat`: 84 modified files, including 2062 changed lines in `lunaria-app/app/api/chat/route.ts`.

Source repo local changes were preserved.
