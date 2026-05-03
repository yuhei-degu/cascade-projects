# Lunaria Architecture Principles

Created: 2026-05-04
Status: adopted product/architecture guardrail

## 0. Positioning

Lunaria should start as an AI diary and companion app, but the internal architecture should be prepared for a broader AI companion life-log OS.

The long-term system may include:

- AI conversation
- diary generation
- long-term memory
- user profile
- character personality
- 2D / Live2D / visual expression
- gacha, items, outfits, room assets
- personality tuning
- alternate character profiles, including future female-oriented models
- external app integrations
- future AI glasses or ambient input

This document is not a mandate to build everything now. It is the architecture constitution that keeps today's implementation from blocking tomorrow's expansion.

## 1. Core Rule: Do Not Collapse Surfaces

Do not treat these as the same thing:

```text
AI reply = screen display = diary = long-term memory = character state
```

That shortcut feels fast in the MVP, but it breaks the product later.

Correct shape:

```text
User input
  -> conversation handling
  -> assistant reply
  -> semantic extraction
  -> diary candidate
  -> memory candidate
  -> character state update
  -> visual expression / motion tags
  -> life_events when an event should be recorded
```

The assistant's visible reply and the internal records used for diary, memory, events, and character state must stay separate.

## 2. Conceptual Layers

### Core Layer

Owns the user-facing life-log core:

- users
- user profiles
- conversations
- messages
- diary entries
- core memories
- memory candidates

### Character Layer

Owns Luna as a character:

- character profile
- base personality
- personality tuning parameters
- affinity / relationship state
- expression state
- motion state
- outfit / room / item state

### Event Layer

Owns normalized events that can later come from chat, diary, memory, gacha, app integrations, or AI glasses:

- life events
- event sources
- event links
- external events

### Integration Layer

Owns future outside-world inputs:

- calendar
- health
- location
- mobile app
- photos
- notifications
- external app hooks
- AI glasses

## 3. Current Naming Reality

The ideal conceptual names are generic, but the current repository uses `lunaria_*` tables.

Do not rename tables just for conceptual purity right now. Prefer evolutionary additions:

| Concept | Current / near-term name |
|---|---|
| messages | `lunaria_messages` |
| diary entries | `lunaria_diary_logs` now, possibly `lunaria_diary_entries` later |
| core memories | `lunaria_core_memory` |
| user profiles | `lunaria_user_profile` |
| gacha pool/history | existing `lunaria_gacha_*` tables |

If we introduce new tables, prefer explicit `lunaria_` names until a full schema migration is worth the cost.

## 4. Life Events

`life_events` should become the long-term expansion spine, but it does not need to be the first thing implemented.

Purpose:

- Keep external and internal events out of raw chat logs.
- Preserve source, time, privacy level, and raw reference.
- Let diary, memory, notification, and character state react to events without being tightly coupled.

Future event shape:

```ts
type LifeEvent = {
  user_id: string
  event_type:
    | 'chat'
    | 'diary'
    | 'memory'
    | 'gacha'
    | 'item'
    | 'location'
    | 'photo'
    | 'calendar'
    | 'health'
    | 'external_app'
  source:
    | 'lunaria_chat'
    | 'lunaria_diary'
    | 'ai_glasses'
    | 'mobile_app'
    | 'manual_input'
    | 'calendar'
    | 'health_app'
    | 'gacha_system'
  occurred_at: string
  title?: string
  summary?: string
  raw_ref?: string
  privacy_level: 'normal' | 'sensitive' | 'private'
  metadata: Record<string, unknown>
}
```

Adoption rule:

- Do not block diary/memory work on `life_events`.
- Add it once diary and memory provenance are stable enough that events have a clear purpose.

## 5. Diary Principles

Diary is not just one generated text blob. It is a composed daily recollection.

Diary should support:

- generate on demand
- date shelf / month shelf
- detail view
- source conversation/message references
- regeneration
- future editing
- future deletion
- prompt version tracking
- memory candidate extraction

Diary fields should evolve toward:

- `id`
- `user_id`
- `diary_date`
- `source_conversation_id`
- `source_message_ids`
- `title`
- `body` or `summary`
- `events`
- `emotion_tags` / `emotions`
- `topics`
- `generated_by`
- `prompt_version`
- `created_at`
- `updated_at`
- `deleted_at`

Guardrails:

- Do not infer what the user did outside explicit conversation content.
- Do not make raw transcripts the emotional center of the UI.
- Keep diary as Luna's composed recollection, not surveillance.
- If diary creates memory, create `memory_candidates` first or preserve clear provenance.

## 6. Memory Principles

Core memory is for long-term continuity. It must stay selective.

Good candidates:

- continuing interests
- long-term worries
- major goals
- important relationships
- stable life background
- information that affects Luna's relationship with the user

Bad candidates:

- gacha results
- temporary moods
- one-off small talk
- UI operations
- item acquisition logs
- outfit changes

Core memory should evolve toward:

- `id`
- `user_id`
- `content`
- `memory_category`
- `importance`
- `source_type`
- `source_id`
- `source_date`
- `confidence`
- `status`
- `created_at`
- `updated_at`
- `deleted_at`

Minimum `source_type` values:

