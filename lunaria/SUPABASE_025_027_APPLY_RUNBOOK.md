# Supabase 025〜027 適用ランブック（ピボット Phase 1〜3）

作成日: 2026-07-18
対象: `lunaria-app/supabase/migrations/` の 025 / 026 / 027

## 適用するもの

| # | ファイル | 内容 | 未適用時の挙動 |
|---|---|---|---|
| 025 | `025_work_items.sql` | `lunaria_work_items` 新設（作業抽出の保存先） | 抽出はスキップ（警告ログのみ）。/work は「準備中」表示 |
| 026 | `026_diary_tomorrow_step.sql` | `lunaria_diary_logs.tomorrow_step` 列追加 | 一手の生成をスキップ。日記・第一声は従来動作 |
| 027 | `027_weekly_reviews.sql` | `lunaria_weekly_reviews` 新設（週次レビュー） | /work のふりかえりは 409 → UI非表示 |

3つとも「未適用でも会話は壊れない」設計だが、ピボットMVPの機能は全部この3つに乗っている。

## 手順

1. Supabase Dashboard → SQL Editor
2. **025 → 026 → 027 の順に**そのまま貼り付けて実行（各ファイルは冪等。再実行可）
3. 各実行後にエラーがないことを確認

## 検証クエリ

```sql
-- 025: テーブルとRLS
select relname, relrowsecurity from pg_class where relname = 'lunaria_work_items';
select polname from pg_policy where polrelid = 'public.lunaria_work_items'::regclass;
-- 期待: select/insert/update/delete の *_own 4本

-- 026: 列
select column_name from information_schema.columns
where table_name = 'lunaria_diary_logs' and column_name = 'tomorrow_step';

-- 027: テーブルとRLS
select relname, relrowsecurity from pg_class where relname = 'lunaria_weekly_reviews';
select polname from pg_policy where polrelid = 'public.lunaria_weekly_reviews'::regclass;
-- 期待: select_own 1本のみ（書き込みは service_role 専用）
```

## 動作確認（適用後）

1. チャットで作業報告をする（例:「今日は請求書のテンプレ直した」）→ /work に数十秒以内に出る
2. /work で kind をタップで付け替え → リロードしても維持される
3. 日記を生成 → 日記ページに「明日の一手」セクションが出る
4. 翌朝(または履歴なし状態)の第一声が一手に触れる
5. /work の「ふりかえりを作る」→ 今週のレビューが出る

## ロールバック

```sql
drop table if exists public.lunaria_weekly_reviews;
alter table public.lunaria_diary_logs drop column if exists tomorrow_step;
drop table if exists public.lunaria_work_items;
```
アプリ側は全部 graceful degradation するので、ロールバックしてもデプロイし直す必要はない。

## 関連

- 設計: `lunaria-app/docs/pivot-plan.md`
- eval: `scripts/eval-extraction.mts`(10/10) / `eval-next-step.mts`(3/3) / `eval-weekly-review.mts`(2/2)
- Vercel: `NEXT_PUBLIC_SHOW_PLAYFUL` 未設定なら次デプロイからガチャ/ゲーム導線が非表示（保留）。表示を維持したいなら `1` を設定
