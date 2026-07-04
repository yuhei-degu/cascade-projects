# Lunaria Daily Progress Report

菴懈・譌･: 2026-05-09

## 菴ｿ縺・婿

1譌･縺ｮ邨ゅｏ繧翫√∪縺溘・縺ｾ縺ｨ縺ｾ縺｣縺滉ｽ懈･ｭ蜊倅ｽ阪・邨ゆｺ・凾縺ｫ霑ｽ險倥☆繧九・
## 2026-05-09

### Completed

- AI_DEV_OS 隧ｦ鬨灘ｰ主・縺ｮ譁ｹ驥昴ｒ謗｡逕ｨ縲・- 隧ｦ鬨灘ｰ主・逕ｨ縺ｮ險倬鹸繝輔ぃ繧､繝ｫ繧・`lunaria/` 驟堺ｸ九↓菴懈・縲・- 譛蛻昴・菴弱Μ繧ｹ繧ｯ螳溯｣・ｮ滄ｨ薙→縺励※縲～LunariaPortrait` 繧・`/gacha` 邨先棡繝｢繝ｼ繝繝ｫ縺ｫ謗･邯壹・- 蜈ｱ騾・AI_DEV_OS 蛛ｴ縺ｸ隧ｦ鬨馴°逕ｨ縺ｮ蟄ｦ縺ｳ繧定ｿｽ險倥・
### In Progress

- 縺ｪ縺励・
### Next

- `LUN-OPS-001`: Supabase migration `014`-`019` 縺ｮ驕ｩ逕ｨ迥ｶ諷狗｢ｺ隱阪・- `LUN-MEM-002`: memory restore/edit UX 險ｭ險医・
### Blocked

- Supabase 螳・DB 迥ｶ諷九・譛ｪ遒ｺ隱阪・
### Files Changed

- `lunaria/AI_DEV_OS_TRIAL_PLAN.md`
- `lunaria/TASK_EVALUATION.md`
- `lunaria/AI_ROUTING.md`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`
- `lunaria/REPORTS/DECISION_BRIEF.md`
- `lunaria/REPORTS/RISK_REPORT.md`
- `lunaria/REPORTS/HANDOFF_REPORT.md`
- `lunaria-app/app/gacha/page.tsx`
- `lunaria-app/components/lunaria/LunariaPortrait.tsx`
- `ai-dev-os/AI_DEV_OS/LOGS/LESSONS_LEARNED.md`
- `ai-dev-os/AI_DEV_OS/LOGS/PROMPT_IMPROVEMENTS.md`
- `ai-dev-os/AI_DEV_OS/LOGS/GLOBAL_DECISIONS.md`

### Verification

- `npm run build`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.

### Risks

- 繝ｫ繝ｼ繝・`TASKS.md` 縺ｨ `lunaria/TASK_EVALUATION.md` 縺ｮ莠碁㍾邂｡逅・′襍ｷ縺阪ｋ蜿ｯ閭ｽ諤ｧ縲・- 蜿､縺・`lunaria/PROGRESS.md` 縺ｨ譛譁ｰ繝ｫ繝ｼ繝・`PROGRESS.md` 縺ｮ隱ｭ縺ｿ蛻・￠縺悟ｿ・ｦ√・
### Human Decisions Needed

- AI_DEV_OS 縺ｮ驕狗畑繝輔ぃ繧､繝ｫ繧呈怙邨ら噪縺ｫ `lunaria/` 縺ｫ髮・ｴ・☆繧九°縲・- `/gacha` 邨先棡繝｢繝ｼ繝繝ｫ縺ｮ隕九◆逶ｮ縺後Ν繝翫Μ繧｢繧峨＠縺・°縲・
## Template

```text
## YYYY-MM-DD

### Completed
-

### In Progress
-

### Next
-

### Blocked
-

### Files Changed
-

### Verification
-

### Risks
-

### Human Decisions Needed
-
```

## 2026-05-09 Claude Intake Addendum

Completed:
- Claude visual/items handoff accepted as docs + mock UI.
- `/items` and `/character` mock pages verified.
- New Claude `components/character/LunariaPortrait.tsx` verified separately from the existing gacha reaction portrait.

