# Antigravity 2 Lunaria Auto-Development Pass 2026-06-02

Purpose: use Antigravity 2 as a focused implementation partner for Lunaria, while Codex continues queue orchestration, promotion, and review work.

## Workspace

```text
C:\Users\yuuve\CascadeProjects\lunaria-app
```

## Main Goal

Make one visible, user-facing Lunaria improvement that moves the product toward release readiness.

Prioritize in this order:

1. Conversation quality and Japanese UI copy.
2. Main chat screen usability and empty/loading/error states.
3. Gacha / Moon Box result clarity and the path back to conversation.
4. Character expression and portrait presentation.
5. Small consistency fixes across diary, memory, items, and character pages.

## Coordination Rules

- Codex may be running implementation or promotion workers in parallel.
- Before editing, inspect `git status --short`.
- Do not revert unrelated dirty files.
- Avoid broad changes in files already heavily modified unless the specific edit is small and easy to review.
- Do not replace `app/page.tsx` wholesale.
- Prefer one small improvement over a large rewrite.
- If the safest action is only a review, write the findings and exact next patch suggestion instead of forcing edits.

## Product Boundary

Keep these boundaries intact:

```text
AI reply != diary != long-term memory != profile != character state != gacha event
```

Do not change:

- Supabase schema, migrations, policies, or real data.
- API contracts for `/api/chat`, `/api/messages`, `/api/diary`, or `/api/gacha/*`.
- Auth, `.env*`, billing, deployment, production database, or secrets.
- Core business logic unless a tiny UI-facing guard is unavoidable.

## Lunaria Direction

Lunaria is not a generic assistant dashboard and not a gacha-first game.

Short definition:

```text
30 seconds of conversation grows a diary, memory, and relationship with Luna.
```

The UI/copy should feel:

- quiet, companion-like, and useful
- Japanese-first, not translated SaaS copy
- emotionally close, but not clingy
- dark, moonlit, and readable
- restrained rather than flashy

Avoid:

- pressure, scarcity, FOMO, paid-game style copy
- medical/mental-health professional framing
- maid/servant/operator/system language
- technical labels exposed as the main user-facing copy

Prefer terms like:

```text
話す / 拾う / しまう / 棚から外す / 月箱 / 今日の日記 / 記憶の棚 / そっと置いておく
```

## Suggested Low-Conflict Improvements

Choose one:

- Improve the main chat empty state so it invites one natural Japanese conversation.
- Improve quick prompts so they sound like real Japanese conversation starters.
- Improve loading/error text so it feels like Luna, not a system message.
- Improve the gacha result CTA so it naturally returns to conversation.
- Improve mobile layout text density without changing data flow.
- Add a tiny visual/copy polish to diary or memory pages that makes state clearer.

## Files To Inspect First

```text
docs/BRAND_GUIDE.md
docs/LUNARIA_VISUAL_GUIDE.md
docs/UI_COLOR_PALETTE.md
docs/GACHA_DESIGN_PHILOSOPHY.md
app/page.tsx
app/gacha/page.tsx
app/globals.css
components/character/LunariaPortrait.tsx
components/lunaria/LunariaPortrait.tsx
```

## Files You May Edit

Primary:

```text
app/page.tsx
app/gacha/page.tsx
app/gacha/inventory/page.tsx
app/diary/page.tsx
app/memory/page.tsx
app/items/page.tsx
app/character/page.tsx
app/globals.css
components/character/LunariaPortrait.tsx
components/lunaria/LunariaPortrait.tsx
```

Only edit other files if the selected improvement cannot work otherwise, and record why.

## Verification

Run the narrowest useful checks first. Use more if the change touches shared UI or types.

Preferred:

```powershell
npx tsc --noEmit --pretty false
npm run build
```

If build is already known to be blocked by unrelated work, record the blocker and run a narrower check.

## Required Result Note

At the end, create or update:

```text
docs/ANTIGRAVITY_LUNARIA_AUTO_DEV_RESULT_2026-06-02.md
```

Include:

- changed files
- what screen or flow visibly improved
- verification command and result
- any unrelated blockers
- remaining risk
- suggested next step for Codex

