# AssistantReply Integration Plan

Date: 2026-05-09
Owner: Codex 5.5
Status: Plan ready, implementation not started
Scope: Add structured assistant metadata without breaking current chat

## Goal

Move from plain assistant text toward a structured reply that can drive expression, motion, voice tone, topic tags, and future candidate creation.

## Current State

- Chat currently works as text-first UI.
- `lunaria-app/docs/ASSISTANT_REPLY_SCHEMA.md` proposes a structured object.
- `lib/lunaria/reactions.ts` already defines reaction IDs and context defaults.
- `/gacha` and visual placeholder surfaces can consume reaction-like state, but chat is not yet wired to it.

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

### Stage 1: Server-side parse, text response unchanged

- In chat route, try to parse model output as AssistantReply.
- Continue returning the same text shape to the current client.
- Log parse failures in development only.
- Do not create memory candidates from flags yet.

### Stage 2: Add optional metadata to response

- Extend response with optional `assistant_meta`.
- Existing clients ignore unknown fields.
- UI can map metadata to a portrait reaction later.

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

Recommended for MVP: option 1 or Stage 0/1 only. Do not destabilize chat for visual metadata.

## Verification

- Parser unit-style checks with valid JSON, invalid JSON, and plain text.
- `npm run build`
- `npx tsc --noEmit --pretty false`
- Manual chat happy path.

## Recommended Next Implementation

Implement Stage 0 only: add parser/type with no runtime chat changes. This is low risk and makes future work easier.