Verification:
- `npm run build`: passed.
- `npx tsc --noEmit -p tsconfig.mocks.json --pretty false`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.

Risks:
- `/items` and `/character` are mock-only and should not be presented as DB-backed features yet.
- Two portrait components exist temporarily and should be consolidated later.

## 2026-05-16 Conversation Polish

### Completed
- Added a chat response polish layer for game reports, low-energy messages, serious-route replies, and practical planning asks.
- Rebuilt `chat:smoke` scenarios in readable Japanese so conversation regressions are easier to catch.

### Files Changed
- `lunaria-app/app/api/chat/route.ts`
- `lunaria-app/lib/lunaria/conversation-polish.ts`
- `lunaria-app/scripts/lunaria-chat-smoke.js`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- `npm run chat:smoke` against `http://localhost:3022/api/chat`: passed, 7 scenarios / 0 failures.

### Risks
- Smoke scenarios are quality gates, not exhaustive human evaluation.
- Actual response style still depends on the active model output and prompt behavior.

### Human Decisions Needed
- Keep the temporary Lunaria rooftop image for now or replace it later with a more app-native portrait.

## 2026-05-16 Conversation Casebook

### Completed
- Created a conversation evaluation casebook covering casual chat, planning, low-energy support, serious support, personality distance, memory/profile, diary flow, game/gacha afterglow, output hygiene, and multi-turn continuity.
- Added JSON seed cases for future automated chat smoke expansion.

### Files Changed
- `lunaria/CONVERSATION_CASES.md`
- `lunaria-app/scripts/conversation-cases.json`

### Verification
- `conversation-cases.json`: parsed successfully with Node, 12 seed cases.
- `git diff --check`: passed.

### Risks
- Casebook is an evaluation artifact only; it does not guarantee conversation quality until cases are wired into automated or manual review.

### Human Decisions Needed
- Decide which case groups should become strict automated gates versus manual tone review.

## 2026-05-16 Real Conversation Regression Fix

### Completed
- Added the user-provided end-world / strategy meeting / weekday correction transcript as regression cases.
- Repaired mojibake in core conversation prompt, prompt builder, state summary, and conversation polish helper.
- Added JST calendar context to chat prompts.
- Added deterministic handling for “明日何曜日？” so the API does not guess weekdays through the LLM.
- Hardened AssistantReply parsing so incomplete `{"message": ...` JSON leaks are salvaged into plain user-facing text.

### Files Changed
- `lunaria/CONVERSATION_CASES.md`
- `lunaria-app/scripts/conversation-cases.json`
- `lunaria-app/app/api/chat/route.ts`
- `lunaria-app/lib/prompt.ts`
- `lunaria-app/lib/lunaria/prompt-builder.ts`
- `lunaria-app/lib/lunaria/state-summary.ts`
- `lunaria-app/lib/lunaria/date.ts`
- `lunaria-app/lib/lunaria/conversation-polish.ts`
- `lunaria-app/lib/lunaria/assistant-reply.ts`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- `npm run chat:smoke`: passed, 7 scenarios / 0 failures.
- `conversation-cases.json`: parsed successfully, 15 cases.

### Risks
- Current local runtime was after midnight JST during verification, so “明日” resolved to Monday at runtime. The regression case documents the original 2026-05-16 evening expectation: Sunday.
- Some rare profile-confirmation fallback messages are currently plain English after repairing syntax corruption; they should be re-localized later.

### Human Decisions Needed
- Decide whether “明日/今日” should use server JST, browser/client date, or an explicit client-sent date context for absolute consistency.

## 2026-05-17 Endworld Survival Redesign

### Completed
- Replaced `/endworld` linear 5-scene mood game with a survival MVP based on the redesign spec.
- Added preparation phase with 3 carry-in item slots.
- Added resources: food, energy, sanity.
- Added Luna abilities: search, analysis, repair, defense, empathy.
- Added day events with risk/reward choices, skill checks, resource drain, success/failure logs, and facility progress.
- Added end-state report generation for home conversation carry-back.
- Updated `/games` copy to prioritize Endworld as the core game and treat other games as side/event candidates.
- Added canonical redesign docs in both app docs and the Lunaria docs base.

