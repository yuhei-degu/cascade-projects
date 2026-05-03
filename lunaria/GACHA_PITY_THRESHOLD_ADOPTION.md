# Lunaria Gacha Pity Threshold Adoption

Created: 2026-05-03

## Decision

Launch the pity system at **200 draws**.

Claude's threshold review concluded:

- `100` draws is generous, but weakens the rarity of `urban_legend`.
- `500` draws keeps the original scarcity, but is too far away to feel like a real safety net.
- `200` draws is the best launch balance: reachable through steady daily play while keeping `urban_legend` special.

## Implementation

- `015_gacha_pity_system.sql` introduced the pity table and `draw_gacha_v2` at the initial 100-draw threshold.
- `016_gacha_pity_threshold.sql` replaces only `draw_gacha_v2` and changes the threshold check from `>= 99` to `>= 199`.
- `lib/lunaria/gacha.ts` now uses `PITY_THRESHOLD = 200`.
- `gacha:report`, `gacha:verify`, and admin stats also report a `/200` threshold.

## Supabase Apply Order

Run these in SQL Editor in this order:

1. `lunaria-app/supabase/migrations/014_gacha_content_v2.sql`
2. `lunaria-app/supabase/migrations/015_gacha_pity_system.sql`
3. `lunaria-app/supabase/migrations/016_gacha_pity_threshold.sql`

`014` and `015` are still required. `016` does not create tables; it is the threshold override for the launch setting.

## Verification

After SQL apply:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run gacha:report
npm run gacha:verify
npm run gacha:smoke
```

Expected:

- Active pool: `41`
- Moon fullness: available
- Pity progress strings use `/200`
- `gacha:verify` passes
- `gacha:smoke` passes

