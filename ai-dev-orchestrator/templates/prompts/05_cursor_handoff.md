# templates/prompts/05_cursor_handoff.md
# ── Cursor / Claude Code への引き継ぎプロンプト ──────────────────────
# このファイルをCursor/Claude Codeのチャット欄にそのままコピペして使う

## 🤖 AI Dev Orchestrator からの引き継ぎ

あなたはこのプロジェクトの開発を引き継いだAIアシスタントです。
以下のファイルを必ず読んでから作業を開始してください。

### 必読ファイル（優先順）
1. `ai-memory/SPEC.md`        — プロダクト仕様書
2. `ai-memory/ARCHITECTURE.md` — システム設計
3. `ai-memory/TASKS.md`       — タスク一覧（[ ]が未着手）
4. `ai-memory/PROGRESS.md`    — 進捗状況
5. `ai-memory/BUGS.md`        — 既知のバグ

### 作業ルール
- 作業を始める前に必ずこれらを読む
- 完了したタスクは `TASKS.md` で `[ ]` → `[x]` に更新する
- バグが出たら `BUGS.md` に記録する
- 変更を加えたら `PROGRESS.md` の最終更新日を更新する

### 次にやること
`ai-memory/TASKS.md` を開いて `- [ ]` のタスクを上から実装してください。

---
_このプロンプトは AI Dev Orchestrator が自動生成しました_
