# Lunaria AI Diary and Memory Review Design

Created: 2026-05-03
Status: design note + implemented surface alignment.

## 2026-05-03 Review Alignment

Claude reviewed this design in `LUNARIA_DIARY_MEMORY_REVIEW.md`.

Decisions accepted from the review:

- Do not add `user_day` or `user_day_summary` to the diary schema.
- Do not infer what the user did outside explicit conversation content.
- Keep "what we talked about" and "what Luna remembers long-term" separate.
- Treat D1/D2 plus month shelf and generation fallback as implemented.
- Diary schema expansion was prepared as `017_diary_v1_schema.sql`; apply after the gacha DB is stable.
- Do not start D4 memory browsing until memory provenance columns exist.

Product guardrail:

> Luna may remember the shape of a conversation, but she should not pretend she watched the user's day.

## 0. Positioning

AI diary is important, but it should not outrank the current gacha stabilization work.

Current priority:

1. Apply Supabase `014` -> `015` -> `016`
2. Confirm `gacha:verify` and `gacha:smoke`
3. Stabilize Moonbox v2 and pity operations
4. Return to AI diary / memory browsing as a designed product surface

This document exists so we do not lose the intended shape of the diary feature while focusing on the current release path.

## 1. Product Principle

The diary should not feel like a raw database viewer.

It should feel like:

- Luna quietly kept the shape of the day
- The user can return to a date without feeling surveilled
- Memory is warm, selective, and inspectable
- Raw conversation can be available, but the primary surface is a composed recollection

Working metaphor:

> A shelf where Luna keeps the days, not a log file.

## 2. Current Implementation Snapshot

Already present:

- `POST /api/diary`
  - Generates a diary for a date from `lunaria_extractions`
  - Falls back to same-day `lunaria_messages` when extractions are empty
  - Upserts into `lunaria_diary_logs`
  - Returns generation metadata for the UI
- `GET /api/diary?date=YYYY-MM-DD`
  - Fetches one diary row by date
- `GET /api/diary/month?month=YYYY-MM`
  - Fetches a lightweight month shelf of generated diary days
- `lunaria_diary_logs`
  - `diary_date`
  - `summary`
  - `events`
  - `emotions`
  - `luna_comment`
  - `unresolved_issues`
  - `next_topics`
  - `importance`
- `lunaria_messages`
  - Stores user/assistant messages with `created_at`
- `GET /api/messages?date=YYYY-MM-DD`
  - Fetches same-day transcript messages using the JST day range helper
- `/diary`
  - Date picker
  - Existing diary display
  - Generate-on-demand action
  - Collapsible same-day transcript
  - Monthly diary shelf

Missing:

- No clear retention / privacy surface
- Diary schema v1 migration exists but may still be unapplied in Supabase
- No memory provenance surface for "Luna remembers this because..."

## 3. What A User Should Be Able To Ask

Minimum target:

- "What did we talk about on 2026-05-03?"
- "What was I doing that day?"
- "What did Luna think mattered?"
- "Were there unresolved topics?"
- "Can I see the actual messages from that day?"

Important distinction:

- Diary answer: Luna's composed summary of the day
- Conversation answer: actual chat transcript for that date
- Memory answer: long-term facts or preferences that were extracted from that day

These should be related, but not collapsed into one bucket.

## 4. Proposed Data Surfaces

### 4.1 Daily Diary

Primary user-facing card for a date.

Fields:

- `date`
- `title`
- `summary`
- `events`
- `mood`
- `luna_comment`
- `unresolved_issues`
- `next_topics`
- `importance`

Potential future additions:

- `conversation_summary`
- `memory_changes`
- `talked_about`
- `source_message_count`
- `generated_at`
- `edited_by_user_at`

Do not add `user_day` / `user_day_summary`.

If user activities are ever shown, they must be explicitly mentioned by the user and should live in `events` or a narrowly named `user_mentioned_activities` field with source references.

### 4.2 Conversation Transcript

Secondary, expandable section.

Purpose:

- Trust and inspectability
- "What exactly did I say?"
- Debugging memory behavior

Rules:

- Show by date
- Keep user/assistant roles clear
- Avoid making raw logs the emotional center of the UI
- Consider a "show exact conversation" affordance instead of default-open transcript

### 4.3 Memory Changes

This is the most sensitive surface.

The user should eventually be able to see:

- What Luna remembered
- When it was remembered
- Why it was remembered
- Whether it is still active
- Whether the user wants to delete or correct it

Possible fields:

- `memory_id`
- `memory_type`
- `content`
- `source_date`
- `source_message_id`
- `confidence`
- `status`
- `created_at`
- `last_confirmed_at`

## 5. Daily Summary Shape

Recommended diary schema, version 1:

```json
{
  "date": "2026-05-03",
  "title": "月箱の準備を進めた日",
  "summary": "今日はガチャの月箱と天井まわりを整理し、次に何を安定させるかを決めていた。",
  "events": ["月箱v2の採用候補を整理した", "AI日記で日付指定の見返し方を相談した"],
  "talked_about": ["月箱v2", "天井200連", "AI日記", "記憶の見せ方"],
  "emotions": { "joy": 1, "anxiety": 1, "loneliness": 0 },
  "luna_comment": "今日は、未来の棚を作る話をした日だったね。今すぐ全部じゃなくていい、でも忘れないように置いておこう。",
  "unresolved_issues": ["Supabase 014/015/016 apply", "AI diary UI design"],
  "next_topics": ["DB適用後の動作確認", "日記UIの設計レビュー"],
  "memory_changes": [
    {
      "type": "preference",
      "content": "ユーザーは重要でない作業をClaudeへ振り分けたい",
      "action": "candidate"
    }
  ],
  "importance": 4,
  "source_message_count": 18,
  "generated_at": "2026-05-03T12:00:00.000Z"
}
```