- `conversation`
- `diary`
- `profile`
- `manual`

Near-term priority:

- Add a real `memory_candidates` flow before more aggressive automatic memory saving.

## 7. Profile Principles

Stable profile facts should not be duplicated into core memory.

Profile belongs in profile storage, not memory storage:

- display name
- age band
- gender
- relationship status
- occupation
- communication preference

Rules:

- Profile is stable information.
- Do not overwrite profile from casual conversation.
- Prefer explicit settings UI for changes.
- Inject only relevant profile details into prompts.
- Keep profile and core memory separate.

## 8. Character Personality Principles

Luna's root personality should be fixed.

Fixed roots:

- childhood-friend feeling
- light but not shallow
- does not run away from hard topics
- does not blindly affirm everything
- has humor
- becomes serious when needed
- carries the user's life log together
- feels like a comrade / accomplice, not a generic assistant

Tunable parameters should adjust style, not identity:

- `sweetness`
- `teasing`
- `energy`
- `practicality`
- `distance`
- `seriousness`

Rules:

- Do not let users freely rewrite Luna's core personality.
- Store tuning as bounded parameters.
- Convert parameters into natural prompt text.

## 9. Assistant Reply Structure

The assistant reply should evolve from a raw string to a structured payload.

Future shape:

```ts
type AssistantReply = {
  message: string
  emotion?: string
  expression?: string
  motion?: string
  voice_tone?: string
  topic_tags?: string[]
  should_create_memory_candidate?: boolean
  should_create_diary_candidate?: boolean
}
```

Rules:

- The UI displays `message`.
- 2D / Live2D uses `expression`, `motion`, and `voice_tone`.
- Memory and diary systems should not rely on parsing the visible reply alone.

Near-term priority:

- Design a backwards-compatible response shape while still streaming plain text to the current chat UI.

## 10. Gacha Principles

Gacha is not the core memory system. It is a relationship and life-log expression layer.

Gacha can contain:

- outfits
- accessories
- backgrounds
- expressions
- motions
- room items
- special voice/copy lines

Gacha results should flow to:

- gacha pulls/history
- user item inventory
- character state if equipped or active
- optional `life_events` summary later

Gacha results must not be stored in `core_memories`.

## 11. 2D / Live2D Principles

Do not wire the visible AI sentence directly to the rendering engine.

Correct shape:

```json
{
  "message": "まあまあ、今日はそこまで頑張ったなら十分じゃない？",
  "emotion": "gentle_smile",
  "expression": "soft",
  "motion": "tilt_head",
  "voice_tone": "warm"
}
```

Rendering phases:

1. Static portrait
2. Expression variants
3. Simple motion
4. Live2D / Spine / VRM
5. Voice and richer animation

Conversation logic and visual rendering must remain loosely coupled.

## 12. External Input Principles

External inputs should never go directly into diary, memory, or chat logs.

Correct shape:

```text
external input
  -> external_events
  -> life_events
  -> diary candidate if useful
  -> memory candidate if useful
  -> conversation topic if useful
```

Future sources:

- voice input
- AI glasses camera observations
- location
- steps / movement
- calendar
- health
- photos
- notifications
- quick notes
- other app events

## 13. Phasing

### Phase 1: Core MVP

- AI conversation
- messages
- user profile
- diary generation
- date shelf
- diary detail

### Phase 2: Memory

- core memory provenance
- memory viewer
- memory candidates
- source type / source id
- diary-derived memory candidates
- conversation-derived memory candidates

### Phase 3: Character State

- character state
- personality tuning
- structured assistant reply
- expression / motion tags
- static portrait or expression variants

### Phase 4: Gacha Expansion

- banners
- items
- pulls
- inventory
- equipped outfit/background/expression integration

### Phase 5: Event Spine

- life events
- event sources
- event links
- internal event logging for chat/diary/memory/gacha

### Phase 6: Advanced Integrations

- Live2D
- voice
- alternate character profiles
- AI glasses
- calendar / health integrations

## 14. Implementation Rules For Now

Always protect these boundaries:

- Do not mix chat logs and diary entries.
- Do not mix diary and long-term memory.
- Do not put gacha results in core memory.
- Do not duplicate profile facts into core memory.
- Keep assistant replies ready to become structured.
- Preserve source/provenance fields when saving generated records.
- Prefer `deleted_at` over hard delete for user-facing records.
- Save prompt versions for generated content.
- Apply migrations in small, safe phases.

## 15. Near-Term Adopted Queue

The next implementation direction should be:

1. Memory candidate model and review flow.
2. Assistant reply structured-output design.
3. Diary source references: `source_message_ids`, `prompt_version`, and future `deleted_at`.
4. Minimal character state design.
5. Minimal life event design after diary/memory provenance stabilizes.

## 16. Final Aim

Lunaria's smallest durable core is:

- AI conversation
- diary
- long-term memory
- profile
- life events
- character state

With those six pillars, the product can later grow into:

- gacha
- 2D / Live2D
- voice
- alternate character models
- AI glasses
- external app integrations
- paid features
- notifications
- life-log analysis

The first release may look like an AI diary app. The internal architecture should keep the path open toward an AI companion life-log OS.
