# AssistantReply Integration Plan

Date: 2026-05-09
Owner: Codex 5.5
Status: Stage 0-2 implemented with fallback
Scope: Add structured assistant metadata without breaking current chat

## Goal

Move from plain assistant text toward a structured reply that can drive expression, motion, voice tone, topic tags, and future candidate creation.

## Current State

- Chat currently works as text-first UI.
- `lunaria-app/docs/ASSISTANT_REPLY_SCHEMA.md` proposes a structured object.
- `lib/lunaria/reactions.ts` already defines reaction IDs and context defaults.
- `/gacha` and visual placeholder surfaces can consume reaction-like state.
- `/api/chat` now parses final assistant output with the AssistantReply parser and returns optional `assistantMeta` in the final `done` event.
- The user-visible `reply` remains plain text and the current client can ignore unknown metadata.

## Target Shape

```ts
type AssistantReply = {
  message: string
  emotion?: 'warm' | 'playful' | 'sad' | 'serious' | 'calm' | 'surprised' | 'relieved' | 'worried'
  expression?: string
  motion?: string
  voice_tone?: 'soft' | 'firm' | 'playful' | 'sleepy' | 'bright' | 'quiet'
  topic_tags?: string[]
  should_create_memory_candidate?: boolean
  should_create_diary_candidate?: boolean
}
```

## Safe Rollout

### Stage 0: Types and parser only

- Add `lib/lunaria/assistant-reply.ts`.
- Export schema/type/parser.
- Parser returns `{ message: rawText }` if JSON parse fails.
- No chat behavior change.
- Status: Done.

### Stage 1: Server-side parse, text response unchanged

- In chat route, try to parse model output as AssistantReply.
- Continue returning the same text shape to the current client.
- Log parse failures in development only.
- Do not create memory candidates from flags yet.
- Status: Done, without changing prompts to require JSON.

### Stage 2: Add optional metadata to response

- Extend response with optional `assistantMeta`.
- Existing clients ignore unknown fields.
- UI can map metadata to a portrait reaction later.
- Status: Done.

### Stage 3: Portrait reaction mapping

- Add mapper:
  - expression + motion -> reaction ID if known.
  - fallback to context reaction.
- Update chat UI to display reaction without changing message storage.

### Stage 4: Candidate flags

- Treat `should_create_memory_candidate` as a hint, not authority.
- Server-side extraction/governance still decides whether to write a candidate.
- Do not let gacha/item events create core memory.

## Compatibility Rules

- Never require JSON from the model before fallback is tested.
- Do not break streaming until a streaming metadata protocol is chosen.
- Store the user-visible message separately from internal metadata.
- Do not rewrite historical messages.
- Keep `message` as the only required field.

## Open Decision

Streaming path:

1. Keep streaming text-only and parse metadata in a second non-streaming pass.
2. Switch chat to non-streaming structured output later.
3. Stream text chunks and send a final metadata event.

Chosen for MVP: keep streaming text-first, parse the final raw output, and send optional final metadata. Do not require structured model output yet.

## Verification

- Parser unit-style checks with valid JSON, invalid JSON, and plain text.
- `npm run build`
- `npx tsc --noEmit --pretty false`
- Manual chat happy path.

## Recommended Next Implementation

Next implementation: map `assistantMeta.expression` and `assistantMeta.motion` to a safe portrait reaction in the chat UI. Keep message storage text-only.
