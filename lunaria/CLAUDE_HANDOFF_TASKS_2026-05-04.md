# Claude Handoff Tasks - 2026-05-04

## 前提
- Repo: `C:\Users\yuuve\CascadeProjects`
- Codex 側では `/diary` ページの文字化け修正とUI再整備を進行中
- Claude は同じファイルを直接編集しないで、レビュー/設計/追加タスク整理を担当
- コード編集はしない。必要なら提案だけ書く

## Task 1: AI日記UIレビュー

関連ファイル:
- `lunaria-app/app/diary/page.tsx`
- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`
- `lunaria/LUNARIA_DIARY_MEMORY_REVIEW.md`

やってほしいこと:
1. `/diary` の表示項目が AI日記/記憶設計に合っているかレビュー
2. 「日記」「会話ログ」「長期記憶候補」の境界がユーザーに誤解されにくいか確認
3. ルナリアらしい文言として強すぎる/弱すぎる箇所を指摘
4. 追加したほうがよい小さなUI要素を優先順位つきで提案
5. 出力先: `lunaria/DIARY_UI_REVIEW_2026-05-04.md`

注意:
- コード編集はしない
- 既存UIのスクリーンショットがなくても、ファイルを読んでレビューする
- 「実装必須」と「後回しでよい」を分ける

## Task 2: 記憶閲覧UIの次フェーズ設計

関連資料:
- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`
- `lunaria/LUNARIA_DIARY_MEMORY_REVIEW.md`
- `lunaria-app/supabase/migrations/018_core_memory_provenance.sql`
- `lunaria-app/lib/lunaria/memory.ts`

やってほしいこと:
1. ユーザーが日付指定で「その日に何を話したか」「その日何を記憶したか」を見られるUI案を作る
2. `source_date`, `source_message_id`, `confidence`, `status` をどう表示するか提案
3. 記憶の削除/修正/確認を入れるなら、最小MVPの操作フローを書く
4. AI日記と長期記憶の違いが伝わるコピー案を作る
5. 出力先: `lunaria/MEMORY_VIEWER_NEXT_PHASE_PLAN.md`

注意:
- migration は作らない
- コード編集はしない
- DBの未確認推測は「要確認」と明記

## Task 3: 次にCodexへ渡す実装候補の整理

やってほしいこと:
1. いま完成に近づけるための実装候補を 5-8 件に絞る
2. 各候補に「ユーザー価値」「リスク」「編集対象ファイル」「推定工数」を付ける
3. Claude向き/ Codex向き/ ユーザー作業あり を分類
4. 出力先: `lunaria/NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md`

注意:
- Vercel 本番公開は無料枠制約があるので優先度を下げる
- ガチャ・日記・記憶・チャット体験の順で見る
