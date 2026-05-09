# Supabase 020-021 Apply Runbook

Date: 2026-05-09
Status: draft / human-gated
Scope: `lunaria_user_items` and `lunaria_character_states`

## Purpose

Apply the character/items foundation after Supabase migrations `014` through `019` are confirmed.

This step prepares Lunaria for:

- DB-backed `/items`
- DB-backed `/character`
- gacha result to `user_items` projection
- future equipment and expression/motion persistence

## Human Gate

Do not run this against production or an unknown Supabase project without explicitly confirming the target project.

Stop if any of these are true:

- `014` through `019` are not confirmed applied.
- You are not sure which Supabase project SQL Editor is targeting.
- You cannot tolerate a schema change in the target DB.
- RLS/security review has not been read.

## Files

Source migrations:

- `lunaria-app/supabase/migrations/020_user_items.sql`
- `lunaria-app/supabase/migrations/021_character_states.sql`

Generated manual bundle:

- `lunaria-app/supabase/manual/020_021_character_items_apply_bundle.sql`

Generate bundle:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run character:sql-pack
```

## Pre-Apply Checks

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run env:check
npm run supabase:verify
npm run gacha:verify
npm run build
```

Expected:

- `supabase:verify` passes for the current DB.
- `gacha:verify` confirms Phase G+ tables and pity state are present.
- `npm run build` passes.

## Apply Order

Recommended: paste the generated bundle into Supabase SQL Editor.

Order inside the bundle:

1. `020_user_items.sql`
2. `021_character_states.sql`
3. verification queries

## Post-Apply Verification

Run:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run character:verify
npm run supabase:verify
npm run gacha:verify
npm run build
```

Expected from `character:verify`:

- `User items columns`: PASS
- `Character states columns`: PASS
- `User items row count`: PASS
- `Character states row count`: PASS
- `Default character state row`: PASS

## Rollback Notes

These migrations are additive, but rollback is still a human decision.

If applied to the wrong non-production project before any app code depends on them, a manual rollback could remove:

```sql
drop table if exists public.lunaria_character_states;
drop table if exists public.lunaria_user_items;
drop function if exists public.lunaria_touch_character_states_updated_at();
drop function if exists public.lunaria_touch_user_items_updated_at();
```

Do not run rollback SQL in production without export/backup and explicit human approval.

## Next After Apply

1. Update `/items` from mock data to `lunaria_user_items` + `lunaria_gacha_pool`.
2. Update `/character` from mock data to `lunaria_character_states`.
3. Update gacha draw flow to keep `lunaria_user_items` in sync for new pulls.
4. Add equipment update API only after item ownership validation is implemented.

## Assumptions

- `lunaria_gacha_pool`, `lunaria_gacha_inventory`, and `lunaria_gacha_history` exist.
- `lunaria_users` exists and contains the default dev user.
- `lunaria_items` and `character_profiles` are still design-only and are intentionally not required.
