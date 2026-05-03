# Supabase Gacha 014/015/016 Apply Addendum

Created: 2026-05-03

This addendum supersedes the older `SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md` where the old filename or text only mentions `014/015`.

## Current Correct Apply Order

1. `014_gacha_content_v2.sql`
2. `015_gacha_pity_system.sql`
3. `016_gacha_pity_threshold.sql`

The connected Supabase database is currently still before these migrations, so `gacha:verify` is expected to fail until all three are applied.

## One-file SQL Editor Bundle

To reduce copy/paste mistakes, generate a single manual apply file:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run gacha:sql-pack
```

This writes:

```text
supabase/manual/014_016_gacha_apply_bundle.sql
```

Paste that generated file into Supabase SQL Editor. It contains:

- `014_gacha_content_v2.sql`
- `015_gacha_pity_system.sql`
- `016_gacha_pity_threshold.sql`
- post-apply verification SQL

## Why 016 Exists

`015` creates the pity infrastructure and the new `draw_gacha_v2` RPC. It was originally written with a 100-draw hard pity.

Claude reviewed the threshold and recommended 200 draws for launch. `016` therefore keeps all `015` schema changes and only replaces the RPC threshold:

- `v_pity_before >= 99` becomes `v_pity_before >= 199`
- App/report/verify now use `/200`

## RLS Policy Note

`lunaria_gacha_pity_state` intentionally has RLS enabled without client-facing policies. The app accesses it through server-side service-role flows and `draw_gacha_v2`.

If Supabase Advisor warns about missing policies, treat that as expected for this phase unless we later expose direct client reads.

## RPC Coexistence

- `draw_gacha`: legacy fallback, retained for environments before 015/016.
- `draw_gacha_v2`: authoritative after 015/016, handles tickets, inventory, coins, history audit fields, and pity state.

The app attempts `draw_gacha_v2` when pity state exists and falls back to `draw_gacha` if the DB has not been migrated yet.

## Backfill No-op

`015` backfills `lunaria_gacha_pity_state` from existing history. If a user has no prior gacha history, no row may exist after migration. That is OK: `draw_gacha_v2` creates the row on first draw.

## Emergency Rollback Shape

Prefer forward fixes. If rollback is unavoidable:

```sql
drop function if exists public.draw_gacha_v2(uuid, uuid, text);

alter table if exists public.lunaria_gacha_history
  drop column if exists pity_before,
  drop column if exists pity_after,
  drop column if exists pity_triggered;

drop table if exists public.lunaria_gacha_pity_state;
```

For `014`, prefer setting newly added v2 items inactive rather than deleting rows, because inventory/history references may exist after users draw.

## Post-apply Local Commands

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run gacha:report
npm run gacha:verify
npm run gacha:smoke
```

`gacha:verify` now checks that `/api/gacha/state` reports the expected `200` threshold when HTTP verification is enabled with `LUNARIA_BASE_URL` or a CLI base URL.