### Files Changed
- `lunaria-app/app/endworld/page.tsx`
- `lunaria-app/app/games/page.tsx`
- `lunaria-app/app/globals.css`
- `lunaria-app/scripts/weekend-smoke.js`
- `lunaria-app/scripts/games-smoke.js`
- `lunaria-app/docs/ENDWORLD_SURVIVAL_REDESIGN_SPEC.md`
- `lunaria/ENDWORLD_SURVIVAL_REDESIGN_SPEC.md`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run weekend:smoke`: passed.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run games:smoke`: passed.
- Manual HTTP check: `/endworld` returned 200 and rendered survival prep UI.

### Risks
- Browser click E2E is not yet automated; current checks verify render and static smoke only.
- Weekly lockout is documented but not enforced yet.
- Rewards are still localStorage-based and not DB-backed.

### Human Decisions Needed
- Decide whether the old `memory-quest` and `dream-repair` routes should remain visible or be folded into Endworld-only navigation soon.

## 2026-05-17 Endworld Follow-up Hardening

### Completed
- Added Day 6 and Day 7 events so the survival route now has unique events for the full 7-day run.
- Fixed completed-day reporting so the ending screen and home handoff do not overcount the final day.
- Added a weekly formal-challenge cadence notice based on the last result timestamp while keeping replay open for development testing.
- Updated the home return card to show new Endworld fields such as survival days, facility progress, and emotional diary when available.
- Repaired `scripts/conversation-cases.json` from mojibake into readable Japanese seed cases.
- Added `npm run endworld:check` to verify Endworld source invariants without browser automation.

### Files Changed
- `lunaria-app/app/endworld/page.tsx`
- `lunaria-app/app/globals.css`
- `lunaria-app/app/page.tsx`
- `lunaria-app/package.json`
- `lunaria-app/scripts/endworld-source-check.js`
- `lunaria-app/scripts/conversation-cases.json`
- `lunaria-app/docs/ENDWORLD_SURVIVAL_REDESIGN_SPEC.md`
- `lunaria/ENDWORLD_SURVIVAL_REDESIGN_SPEC.md`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `npm run endworld:check`: passed.
- `npm run build`: passed via redirected build log; Next produced a complete route table including `/endworld`.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run weekend:smoke`: passed.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run games:smoke`: passed.
- `scripts/conversation-cases.json`: parsed successfully with Node.

### Risks
- Codex in-app browser automation could not attach to the IAB backend, so click E2E is still not verified in-browser from this session.
- Weekly cadence is visible but not enforced; this is intentional for development, but production needs a DB-backed policy later.
- Endworld rewards remain localStorage-only and are not connected to inventory or memory candidates yet.

### Human Decisions Needed
- Decide whether the weekly challenge should be a strict lockout, a ticket cost, or a soft recommendation in the first public build.

## 2026-05-17 Endworld v2 Claude Intake Fix

### Completed
- Aligned `npm run endworld:check` with Claude's Endworld v2 vignette/core-engine structure.
- Preserved the new storage keys: `lunaria_endworld_v2` and `lunaria_endworld_handoff_v2`; old `lunaria_endworld_v1` is not referenced.
- Repaired visible mojibake in the Endworld v2 page, vignette pool, closing handoff copy, SceneCurtain labels, and mock memory hook strings.
- Added home-page support for `lunaria_endworld_handoff_v2` so the v2 return card can start a natural Luna conversation without relying on the old report key.
- Updated `weekend-smoke` for Client Component output by checking the rendered route plus loaded JS chunks for v2 keys/copy.

### Files Changed
- `lunaria-app/app/endworld/page.tsx`
- `lunaria-app/app/page.tsx`
- `lunaria-app/components/games/SceneCurtain.tsx`
- `lunaria-app/lib/games/core/aftertaste.ts`
- `lunaria-app/lib/games/core/memory-hook.ts`
- `lunaria-app/lib/games/endworld/vignettes.ts`
- `lunaria-app/scripts/endworld-source-check.js`
- `lunaria-app/scripts/weekend-smoke.js`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed.
- `npm run endworld:check`: passed.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run weekend:smoke`: passed.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run games:smoke`: passed.

