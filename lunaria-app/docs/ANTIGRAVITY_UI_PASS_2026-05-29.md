# Antigravity 2 UI/Design Pass - 2026-05-29

You are Antigravity 2 working in:

`C:\Users\yuuve\CascadeProjects\lunaria-app`

The user wants Lunaria's visible product UI, design, motion, and main user-facing experience improved. Codex will review and verify your work after you finish.

## Primary Goal

Improve Lunaria's UI/design quality across the actual app screens, especially the main conversation experience, Moon Box/gacha, character, memory, diary, items, gallery, and game entry screens.

Prioritize changes that make the product feel more polished, coherent, beautiful, and usable in Japanese.

## Hard Boundaries

- Do not revert unrelated dirty files.
- Do not delete user work.
- Do not change Supabase schema, auth, secrets, billing, or persistence architecture unless absolutely required for a visible UI bug.
- Do not run `npm run build` while a Next dev server is running against the same `.next` directory.
- Do not leave `npx next dev -p 3009` or any other long-running server as a foreground task. If a server is already on `http://localhost:3009`, use it. If you must start one, treat it as a background/manual preview server and keep working.
- Keep display language Japanese.
- Keep controls mobile-safe: no overlapping text, no tiny taps, no cramped labels.
- Avoid card-inside-card UI, over-rounded cards, one-note purple/dark palettes, and marketing-style landing pages. Build the actual usable app surfaces.

## Screens To Inspect And Improve

- `/` main Lunaria conversation screen
- `/gacha` and `/gacha/inventory`
- `/character` and `/character/gallery`
- `/memory`
- `/diary`
- `/items`
- `/games`, `/endworld`, `/weekend` if present and visibly rough

## Focus Areas

1. Main conversation screen
   - Make it immediately clear this is the main place to talk with Lunaria.
   - Improve spacing, hierarchy, mobile first viewport, chat readability, and Japanese tone.
   - Keep Lunaria as a close, gradually intimate AI companion, not a formal customer-service bot.

2. Gacha/Moon Box
   - Improve result dialog, animations, afterglow, and item reveal clarity.
   - Ensure `lunaria-reference-head-turns-8.jpg` renders as a clean animated/cropped Lunaria portrait, not as a visible reference sheet.
   - Keep gacha framed as a conversation/room reward, not the whole product.

3. Character and memory screens
   - Improve filters, badges, toggles, labels, and tap targets.
   - Remove awkward English IDs from user-facing UI.
   - No text overlap at mobile widths.

4. Visual polish
   - Make the app feel cohesive, quiet, intimate, and premium.
   - Use visual assets where useful.
   - Prefer restrained, usable screens over decorative hero sections.

5. Bug cleanup
   - Fix obvious visual/runtime bugs you encounter.
   - Keep code changes scoped.

## Verification To Run

At minimum:

```powershell
npx tsc --noEmit --pretty false
npm run chat:devtest
```

If you do browser checks, record which routes you opened. Do not run `npm run build` unless you first stop the dev server and understand the `.next` cache risk.

## Completion Contract

When done, create this file:

`docs/ANTIGRAVITY_UI_PASS_2026-05-29_DONE.md`

Include:

- Summary of changed screens/files
- What you intentionally did not change
- Verification commands and results
- Routes you checked in the browser
- Known remaining issues for Codex to verify

Codex will then inspect your diff, run verification, and browser-test the result.
