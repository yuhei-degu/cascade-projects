# Supabase 020-021 Security Review

Date: 2026-05-09
Reviewer: Codex 5.5 self-review
Status: review required before apply

## Scope

Reviewed:

- `lunaria-app/supabase/migrations/020_user_items.sql`
- `lunaria-app/supabase/migrations/021_character_states.sql`
- `lunaria-app/scripts/character-verify.js`
- `lunaria-app/scripts/character-sql-pack.js`

Not reviewed:

- Actual Supabase project state.
- Production DB data.
- Browser/client direct access behavior after future DB-backed UI work.

## Summary

The migrations are additive and do not delete existing data. They create two new tables:

- `lunaria_user_items`
- `lunaria_character_states`

Both tables enable RLS and define owner-only policies for select/insert/update/delete.

## Positive Findings

- Existing `lunaria_gacha_inventory` and `lunaria_gacha_history` are preserved.
- Backfill in `020` is insert/upsert only.
- `021` seeds default character state rows without inferring equipment.
- No `security definer` functions are used.
- Trigger helper functions pin `search_path` to `public, pg_temp`.
- Policies use `to authenticated` and `(select auth.uid()) = user_id`, matching current Supabase RLS guidance.
- `UPDATE` has a corresponding `SELECT` policy, so updates should not silently fail due to missing visibility policy.

## Risks

| Risk | Severity | Notes | Mitigation |
|---|---:|---|---|
| Wrong project SQL Editor target | High | Manual SQL paste can hit the wrong Supabase project | Confirm target project before running |
| Dependency mismatch | High | `020` depends on gacha tables and `021` depends on users/gacha pool | Confirm `014`-`019` first |
| Array item references are not FK-enforced | Medium | `equipped_accessory_pool_ids` and `room_item_pool_ids` are UUID arrays | Validate ownership in app/API before equipment editing |
| Service-role bypass in current app architecture | Medium | Existing Next.js server code uses service role | Keep all mutation APIs server-side and validate user IDs before client access |
| Rollback can remove new data | Medium | Dropping tables after use loses user state/items projection | Backup/export before rollback in any important environment |

## RLS Checklist

- [x] RLS enabled on both new public tables.
- [x] `select` policy exists.
- [x] `insert` policy exists with `with check`.
- [x] `update` policy exists with `using` and `with check`.
- [x] `delete` policy exists.
- [x] Policies are scoped to `authenticated`.
- [x] Policies do not use mutable `user_metadata`.
- [x] No public `security definer` functions added.

## Apply Recommendation

Do not apply yet unless:

1. `014` through `019` are confirmed applied.
2. The target Supabase project is confirmed.
3. The user accepts the schema direction: `pool_id` references `lunaria_gacha_pool` for now, not future `lunaria_items`.
4. `SUPABASE_020_021_CHARACTER_ITEMS_RUNBOOK.md` is followed.

## Next Review Needed

Before DB-backed UI work, review:

- Whether `/items` should read via service-role API or authenticated client query.
- Whether equipment mutation should be an RPC to enforce ownership atomically.
- Whether `lunaria_user_items` should eventually split from `lunaria_gacha_pool` into a dedicated `lunaria_items` catalog.
