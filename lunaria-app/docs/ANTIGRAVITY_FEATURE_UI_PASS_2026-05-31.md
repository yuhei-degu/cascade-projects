# Antigravity 2 Feature/UI Pass - 2026-05-31

Work in:

`C:\Users\yuuve\CascadeProjects\lunaria-app`

The user wants Antigravity 2 to improve Lunaria's actual project functionality, readability, and visible UI.

## Current Situation

The working tree already contains many changes from Codex, Antigravity, and the user. Treat all existing changes as user-owned. Do not revert broad files or reset the repo.

Previous broad Antigravity passes stalled. This pass must be narrower and produce a completion report.

## Goal

Make Lunaria easier to use and visually clearer by improving a small, high-impact set of actual screens and interactions.

Prioritize:

1. Main conversation screen `/`
   - Make the main chat flow readable and clearly primary.
   - Improve spacing, Japanese labels, quick actions, and mobile layout.
   - Keep Lunaria's tone close and companion-like, not formal support.

2. Moon Box `/gacha`
   - Improve result readability, affordance, and after-result actions.
   - Keep gacha as a companion/room reward, not the core game.
   - Avoid layout overlap on mobile.

3. Character and memory surfaces `/character`, `/memory`
   - Improve filters, button labels, tap targets, status readability.
   - Remove user-facing English/internal IDs where practical.

## Hard Constraints

- Do not change database schema, auth, API secrets, billing, Supabase config, or persistence architecture.
- Do not run `npm run build` while a dev server is running.
- Do not leave `npx next dev -p 3009` running as a foreground task.
- Keep visible UI language Japanese.
- Do not delete or overwrite unrelated existing work.
- Keep the change scoped. A focused improvement is better than another stalled broad pass.

## Verification

Run:

```powershell
npx tsc --noEmit --pretty false
npm run chat:devtest
```

If you can browser-check, record the routes checked. If not, say so in the completion report.

## Completion Report

When finished, create:

`docs/ANTIGRAVITY_FEATURE_UI_PASS_2026-05-31_DONE.md`

Include:

- Changed files
- Screens improved
- Functional or visual bugs fixed
- Commands run and results
- Routes manually checked
- Remaining issues for Codex to verify

Codex will review your diff and run verification after this file exists.
