# Supabase ガチャ 014/015 適用 Runbook レビュー

作成：2026-05-03
位置付け：`SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md` の運用前レビュー
方針：レビューのみ。SQL は実行しない・コードは編集しない

参照：
- `lunaria/SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md`（レビュー対象）
- `lunaria-app/supabase/migrations/014_gacha_content_v2.sql`
- `lunaria-app/supabase/migrations/015_gacha_pity_system.sql`
- `lunaria-app/scripts/gacha-verify.js`

---

## 0. 結論

Runbook は**全体として実用的**で、適用順序・確認 SQL・失敗時対応の枠組みは揃っている。ただし以下 5 点で**追記推奨**：

1. **RLS ポリシーの不在を明示**（015 で RLS enable のみ、policy 未定義）
2. **rollback SQL の具体化**（特に 015 のテーブル/カラム/RPC 削除手順）
3. **`draw_gacha_v2` と `draw_gacha` の並存ルール**を運用側に伝達
4. **既存履歴ゼロ環境での backfill no-op 動作**を期待値として明示
5. **アプリ側コード変更（gacha.ts）の挙動境界**：適用前後で何が変わるか

§7 の「閾値判断について」は別レビュー（`GACHA_PITY_THRESHOLD_REVIEW.md`）で扱われているので、本レビューでは触れない。

---

## 1. 適用手順の抜けチェック

### 1.1 SQL Editor 適用順（§2）— ⭕ 妥当

`014` → `015` の順序は妥当。`015` は `lunaria_gacha_history`（009 で作成済み）の ALTER COLUMN を含むため、010 系が適用済み環境で実行する前提。

確認：

| 依存 | 015 が依存する既存リソース | 適用済み前提 |
|---|---|---|
| `lunaria_users` | 001 で作成 | ✅ |
| `lunaria_gacha_history` | 009 で作成 | ✅ |
| `lunaria_gacha_tickets` | 009 で作成 | ✅ |
| `lunaria_gacha_inventory` | 009 で作成 | ✅ |

問題なし。

### 1.2 適用前チェック（§1）— ⭕ 良い

`gacha:report` / `gacha:verify` を先に実行して**現状の失敗状態を期待値として確認**する流れは賢い。「適用前の verify FAIL 内容が想定通りか」を確認することで、適用後の PASS 判定が信頼できる。

### 1.3 014 適用後チェック（§3）— ⭕ 充実

- rarity count
- 名前一覧（17 行返る期待）

両方妥当。

### 1.4 015 適用後チェック（§4）— ⭕ 充実

- カラム存在
- `draw_gacha_v2` の存在 + `proconfig` で search_path 確認
- 権限（`service_role` のみ）

これだけでセキュリティ要件は確認できる。

### 1.5 ローカル検証（§5・§6）— ⭕ 良い

`gacha:report` / `gacha:verify` / `gacha:smoke` の 3 段構え。ブラウザ確認も含めて十分。

---

## 2. 追記推奨：5 つの抜け

### 2.1 【追記推奨 1】RLS ポリシーの不在を明示

**問題**：

`009_gacha.sql §8` と `015_gacha_pity_system.sql §1` で `enable row level security` だけが宣言されており、**policy が一切定義されていない**。

これは Supabase の挙動として：
- `service_role` キー：RLS を bypass（問題なくアクセス可能）
- `anon` / `authenticated` キー：**全アクセス拒否**（policy 無いため）

つまり**意図通り**（Next.js API から service_role 経由でしか操作しない設計）だが、**Supabase の Linter / Advisor が警告を出す**。Runbook で「警告は意図通り」と明示しておかないと、ユーザーが「policy 漏れ」と誤認するリスク。

**追記案**：

```markdown
### 4.5 RLS ポリシー警告について

015 適用後、Supabase Database Linter で以下の警告が出る可能性がある：

> "RLS Enabled but no Policies"
> Tables: lunaria_gacha_pity_state

これは**意図通り**。Lunaria の設計では:

- `service_role`（API server）からのみアクセス
- `anon` / `authenticated` からの直接アクセスは不可（PostgREST/Data API 経由）
- policy 未定義 = anon/authenticated は全拒否

→ Supabase Advisor で **Dismiss** または **Suppress** してよい。

確認 SQL：
```sql
select tablename, rowsecurity, hasanysecurity
  from pg_tables
 where schemaname = 'public' and tablename like 'lunaria_gacha%'
 order by tablename;
-- 期待：rowsecurity = true、policy なし
```
```

