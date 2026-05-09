# Diary UI Acceptance Checklist

Date: 2026-05-09
Source: `lunaria/DIARY_UI_REVIEW_2026-05-04.md`
Owner: Codex 5.5
Scope: implementation checklist only; no code changes in this task

## Goal

Turn the existing `/diary` UI review into concrete acceptance criteria before implementation.

The review's main point is that the diary page already has a strong Lunaria atmosphere, but three UI choices can make the page feel more like surveillance or internal debug output than a warm diary shelf.

## Must Fix A: Hide `memory_changes` by default

### Problem

`memory_changes` can currently appear as a normal main-column section when entries exist. This risks making Luna feel like she is exposing an internal memory extraction list every time the user reads a diary.

### Desired Behavior

- `memory_changes` should not be expanded by default.
- The user should intentionally open it when they want to inspect what Luna may remember.
- The section should be framed as reviewable memory candidates, not final facts.

### Acceptance Criteria

- If `memory_changes.length === 0`, no memory-change section is shown.
- If `memory_changes.length > 0`, the default state is collapsed.
- The collapsed label includes a count, for example: `Things Luna may remember (3)`.
- Opening the section reveals the candidate list.
- Candidate labels should avoid implying final memory unless the action is explicitly confirmed.
- The section copy should make user control clear.

### Non-Goals

- Do not implement approve/reject/edit actions here.
- Do not change the diary generation schema.
- Do not write to `core_memories` from this UI.

## Must Fix B: Move internal stats behind a dev/details layer

### Problem

Stats such as message count, extraction count, importance, source messages, and generated time are useful for debugging, but they can feel too mechanical in the main diary experience.

### Desired Behavior

The main diary should keep warm, user-facing status only. Internal metrics should move into a collapsed details panel or a dev-only section.

### Acceptance Criteria

- Main user-facing diary view should not prominently show all raw internal stats.
- Keep only one gentle diary status if needed, such as `Diary available` / `Not generated yet`.
- Move these fields to a collapsed section or dev view:
  - `message_count`
  - `extraction_count`
  - `importance`
  - `source_message_count`
  - `generated_at`
- The collapsed section label should be neutral, for example: `Technical details` or `Diary source details`.
- The default user path should not require reading internal metrics.

### Non-Goals

- Do not remove the data from API responses.
- Do not change `/api/diary` or `/api/diary/month` behavior.
- Do not hide errors needed for local debugging entirely.

## Must Fix C: Move transcript lower in the main flow or separate it clearly

### Problem

The transcript currently behaves like side information. For a diary page, the user's mental model is usually: diary summary first, source conversation later. If the raw conversation feels too prominent or disconnected, it can confuse what is authoritative.

### Desired Behavior

The main flow should be:

1. Luna's diary / summary
2. Events
3. Topics
4. Unresolved issues
5. Next topics
6. Memory candidate details, collapsed
7. Source conversation, collapsed and clearly secondary

### Acceptance Criteria

- Source conversation is collapsed by default.
- Source conversation appears after the diary content, not as a competing emotional center.
- The label should be clear, for example: `Source conversation for this day`.
- Each message should keep role and time if available.
- Empty transcript state should be gentle and non-alarming.

### Non-Goals

- Do not create a separate `/diary/[date]/transcript` route in this task unless explicitly chosen later.
- Do not change message storage.
- Do not alter diary generation.

## Nice-To-Have Later

| Item | Value | Priority |
|---|---|---:|
| Add previous/next day jump affordance polish | Better diary browsing | P2 |
| Make Luna comment visually distinct | Helps user feel Luna's voice | P2 |
| Improve empty states | Reduces cold/system feel | P2 |
| Add small month shelf glyphs | Better scanability | P3 |
| Add timestamp display per source message | Better transcript context | P3 |
| Add better error color/copy | Less alarming failures | P3 |

## Implementation Guardrails

- Keep changes inside the diary page unless a tiny helper is clearly justified.
- Do not touch Supabase migrations.
- Do not change API contracts unless a separate task approves it.
- Do not implement memory writes from the diary page in this task.
- Run `npm run build` and then `npx tsc --noEmit --pretty false` sequentially after implementation.

## Suggested Codex Implementation Plan

1. Inspect current `lunaria-app/app/diary/page.tsx` structure.
2. Add local state for showing memory candidates if needed.
3. Convert memory changes section to a collapsed `details` or controlled toggle.
4. Move source stats into a collapsed details block.
5. Move transcript/source conversation below main diary content and keep it collapsed by default.
6. Verify no API or DB changes were introduced.
7. Run build/typecheck.
8. Update `PROGRESS.md`, `REVIEW_LOG.md`, and metrics.

## Stop Conditions

Stop and ask before proceeding if implementation requires:

- New DB fields.
- New writes to memory tables.
- Diary generation prompt changes.
- Route structure changes.
- Production deploy.