### Risks
- `buildMockProfile()` is still the active memory hook. Real core memory connection remains a later task.
- The candidate approval buttons are still UI-only. They intentionally do not call the memory candidates API yet.
- Some non-visible comments/docs from Claude's output may still contain mojibake, but visible runtime strings in the v2 Endworld path were repaired.

### Next Actions
- Connect `buildProfileFromCoreMemory()` to `lib/lunaria/memory.ts` output.
- Wire the candidate approval action to `app/api/memory/candidates` POST.
- Move inline styles into shared CSS/components once the gameplay loop feels right.

## 2026-05-17 Endworld Candidate Save Connection

### Completed
- Added guarded `POST /api/memory/candidates` support for manually approved game/Endworld memory candidates.
- Wired the Endworld v2 closing action `うん、覚えてて` to save the proposed candidate through the memory candidate API.
- Kept memory governance intact: approved game residue is saved as a candidate only, and does not silently fallback into `core_memories`.
- Added user-facing save states for saving, saved, missing candidate table, and error cases.
- Updated `npm run endworld:check` so the v2 source invariant test verifies the candidate API handoff.

### Files Changed
- `lunaria-app/app/endworld/page.tsx`
- `lunaria-app/app/api/memory/candidates/route.ts`
- `lunaria-app/scripts/endworld-source-check.js`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `npm run endworld:check`: passed.
- `npm run build`: passed; Next generated the full route table including `/endworld` and `/api/memory/candidates`.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run weekend:smoke`: passed.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run games:smoke`: passed.

### Risks
- If migration `019_memory_candidates.sql` is not applied, the UI will show a table-not-ready message instead of saving.
- The Endworld memory hook still uses `buildMockProfile()`; real memory personalization remains a later integration task.
- Candidate dedupe/merge policy is still handled in the memory review flow, not at game save time.

### Next Actions
- Connect `buildProfileFromCoreMemory()` so Endworld scene ranking can use real user memories.
- Add a small browser/manual QA note for the closing candidate button after DB migrations are applied locally.
- Decide whether game-derived candidates should use a new `source_type = game` in a future migration instead of the current safe `manual` source type.

## 2026-05-20 Auto Dev Collision Control + Fun Loop Hardening

### Completed
- Added `LUNARIA_CANONICAL_SPEC.md` as the readable source of truth for conversation, memory, diary, games, gacha, character presentation, and AI collision policy.
- Added `AUTO_DEV_TASK_QUEUE.md` so Codex and Claude have separate work lanes and high-collision files are called out before editing.
- Added `AUTO_DEV_RUNBOOK.md` to standardize the implement -> verify -> record loop.
- Repaired `scripts/conversation-cases.json` from broken/mojibake JSON into 37 valid Japanese conversation cases across daily, planning, serious, diary, memory, game, gacha, calendar, hygiene, and fun scenarios.
- Added `scripts/conversation-casebook-check.js` and `npm run conversation:cases` so the conversation casebook cannot silently rot again.
- Rewrote `/endworld` into a clean survival v2 route with readable Japanese copy, 7 days, prep items, resources, skills, multiple endings, home report handoff, and chat handoff.
- Added `scripts/endworld-paths-check.js` and `npm run endworld:paths` for clearability/path invariant checks.
- Updated `endworld:check`, `weekend:smoke`, and `games:smoke` to match the current survival v2 route.

### Files Changed
- `lunaria/LUNARIA_CANONICAL_SPEC.md`
- `lunaria/AUTO_DEV_TASK_QUEUE.md`
- `lunaria/AUTO_DEV_RUNBOOK.md`
- `lunaria-app/app/endworld/page.tsx`
- `lunaria-app/package.json`
- `lunaria-app/scripts/conversation-cases.json`
- `lunaria-app/scripts/conversation-casebook-check.js`
- `lunaria-app/scripts/endworld-paths-check.js`
- `lunaria-app/scripts/endworld-source-check.js`
- `lunaria-app/scripts/weekend-smoke.js`
- `lunaria-app/scripts/games-smoke.js`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `npm run conversation:cases`: passed, 37 cases / 14 categories.
- `npm run endworld:paths`: passed, 8 vignette fixtures / 8 settings / 4 path patterns.
- `npm run endworld:check`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; Next generated the route table including `/endworld`.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run weekend:smoke`: passed.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run games:smoke`: passed.