### 2.2 【追記推奨 2】rollback SQL の具体化

**問題**：`§8 失敗時` には対応方針があるが、**具体的な rollback SQL** が無い。本番事故時に手が止まる。

**追記案**：

```markdown
### 8.4 Rollback SQL

#### 014 を巻き戻す場合

注意：UPDATE で書き換えた既存アイテムは、旧名・旧説明を別途記録していないと完全には戻せない。新規 INSERT は削除可能。

```sql
-- 新規 INSERT 11 件を削除（インベントリ未獲得分のみ）
delete from public.lunaria_gacha_pool
 where name in (
   '木の小箱','朝の湯のみ','古いマッチ箱',
   '空色のリボン','細紐のブレスレット',
   '月夜の鏡',
   '名のない地図','古いカメラ','鏡うつしの本','月光のティーポット','ふたりの傘'
 )
 and id not in (select pool_id from public.lunaria_gacha_inventory);

-- リネーム（A 区分 6 件）の巻き戻し（必要なもののみ）
update public.lunaria_gacha_pool set name = 'やわらかいクッション', description = 'ふわふわで居心地いい'   where name = '月見クッション';
update public.lunaria_gacha_pool set name = '古い本',                description = 'タイトルは読めない'         where name = '表紙の取れた本';
update public.lunaria_gacha_pool set name = '水晶のペンダント',      description = '光を透かす'                 where name = '光の雫ペンダント';
update public.lunaria_gacha_pool set name = '古代風コイン',          description = '由来は不明'                 where name = '名前のないコイン';
update public.lunaria_gacha_pool set name = '指輪',                  description = '誰かを待つように'           where name = '誰かのリング';
update public.lunaria_gacha_pool set name = '満月の鈴',              description = '振っても音が出ない'         where name = '無音の鈴';

-- 説明のみ変更（B 区分 4 件）の巻き戻しは省略可（影響軽微）
```

#### 015 を巻き戻す場合

```sql
-- RPC 削除
drop function if exists public.draw_gacha_v2(uuid, uuid, text);

-- history 監査カラム削除（データロスあり、慎重に）
alter table public.lunaria_gacha_history
  drop column if exists pity_before,
  drop column if exists pity_after,
  drop column if exists pity_triggered;

drop index if exists public.lunaria_gacha_history_pity_triggered_idx;

-- pity state テーブル削除
drop table if exists public.lunaria_gacha_pity_state;
```

注意：
- アプリ側の `gacha.ts` は `isMissingPityInfrastructure` で fallback するので、**RPC・テーブル削除しても 500 エラーにはならず、自動で旧 RPC（draw_gacha）にフォールバック**する
- ただし `/admin/gacha` の Moon Fullness 表示は壊れる
- gacha-verify.js は FAIL になる
```

### 2.3 【追記推奨 3】`draw_gacha_v2` と `draw_gacha` の並存ルール

**問題**：015 適用後、**RPC が 2 つ並存**する。アプリは `gacha.ts` で v2 → v1 フォールバックするが、運用上どちらが authoritative かが曖昧。

**追記案**：

```markdown
### 4.6 RPC 並存ルール

015 適用後、以下の 2 つの RPC が並存する：

| RPC | 状態 | 役割 |
|---|---|---|
| `draw_gacha` | 旧版、残置 | アプリの fallback 用 |
| `draw_gacha_v2` | 新版、authoritative | 通常運用ではこちらを使う |

アプリ側 `lib/lunaria/gacha.ts` は：

1. まず `draw_gacha_v2` を呼ぶ（pity 情報も同時に処理）
2. v2 が見つからない / pity 関連エラーなら `draw_gacha` にフォールバック

→ **本番では v2 のみが呼ばれる**。v1 は disaster recovery 用の安全網。

将来 v1 を完全廃止する場合は別 migration（例：`017_drop_legacy_draw_gacha.sql`）で実施。
このタイミングで `gacha.ts` の fallback ロジックも削除する。
```

### 2.4 【追記推奨 4】既存履歴ゼロ環境での backfill 動作

**問題**：015 §3 backfill は `with known_users as (...)` で `gacha_history` / `tickets` / `inventory` から既存ユーザーを抽出する。**まだ誰もガチャを引いていない環境**ではこの 3 テーブルが空 → backfill が **no-op**（0 行 INSERT）。

これは正常動作だが、Runbook に明示が無いと「`pity_state` テーブルが空＝失敗」と誤認するリスク。

