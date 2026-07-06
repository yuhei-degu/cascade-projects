# PIPELINE — OSの全状態はこのファイルだけ

| project | state | since | kill_criteria | notes |
|---|---|---|---|---|
| Lunaria | building (smoke passed on prod DB 2026-07-05) | 2026-07-04 | 公開後4週間、自分以外の利用者0なら見直し(承認時に確定) | 残: Supabase本番作成(人間) → deployed へ |

states: candidate / approved / building / deployed / in-use / done / killed
rules: building は常に最大1行。タスク源は承認時分解と実利用のみ。
