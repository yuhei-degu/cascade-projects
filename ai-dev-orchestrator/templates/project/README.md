# {{PROJECT_NAME}}

> AI Dev Orchestratorで自動生成されたプロジェクト

## ディレクトリ構造
```
{{PROJECT_NAME}}/
├── ai-memory/        ← AIが読み書きするメモリファイル
│   ├── SPEC.md       ← 仕様書
│   ├── ARCHITECTURE.md ← 設計書
│   ├── TASKS.md      ← タスク管理
│   ├── PROGRESS.md   ← 進捗
│   └── BUGS.md       ← バグトラッカー
├── src/              ← ソースコード
├── tests/            ← テストコード
├── logs/             ← AIの行動ログ
└── ai-prompts/       ← 各タスクの実装プロンプト
```

## 開発の再開方法（Cursor / Claude Code）

```bash
# 1. ai-memory/を全部読む
# 2. TASKS.mdで[ ]のタスクを確認
# 3. 以下のプロンプトをCursorに貼り付ける
```

`templates/prompts/05_cursor_handoff.md` の内容をCursorに貼り付けてください。

## CLI操作

```bash
ai-dev status      # 進捗確認
ai-dev task        # タスク一覧
ai-dev fix "エラー" # バグ自動修正
```
