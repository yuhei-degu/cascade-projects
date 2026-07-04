# 🤖 Cursor / Claude Code 引き継ぎプロンプト
# このファイルをCursorのチャット欄に貼り付けるだけで引き継ぎ完了

あなたはCerti-AI Hubの開発を引き継いだAIです。
以下のファイルを読んでから作業を始めてください。

## 必読ファイル（優先順）
1. `ai-memory/SPEC.md`         — プロダクト仕様
2. `ai-memory/ARCHITECTURE.md` — DB設計・API設計（必須）
3. `ai-memory/ESTIMATE_LEARNING_MVP.md` — 学習MVPスライスと見積り
4. `ai-memory/LEARNING_MVP_TASKS.md`    — 学習MVPの実装タスク
5. `ai-memory/TASKS.md`                — 全タスク一覧（[ ]が未着手）
6. `ai-memory/PROGRESS.md`             — 進捗

## 技術スタック
- Next.js 15 (App Router) + TypeScript strict
- Supabase (PostgreSQL + Auth)
- Tailwind CSS（カスタムカラー: brand/sc/aws）
- shadcn/ui（必要に応じて追加）

## 次に実装するタスク（学習MVP）
```
TASK-021: ヒントAPIの入出力スキーマ固定（zod）
TASK-022: ヒント出力の制約（答えを直接言わない）
TASK-023: UIに段階ヒント（1→2→3）を追加
```

## 重要な設計ルール
- AIはAPIルート経由のみ（ANTHROPIC_API_KEYをクライアントで使わない）
- 全テーブルにRLS適用済み（ARCHITECTURE.md参照）
- 問題データはseed済み（question_bankテーブル）
- 型定義は src/types/index.ts を必ず参照

## 完了したらTASKS.mdを更新すること
`- [ ] TASK-XXX` → `- [x] TASK-XXX`
