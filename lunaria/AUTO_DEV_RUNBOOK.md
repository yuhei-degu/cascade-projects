# Lunaria Auto Dev Runbook

Last updated: 2026-05-20
Purpose: Standardize the loop: implement -> verify -> record -> handoff.

## Fast Mode Loop

1. Read current source of truth:
   - `lunaria/LUNARIA_CANONICAL_SPEC.md`
   - `lunaria/AUTO_DEV_TASK_QUEUE.md`
   - `lunaria/TASK_EVALUATION.md`
   - `lunaria/AUTO_DEV_GUARDRAILS.md`
   - latest `lunaria/REPORTS/DAILY_PROGRESS.md`
2. Pick one task with clear file ownership.
3. State risk and stop conditions internally before editing.
4. Implement only inside the chosen file scope.
5. Run targeted checks.
6. Run broad checks when app code changed.
7. Update metrics/progress.
8. Leave the next task suggestion.

## Stop Conditions

Stop and ask the human before:

- Production DB changes
- Production deploy
- Stripe live mode
- Secret or `.env.local` display/change
- Irreversible migration
- User data deletion
- High risk or Critical risk tasks
- Broad refactor touching unrelated files

## Default Verification Matrix

| Change type | Required checks |
|---|---|
| Docs only | Read tail/diff, no build required |
| JSON/test data | `npm run conversation:cases` or relevant parser |
| Game source | `npm run auto:guard`, `npx tsc --noEmit --pretty false`, `npm run endworld:check`, `npm run endworld:paths` |
| UI/app route | `npm run auto:guard`, `npx tsc --noEmit --pretty false`, `npm run build`, route smoke if available |
| Chat behavior | static smoke, local server `npm run chat:smoke` if runtime is available |
| DB candidate files | SQL pack/verify scripts only; do not apply DB automatically |

## Drift Guard

Run this after any medium-sized automated change:

```powershell
npm run auto:guard
```

This check fails when Lunaria drifts away from the current source of truth, including missing canonical docs, mojibake in user-facing TS/TSX, old Endworld v1 storage revival, missing conversation case coverage, or missing required automation scripts.

## Required Record Format

Add to `lunaria/REPORTS/DAILY_PROGRESS.md`:

```md
## YYYY-MM-DD Short Task Name

### Completed
- ...

### Files Changed
- `...`

### Verification
- `...`: passed/failed

### Risks
- ...

### Next Actions
- ...
```

Add one row to `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md` with:

- Task ID
- Date
- Owner AI
- Reviewer AI
- Task type
- Difficulty
- Risk
- Human approval
- Elapsed estimate
- File count
- Build/typecheck/smoke results
- Outcome
- Notes

## Collision Avoidance

Before editing, classify files:

- Green: new docs, new scripts, isolated JSON fixtures
- Yellow: route-specific page/component, package script entry
- Red: `app/page.tsx`, `app/api/chat/route.ts`, `lib/prompt.ts`, `lib/supabase.ts`, migrations, package lock

Only one agent should touch Red files at a time.

## Fun App Bias

When choosing between two safe tasks, prefer the one that improves one of these:

- Luna feels more specific and alive.
- A return visit has a reason.
- Game results create conversation.
- Gacha/items feel emotionally meaningful.
- The app catches regressions before the user sees them.