### Risks
- `/endworld` is now clean survival v2, while the older vignette engine remains as future/reference code. This is intentional but should be consolidated later.
- The conversation casebook is currently a fixture quality gate, not yet fully wired into live `chat:smoke` execution.
- The Endworld route is still localStorage-based; DB-backed weekly cadence/rewards remain deferred.

### Next Actions
- Convert the strongest 5-8 conversation casebook entries into live chat smoke scenarios.
- Add a small home-page daily prompt/reason-to-return card, but only when `app/page.tsx` is free to edit.
- Ask Claude for a copy/UX review using the prompt in `AUTO_DEV_TASK_QUEUE.md`.

## 2026-05-20 Japanese UI Copy + Home Visual Polish

### Completed
- Rewrote the home chat page UI copy from mojibake/English-like labels into readable Japanese.
- Improved home visual hierarchy with a warmer moonlit layout, stronger portrait stage, larger Japanese headings, softer chat bubbles, and clearer navigation buttons.
- Replaced user-facing fallback/error/toast messages with natural Japanese Luna copy.
- Replaced Endworld visible English labels such as `ENDWORLD`, `ENDING`, `Day`, and `score` with Japanese labels.
- Confirmed no mojibake-looking text remains in `app`, `components`, or `lib` TypeScript/TSX files.
- Attempted in-app browser screenshot via Browser Use, but the Codex IAB backend was unavailable in this session. Continued with code/static/build/smoke verification.

### Files Changed
- `lunaria-app/app/page.tsx`
- `lunaria-app/app/endworld/page.tsx`
- `lunaria-app/app/globals.css`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `rg "縺|繧|譛|螟|荳|蜊|邨|髯|繝|驛|谺|蛟|譁|逕|莉穂" app components lib -g "*.tsx" -g "*.ts"`: no matches.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run conversation:cases`: passed, 40 cases / 15 categories.
- `npm run endworld:check`: passed.
- `npm run endworld:paths`: passed.
- `npm run build`: passed; Next generated the route table including `/` and `/endworld`.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run weekend:smoke`: passed.
- `LUNARIA_BASE_URL=http://localhost:3022 npm run games:smoke`: passed.

### Risks
- Browser screenshot verification could not run because the in-app browser automation backend was unavailable.
- `globals.css` still contains legacy CSS for older routes; visible TS/TSX copy is clean, but broader CSS consolidation remains future work.
- Other routes may still need design review even if their text is readable.

### Next Actions
- When browser automation is available, capture home/endworld/gacha screenshots and do visual QA pass.
- Continue Japanese-first UI polish route by route: `/gacha`, `/memory`, `/diary`, `/items`, `/character`.
- Convert the strongest conversation casebook entries into live chat smoke scenarios.

## 2026-05-20 Auto Dev Guardrails

### Completed
- Added `AUTO_DEV_GUARDRAILS.md` so automated agents have explicit north-star, stop conditions, red-zone files, and done criteria.
- Added `npm run auto:guard` through `scripts/auto-dev-guard.js`.
- The guard now checks required AI_DEV_OS files, canonical-spec phrases, package scripts, mojibake in TS/TSX, old Endworld v1 key revival, home/endworld Japanese UI anchors, and conversation casebook coverage.
- Updated `AUTO_DEV_RUNBOOK.md` and `AUTO_DEV_TASK_QUEUE.md` so medium-sized automated work must run `npm run auto:guard`.
- The new guard caught English/internal copy on `/character`, so the character state page was Japanese-localized as part of the hardening pass.

### Files Changed
- `lunaria/AUTO_DEV_GUARDRAILS.md`
- `lunaria/AUTO_DEV_RUNBOOK.md`
- `lunaria/AUTO_DEV_TASK_QUEUE.md`
- `lunaria/LUNARIA_CANONICAL_SPEC.md`
- `lunaria-app/scripts/auto-dev-guard.js`
- `lunaria-app/package.json`
- `lunaria-app/app/character/page.tsx`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `npm run auto:guard`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `rg "縺|繧|譛|螟|荳|蜊|邨|髯|繝|驛|谺|蛟|譁|逕|莉穂" app components lib -g "*.tsx" -g "*.ts"`: no matches.
- `npm run build`: passed; Next generated the route table including `/character`.

