# PROMPT_IMPROVEMENTS

AI への依頼文を改善した履歴を残します。

## 記入例

### 日付

2026-05-09

### 対象プロンプト

例: Implement Agent

### 問題

例: 指示していないリファクタまで実行してしまった。

### 改善内容

例: 「勝手に仕様変更しない」「関係ない大規模リファクタをしない」「変更範囲が広がる場合は止まって報告する」を強調した。

### 効果確認

例: 次回タスクで変更範囲が TASKS.md の範囲内に収まったか確認する。

## 2026-05-09

### Target Prompt
AI_DEV_OS trial implementation prompt

### Issue
If the user says "finish completely", the agent may mix planning, implementation, metrics, and upstream AI_DEV_OS feedback without a clear completion definition.

### Improvement
Ask the agent to complete these phases explicitly:
1. Select one low-risk task from TASKS / TASK_EVALUATION.
2. State the implementation plan before editing.
3. Implement only that task.
4. Run verification.
5. Update project-local experiment logs and reports.
6. Summarize reusable lessons into the shared AI_DEV_OS LOGS.
7. Commit / PR only the intended files.

### Expected Effect
This keeps "complete" from becoming scope creep while still producing data that can improve the shared AI_DEV_OS.
