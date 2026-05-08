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