### Risks
- `auto:guard` is intentionally conservative, but it is still a static check and cannot judge visual quality by itself.
- Browser screenshot verification remains separate and should be used when browser automation is available.
- Some internal docs are still English-heavy by design; the guard focuses on source/UI drift, not all Markdown prose.

### Next Actions
- Add `npm run auto:guard` to any future orchestrated auto-dev cycle.
- Continue route-by-route Japanese UI polish, especially `/gacha`, `/memory`, `/diary`, `/items`.
- Add a visual screenshot checklist once browser automation is stable.

## 2026-05-24 Lunaria Visual Asset Gallery

### Completed
- Curated local Lunaria character images from `C:\Users\yuuve\Downloads\AI生成画像\残す` into app-safe public assets.
- Added a visual asset manifest so future conversation, game, gacha, and Live2D work can reference one canonical list.
- Added `/character/gallery` as a Japanese-first visual lab for comparing current, candidate, mood, and reference images.
- Added navigation links from the home screen and character state screen.
- Kept runtime behavior unchanged: no DB, auth, env, Stripe, Supabase, or production changes.

### Files Changed
- `lunaria-app/public/images/lunaria/*`
- `lunaria-app/lib/lunaria/visual-assets.ts`
- `lunaria-app/app/character/gallery/page.tsx`
- `lunaria-app/app/page.tsx`
- `lunaria-app/app/character/page.tsx`
- `lunaria-app/app/globals.css`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `npm run auto:guard`: passed.
- `npm run build`: passed; Next generated `/character/gallery`.
- Temporary local `next start -p 3010` check: `/character/gallery` returned HTTP 200.

### Risks
- Browser screenshot automation was not available through the current tool surface, so visual QA is static plus local HTTP only.
- Some candidate images are intentionally kept as reference/mood assets, not default home visuals, because constant-use screens should prioritize readability and comfort.

### Next Actions
- Use `/character/gallery` to pick one game image, one diary image, and one gacha special image.
- Add per-route image mapping after visual approval: chat, Endworld, gacha result, diary detail.
- When browser automation is available, capture `/`, `/character/gallery`, `/games`, and `/gacha` screenshots for design QA.

## 2026-05-24 Conversation/Game/Japanese Quality Repair

### Completed
- Identified the core failure behind broken chat quality: `app/api/chat/route.ts` still contained mojibake in classification, fallback, game-context, and system prompt logic.
- Rebuilt the chat route with readable Japanese logic, safe input normalization, clean Gemini prompting, JSON/metadata stripping, and deterministic replies for fragile cases.
- Added deterministic handling for calendar correction, quality complaints, serious support, and Endworld result reflection so the app does not rely on the LLM for high-risk conversational basics.
- Localized visible copy on `/games`, `/gacha`, `/items`, `/diary`, and `/character/gallery` where English/internal wording was still leaking into Japanese-first UI.
- Updated `games:smoke` expectations to match the current Japanese game hub copy.
- Browser-audited `/character/gallery`, `/games`, `/endworld`, `/gacha`, `/items`, and `/diary` on `localhost:3013`; no runtime error, mojibake, or obvious English UI leak found in the sampled body text.

### Files Changed
- `lunaria-app/app/api/chat/route.ts`
- `lunaria-app/app/games/page.tsx`
- `lunaria-app/app/gacha/page.tsx`
- `lunaria-app/app/items/page.tsx`
- `lunaria-app/app/diary/page.tsx`
- `lunaria-app/app/character/gallery/page.tsx`
- `lunaria-app/lib/lunaria/gacha-copy.ts`
- `lunaria-app/lib/lunaria/character-items.ts`
- `lunaria-app/lib/lunaria/visual-assets.ts`
- `lunaria-app/scripts/games-smoke.js`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- UTF-8 chat API regression checks: calendar correction, quality complaint, and Endworld result reflection returned readable Japanese without raw JSON.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run conversation:cases`: passed.
- `npm run auto:guard`: passed.
- `LUNARIA_BASE_URL=http://localhost:3013 npm run games:smoke`: passed.
- `npm run build`: passed; Next generated `/api/chat`, `/games`, `/endworld`, `/gacha`, `/items`, `/diary`, and `/character/gallery`.