**追記案**：

```markdown
### 4.7 既存履歴ゼロ環境での pity_state 動作

- まだ誰も `/gacha` を使っていない環境では、`015` の backfill は 0 行 INSERT になる
- `select * from lunaria_gacha_pity_state;` が空でも**正常**
- 初回 draw 時に `draw_gacha_v2` 内の `insert ... on conflict (user_id) do nothing` で自動作成される

`gacha:verify` の `Pity state row missing` WARN もこの環境では出るが、無視してよい：

> WARN Pity state row missing: no row for ...; this is OK before first draw if no prior gacha rows exist
```

### 2.5 【追記推奨 5】アプリ側挙動境界の明示

**問題**：Runbook が DB 側のチェックに偏っており、**アプリ側の挙動が適用前後でどう変わるか**が不明瞭。

**追記案**：

```markdown
### 5.3 アプリ側挙動の比較

`gacha.ts` には backward compat 設計があるため、適用前後で動作不能になることはない。各 phase の挙動：

| Phase | 014 | 015 | アプリの挙動 |
|---|---|---|---|
| 適用前 | 未適用 | 未適用 | `draw_gacha`（v1）使用、pool 30、pity 表示なし |
| 014 のみ | 適用 | 未適用 | `draw_gacha`（v1）使用、pool 41、pity 表示なし |
| 014 + 015 | 適用 | 適用 | `draw_gacha_v2` 使用、pool 41、pity 表示あり |
| 015 のみ（事故） | 未適用 | 適用 | `draw_gacha_v2` 使用、pool 30、pity 表示あり |

→ Phase 4（015 のみ）は v2 コンテンツが無い状態で v2 RPC を使う変則状態。**順番を守る**理由は世界観の整合性であり、技術的には壊れない。

### 5.4 適用前後で確認すべきアプリ画面

| 画面 | 適用前期待値 | 014 後期待値 | 014+015 後期待値 |
|---|---|---|---|
| `/gacha` | 引ける、月満ち表示なし | 引ける、月満ち表示なし | 引ける、月満ち表示あり |
| `/gacha/inventory` | 30 種が抽選対象 | 41 種が抽選対象（次回引きから新規排出） | 同左 + pity 反映 |
| `/admin/gacha` | Moon Fullness なし | Moon Fullness なし | Moon Fullness 表示 |
| `/api/gacha/state` | `pity: null` | `pity: null` | `pity: { progress, threshold, triggered }` |
| `/api/health` | OK | OK | OK + pity tables 存在報告 |

```

---

## 3. 既存項目の補強推奨

### 3.1 §3 適用後チェック（014）の補強

期待される rarity count 表示で、**before/after の対比**を入れると視覚的に分かりやすい：

```markdown
| rarity | 適用前 | 適用後 |
|---|---:|---:|
| common_a | 5 | **8** |
| common_b | 5 | **7** |
| rare_a | 3 | 3 |
| rare_b | 3 | 3 |
| epic | 2 | **3** |
| legendary | 2 | 2 |
| urban_legend | 10 | **15** |
| **total** | **30** | **41** |
```

### 3.2 §4 適用後チェック（015）に backfill 確認 SQL 追加

```sql
-- backfill 結果の妥当性チェック
select
  count(*) as users_with_pity,
  avg(draws_since_urban_legend)::numeric(6,2) as avg_progress,
  avg(lifetime_draws)::numeric(6,2) as avg_lifetime
from public.lunaria_gacha_pity_state;
```

既存ユーザーがいる環境では、`avg_progress` が 0〜99 の範囲（least で 99 でキャップ）。

### 3.3 §6 ブラウザ確認に開発ツール起動順序追加

```markdown
### 6.1 ブラウザ確認の手順

1. `npm run dev` で起動
2. Chrome DevTools の Network タブを開いた状態で `/gacha` を開く
3. `/api/gacha/state` レスポンスに `pity` フィールドがあることを確認
4. `pity.threshold === 100` であることを確認（閾値変更の可能性に備えて）
5. デイリーボーナス受取 → 引く → モーダルにルナのリアクション
6. かぶり時はコイン加算が画面に出る
```

---

## 4. 重点レビュー：015 の `draw_gacha_v2` セキュリティ周辺

### 4.1 search_path 固定 ⭕

`015 §4 末尾`：

```sql
alter function public.draw_gacha_v2(uuid, uuid, text)
  set search_path = public, pg_temp;
```

