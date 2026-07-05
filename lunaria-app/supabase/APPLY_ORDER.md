# 本番Supabase migration 適用手順(正史)

結論: **正史は `migrations/` の連番 001〜023。番号順にそのまま適用する。**
`manual/` のバンドル4本は、開発DBへ手動適用するために連番を連結したコピーであり、
**本番では使わない**(二重適用になる)。

## 手順

1. 本番Supabaseプロジェクトを新規作成(devの uegefcjabpqinhokgkxe とは別)
2. SQL Editor で 001 から 023 まで**番号順に1本ずつ**実行する
   - **003_seed_dev_user.sql はスキップ**(開発用固定UUIDユーザーのシード。
     本番は Supabase Auth の実ユーザーのみ)
   - 023_rls_hardening.sql は必ず最後
3. 適用後の確認:
   - `node scripts/gacha-verify.js`(本番の env を向けて実行)
   - Supabase ダッシュボードで RLS が全テーブル有効になっていること

## 備考

- 010/012/014 はガチャのコンテンツseed。本番に初期アイテムを入れる正規の手段なので実行する
- knowledge_update.md は文書。実行対象外
- 以後の新規migrationは 024 から連番で追加し、manual バンドルはもう作らない
