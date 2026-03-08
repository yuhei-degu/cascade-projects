<!--
@@AGENT_HANDOFF_METADATA@@
project: certi-ai-hub
last_agent: CLAUDE-ARCHITECT
next_agent: CURSOR
instruction: "[ ] のタスクを上から順に実装すること。依存関係に注意。"
@@END_METADATA@@
-->

# TASKS.md — タスク管理

## サマリー
- Total: 20
- Done: 5
- In Progress: 0
- Pending: 15
- Failed: 0

## 凡例
- [x] DONE  - [ ] PENDING  - [>] RUNNING  - [!] FAILED

---

## EPIC-001: 基盤（優先度: CRITICAL）

- [x] TASK-001 | priority:CRITICAL | agent:CLAUDE | estimate:done
  説明: ai-memory全ファイル作成（SPEC/ARCH/TASKS/PROGRESS/BUGS）
  成果物: ai-memory/

- [x] TASK-002 | priority:CRITICAL | agent:CLAUDE | estimate:done
  説明: DBスキーマ設計（ARCHITECTURE.md に記述済み）
  成果物: ai-memory/ARCHITECTURE.md

- [x] TASK-003 | priority:CRITICAL | agent:CURSOR | estimate:done
  説明: package.json / tsconfig / next.config 作成
  成果物: package.json, tsconfig.json, next.config.ts

- [x] TASK-004 | priority:CRITICAL | agent:CURSOR | estimate:done
  説明: Supabase初期マイグレーションSQL
  成果物: supabase/migrations/001_initial.sql

- [x] TASK-005 | priority:CRITICAL | agent:CURSOR | estimate:done
  説明: TypeScript型定義
  成果物: src/types/index.ts

---

## EPIC-002: コアUI（優先度: HIGH）

- [ ] TASK-006 | priority:HIGH | agent:CURSOR | estimate:60min
  説明: グローバルレイアウト（Header/Sidebar/フォント/カラー）
  依存: TASK-005
  成果物: src/app/layout.tsx, src/components/layout/

- [ ] TASK-007 | priority:HIGH | agent:CURSOR | estimate:90min
  説明: ランディングページ（LP）—機能紹介・ログインCTA
  依存: TASK-006
  成果物: src/app/(public)/page.tsx

- [ ] TASK-008 | priority:HIGH | agent:CURSOR | estimate:120min
  説明: QuestionCard コンポーネント（択一/長文/コード問題に対応）
  依存: TASK-005
  成果物: src/components/exam/QuestionCard.tsx

- [ ] TASK-009 | priority:HIGH | agent:CURSOR | estimate:60min
  説明: ExamTimer（カウントダウン・残り時間警告）
  依存: TASK-005
  成果物: src/components/exam/ExamTimer.tsx

- [ ] TASK-010 | priority:HIGH | agent:CURSOR | estimate:90min
  説明: ResultPanel（採点結果・解説・AIヒントボタン）
  依存: TASK-008
  成果物: src/components/exam/ResultPanel.tsx

---

## EPIC-003: API Routes（優先度: HIGH）

- [ ] TASK-011 | priority:HIGH | agent:CURSOR | estimate:60min
  説明: GET /api/questions（module/category/limit/shuffle対応）
  依存: TASK-004, TASK-005
  成果物: src/app/api/questions/route.ts

- [ ] TASK-012 | priority:HIGH | agent:CURSOR | estimate:90min
  説明: POST /api/exam + PATCH /api/exam/[id]（セッション作成・採点）
  依存: TASK-011
  成果物: src/app/api/exam/route.ts, src/app/api/exam/[sessionId]/route.ts

- [ ] TASK-013 | priority:HIGH | agent:CURSOR | estimate:60min
  説明: POST /api/ai/hint（claude-haiku でヒント生成）
  依存: TASK-005
  成果物: src/app/api/ai/hint/route.ts

- [ ] TASK-014 | priority:MEDIUM | agent:CURSOR | estimate:90min
  説明: POST /api/ai/analysis（弱点分析レポート生成）
  依存: TASK-013
  成果物: src/app/api/ai/analysis/route.ts

---

## EPIC-004: 学習ページ（優先度: HIGH）

- [ ] TASK-015 | priority:HIGH | agent:CURSOR | estimate:120min
  説明: SCモジュールトップページ（カテゴリ別問題一覧・進捗リング）
  依存: TASK-008, TASK-011
  成果物: src/app/(public)/sc-module/page.tsx

- [ ] TASK-016 | priority:HIGH | agent:CURSOR | estimate:120min
  説明: AWSモジュールトップページ
  依存: TASK-008, TASK-011
  成果物: src/app/(public)/aws-module/page.tsx

- [ ] TASK-017 | priority:HIGH | agent:CURSOR | estimate:180min
  説明: CBT模擬試験エンジン（時間制限・中断再開・採点画面）
  依存: TASK-009, TASK-010, TASK-012
  成果物: src/app/(public)/common/exam/page.tsx, src/lib/exam/engine.ts

---

## EPIC-005: 高度機能（優先度: MEDIUM）

- [ ] TASK-018 | priority:MEDIUM | agent:CURSOR | estimate:120min
  説明: シナジー学習ビュー（SC↔AWS相互リンク表示）
  依存: TASK-015, TASK-016
  成果物: src/components/synergy/SynergyLink.tsx

- [ ] TASK-019 | priority:MEDIUM | agent:CURSOR | estimate:180min
  説明: Interactive Lab（SQLインジェクション/プロンプトインジェクションデモ）
  依存: TASK-006
  成果物: src/components/lab/

- [ ] TASK-020 | priority:MEDIUM | agent:CURSOR | estimate:120min
  説明: 学習カレンダー（ストリーク・試験日カウントダウン）
  依存: TASK-012
  成果物: src/app/(public)/common/calendar/page.tsx

---
_Last updated by: CLAUDE-ARCHITECT at 2026-03-08 00:00:00_
