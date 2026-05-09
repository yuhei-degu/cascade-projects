# Lunaria Portrait Consolidation Plan

Date: 2026-05-09
Owner: Codex 5.5
Status: Plan ready, refactor not started
Scope: Two current portrait components

## Current Components

### `components/lunaria/LunariaPortrait.tsx`

Used by earlier reaction foundation.

Strengths:

- Uses `LunariaReactionId` from `lib/lunaria/reactions.ts`.
- Supports portrait asset fallback paths.
- Better fit for production asset pipeline.

Limitations:

- Reaction-level abstraction only.
- Does not directly preview expression/motion lists.

### `components/character/LunariaPortrait.tsx`

Accepted from Claude visual mock work.

Strengths:

- Supports direct `expression` and `motion` props.
- Useful for `/character` preview and mock animation testing.
- Has SVG/CSS placeholder behavior.

Limitations:

- Has mojibake comments.
- Separate type universe from `reactions.ts`.
- Not tied to asset fallback strategy.

## Recommendation

Keep both short-term, but define ownership clearly:

| Component | Role | Keep? |
|---|---|---|
| `components/lunaria/LunariaPortrait.tsx` | Production-facing reaction/asset component | Yes |
| `components/character/LunariaPortrait.tsx` | Preview/mock expression-motion component | Yes for now |

Do not merge immediately. A merge now risks breaking `/gacha` or `/character` without delivering user value.

## Consolidation Target

Eventually create one adapter layer:

```ts
type LunariaVisualState = {
  outfitId?: string
  reaction?: LunariaReactionId
  expression?: string
  motion?: string
  imageUrl?: string
}
```

Then:

- Chat/gacha/diary use `reaction`.
- Character preview can still drive `expression` and `motion`.
- Asset layer maps both paths to final image/Live2D inputs.

## Safe Refactor Sequence

1. Clean comments in `components/character/LunariaPortrait.tsx` to ASCII/English.
2. Extract expression/motion union types to `lib/lunaria/visual-state.ts`.
3. Add mapping from expression+motion to reaction ID where possible.
4. Update `/character` to import shared visual types.
5. Only then consider merging placeholder rendering.

## Stop Conditions

Stop before refactor if:

- `/gacha` result modal behavior changes unexpectedly.
- `/character` preview loses expression/motion controls.
- Final asset path conventions are still undecided.

## Recommended Next Implementation

Start with comment/type cleanup only. Do not merge components in the same commit.
