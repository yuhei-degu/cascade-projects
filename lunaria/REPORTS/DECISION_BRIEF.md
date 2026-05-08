# Lunaria Decision Brief

作成日: 2026-05-09

## 目的

人間判断が必要な内容を、選択肢・推奨案・リスク・可逆性と一緒に記録する。

## Active Decision Briefs

### DEC-001: AI_DEV_OS 運用ファイルの置き場所

| 項目 | 内容 |
|---|---|
| Decision Needed | AI_DEV_OS 運用ファイルをルートに置き続けるか、`lunaria/` に寄せるか |
| Recommended Option | `lunaria/` に Lunaria 専用の試験運用ファイルを置き、ルートは短期の司令塔として残す |
| Why | ドキュメント母艦が `lunaria/` であり、Lunaria 専用の記録はそこに集約した方が後で見つけやすい |
| Risks | ルート `TASKS.md` と二重管理になる |
| Reversible? | Yes |
| Human Confirmation | Adopted for trial |

### DEC-002: 最初のAI_DEV_OS実装実験

| 項目 | 内容 |
|---|---|
| Decision Needed | 最初に試す小さな実装タスクを何にするか |
| Recommended Option | `LUN-REA-001`: `LunariaPortrait` を `/gacha` 結果モーダルに接続 |
| Why | DB / 認証 / env に触らず、reaction layer の価値を小さく検証できる |
| Risks | UI 表示が少し変わるため、ルナリアらしさの目視確認が必要 |
| Reversible? | Yes |
| Human Confirmation | Approved and completed |

### DEC-003: Supabase migration 確認の扱い

| 項目 | 内容 |
|---|---|
| Decision Needed | `014`-`019` の DB 適用状態確認をいつ行うか |
| Recommended Option | 実装前の別タスクとして、人間操作込みで確認する |
| Why | Git の migration と Supabase 実 DB 状態は一致しているとは限らない |
| Risks | 未確認のまま memory/gacha を進めると、ローカルは通っても実DBで壊れる可能性 |
| Reversible? | N/A |
| Human Confirmation | Required |

## Template

```text
### DEC-XXX: Title

| 項目 | 内容 |
|---|---|
| Decision Needed |  |
| Options |  |
| Recommended Option |  |
| Why |  |
| Risks |  |
| Cost / Complexity |  |
| Reversible? |  |
| Human Confirmation | Pending / Approved / Rejected |
```