### Risks
- This repair fixes broken copy, mojibake, and high-risk reply cases, but it does not make the game deeply fun yet.
- `/gacha` still shows loading/fallback state when DB/API data is unavailable; the text is readable, but the reward loop needs a product pass.
- Conversation quality still needs more live-case regression beyond the three repaired critical cases.

### Next Actions
- Expand live chat regression tests from the user's real transcript: apology/correction, game reflection,甘やかし,茶化し励まし,明日整理.
- Improve Endworld's moment-to-moment game loop: visible threat pressure, irreversible choice cost, Luna intervention timing, and stronger endings.
- Continue visual QA with screenshots, not only body-text scans.

## 2026-05-25 Game Feel Repair Pass

### Completed
- Treated the user's feedback as correct: the games were too close to readable story pages and not enough like games.
- Upgraded `/endworld` with visible mechanics: success rate, roll variance, AI pressure affecting difficulty, repeated-skill penalty, Luna intervention charges, pressure delta logging, and failure scars.
- Added browser-confirmed Endworld event-screen signals: `成功率`, `ルナ介入`, `同じ手を読まれている`, `AI圧力 27%→21%`, and `揺らぎ` appeared after real interaction.
- Added success-rate and roll logs to `/games/memory-quest` and `/games/dream-repair` so failures feel like attempts, not hard gates.
- Added success-rate, roll, and threat-before/after logs to `/games/ai-breakout` so MOTHER pressure becomes a visible gamble.
- Kept this pass client-side only: no DB, auth, env, Supabase, Stripe, or production changes.

### Files Changed
- `lunaria-app/app/endworld/page.tsx`
- `lunaria-app/app/games/memory-quest/page.tsx`
- `lunaria-app/app/games/dream-repair/page.tsx`
- `lunaria-app/app/games/ai-breakout/page.tsx`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `LUNARIA_BASE_URL=http://localhost:3013 npm run games:smoke`: passed.
- `npm run auto:guard`: passed.
- Browser audit on `/endworld`, `/games/memory-quest`, `/games/dream-repair`, `/games/ai-breakout`: no runtime error; visible game signals present.
- `npm run build`: passed; Next generated all game routes.

### Risks
- This is a mechanics repair pass, not a full game redesign. Endworld now has readable pressure, but the decision economy still needs balancing.
- The side games now show chance/roll, but their content loops remain short and need stronger route-specific identity.
- Random rolls make playthroughs less deterministic; future tests should separate deterministic source checks from UI play checks.

### Next Actions
- Balance Endworld numbers after 3-5 manual runs: early success should feel safe, midgame should force tradeoffs, late game should create real risk.
- Add one special event per game that changes available choices instead of only changing numbers.
- Add a game result comparison screen: previous run vs current run, so replay has a visible reason.

## 2026-05-26 Conversation Service Recovery Pass

### Completed
- Reviewed customer-service/hospitality conversation guidance and translated it into Luna's companion tone.
- Added service-recovery handling for user frustration such as `面白くない`, `変な日本語`, `期待外れ`, `がっかり`, and `微妙`.
- Prioritized conversation-improvement requests over game-improvement copy when both appear in the same message.
- Added a new `service_recovery` conversation-case category with three regression cases.
- Added `LUNARIA_CONVERSATION_SERVICE_RECOVERY.md` so future agents do not forget the applied conversation principles.

