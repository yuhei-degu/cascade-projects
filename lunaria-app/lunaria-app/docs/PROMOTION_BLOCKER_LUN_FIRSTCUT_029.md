# Promotion Blocker: LUN-FIRSTCUT-029

Date: 2026-05-31
Task: ROOTCAUSE-PROMOTE-LUN-FIRSTCUT-029

## Decision

Automatic promotion for reviewed worktree `LUN-FIRSTCUT-029` must stop.

Do not create another `PROMOTE-MERGE-LUN-FIRSTCUT-029` task. The reviewed worktree is now obsolete compared with the current source repository's local Lunaria changes, and a safe automatic merge would overwrite or downgrade unrelated local work.

## Reviewed Worktree

Path:

`C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\WORKTREES\lunaria\lun-firstcut-029-20260530-040231\lunaria-app`

Observed reviewed changes:

- `app/page.tsx`: small Japanese copy polish for the typing indicator, empty state, input placeholder, ticket toast, fallback assistant messages, route badge, header label, and diary link label.
- `package.json`: added `auto:guard` and `lunaria:cycle` scripts.
- `scripts/lunaria-improvement-cycle.js`: added a small source/runtime smoke check script.

The original review `rev-lun-firstcut-029-20260530-040747` recommended integration with no blocking issues. Later promotion/fix reviews narrowed the viable promotion to the package scripts and guard script, not the UI copy patch.

## Current Source Repository

Path:

`C:\Users\yuuve\CascadeProjects\lunaria-app`

Current source status for the relevant files:

- `lunaria-app/app/page.tsx` is already locally modified with a much larger later homepage/chat redesign.
- `lunaria-app/package.json` is already locally modified with `auto:guard`, `lunaria:cycle`, and additional guard/smoke scripts.
- `lunaria-app/scripts/auto-dev-guard.js` is an untracked current guard script.
- `lunaria-app/scripts/lunaria-improvement-cycle.js` is an untracked current continuous-improvement script.

The current source `app/page.tsx` already contains the product intent of the reviewed UI polish in a newer design:

- Japanese-first home/chat copy, including `ルナリア`, `ルナリアと話す`, `ここから始めよう`, and `送る`.
- A Japanese typing-label affordance: `ルナリアが返事を考えています`.
- Japanese fallback assistant copy for interrupted or failed replies.
- Japanese ticket toast copy.
- Connected chat markers remain present: `/api/chat`, `routeType`, `assistantMeta`, `ticketGranted`, `gameContext`, `LunariaPortrait`, and `assistantVisual`.

The current source guard system is also newer and broader than the reviewed script:

- `auto:guard` now points to `scripts/auto-dev-guard.js`.
- `lunaria:cycle` now runs a multi-check continuous improvement script that calls conversation, chat, Endworld, and game source checks.
- Replacing these with the reviewed script would reduce current local verification coverage.

## Root Cause

The recurring promotion loop is attempting to promote a stale reviewed patch onto a source repo that has accumulated substantial local Lunaria work on the same files and same product surface.

The blocker is not a missing merge task. The blocker is stale promotion input:

- The reviewed UI patch overlaps `app/page.tsx`, which has since been heavily changed.
- The reviewed package/script patch overlaps `package.json` and `scripts/lunaria-improvement-cycle.js`, which have since been replaced by a broader guard setup.
- Source repo local changes are intentional work-in-progress and must be preserved.

## Stop Condition Hit

Stop condition:

`the reviewed worktree is obsolete compared with current source changes`

Secondary stop condition:

`safe merge would overwrite unrelated local work`

## Required Human/Orchestrator Action

Mark `LUN-FIRSTCUT-029` promotion as stopped/obsolete rather than spawning another promotion task.

If any detail from `LUN-FIRSTCUT-029` is still desired, create a new implementation task against the current source state with a narrow scope, for example:

- "Re-check current Lunaria home chat empty/error copy and make one small Japanese-first copy improvement if still needed."

Do not replay the old reviewed patch automatically.
