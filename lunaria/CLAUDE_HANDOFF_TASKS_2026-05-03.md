# Claude 作業割り振り 2026-05-03

作成：2026-05-03  
目的：Codex が進めた月箱 v2 / 天井 / 運用チェック周辺について、Claude に任せるべきレビュー・判断・文書整合タスクをまとめる。

---

## Claude へ渡す優先タスク

### Task 1. 天井閾値レビュー

狙い：100 連のまま進めるか、200 / 300 / 500 に変更するかを哲学・体験設計の観点で決める。

Claude へのプロンプト：

```markdown
Lunaria ガチャ天井システムの閾値レビューをして。

Repo: C:\Users\yuuve\CascadeProjects

関連資料:
- lunaria/GACHA_PITY_SYSTEM_DESIGN.md
- lunaria/POST_CODEX_STATUS_REVIEW.md
- lunaria/PHASE_G_GACHA_DESIGN.md
- lunaria/MOONBOX_ITEM_GUIDELINES.md
- lunaria-app/supabase/migrations/015_gacha_pity_system.sql
- lunaria-app/lib/lunaria/gacha.ts

やってほしいこと:
1. 100 / 200 / 300 / 500 連の4案を比較
2. urban_legend の希少性、Lunariaらしさ、日次5回ペース、離脱防止の観点で評価
3. 最終推奨を1つ出す
4. もし100以外を推奨するなら、必要な変更箇所を列挙
5. 出力先: lunaria/GACHA_PITY_THRESHOLD_REVIEW.md

注意:
- コード編集はしない
- migration は作らない
- Codex実装を否定するのではなく、運用前レビューとして冷静に評価する
```

### Task 2. ドキュメント整合性レビュー

狙い：進捗が一気に進んだため、古い計画書のステータスを最新化する。

Claude へのプロンプト：

```markdown
Lunaria の次フェーズ候補ドキュメントを、現在の master 実態に合わせて更新案として整理して。

Repo: C:\Users\yuuve\CascadeProjects

関連資料:
- lunaria/NEXT_PHASE_CANDIDATES.md
- lunaria/POST_CODEX_STATUS_REVIEW.md
- lunaria/PROGRESS.md
- lunaria/MOONBOX_V2_FINAL_REVIEW.md
- lunaria/GACHA_PITY_SYSTEM_DESIGN.md
- lunaria/SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md

やってほしいこと:
1. NEXT_PHASE_CANDIDATES.md の古い記述を洗い出す
2. 候補 C（月箱コンテンツ v2）と候補 E（天井）を現在の実態に合わせてステータス更新案にする
3. 候補 D（本番/Supabase適用）を最優先に再配置する案を出す
4. PROGRESS.md に追記すべき短い更新文案を作る
5. 出力先: lunaria/NEXT_PHASE_STATUS_UPDATE_PROPOSAL.md

注意:
- 既存ファイルを直接編集しない
- 変更案としてまとめる
- 本番Vercel専用プロジェクトは無料枠制約があるため、強く推さず「後回し」扱いにする
```

### Task 3. 月箱 v2 文言の最終人格レビュー

狙い：`014` の item name / description が Luna の人格・Lunaria の空気に合っているか確認する。

Claude へのプロンプト：

```markdown
月箱 v2 の item name / description を、Lunaria人格・詩情の観点で最終レビューして。

Repo: C:\Users\yuuve\CascadeProjects

関連資料:
- lunaria/MOONBOX_V2_FINAL_REVIEW.md
- lunaria/MOONBOX_ITEM_GUIDELINES.md
- lunaria-app/supabase/migrations/014_gacha_content_v2.sql

やってほしいこと:
1. 014で追加/更新される文言を全件レビュー
2. 「L」刺繍、ふたりの傘、誰かのリングの関係性モチーフが重すぎないか評価
3. 変更した方がいい文言があれば、migration適用前に差し替え案を出す
4. 出力先: lunaria/MOONBOX_V2_COPY_FINAL_QA.md

注意:
- コード編集はしない
- migration は作らない
- 014適用前に差し替えが必要なものだけ強く指摘する
```

### Task 4. Supabase 適用手順の第三者チェック

狙い：SQL Editor で `014` → `015` を流す前に、手順漏れやrollback不足を確認する。

Claude へのプロンプト：

```markdown
Supabase ガチャ migration 014/015 適用 Runbook をレビューして。

Repo: C:\Users\yuuve\CascadeProjects

関連資料:
- lunaria/SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md
- lunaria-app/supabase/migrations/014_gacha_content_v2.sql
- lunaria-app/supabase/migrations/015_gacha_pity_system.sql
- lunaria-app/scripts/gacha-verify.js

やってほしいこと:
1. SQL Editor 適用手順に抜けがないか確認
2. 適用前/適用後チェックSQLが十分か確認
3. rollback/失敗時対応が足りなければ追記案を出す
4. 特に 015 の `draw_gacha_v2` と RLS / 権限 / search_path 周辺を重点レビュー
5. 出力先: lunaria/SUPABASE_GACHA_014_015_RUNBOOK_REVIEW.md

注意:
- コード編集はしない
- SQLは実行しない
- レビューのみ
```

---

## Codex 側で進める候補

Claude が上記を実行中に Codex が進めてよいもの：

- `NEXT_PHASE_CANDIDATES.md` の機械的更新
- `PROGRESS.md` の更新
- `gacha:verify` の追加改善
- `014/015` 適用後のブラウザ・CLI確認
- 閾値が100以外になった場合の `016` migration とアプリ定数化

---

## 優先順位

今すぐ Claude に渡すなら、順番は以下。

1. Task 1: 天井閾値レビュー
2. Task 4: Supabase 適用手順レビュー
3. Task 3: 月箱 v2 文言最終QA
4. Task 2: ドキュメント整合性レビュー

理由：

- `014/015` の実DB適用前に閾値とSQL手順を固めたい
- 文言QAは `014` 適用前ならまだ差し替えやすい
- ドキュメント整合は後からでも取り戻せる
