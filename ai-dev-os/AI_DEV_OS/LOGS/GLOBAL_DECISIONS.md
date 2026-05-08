# GLOBAL_DECISIONS

全プロジェクト共通で再利用する判断を残します。

## 2026-05-09

### 決定

AI_DEV_OS は Markdown 中心で運用し、最初はアプリ化しない。

### 理由

複数プロジェクトで即日使い回すには、軽くコピーでき、AI に読ませやすい形式が最も扱いやすいため。

### 適用範囲

- 個人開発 SaaS
- AI アプリ
- 学習サイト
- 管理画面つき Web アプリ

## 2026-05-09

### Decision
AI_DEV_OS trial data should be recorded in both the project-local docs and the shared AI_DEV_OS `LOGS/`.

### Reason
Project-local files preserve detailed context for the active project, while shared logs capture reusable workflow lessons for future projects.

### Rule
For each meaningful AI_DEV_OS trial:
- Update the project-local experiment log.
- Update project-local progress / handoff reports.
- Add only reusable lessons to shared `AI_DEV_OS/LOGS/`.
- Do not copy project secrets, `.env.local`, production details, or sensitive user data into shared logs.