### Files Changed
- `lunaria-app/app/api/chat/route.ts`
- `lunaria-app/lib/lunaria/conversation-polish.ts`
- `lunaria-app/scripts/conversation-cases.json`
- `lunaria/LUNARIA_CONVERSATION_SERVICE_RECOVERY.md`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- Live UTF-8 `/api/chat` checks passed for game-not-fun, weird-Japanese, and expectation-failure prompts.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run conversation:cases`: passed with 52 cases / 16 categories.
- `LUNARIA_STATIC_ONLY=1 node scripts/lunaria-chat-smoke.js`: passed.
- `npm run auto:guard`: passed.
- `npm run build`: passed.

### Risks
- This improves frustration handling and conversation recovery, but it does not solve all daily-chat naturalness yet.
- The next needed layer is a live reply evaluator that checks for concrete mirror, impact naming, and one next action.

### Next Actions
- Add live transcript regression for the user's real conversation snippets.
- Add a reply-quality evaluator script for service-recovery replies.
- After conversation recovery is stable, return to game design with stronger player motivation and replay loops.

## 2026-05-27 Antigravity Visual QA Follow-up

### Completed
- Reviewed Antigravity's 8-pose Lunaria sprite integration on `/`, `/character`, and `/gacha` in a local browser.
- Fixed the home mobile layout regression where later `.luna-shell` and `.luna-stage` CSS rules overrode the claimed chat-first responsive layout.
- Repaired mobile status/portrait sizing by overriding stale 48px stage rules at the final CSS layer.
- Updated emotion/reaction fallbacks so `worried` and probe-style thinking use `look_away`, and gacha/item presentation uses `small_wave` instead of an undefined `custom_pose`.
- Restarted the dev server after build because Next's `.next` output replacement can break an already-running dev server.

### Files Changed
- `lunaria-app/app/globals.css`
- `lunaria-app/app/page.tsx`
- `lunaria-app/lib/lunaria/reactions.ts`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `npm run build`: passed.
- `npx tsc --noEmit --pretty false`: passed after build-generated `.next/types` existed.
- Browser smoke on `http://localhost:3018/`, `/character`, and `/gacha`: no runtime error and no horizontal overflow at the in-app browser's narrow viewport.

### Risks
- The 8-pose sheet is still a temporary composite image; the sprite crop works for a placeholder, but it is not production-quality Live2D/Spine motion.
- `/gacha` was checked in idle/loading state only; actual draw-result animation still needs a ticket-backed manual run.
- The home layout is now readable, but the product still needs a deliberate mobile information architecture pass.

### Next Actions
- Run one real gacha draw with available tickets and verify the result modal uses the `small_wave` presentation motion.
- Add a deterministic visual-state smoke test that checks `emotion -> expression/motion` mappings without requiring the live LLM.
- Continue reducing duplicated portrait CSS between `components/character` and `components/lunaria`.

## 2026-05-31 Conversation Quality Repair

### Completed
- Treated the user's conversation-quality complaint as valid and audited live `/api/chat` output, not just static guards.
- Found bad live replies: a planning answer ending as `どう。`, thin small-talk, verbose Endworld result dumps, and pasted Endworld results being misrouted into top-route/completion-board guidance.
- Added deterministic reply skeletons for practical schedule planning, light small-talk, and Endworld result/one-line handoff cases.
- Routed `夢境修復士ルナリア` and related game-result reports through deterministic game afterglow instead of generic LLM praise.
- Strengthened `scripts/lunaria-chat-smoke.js` so it now fails on truncated planning, too-thin small-talk, one-line requests that become long dumps, and top-route misrouting.

### Files Changed
- `lunaria-app/app/api/chat/route.ts`
- `lunaria-app/lib/lunaria/conversation-polish.ts`
- `lunaria-app/scripts/lunaria-chat-smoke.js`
- `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md`
- `lunaria/REPORTS/DAILY_PROGRESS.md`

### Verification
- `npx tsc --noEmit --pretty false`: passed.
- `npm run conversation:cases`: passed.
- `LUNARIA_STATIC_ONLY=1 npm run chat:smoke`: passed.
- Live `npm run chat:smoke` against `http://localhost:3022/api/chat`: passed with 0 failures.
- `npm run auto:guard`: passed.
- `npm run build`: passed.

### Risks
- This fixes several obvious broken paths, but the live LLM can still produce flat or overly therapist-like responses outside the deterministic cases.
- Endworld follow-up replies are now safer, but the wording is still more utilitarian than emotionally rich.
- Future automated cycles should not add dozens of narrow regex rules without a live reply quality check.

### Next Actions
- Add a smaller live evaluator for warmth, specificity, and one-next-action quality.
- Add more real-user transcript cases from actual bad conversations.
- Improve Luna's ordinary daily-chat charm after the broken paths are stable.
