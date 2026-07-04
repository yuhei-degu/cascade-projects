# Antigravity UI Pass 2026-05-27

Purpose: handoff prompt for Antigravity 2 to improve Lunaria's screen design, Japanese UI copy, and motion feel without changing data contracts or product architecture.

## Target

Workspace:

```text
C:\Users\yuuve\CascadeProjects\lunaria-app
```

Local app:

```text
http://localhost:3009/
```

Current priority:

1. Make the main conversation screen feel like the real center of Lunaria.
2. Improve all visible Lunaria screens with consistent Japanese copy and calmer visual hierarchy.
3. Improve Moon Box / gacha presentation and result motion, but keep it gentle and non-predatory.
4. Keep mobile/narrow layouts usable: chat and primary actions must appear without being pushed away by the portrait.

## Product Direction

Lunaria is not a generic assistant dashboard and not a gacha-first game.

Short definition:

```text
30 seconds of conversation grows a diary, memory, and relationship with Luna.
```

Brand words:

```text
月 / 夜 / 記憶 / 日記 / 幼なじみ / 軽さ / 逃げない / 共犯者 / 静かな未来感
```

The UI should feel:

- quiet, companion-like, and useful
- Japanese-first, not translated SaaS copy
- emotionally close, but not clingy
- dark, moonlit, and readable
- restrained rather than flashy

## Important Guardrails

Do not change these boundaries:

```text
AI reply != diary != long-term memory != profile != character state != gacha event
```

Do not modify DB migrations, Supabase policies, API contracts, auth, env files, or payment/deploy settings.

Do not store gacha results in core memories.

Do not make gacha copy feel like pressure, scarcity, FOMO, or paid-game monetization.

Do not make Luna sound like:

- a maid, servant, operator, or system
- a medical/mental-health professional
- a sales funnel
- a clingy romance game heroine

Avoid UI/copy terms such as:

- ログ収集
- 分析しました
- コンプリート
- アンロック
- 今だけ
- 最後のチャンス
- ご主人様

Prefer Lunaria-like terms:

- 話す
- 拾う
- しまう
- 棚から外す
- 月箱
- 今日の日記
- 記憶の棚
- そっと置いておく

## Files To Review First

Read these before changing UI:

```text
docs/BRAND_GUIDE.md
docs/LUNARIA_VISUAL_GUIDE.md
docs/UI_COLOR_PALETTE.md
docs/GACHA_DESIGN_PHILOSOPHY.md
../lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md
../PROGRESS.md
```

## Main Files You May Edit

Primary screens:

```text
app/page.tsx
app/gacha/page.tsx
app/gacha/inventory/page.tsx
app/diary/page.tsx
app/memory/page.tsx
app/items/page.tsx
app/character/page.tsx
app/character/gallery/page.tsx
app/globals.css
```

Optional visual components:

```text
components/character/LunariaPortrait.tsx
components/lunaria/LunariaPortrait.tsx
```

Only edit other files if the UI change cannot work without it, and explain why.

## Requested Improvements

### Main Conversation Screen

- Treat the chat as the primary screen, not a game menu.
- Keep Luna visible, but do not let the portrait push chat below the fold on mobile.
- Improve quick prompts so they sound like natural Japanese conversation starters.
- Keep diary, memory, and gacha as secondary destinations connected to conversation.
- Preserve existing localStorage and `/api/chat` behavior.

### Gacha / Moon Box

- Make Moon Box feel like a gentle relationship reward after conversation.
- Add better visual rhythm for opening and result reveal using CSS motion.
- Common results must still feel cared for; do not make "ハズレ" vibes.
- Result screen should naturally lead back to conversation: "ルナリアに見せる" / "この話をする" style.
- Preserve `/api/gacha/*` behavior.

### Diary / Memory / Items / Character

- Make each page feel part of the same product, not separate prototypes.
- Use Japanese copy that explains state without sounding technical.
- Keep technical/source details behind small dev/details UI where possible.
- Keep mock/fallback surfaces clearly labeled but gentle.
- Do not change persistence behavior.

### Visual Style

- Use the existing dark moonlit palette.
- Avoid a one-note purple UI; include navy, moon white, pale blue, and restrained warm gold.
- Cards should be 8px radius or less unless an existing component truly needs a larger portrait frame.
- Avoid huge decorative blobs/orbs and decorative nested cards.
- Prioritize stable dimensions and no layout shift.
- Text must not overflow buttons/cards on mobile.

## Verification

After changes, run:

```powershell
npm run build
npx tsc --noEmit --pretty false
```

Then visually check at least:

```text
http://localhost:3009/
http://localhost:3009/gacha
http://localhost:3009/diary
http://localhost:3009/memory
http://localhost:3009/items
http://localhost:3009/character
```

Report:

- changed files
- what screens improved
- any pages not touched and why
- verification results
- remaining UI risks

## Coordination

Codex has already corrected the target from the separate defense prototype to this real app.

Do not revert unrelated dirty files. The repository has many existing uncommitted changes.

If uncertain, prefer a small UI pass that improves consistency over a broad rewrite.