→ Supabase Advisor の "Function Search Path Mutable" 警告を防ぐ正攻法。
旧 `draw_gacha` も `013_gacha_operational_hardening.sql` で同様の対応済み。**整合性 OK**。

### 4.2 EXECUTE 権限 ⭕

`015 §4 末尾`：

```sql
revoke execute on function public.draw_gacha_v2(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.draw_gacha_v2(uuid, uuid, text)
  to service_role;
```

→ `011_lock_gacha_rpc.sql` と同じパターン。`anon` / `authenticated` から直接呼べないので、ブラウザから **`user_id` 偽装で他人のチケット消費**等の攻撃が成立しない。**OK**。

### 4.3 RLS ⭕（ただし §2.1 で指摘した警告対応必要）

`015 §1`：

```sql
alter table public.lunaria_gacha_pity_state enable row level security;
```

policy 無いので `anon` / `authenticated` は全拒否、`service_role` は bypass。設計通りだが Advisor 警告対応の文書化要。

### 4.4 トランザクション境界 ⭕

`draw_gacha_v2` 内部：
- pity_state を `for update` で行ロック
- チケット消費（`update ... where count >= 1 returning`）
- inventory upsert
- coins upsert
- pity_state UPDATE
- history INSERT

すべて 1 RPC 内で完結 = PostgreSQL のトランザクション境界に従う。**race condition 耐性 OK**。

懸念があるとすれば：
- `for update` を持つ pity_state UPDATE と、ticket consumption の順序。pity 検査が先行 → ticket 消費は後（`pity_required` 例外時にチケット消費されない設計）→ **これは正しい**

### 4.5 例外処理 ⭕

カスタムエラーコード（`P0001`）で：
- `invalid_rarity`
- `pool_not_found`
- `rarity_mismatch`
- `pity_state_missing`
- `pity_required`
- `no_ticket`

を区別。アプリ側 `gacha.ts` も message 文字列マッチでエラー種別を区別。**過剰でなく必要十分**。

ただし、message 文字列マッチは脆弱。将来的には errcode（`P0001` は generic）を細分化（`P0002`〜）するか、JSON エラーペイロードを使う方が堅牢。**v2 では妥協 OK**。

---

## 5. 総合評価

| 項目 | 評価 |
|---|---|
| 適用手順 | ⭕⭕ 順序・確認 SQL ともに妥当 |
| 適用前後の検証 | ⭕ `gacha:verify` 含めて充実 |
| rollback 対応 | △ 方針はあるが具体 SQL 不足 → §2.2 追記推奨 |
| RLS / 権限 / search_path | ⭕ 実装は正しいが運用文書化が薄い → §2.1 追記推奨 |
| 既存環境（履歴ゼロ）対応 | △ 暗黙の前提あり → §2.4 追記推奨 |
| アプリ挙動境界 | △ DB 側に偏っている → §2.5 追記推奨 |
| RPC 並存ルール | △ 言及なし → §2.3 追記推奨 |

→ **本体は OK**。5 つの追記を入れれば運用品質が一段上がる。

---

## 6. 推奨追記の取り込み方

オプション A：Runbook 本体を直接編集して反映  
オプション B：本レビュー文書を補足参照として運用に渡す  
オプション C：Codex に「追記 1〜5 を Runbook に取り込んで」と依頼

**僕の推奨：A**。Runbook は単一文書で完結している方が運用時に便利。本レビューはアーカイブとして残す。

---

## 7. 議論したい論点

1. **追記 1〜5 を Runbook 本体に取り込むか、別文書のままで参照させるか**
2. **rollback SQL を別 file（`016_gacha_rollback.sql.sample` 等）として保存するか**：実行禁止コメント付きで残す手もある
3. **RPC 並存ルール（§2.3）の運用期間**：v1 を半永久に残すか、3 ヶ月後に削除するか
4. **`gacha:verify` の閾値ハードコード**：100 がコードに直接書かれている（gacha-verify.js L154 / L189）。閾値変更時に修正漏れリスク。`pity.threshold` を読む形に書き換える価値はある（小タスク）

---

## 8. 関連ドキュメント

- `SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md`：レビュー対象本体
- `GACHA_PITY_THRESHOLD_REVIEW.md`：閾値 100/200/300/500 の比較
- `MOONBOX_V2_COPY_FINAL_QA.md`：014 文言の最終 QA
- `POST_CODEX_STATUS_REVIEW.md`：post-Codex 棚卸し
- `015_gacha_pity_system.sql`：実装本体
