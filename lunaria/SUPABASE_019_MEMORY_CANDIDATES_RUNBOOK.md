# Supabase 019 Memory Candidates Apply Runbook

Created: 2026-05-04
Status: ready for manual Supabase SQL Editor apply

## Purpose

`019_memory_candidates.sql` adds a review queue for long-term memory candidates.

This supports the architecture principle that conversation and diary extraction should not immediately become durable core memory. New extracted candidates can be reviewed, approved, rejected, merged, or archived later.

## Apply Order

Apply after the existing 014-018 bundle has already passed verification.

1. Open Supabase SQL Editor for the Lunaria project.
2. Paste and run `lunaria-app/supabase/migrations/019_memory_candidates.sql`.
3. Restart local dev server if it is running.
4. Run:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run supabase:verify http://localhost:3000
npm run gacha:smoke
```

## Expected Verification

`npm run supabase:verify` should include:

```text
PASS Memory candidate columns
```

`npm run gacha:smoke` should include either:

```text
PASS /api/memory/candidates: 0 candidates
```

or, if candidates already exist:

```text
PASS /api/memory/candidates: N candidates
```

Before 019 is applied, smoke test may safely show:

```text
PASS /api/memory/candidates: table not applied yet
```

## What Changes In App Behavior

After 019 is applied:

- New conversation-derived `long_term_candidate` extraction saves into `lunaria_memory_candidates` with `status='pending'`.
- Existing confirmed/active core memories continue to work.
- If 019 is not yet applied, the app does not crash. It temporarily falls back to legacy candidate storage.

## Follow-Up Work

Next implementation should add a review UI for:

- approve candidate -> save/merge into core memory
- reject candidate -> keep audit trail but do not use in prompts
- archive candidate -> hide from default queue
- link candidate source date back to `/diary?date=YYYY-MM-DD`
