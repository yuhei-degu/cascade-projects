# Lunaria Auto Dev Task Queue

Last updated: 2026-05-20
Mode: AI_DEV_OS Solo Developer Fast Mode
Purpose: Let Codex and Claude keep improving Lunaria without overlapping work.

## Operating Rules

- Medium risk or below can proceed without stopping if no production DB, deploy, Stripe live mode, secrets, irreversible migration, or user data deletion is involved.
- High risk requires human confirmation.
- Codex should prefer implementation, tests, verification, and integration.
- Claude should prefer proposals, copy, content review, UX critique, and second-opinion design notes.
- If a task touches a high-collision file, write the intended file list before editing.
- Keep all handoff notes in Markdown, not hidden chat context.
- Run `npm run auto:guard` before considering medium-sized automated app work complete.

## Current Work Lanes

| Lane | Owner | File scope | Collision risk | Status |
|---|---|---|---:|---|
| Canonical spec and auto-dev queue | Codex | `lunaria/LUNARIA_CANONICAL_SPEC.md`, `lunaria/AUTO_DEV_TASK_QUEUE.md`, `lunaria/AUTO_DEV_RUNBOOK.md` | Low | Done |
| Conversation casebook repair | Codex | `lunaria-app/scripts/conversation-cases.json`, validation script | Low | Done |
| Conversation tone review | Claude | New review doc under `lunaria/` only | Low | Available |
| Endworld game QA | Codex | scripts only unless bug found | Medium | Available |
| Endworld copy variants | Claude | New proposal doc only | Low | Available |
| Drift guard maintenance | Codex | `scripts/auto-dev-guard.js`, `AUTO_DEV_GUARDRAILS.md` | Low | Done |
| Memory candidate DB apply | Human + Codex | Supabase SQL / verify scripts | High | Blocked until human DB state check |
| Production deploy | Human | Vercel / production env | Critical | Deferred |

## Ready Tasks For Codex

| ID | Task | Why it helps fun | Risk | Files | Verification | Status |
|---|---|---|---:|---|---|---|
| AUTO-001 | Create canonical spec and collision queue | Agents stop drifting and overlapping | Low | `lunaria/*.md` | Readability + diff | Done |
| CHAT-CASE-001 | Repair and expand conversation casebook to 30+ cases | Gives Luna voice a regression suite | Low | `scripts/conversation-cases.json`, `scripts/conversation-casebook-check.js` | `npm run conversation:cases` | Done |
| GAME-TEST-001 | Add Endworld path invariant check | Prevents game loop from becoming unfinishable | Low | `scripts/endworld-paths-check.js`, `package.json` | `npm run endworld:paths` | Done |
| AUTO-GUARD-001 | Add auto-dev drift guard | Keeps automated development from losing the core product direction | Low | `AUTO_DEV_GUARDRAILS.md`, `scripts/auto-dev-guard.js`, `package.json` | `npm run auto:guard` | Done |
| CHAT-001 | Convert 5 strongest casebook examples into live smoke scenarios | Catches real regressions | Medium | `scripts/lunaria-chat-smoke.js` | `npm run chat:smoke` with local server | Todo |
| GAME-UX-001 | Add better Endworld closing copy variants | Makes endings less repetitive | Medium | `lib/games/core/aftertaste.ts`, `vignettes.ts` | typecheck + endworld checks | Todo |
| HOME-DELIGHT-001 | Add one small daily Luna prompt card | Gives user a reason to return | Medium | `app/page.tsx` | build + visual check | Todo |
| TOOLS-001 | Design a manual-only subscription and AI usage wallet mock page | Turns real tool usage into daily conversation and planning value | Low | `lunaria/LUNARIA_SUBSCRIPTION_AI_USAGE_WALLET.md`, later `app/subscriptions/page.tsx` | typecheck + build + visual smoke | Todo |

## Ready Tasks For Claude

Copy this prompt when Claude is available:

```text
Lunariaの会話とゲームを楽しくするためのレビューをしてください。コードは編集しないでください。

参照:
- C:\Users\yuuve\CascadeProjects\lunaria\LUNARIA_CANONICAL_SPEC.md
- C:\Users\yuuve\CascadeProjects\lunaria\AUTO_DEV_TASK_QUEUE.md
- C:\Users\yuuve\CascadeProjects\lunaria-app\scripts\conversation-cases.json
- C:\Users\yuuve\CascadeProjects\lunaria-app\lib\games\endworld\vignettes.ts

出力先:
- C:\Users\yuuve\CascadeProjects\lunaria\CLAUDE_FUN_REVIEW_2026-05-20.md

やってほしいこと:
1. Lunaの会話が楽しくなる追加ケースを20個提案
2. Endworld v2の弱い場面/強い場面をレビュー
3. ガチャ・日記・記憶とゲームをつなぐ小さな演出案を10個提案
4. Codexが次に実装しやすい順に並べる
5. 触るべきファイルと触らない方がいいファイルを分ける

注意:
- コード編集しない
- DB、本番、env、migrationは触らない
- 既存仕様を壊す提案は「破壊的」と明記
```

Copy this prompt for a subscription/AI usage copy review:

```text
Lunariaの「サブスク / AI利用量ウォレット」案をレビューしてください。コードは編集しないでください。

参照:
- C:\Users\yuuve\CascadeProjects\lunaria\LUNARIA_CANONICAL_SPEC.md
- C:\Users\yuuve\CascadeProjects\lunaria\LUNARIA_SUBSCRIPTION_AI_USAGE_WALLET.md

出力先:
- C:\Users\yuuve\CascadeProjects\lunaria\CLAUDE_SUBSCRIPTION_AI_USAGE_REVIEW.md

やってほしいこと:
1. この機能がLunariaらしいかをレビュー
2. 「お金の管理」っぽく冷たくならない名前案を20個出す
3. サブスク見直し会話のプロンプトを20個出す
4. AI使用量/残り枠の会話例を20個出す
5. プライバシー/セキュリティ上の危険な実装を指摘
6. Codexが最初に作るなら何を作るべきか、低リスク順に並べる

注意:
- コード編集しない
- DB、env、外部API、ログイン情報、決済情報には触らない
- 各社AIの現在の制限値を断定しない
```

## Blocked / Human Needed

| Task | Block reason | Human action |
|---|---|---|
| Apply memory candidate migration | Actual Supabase state unknown | Apply/verify SQL only when ready |
| Public deploy | Free Vercel/project constraints and prod risk | Decide later |
| Stripe/payment | Not needed for fun MVP | Defer |
| Live2D asset pipeline | Needs asset decision | Defer until static portrait direction is chosen |

## Done Log

| Date | ID | Result |
|---|---|---|
| 2026-05-20 | AUTO-001 | Canonical spec and task queue created |
| 2026-05-20 | CHAT-CASE-001 | Conversation casebook repaired and expanded to 37 valid cases |
| 2026-05-20 | GAME-TEST-001 | Endworld source/path checks aligned with survival v2 route |
| 2026-05-20 | AUTO-GUARD-001 | Auto-dev guardrails and `npm run auto:guard` added |
