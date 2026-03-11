<!--
@@AGENT_HANDOFF_METADATA@@
project: certi-ai-hub
phase: IMPL_PHASE2_IN_PROGRESS
completed_tasks: [TASK-001..006]
next_tasks: [TASK-009, TASK-010, TASK-011, TASK-012]
completed_by:
  TASK-006: "GitHub Copilot (Header / Sidebar / layout.tsx)"
  TASK-007: "Cursor (LP: ヒーロー・機能カード・CTA)"
  TASK-008: "Cursor (QuestionCard: 択一/長文/コード対応)"
@@END_METADATA@@
-->

# PROGRESS.md — 進捗記録

## 現在のフェーズ
Phase: IMPL（実装フェーズ）
Started: 2026-03-08 00:00
Last Active: 2026-03-08 00:00

## 全体進捗
```
[████████░░░░░░░░░░░░] 40%  (8/20 tasks)
```

## フェーズ別進捗
| フェーズ | ステータス | 完了日時 |
|---------|---------|---------|
| DESIGN  | ✅ DONE | 2026-03-08 |
| IMPL P1（基盤） | ✅ DONE | 2026-03-08 |
| IMPL P2（コアUI） | PENDING | - |
| IMPL P3（API）  | PENDING | - |
| IMPL P4（学習ページ） | PENDING | - |
| IMPL P5（高度機能） | PENDING | - |
| TEST    | PENDING | - |
| DEPLOY  | PENDING | - |

## 実行ログ（直近）
```
[2026-03-08 00:00] CLAUDE   design_architecture         DONE
[2026-03-08 00:00] CLAUDE   analyze_requirements        DONE
[2026-03-08 00:00] CLAUDE   split_tasks (20 tasks)      DONE
[2026-03-08 00:00] CURSOR   boilerplate_setup           DONE
[2026-03-08 00:00] CURSOR   db_schema_sql               DONE
[2026-03-11 00:00] CURSOR   implement_layout            DONE
[2026-03-11 00:00] CURSOR   implement_lp                DONE
[2026-03-11 00:00] CURSOR   implement_question_card     DONE
```

## エージェント稼働状況
| Agent        | 担当 | 完了 | 失敗 | 最終稼働 |
|-------------|------|------|------|---------|
| CLAUDE-ARCH | 3    | 3    | 0    | 2026-03-08 |
| COPILOT     | 1    | 1    | 0    | 2026-03-11 |
| CURSOR      | 4    | 4    | 0    | 2026-03-11 |
| CODEX       | 0    | 0    | 0    | - |
| TEST_AI     | 0    | 0    | 0    | - |

## 次のエージェントへの引き継ぎ事項
1. **次に実装するタスク**: TASK-008（QuestionCard コンポーネント）
2. **完了済みタスクまとめ**:
   - TASK-006: GitHub Copilot → Header / Sidebar / layout.tsx
   - TASK-007: Cursor → LP（ヒーロー・機能カード・Interactive Lab・CTA）
3. **重要な設計判断**:
   - Supabase RLSは全テーブルに適用済み（SQL参照）
   - AIはサーバーサイドAPIルート経由のみ呼ぶ
   - 問題データはシードSQLに含む（question_bank）
3. **環境変数**（.env.local に設定が必要）:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - ANTHROPIC_API_KEY

---
_Last updated by: CLAUDE-ARCHITECT at 2026-03-08 00:00:00_
