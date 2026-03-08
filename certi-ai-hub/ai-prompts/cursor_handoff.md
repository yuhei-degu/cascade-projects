# 🤖 Cursor / Claude Code 引き継ぎプロンプト
# このファイルをCursorのチャット欄に貼り付けるだけで引き継ぎ完了

あなたはCerti-AI Hubの開発を引き継いだAIです。
以下のファイルを読んでから作業を始めてください。

## 必読ファイル（優先順）
1. `ai-memory/SPEC.md`         — プロダクト仕様
2. `ai-memory/ARCHITECTURE.md` — DB設計・API設計（必須）
3. `ai-memory/TASKS.md`        — タスク一覧（[ ]が未着手）
4. `ai-memory/PROGRESS.md`     — 現在5/20完了

## 技術スタック
- Next.js 15 (App Router) + TypeScript strict
- Supabase (PostgreSQL + Auth)
- Tailwind CSS（カスタムカラー: brand/sc/aws）
- shadcn/ui（必要に応じて追加）

## 次に実装するタスク（TASK-006から）
```
TASK-006: グローバルレイアウト（Header/Sidebar）
TASK-007: ランディングページ（LP）
TASK-008: QuestionCard コンポーネント
```

## 重要な設計ルール
- AIはAPIルート経由のみ（ANTHROPIC_API_KEYをクライアントで使わない）
- 全テーブルにRLS適用済み（ARCHITECTURE.md参照）
- 問題データはseed済み（question_bankテーブル）
- 型定義は src/types/index.ts を必ず参照

## 完了したらTASKS.mdを更新すること
`- [ ] TASK-XXX` → `- [x] TASK-XXX`
