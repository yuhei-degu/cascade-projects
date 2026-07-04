# Lunaria Auto Dev Guardrails

Last updated: 2026-05-20
Status: Required before medium-or-larger AI changes

## Purpose

This file exists so automated development can keep improving Lunaria without drifting away from the product's core identity.

AI agents may improve implementation, copy, tests, and UI, but they must not quietly change what Lunaria is.

## North Star

Lunaria is a Japanese-first AI companion diary and life-log app.

The experience should feel:

- Warm
- Playful
- Emotionally safe
- Useful in daily life
- Remembering, but not creepy
- Game-like, but not a grind trap
- Japanese-first in visible UI and conversation

## Hard Guardrails

Automated development must not violate these:

1. Do not expose mojibake or raw English fallback copy in user-facing Japanese UI.
2. Do not leak raw JSON or AssistantReply internals to the user.
3. Do not save game/gacha results directly into core memory.
4. Do not revive old Endworld localStorage key `lunaria_endworld_v1`.
5. Do not touch production DB, production deploy, Stripe live mode, secrets, or irreversible migrations without human confirmation.
6. Do not collapse conversation, diary, memory, life events, gacha, and character state into one shared blob.
7. Do not let Claude and Codex edit the same red-zone file at the same time without an explicit handoff.

## Required Source Files

Every AI session should treat these as the active operating system:

- `lunaria/LUNARIA_CANONICAL_SPEC.md`
- `lunaria/AUTO_DEV_TASK_QUEUE.md`
- `lunaria/AUTO_DEV_RUNBOOK.md`
- `lunaria/AUTO_DEV_GUARDRAILS.md`
- `lunaria/TASK_EVALUATION.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`

## Required Commands

Before completing app-code work, run:

```powershell
npm run auto:guard
npx tsc --noEmit --pretty false
npm run build
```

Run route-specific checks when relevant:

```powershell
npm run conversation:cases
npm run endworld:check
npm run endworld:paths
npm run games:smoke
npm run weekend:smoke
npm run gacha:smoke
```

## Task Selection Policy

Prefer tasks in this order:

1. Fix broken Japanese UI/copy, mojibake, or confusing labels.
2. Strengthen conversation quality and regression cases.
3. Make game results create better Luna conversation.
4. Improve diary/memory review safety.
5. Improve gacha/item delight.
6. Add visual polish.
7. Only then touch DB-backed write flows.

## Claude / Codex Division

Codex default lane:

- Implementation
- TypeScript/Next.js fixes
- API wiring
- Test scripts
- Build/smoke verification
- AI_DEV_OS metrics

Claude default lane:

- Copy review
- UX critique
- Content proposals
- Game scene ideas
- Memory/diary policy review
- Docs-only second opinion

## Red-Zone Files

Only one AI should touch these at a time:

- `lunaria-app/app/page.tsx`
- `lunaria-app/app/api/chat/route.ts`
- `lunaria-app/app/globals.css`
- `lunaria-app/lib/prompt.ts`
- `lunaria-app/lib/supabase.ts`
- `lunaria-app/package.json`
- `lunaria-app/package-lock.json`
- `lunaria-app/supabase/migrations/*`

If an agent edits a red-zone file, it must record:

- Why it touched the file
- What behavior changed
- What checks passed
- What another agent should avoid editing next

## Definition Of Done

A task is only done when:

- The changed behavior is clear.
- The user-facing copy is readable Japanese unless intentionally technical/internal.
- Relevant checks pass.
- Progress and metrics are updated.
- Remaining risks are written down.
- The next safe task is obvious.
