# DECISIONS

Important project decisions are recorded here in chronological order. This file is part of the AI_DEV_OS handoff layer for the active Lunaria project.

## 2026-05-09 - Adopt Claude visual/items output as source material

### Decision

Adopt Claude's visual/items output as design and mock UI source material, not as completed DB-backed functionality.

### Reason

The new `/items` and `/character` pages are useful for product direction, visual QA, and future DB implementation planning, while staying safe because they do not touch Supabase, auth, env, Stripe, or production.

### Alternatives

- Defer the Claude output entirely until DB migrations are ready.
- Immediately connect the mock pages to DB tables.

### Review Conditions

Revisit after `character_states` and `user_items` migrations are designed, reviewed, and applied in the intended environment.

## 2026-05-09 - Create `020/021` migration candidates only

### Decision

Create `020_user_items.sql` and `021_character_states.sql` as migration candidates, but do not apply them yet.

### Reason

Claude's DB design referenced future tables such as `lunaria_items` and `character_profiles`, while the current implemented schema uses `lunaria_gacha_pool`, `lunaria_gacha_inventory`, and `lunaria_gacha_history`. Candidate migrations let us review the shape safely before touching Supabase.

### Alternatives

- Wait until a separate item catalog exists.
- Create `lunaria_items` and `character_profiles` immediately.
- Skip migration candidates and only keep design docs.

### Review Conditions

Review again after Supabase `014` through `019` state is confirmed and before any SQL Editor application.

## 2026-05-09 - Add `020/021` SQL bundle and verification support

### Decision

Add dedicated SQL bundle and verification scripts for `020/021` before any DB apply.

### Reason

Manual Supabase SQL Editor work is safer when the exact apply order, post-apply checks, and security review are bundled with the migration candidates.

### Alternatives

- Rely on individual migration files only.
- Apply migrations first and write verification later.

### Review Conditions

Keep `character:verify` read-only. Do not add mutation behavior to verification scripts.

## 2026-05-09 - Make `/items` and `/character` DB-aware with fallback

### Decision

Make `/items` and `/character` DB-aware with safe fallback before applying `020/021`.

### Reason

This lets the UI and API integration be tested incrementally while keeping the human gate for Supabase schema changes intact.

### Alternatives

- Keep pages as pure mock until migrations are applied.
- Require `020/021` before any app integration.

### Review Conditions

After `020/021` are applied, verify the pages report `source: user_items` and `source: character_states` respectively.

## 2026-05-09 - Adopt AI_DEV_OS for Lunaria active development

### Decision

Adopt AI_DEV_OS for Lunaria active development coordination.

### Reason

Lunaria is now large enough that parallel Codex/Claude work needs visible task routing, handoff files, review logs, metrics, and explicit stop conditions. Markdown-based async coordination is safer than relying on hidden chat context.

### Scope

- Applies to current Lunaria development: `lunaria/` and `lunaria-app/`.
- Does not automatically govern every project in the monorepo.
- Medium-risk work may proceed in Solo Developer Fast Mode when it avoids production DB, deploy, Stripe, secrets, irreversible migrations, and user data deletion.

### Alternatives

- Continue ad-hoc chat-based coordination.
- Use AI_DEV_OS only for new projects.

### Review Conditions

If the process creates too much documentation overhead, reduce required updates to `TASKS.md`, `PROGRESS.md`, `HANDOFF.md`, and metrics only.

## 2026-05-09 - Track project completion by target maturity

### Decision

Track Lunaria completion in three separate targets: Local MVP / Private Alpha, Public Beta, and Full Life-log OS Vision.

### Reason

A single percent complete number is misleading because Lunaria is both a near-term AI diary app and a long-term AI companion life-log OS. Separating targets makes the remaining work feel less endless and helps choose the right next task.

### Current Estimate

- Local MVP / Private Alpha: 62% done, 38% remaining.
- Public Beta: 38% done, 62% remaining.
- Full Life-log OS Vision: 18% done, 82% remaining.

### Review Conditions

Update the snapshot when major gates change, especially after Supabase migration verification, memory restore/edit implementation, diary polish, and production-readiness decisions.
