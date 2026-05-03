# Supabase 014-018 Apply Runbook

Created: 2026-05-03
Status: ready for manual SQL Editor apply

## Goal

Apply the currently pending Lunaria database changes in one controlled pass:

1. `014_gacha_content_v2.sql`
2. `015_gacha_pity_system.sql`
3. `016_gacha_pity_threshold.sql`
4. `017_diary_v1_schema.sql`
5. `018_core_memory_provenance.sql`

The app code is already backward-compatible with `017` and `018` not being applied yet, so this apply can wait until the user is ready.

## Generated Bundle

Codex generated a single paste-ready SQL file:

```text
lunaria-app/supabase/manual/014_018_lunaria_apply_bundle.sql
```

Regenerate it with:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run gacha:sql-pack
```

The source of truth remains:

```text
lunaria-app/supabase/migrations/*.sql
```

## Before Apply

Run this from local PowerShell:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run supabase:verify http://localhost:3000
```

Before `014-018` are applied, failures are expected:

```text
Gacha active pool total: 30/41
lunaria_gacha_pity_state missing
lunaria_gacha_history.pity_before missing
lunaria_diary_logs.title missing
lunaria_core_memory.source_date missing
```

This confirms the verifier is checking the right target.

## Apply Steps

1. Open Supabase Studio.
2. Confirm the target project is the Lunaria project.
3. Open SQL Editor.
4. Paste all of:

```text
lunaria-app/supabase/manual/014_018_lunaria_apply_bundle.sql
```

5. Run the SQL once.
6. Keep the SQL Editor output open until local verification passes.

## After Apply

Restart local dev server if it is running:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run dev
```

Then verify:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run supabase:verify http://localhost:3000
npm run gacha:verify http://localhost:3000
npm run gacha:smoke
```

Expected:

```text
supabase:verify: PASS
gacha:verify: PASS
gacha:smoke: PASS
```

## Manual Browser Checks

Open:

```text
http://localhost:3000/gacha
http://localhost:3000/admin/gacha
http://localhost:3000/diary
```

Check:

- `/gacha` shows Moon Fullness / pity progress.
- `/admin/gacha` shows active pool count `41`.
- `/diary` still loads.
- Generating a diary after `017` can persist title/tags/source count.
- New memories saved after `018` can persist provenance fields.

## If Something Fails

Do not keep rerunning blindly.

Capture:

```powershell
npm run supabase:verify http://localhost:3000
npm run gacha:verify http://localhost:3000
Get-Content .next-dev.log -Tail 80
Get-Content .next-dev.err.log -Tail 80
```

Then send the output to Codex.

## Safety Notes

- `014` updates gacha content and should raise active pool total from `30` to `41`.
- `015` adds the pity system foundation.
- `016` changes the pity threshold to 200 draws.
- `017` adds diary v1 columns.
- `018` adds core memory provenance columns.
- `017` and `018` have app-side legacy fallback, so applying them is safe but not urgent.
- Production Vercel release remains separate and is still affected by the root-directory/free-plan constraints.
