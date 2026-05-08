# Lunaria AI_DEV_OS Trial Plan

作成日: 2026-05-09

## 目的

AI_DEV_OS を Lunaria の実開発に試験導入し、複数 AI を使った開発が安全性・速度・引き継ぎ品質を改善するかを記録する。

このファイルは導入方針の正本です。実装タスクそのものは `TASK_EVALUATION.md` と `AI_ROUTING.md` で扱います。

## 対象

- ドキュメント母艦: `C:\Users\yuuve\CascadeProjects\lunaria`
- 実装本体: `C:\Users\yuuve\CascadeProjects\lunaria-app`
- Git ルート: `C:\Users\yuuve\CascadeProjects`

## 導入範囲

### 今回やること

- AI_DEV_OS の考え方を Lunaria のタスク運用に適用する。
- タスクごとに難易度、リスク、担当 AI、人間確認要否を記録する。
- 進捗、判断待ち、レビュー結果、効率化指標を Markdown で蓄積する。
- 作る AI とレビューする AI を分ける。

### 今回やらないこと

- アプリ実装。
- DB migration 作成または適用。
- Supabase / Vercel / Stripe / 本番環境操作。
- 既存ドキュメントの削除。
- `lunaria-app/docs/` の保留素材を正本化すること。

## 正本ルール

| 目的 | 正本 |
|---|---|
| 現在地の短い把握 | `C:\Users\yuuve\CascadeProjects\PROGRESS.md` |
| 実行タスク一覧 | `C:\Users\yuuve\CascadeProjects\TASKS.md` |
| Lunaria 詳細設計 | `lunaria/` 配下の設計資料 |
| AI_DEV_OS 試験導入方針 | `lunaria/AI_DEV_OS_TRIAL_PLAN.md` |
| タスク評価 | `lunaria/TASK_EVALUATION.md` |
| AI 振り分け | `lunaria/AI_ROUTING.md` |
| 効率化測定 | `lunaria/METRICS/AI_DEV_OS_EXPERIMENT_LOG.md` |
| 日次進捗 | `lunaria/REPORTS/DAILY_PROGRESS.md` |
| 判断材料 | `lunaria/REPORTS/DECISION_BRIEF.md` |
| リスク報告 | `lunaria/REPORTS/RISK_REPORT.md` |
| 引き継ぎ | `lunaria/REPORTS/HANDOFF_REPORT.md` |

## 運用フロー

1. `PROGRESS.md` と `TASKS.md` で現在地を確認する。
2. 候補タスクを `lunaria/TASK_EVALUATION.md` に記録する。
3. `lunaria/AI_ROUTING.md` で担当 AI とレビュー AI を決める。
4. DB / 認証 / 決済 / env / 本番 / 大規模変更が絡む場合は人間確認で止める。
5. 実装前に完了条件と検証方法を明確にする。
6. 実装後は別視点でレビューする。
7. 結果を `REPORTS/DAILY_PROGRESS.md` と `METRICS/AI_DEV_OS_EXPERIMENT_LOG.md` に記録する。

## Permission Gate

以下は人間確認なしに進めない。

- DB migration 作成または適用。
- Supabase RLS / policy 変更。
- 認証 / 認可変更。
- Stripe / 決済変更。
- `.env.local` / secret / Vercel env 変更。
- 本番 deploy / production 操作。
- ファイル削除。
- 大規模リファクタ。
- 既存仕様を変更する判断。
- 複数の巨大ファイルをまたぐ変更。

## 自動で進めてよい候補

以下は小さな単位なら Codex が進めてよい。

- ドキュメントの新規記録ファイル作成。
- 既存仕様を壊さない isolated component の追加。
- UI の小さな低リスク接続。
- 型定義や定数の追加。
- build / typecheck / smoke などの検証。
- 既存タスク表の記録更新。

## 成功条件

- タスク選定が速くなる。
- AI 間の引き継ぎで同じ説明を繰り返す回数が減る。
- 仕様変更や DB 変更が勝手に進まない。
- PR / コミット単位が小さくなる。
- 失敗やブロックが記録に残る。
- 人間が判断すべきことが明確になる。

## Assumptions

- AI_DEV_OS は Lunaria 専用ではなく、今回 Lunaria で試験運用する。
- 現在の優先開発対象は Lunaria。
- `lunaria-app/.git` は使わず、ルート Git を使う。
- `lunaria-app/docs/` は保留素材であり、今回の試験導入では削除しない。

## Questions

- ルートの `SPEC.md` / `TASKS.md` / `PROGRESS.md` を将来的に `lunaria/` へ完全移管するか。
- 日次報告を毎作業後に更新するか、まとまった単位で更新するか。
- Claude Code をレビュー専任寄りにするか、設計作成も任せるか。
