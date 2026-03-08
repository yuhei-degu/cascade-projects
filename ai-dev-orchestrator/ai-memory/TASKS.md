# TASKS.md — タスク管理
# AIオーケストレーターが読み書きするタスクキュー
# ─────────────────────────────────────────────

## サマリー
- Total: 0
- Done: 0
- In Progress: 0
- Pending: 0
- Failed: 0

## タスクキュー

### ステータス凡例
- [ ] PENDING   — 未着手
- [>] RUNNING   — 実行中
- [x] DONE      — 完了
- [!] FAILED    — 失敗
- [-] SKIP      — スキップ

### フォーマット
```
- [STATUS] TASK-001 | priority:HIGH | agent:CLAUDE | estimate:30min
  説明: タスクの内容
  依存: TASK-XXX
  成果物: path/to/output
  結果: (完了時に記入)
```

---

## 大タスク

### EPIC-001: 初期セットアップ
_Status: PENDING | Created: {{DATE}}_

#### 小タスク
- [ ] TASK-001 | priority:HIGH | agent:CLAUDE | estimate:10min
  説明: 要件定義書（SPEC.md）を作成する
  依存: なし
  成果物: ai-memory/SPEC.md

- [ ] TASK-002 | priority:HIGH | agent:CLAUDE | estimate:20min
  説明: アーキテクチャ設計（ARCHITECTURE.md）を作成する
  依存: TASK-001
  成果物: ai-memory/ARCHITECTURE.md

- [ ] TASK-003 | priority:HIGH | agent:CURSOR | estimate:30min
  説明: プロジェクト基盤コードを実装する
  依存: TASK-002
  成果物: src/

---
_Last updated by: {{LAST_AGENT}} at {{LAST_UPDATED}}_
