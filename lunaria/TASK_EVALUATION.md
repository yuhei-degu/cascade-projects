# Lunaria Task Evaluation

作成日: 2026-05-09

## 目的

Lunaria の現在タスクを、難易度・リスク・必要 AI レベル・人間確認要否で分類する。

## 評価軸

| 項目 | 値 |
|---|---|
| Difficulty | Low / Medium / High / Critical |
| Risk | Low / Medium / High / Critical |
| Suggested AI | Codex / Claude Code / Gemini / Cursor / Copilot / Human |
| Review Required | Yes / No |
| Security Review Required | Yes / No |
| Human Approval Required | Yes / No |
| Task Size | Small / Medium / Large |
| Status | Todo / Doing / Review / Blocked / Done / Deferred |

## 現在タスク評価

| ID | タスク | Difficulty | Risk | Suggested AI | Review | Security | Human Approval | Task Size | Status | 理由 |
|---|---|---:|---:|---|---|---|---|---|---|---|
| LUN-AI-001 | AI_DEV_OS 試験導入用記録ファイル作成 | Low | Low | Codex | No | No | No | Small | Done | ドキュメント新規追加のみ。既存実装に影響しない |
| LUN-OPS-001 | Supabase migration `014`-`019` 適用状態確認 | Medium | High | Human + Ops Agent | Yes | Yes | Yes | Medium | Todo | 実 DB 状態に依存し、SQL Editor / Supabase 確認が必要 |
| LUN-MEM-001 | `/memory` candidate review actions を実データで確認 | Medium | Medium | Codex | Yes | No | Conditional | Medium | Todo | DB 状態が整っていればローカル検証可能。データ内容は注意 |
| LUN-MEM-002 | memory restore/edit UX 設計 | Medium | Medium | Claude Code + Codex | Yes | Yes | Yes | Medium | Todo | 記憶削除・訂正は信頼性に直結する |
| LUN-MEM-003 | memory restore/edit UX 実装 | High | Medium | Codex | Yes | Yes | Yes | Large | Todo | API / UI / DB status の整合が必要 |
| LUN-REA-001 | `LunariaPortrait` を `/gacha` 結果モーダルに接続 | Low | Low | Codex | Yes | No | No | Small | Done | DB に触らない低リスク UI 接続。試験導入の最初の実装として完了 |
| LUN-CHAR-001 | minimal `character_state` schema 設計 | High | High | Claude Code | Yes | Yes | Yes | Medium | Todo | DB 設計と将来拡張に関わる。実装前に設計レビュー必須 |
| LUN-PROF-001 | `user_communication_profiles` 設計 | High | High | Claude Code + Security Agent | Yes | Yes | Yes | Medium | Todo | プロフィール・記憶・推定情報の分離が重要 |
| LUN-EVT-001 | `life_events` 設計 | High | High | Claude Code + Gemini | Yes | Yes | Yes | Large | Deferred | 将来中核だが、今の MVP 完成を遅らせやすい |
| LUN-PAY-001 | Stripe / 課金導入 | Critical | Critical | Human + Security + Release | Yes | Yes | Yes | Large | Deferred | 決済・本番事故リスクが高く、現時点では後回し |
| LUN-LIVE-001 | Live2D / 3D asset pipeline | Critical | High | Human + Tech Lead | Yes | No | Yes | Large | Deferred | 表現力は高いが制作・運用コストが大きい |

## 次に試す小タスク候補

第一候補:

- 完了: `LUN-REA-001` は `/gacha` 結果モーダルに接続済み

採用理由:

- 既存 DB / 認証 / env に触らない。
- 失敗しても戻しやすい。
- reaction foundation の価値を小さく検証できる。
- AI_DEV_OS の「評価 → 実装 → レビュー → 記録」フローを試すのにちょうどよい。

## Blocked / Human Needed

| タスク | 理由 | 人間に必要な確認 |
|---|---|---|
| Supabase migration 確認 | Git の migration と実 DB 状態が一致するとは限らない | SQL Editor / Supabase 側で `014`-`019` の適用状態確認 |
| character_state schema | 将来の衣装・表情・ガチャ連携に影響 | 最小範囲と後方互換方針 |
| user_communication_profiles | 推定情報・プロフィール・記憶の境界が重要 | ユーザーに見せる/見せない情報の方針 |

## Assumptions

- 現在の正本タスクはルート `TASKS.md`。
- このファイルは Lunaria で AI_DEV_OS を試すための詳細評価表。
- 実装開始前に、対象タスクの完了条件と検証コマンドを明確にする。

## Questions

- 次の低リスク実装実験を `/memory` UX 改善にするか、先に Supabase 適用状態確認へ戻すか。
- DB 状態確認は人間作業として別枠にするか。

## 2026-05-09 Additional Task Evaluation

| ID | Task | Difficulty | Risk | Suggested AI | Review | Security | Human Approval | Task Size | Status | Reason |
|---|---|---:|---:|---|---|---|---|---|---|---|
| LUN-CLAUDE-001 | Intake Claude visual/items docs and mock UI | Medium | Medium | Codex 5.5 | Yes | No | No | Medium | Done | Reviewed `lunaria-app/docs/`, `/items`, `/character`, and mock portrait component; DB/auth/env/prod untouched; build/typecheck pass |

## 2026-05-09 Additional Task Evaluation

| ID | Task | Difficulty | Risk | Suggested AI | Review | Security | Human Approval | Task Size | Status | Reason |
|---|---|---:|---:|---|---|---|---|---|---|---|
| LUN-DB-020-021 | Create user_items and character_states migration candidates | Medium | High | Codex 5.5 | Yes | Yes | Yes before apply | Medium | Review | Additive SQL candidates only; no Supabase apply; depends on `014`-`019` state confirmation |
