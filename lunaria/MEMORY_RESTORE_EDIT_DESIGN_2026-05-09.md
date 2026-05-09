# Memory Restore/Edit Design

Date: 2026-05-09
Owner: Codex 5.5
Status: Design ready, implementation not started
Scope: Memory governance UX/API design

## Goal

Give the user safe control over what Luna remembers without making memory feel like surveillance or a database admin screen.

## Current State

Already implemented:

- `/memory` lists core memories from `lunaria_core_memory`.
- `/memory` lists pending memory candidates from `lunaria_memory_candidates` when migration `019` is applied.
- Candidate actions exist:
  - approve -> creates confirmed core memory and marks candidate as merged.
  - archive -> marks candidate archived.
  - reject -> marks candidate rejected.

Known gap:

- There is no restore path for archived/rejected candidates.
- There is no edit path for core memory content.
- There is no soft archive/restore UI for core memories.

## Design Principles

- User is the final authority over durable memory.
- Diary entries remain historical records; memory is the curated carry-forward layer.
- Rejection should not be irreversible by accident.
- Editing a memory should preserve provenance and audit notes.
- Do not mix profile settings into core memories.

## Recommended UX

### Candidate states

| State | User wording | Available actions |
|---|---|---|
| pending | Needs review | Remember this / Review later / Remove from shelf |
| merged | Remembered | View memory |
| archived | Review later | Restore to review / Remove from shelf |
| rejected | Removed from shelf | Restore to review |

### Core memory states

| State | User wording | Available actions |
|---|---|---|
| candidate | Soft memory | Confirm / Edit / Archive |
| active | Active memory | Confirm / Edit / Archive |
| confirmed | Confirmed memory | Edit / Archive |
| archived | Archived memory | Restore |
| deleted | Deleted | Hidden by default; no UI restore in MVP |

## API Plan

### Candidate restore

Extend `PATCH /api/memory/candidates` action enum:

```ts
type CandidateAction =
  | 'approve'
  | 'reject'
  | 'archive'
  | 'pending'
```

Current `pending` action already maps to status `pending`; expose it in UI as `Restore to review` for archived/rejected candidates.

### Core memory update

Add `PATCH /api/memory` with body:

```ts
type MemoryPatchBody = {
  id: string
  action: 'archive' | 'restore' | 'confirm' | 'edit'
  content?: string
  notes?: string
}
```

Rules:

- `archive`: set `status='archived'`, append/update notes if provided.
- `restore`: set `status='active'` unless previous status was `confirmed`; use `status='confirmed'` only if explicitly sent later.
- `confirm`: set `status='confirmed'`, `last_confirmed_at=now`, `created_by='user_explicit'` only if appropriate.
- `edit`: update `content`, set `updated_at=now`, append notes such as `edited by user`.

### Validation

- `id` required.
- `content` for edit must be non-empty and length-limited.
- Only update rows for current `USER_ID`.
- Do not allow hard delete in MVP.

## UI Plan

### Phase 1: Candidate restore only

Low/medium risk:

- Add status filter for archived/rejected candidates.
- Show `Restore to review` button for archived/rejected candidate cards.
- Reuse existing `PATCH /api/memory/candidates` with `action='pending'`.

### Phase 2: Core memory archive/restore

Medium risk:

- Add `PATCH /api/memory`.
- Add `Archive` button on memory cards.
- Add archived status filter and `Restore` button.

### Phase 3: Core memory edit

Medium/high risk:

- Add inline edit or modal.
- Require explicit save/cancel.
- Show source date and confidence beside editable text.
- Keep edit notes for future audit.

## Verification

- `npm run build`
- `npx tsc --noEmit --pretty false`
- Manual local checks:
  - pending candidate -> archived -> pending
  - pending candidate -> rejected -> pending
  - active memory -> archived -> active
  - confirmed memory -> archive -> restore behavior matches policy
  - edit memory content and reload

## Stop Conditions

Stop before implementation if:

- DB columns required by provenance/status are missing.
- Migration `019` is not applied but candidate restore is being tested with real DB.
- A hard delete is requested.
- Production DB is the target.

## Recommended Next Implementation

Start with Phase 1 candidate restore UI because the API already supports `pending`. It is the smallest useful trust improvement.