## 6. What To Store vs What To Show

Store:

- Structured summaries
- Events
- User-state observations
- Long-term memory candidates
- Links to source message ranges

Show by default:

- Date
- Title
- Luna comment
- Summary
- Events
- Next topics

Show on demand:

- Full transcript
- Memory changes
- Extraction/debug fields

Do not show as default:

- Raw scoring
- Model routing details
- Internal prompts
- Hidden importance calculations

## 7. Date Handling

Use JST for user-facing diary dates.

Current code often uses:

```ts
new Date().toISOString().split('T')[0]
```

Risk:

- Around midnight in Japan, UTC date and JST date can diverge.

Future implementation should add:

- `getJstDateString(date?: Date): string`
- `getJstDayRange(date: string): { startIso: string; endIso: string }`

These helpers should be used by:

- `POST /api/diary`
- `GET /api/diary`
- future `GET /api/messages?date=YYYY-MM-DD`
- future diary page

## 8. API Proposal

### GET `/api/diary?date=YYYY-MM-DD`

Already exists.

Future response should include:

- diary row
- `generated: boolean`
- `has_messages: boolean`
- `message_count`
- maybe `memory_changes_count`

### POST `/api/diary`

Already exists.

Future behavior:

- Accept `{ date, force?: boolean }`
- Use JST date by default
- Return generated diary plus counts

### GET `/api/messages?date=YYYY-MM-DD`

Future addition.

Behavior:

- If no date: keep current latest 60 behavior
- If date is present: fetch messages where `created_at` is within JST day range
- Return chronological messages

### GET `/api/diary/month?month=YYYY-MM`

Future addition.

Purpose:

- Calendar view
- Days with diary
- Importance markers
- Emotion/mood tiny markers

## 9. UI Proposal

Route:

- `/diary`

Sections:

- Date picker / previous / next
- Diary card
- "Luna's note"
- "What happened"
- "What we talked about"
- "Still open"
- "Next time"
- Collapsible "Exact conversation"
- Collapsible "Memory changes"

Empty states:

- No messages:
  - "この日は、まだルナの棚にしまうものがないみたい。"
- Messages exist but no diary:
  - "この日のこと、今まとめる？"
- Diary generation failed:
  - "うまく綴れなかった。もう一度だけ、月明かりを集めてみる。"

## 10. Privacy and Control

The diary feature should make the user feel ownership, not capture.

Needed eventually:

- Delete diary for a date
- Regenerate diary for a date
- Hide raw transcript by default
- Show what became long-term memory
- Delete or correct a memory
- Explain "Luna remembers this because..."

## 11. Implementation Phases

### Phase D0: Design Review

- Claude reviews this document for product tone and memory taxonomy
- Codex reviews implementation risk and schema/API deltas
- No code changes required

### Phase D1: Read-only Diary Page

Status: implemented on 2026-05-03.

- Add `/diary`
- Add date picker
- Fetch existing `GET /api/diary`
- Show empty states
- No schema changes

### Phase D2: Date-filtered Messages

Status: implemented on 2026-05-03 for basic day transcript fetching and display.

- Extend `GET /api/messages?date=YYYY-MM-DD`
- Add JST day range helper
- Add collapsible transcript to `/diary`

### Phase D3: Generate-on-demand

Status: implemented on 2026-05-03 with backwards-compatible DB fallback.

- Add "summarize this day" action
- Improve `POST /api/diary` response
- Use JST helper
- Add loading/error states
- Refresh month shelf after generation

Implemented D3 work:

- Add diary schema v1 fields: `title`, `talked_about`, `source_message_count`, `generated_at`
- Add `memory_changes` as a small candidate list
- Update prompt / parser / UI for the new fields
- Add `017_diary_v1_schema.sql`
- Keep legacy diary upsert fallback so the app still works before Supabase applies `017`

Remaining D3 work:

- Apply `017` in Supabase after `014` / `015` / `016`
- Regenerate a diary and confirm v1 fields persist

### Phase D3.5: Memory Provenance Schema

Status: pending. Must happen before D4.

Add provenance fields to long-term memory storage so Luna can explain why something is remembered:

- `source_date`
- `source_message_id`
- `confidence`
- `status`
- `last_confirmed_at`

Suggested next migration number after diary v1 schema: `018_core_memory_provenance.sql`.

If another migration lands first, use the next available number and update this document.

### Phase D4: Memory Change Surface

Status: blocked until D3.5 exists.

- Add source links for long-term memories
- Show memory candidates / saved memories by date
- Add delete/correct flows

## 12. Open Questions

- Should the diary be written in Luna's voice, neutral voice, or a mix?
- Should exact transcript be visible by default or behind a button?
- How should explicitly mentioned user activities be shown without implying surveillance?
- Should users edit diary entries?
- Should long-term memory require confirmation before becoming active?
- How long should raw messages be retained?

## 13. Recommendation

Keep schema-heavy diary/memory work behind gacha stabilization in priority, but continue light UX polish and documentation alignment.

The first implementation is now deliberately modest and already in place:

- `/diary`
- date picker
- existing diary display
- empty state
- no new DB migration

Next, add diary schema v1 fields only after the pending gacha DB migrations are applied and verified.

Then add memory provenance before any memory browsing UI.

