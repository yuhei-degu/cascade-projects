# LESSONS_LEARNED

開発を通じて得た学びを蓄積します。

## 記入例

### 日付

2026-05-09

### プロジェクト

例: ai-dev-market

### 学び

例: 課金導線は UI 実装前に Stripe product / price / webhook の対応を整理しておくと手戻りが少ない。

### 次回からのルール

例: Stripe 導入タスクでは最初に `STRIPE_RULES.md` と `RELEASE_CHECKLIST.md` を確認する。

## 2026-05-09

### Project
Lunaria

### Lesson
AI_DEV_OS works best when the first trial task is deliberately small, reversible, and measurable. For Lunaria, choosing a UI-only task (`LunariaPortrait` in the `/gacha` result modal) avoided DB/auth/env/production risk while still exercising the full workflow: task evaluation, AI routing, implementation, verification, and reporting.

### Next Rule
Before the first implementation task in a project, create a project-local trial plan, task evaluation table, routing table, experiment log, and reports folder. Then pick one low-risk task with objective verification commands.

## 2026-05-09

### Project
Lunaria

### Lesson
Parallel AI output should be routed through an explicit intake task before becoming the next implementation base. The intake should classify artifacts as "design", "mock UI", "production code", or "backup artifact"; run objective checks; and record residual risks.

### Next Rule
When Claude/Codex/Cursor produces a large bundle, create an intake task with: changed files, scope classification, secret scan, build/typecheck results, accepted/deferred files, and next implementation gates. Do not jump directly from handoff to DB or production work.

## 2026-05-09

### Project
Lunaria

### Lesson
For Next.js projects, do not run `next build` and standalone `tsc --noEmit` in parallel when `tsconfig.json` includes `.next/types/**/*.ts`. The build can regenerate `.next/types` while TypeScript reads the previous incremental graph, causing false `TS6053` missing file errors.

### Next Rule
Run verification in this order: `npm run build`, then remove ignored `tsconfig.tsbuildinfo` if needed, then `npx tsc --noEmit --pretty false`. Keep these checks sequential, not parallel.
