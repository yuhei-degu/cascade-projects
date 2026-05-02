# Supabase ガチャ 014/015 適用 Runbook

作成：2026-05-03  
目的：`014_gacha_content_v2.sql` と `015_gacha_pity_system.sql` を Supabase SQL Editor で安全に適用し、月箱 v2 + 天井基盤を有効化する。

---

## 0. 現状

コード側は以下まで master に反映済み。

- `014_gacha_content_v2.sql`
- `015_gacha_pity_system.sql`
- `draw_gacha_v2` 自動切替 + legacy fallback
- `/gacha` の「月が満ちるまで」表示
- `/admin/gacha` の Moon Fullness 表示
- `npm run gacha:verify`

ただし、接続先 Supabase はまだ `014/015` 未適用。

現在の期待される未適用状態：

```text
Active pool: 30/30
Moon fullness: Not available
gacha:verify: FAIL
```

---

## 1. 適用前チェック

ローカルで実行：

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run gacha:report
npm run gacha:verify
```

適用前は `gacha:verify` が失敗してよい。

失敗内容の期待値：

- `Active pool total: 30/41`
- `lunaria_gacha_pity_state` が見つからない
- `pity_before` が見つからない

---

## 2. SQL Editor で実行する順番

Supabase Studio の SQL Editor で、必ず順番に実行する。

1. `lunaria-app/supabase/migrations/014_gacha_content_v2.sql`
2. `lunaria-app/supabase/migrations/015_gacha_pity_system.sql`

注意：

- `015` は `014` に直接依存していないが、運用上は `014` → `015` の順番に揃える
- `014` は既存 item を `UPDATE` し、新規 item を `INSERT`
- `015` は新規 table / columns / RPC を追加
- どちらも既存 migration ファイルを編集しない

---

## 3. 014 適用後チェック

SQL Editor で実行：

```sql
select rarity, count(*) as items
  from public.lunaria_gacha_pool
 where is_active
 group by rarity
 order by rarity;
```

期待値：

```text
common_a      8
common_b      7
rare_a        3
rare_b        3
epic          3
legendary     2
urban_legend 15
```

名前チェック：

```sql
select name, rarity
  from public.lunaria_gacha_pool
 where name in (
   '月見クッション',
   '表紙の取れた本',
   '光の雫ペンダント',
   '名前のないコイン',
   '誰かのリング',
   '無音の鈴',
   '木の小箱',
   '朝の湯のみ',
   '古いマッチ箱',
   '空色のリボン',
   '細紐のブレスレット',
   '月夜の鏡',
   '名のない地図',
   '古いカメラ',
   '鏡うつしの本',
   '月光のティーポット',
   'ふたりの傘'
 )
 order by rarity, name;
```

期待：17 行返る。

---

## 4. 015 適用後チェック

SQL Editor で実行：

```sql
select column_name
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'lunaria_gacha_history'
   and column_name in ('pity_before', 'pity_after', 'pity_triggered')
 order by column_name;
```

期待：

```text
pity_after
pity_before
pity_triggered
```

Pity state：

```sql
select *
  from public.lunaria_gacha_pity_state
 order by updated_at desc;
```

RPC：

```sql
select proname, proconfig
  from pg_proc p
  join pg_namespace n on p.pronamespace = n.oid
 where n.nspname = 'public'
   and proname = 'draw_gacha_v2';
```

期待：

- `draw_gacha_v2` が 1 行返る
- `proconfig` に `search_path=public, pg_temp` が含まれる

権限：

```sql
select grantee, privilege_type
  from information_schema.routine_privileges
 where routine_schema = 'public'
   and routine_name = 'draw_gacha_v2'
 order by grantee;
```

期待：

- `service_role` の `EXECUTE`
- `anon` / `authenticated` が出ないこと

---

## 5. ローカル検証

SQL 適用後に実行：

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run gacha:report
npm run gacha:verify
npm run gacha:smoke
```

期待：

- `gacha:report`
  - `Active: 41/41`
  - `Moon fullness Progress: n/100`
- `gacha:verify`
  - PASS
- `gacha:smoke`
  - PASS

---

## 6. ブラウザ確認

ローカル dev server：

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run dev
```

確認：

- `/gacha` に「月が満ちるまで」が表示される
- `/admin/gacha` に `MOON FULLNESS` が表示される
- デイリーボーナス受取が動く
- チケットがあれば月箱を受け取れる
- 結果モーダルにルナのリアクションが出る

---

## 7. 閾値判断について

現状の `015` は **100 連**で `urban_legend` に到達する設計。

Claude review `POST_CODEX_STATUS_REVIEW.md` では「100 連は甘すぎる可能性」が指摘されている。

判断肢：

- 100：20 日程度で必ず都市伝説。体験は強いが希少性は下がる
- 200：40 日程度。日常と希少性の中間
- 300：60 日程度。都市伝説らしさを残しやすい
- 500：100 日程度。初期設計に近いが救済感は弱い

実装上は現在 `99` がコードと RPC にハードコードされている。変更するなら `016_gacha_pity_threshold.sql` とアプリ側定数化を行う。

---

## 8. 失敗時

### 014 で失敗した場合

- unique constraint のエラーなら、同名 item が既に存在していないか確認
- `UPDATE` が 0 rows でも、旧名が既に変更済みなら問題なし
- active pool が 41 にならない場合は、新規 item の `on conflict` が発火している可能性

### 015 で失敗した場合

- `lunaria_users` / `lunaria_gacha_history` / `lunaria_gacha_tickets` が存在するか確認
- `draw_gacha_v2` の `create or replace function` で失敗したら、エラー行を記録して Claude/Codex に戻す

### アプリが 500 になる場合

まず実行：

```powershell
npm run gacha:report
npm run gacha:smoke
```

見るログ：

- `[gacha/state]`
- `[gacha/draw]`
- `[admin/pool-stats]`

---

## 9. 完了条件

以下すべてを満たせば完了。

- `npm run gacha:verify` が PASS
- `npm run gacha:smoke` が PASS
- `/gacha` に月満ち表示
- `/admin/gacha` に Moon Fullness 表示
- active pool が 41
- `draw_gacha_v2` が存在し、`service_role` のみ実行可能
