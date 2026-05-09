# Lunaria AI Routing

作成日: 2026-05-09

## 目的

Lunaria 開発で、どの AI に何を任せるかを記録する。

AI 同士を直接会話させるのではなく、Markdown ファイルを通じて非同期に引き継ぐ。

## 基本方針

- Human が最終判断者。
- Codex は小さな実装・検証・PR 作成を担当。
- Claude Code は設計レビュー・仕様整理・高リスク方針検討を担当。
- Gemini は長文資料比較・矛盾点洗い出しを担当。
- Cursor / Copilot は局所実装補助に使う。
- 作る AI とレビューする AI は分ける。

## ルーティング表

| 作業タイプ | Primary AI | Review AI | Human Approval | Notes |
|---|---|---|---|---|
| 小さな UI 接続 | Codex | Review Agent 観点で自己レビュー / Claude 任意 | 原則不要 | DB / 認証 / env に触らない範囲 |
| isolated component 追加 | Codex | Codex self-review | 原則不要 | build / typecheck 必須 |
| ドキュメント整理 | Codex / Claude Code | Human skim | 原則不要 | 既存ファイル削除は不可 |
| 仕様整理 | Claude Code | Codex / Gemini | 必要な場合あり | 採用時は `DECISIONS.md` に記録 |
| 長文資料比較 | Gemini | Claude Code | 原則不要 | 矛盾点と採用/保留/修正を出す |
| DB schema 設計 | Claude Code | Security Agent / Codex | 必須 | migration 実装前に判断 |
| DB migration 実装 | Codex | Security Agent | 必須 | SQL Editor 適用は人間確認 |
| RLS / 認可 | Security Agent | Codex | 必須 | 事故リスク高 |
| 本番 deploy | Release Agent | Human | 必須 | Vercel 無課金制約も考慮 |
| Stripe / 決済 | Security + Release | Human | 必須 | 今は Deferred |

## 現在の推奨割り振り

| Task ID | タスク | Primary | Reviewer | Human Approval | 状態 |
|---|---|---|---|---|---|
| LUN-AI-001 | AI_DEV_OS 記録ファイル作成 | Codex | Human skim | No | Done |
| LUN-REA-001 | `LunariaPortrait` を `/gacha` 結果モーダルへ接続 | Codex | Codex self-review / Claude optional | No | Done |
| LUN-MEM-001 | memory candidate review 実データ確認 | Codex | Human if DB data unclear | Conditional | Todo |
| LUN-MEM-002 | restore/edit UX 設計 | Claude Code | Codex | Yes | Todo |
| LUN-CHAR-001 | character_state schema 設計 | Claude Code | Security Agent | Yes | Todo |
| LUN-PROF-001 | user_communication_profiles 設計 | Claude Code | Security Agent | Yes | Todo |
| LUN-EVT-001 | life_events 設計 | Claude Code + Gemini | Human | Yes | Deferred |

## Stop Conditions

AI は以下で作業を止め、人間確認を求める。

- DB / migration / RLS / policy に触る必要が出た。
- 認証 / 認可 / secret / env に触る必要が出た。
- 本番環境、Vercel、Stripe、Supabase の操作が必要になった。
- 仕様の解釈が複数あり、結果が大きく変わる。
- 既存ファイル削除が必要になった。
- テスト失敗が解消できない。
- 変更範囲が想定より広がった。
- Claude / Codex の作業範囲が衝突した。

## Handoff Format

AI に渡すときは以下を含める。

```text
対象:
- docs:
- app:

読むファイル:
- SPEC.md
- PROGRESS.md
- HANDOFF.md
- TASKS.md
- 関連設計資料

やること:
1.
2.
3.

やらないこと:
- DB migration
- env
- 本番
- 既存仕様変更

出力:
- 変更ファイル
- 検証結果
- assumptions
- risks
- next actions
```

## Assumptions

- Claude Code が制限中の場合は Codex がドキュメント整理と小さな実装を進める。
- Codex はローカル検証と GitHub PR 作成に強い。
- 高リスク設計は必ずレビュー AI と人間確認を挟む。

## Questions

- Claude Code をどこまで設計担当に寄せるか。
- Gemini を長文比較用に常用するか、必要時だけ使うか。

## 2026-05-09 Additional Routing

| Task ID | Task | Primary | Reviewer | Human Approval | Status |
|---|---|---|---|---|---|
| LUN-CLAUDE-001 | Claude visual/items docs and mock UI intake | Codex 5.5 | Codex self-review | No | Done |

## 2026-05-09 DB Candidate Routing

| Task ID | Task | Primary | Reviewer | Human Approval | Status |
|---|---|---|---|---|---|
| LUN-DB-020-021 | Create/review user_items and character_states migration candidates | Codex 5.5 | Security Agent / Claude Code when available | Yes before apply | Review |
