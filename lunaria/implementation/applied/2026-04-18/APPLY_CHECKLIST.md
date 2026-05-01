# 適用前チェックリスト（2026-04-18）

対象リポジトリ：`C:\Users\yuuve\CascadeProjects\lunaria-app`
対象 DB：Supabase（Certi-AI Hub プロジェクト・`lunaria_` prefix）

このチェックリストは `PROFILE_MEMORY_INTEGRATION.md` の設計を実適用する前に一度走らせるもの。**壊れた状態のまま進まないこと**が最優先。何か想定と違っていたらここで止めて INTEGRATION.md と突き合わせ直す。

---

## 実測値ログ（適用作業の1次ログ・埋めながら進める）

> Phase A / C / D で観測した値をここに追記する。後日「なぜ patch を書き換えたか」を辿るための記録。推測や予定ではなく、必ず**目で見た値**だけ書く。

### 環境
- 実施日時：`2026-04-18`（Phase B/C/D 同日）
- 実施者：`橋本悠平` + Cowork (Claude)
- Supabase プロジェクト：`___________________`（URL 末尾の project ref・後日記入）
- dev user_id：`00000000-0000-0000-0000-000000000001`

### Phase A 実測（スキーマ・最重要3点）
- [x] `lunaria_core_memory` 本文列名：**`content`**
- [x] `lunaria_user_profile.gender` 型：**該当なし。`user_profile` は EAV 形式 (field, value, source) で、gender は行として格納（value は text 自由文）**
- [ ] 006 までの適用済み migration version：`_______________`（`schema_migrations` テーブルが無ければ手動履歴で可）
- [x] 007 / 008 が未適用であることを確認：**Yes（superseded_by_profile 列なし）**

### 設計への影響（2026-04-18 判明）
- `lunaria_user_profile` は **EAV (field, value, source) モデル**。当初の wide-columns 想定は全面誤り。
- 既存テーブルが設計文書（SPEC.md の MVP 最小構成）より遥かに多い：
  - `lunaria_pending_profile_updates` (id,user_id,field,detected_value,trigger_message,created_at) → **pending フロー用カラム追加は不要**
  - `lunaria_profile_archive` (id,user_id,field,old_value,new_value,archived_at) → **`archived jsonb` カラム追加は不要**
  - `lunaria_preferences` 既存 → 嗜好は core_memory と別枠、3-way 分離が既に効いている可能性大（要 Q8/Q9 確認）
  - `lunaria_extractions` 既存 → 抽出ログは残っている
  - `lunaria_emotion_state` / `lunaria_relationship_state` / `lunaria_affinity` / `lunaria_diary_logs` / `lunaria_route_master` / `lunaria_routing_review` も既存
- `core_memory.type` 値域：`pattern`(8) / `goal`(1) / `name`(1) / `value`(1)。意味カテゴリ分類であり、属性 vs エピソードの区別ではない。
- **当初案の大幅縮小**：007 は空 or 不要、008 の supersede フラグも不要な公算。「マイグレーション追加」から「抽出パイプラインを既存スキーマに整合させる」へ方針転換。

### Phase A 実測（core_memory 周辺カラム）
> pickMemories / audit スクリプトのクエリがそのまま通るか判定するため。
- [x] ユーザー参照列名は `user_id` か：**Yes**
- [x] `created_at` 存在：**Yes**
- [x] `importance` 存在：**No** → 代替として `score integer DEFAULT 3` を使う
- [x] `last_used_at` 存在：**No** → 代替として `last_seen timestamptz` を使う
- [x] `superseded_by_profile` が **未だ存在しない**ことを確認：**Yes（未作成）**
- 追加発見：`type text NOT NULL` / `memory_key text` / `memory_category text` / `hit_count integer DEFAULT 1` が既存。→ supersede フラグを追加する代わりに `type` や `memory_category` で分離できる可能性あり。値域を追加クエリで確認中。

### Phase A 実測（データ量）
- [x] `lunaria_user_profile` レコード数：`2`（cleanup 前。gender, occupation）
- [x] `lunaria_core_memory` 総件数：`11`（うち `memory_category='profile'` が 2 行）
- [x] 属性重複候補（`memory_category='profile'`）件数：`2`（user_name, user_gender）
- [x] dev user の現 profile：`gender=男性, occupation=ITエンジニア・SES, age_band=未登録`

### Phase A 目視確認（誤爆傾向）
> ILIKE クエリのヒット上位 2〜3 件を開いて、本当に属性情報か／ただのエピソードかを確認。誤爆パターンが見えたらキーワードを絞る。
- サンプル1：id=`___________` / preview=`_______________` / 判定：属性 / エピソード / 判断つかない
- サンプル2：id=`___________` / preview=`_______________` / 判定：属性 / エピソード / 判断つかない
- サンプル3：id=`___________` / preview=`_______________` / 判定：属性 / エピソード / 判断つかない
- 誤爆傾向メモ：`_______________`（例：「男」が「男女別」「長男」等で過剰にヒット → 短い語は除外）

### パッチ書き換え記録（実スキーマに合わせた修正）
> 想定と違ったので変更した箇所を1行ずつ。「変更なし」なら「なし」と書く。
- `008_profile_memory_sync.sql`：`v2 で破棄済・適用せず`
- `profile.patch.md`：`buildProfileSummary(userId) 1 行サマリ化は見送り。現行 buildProfileContext(profile[]) の多行プロンプトを維持。ProfileField 型拡張のみ実施`
- `memory.patch.md`：`pickMemories は新設したが、既存 saveCoreMemory は全面書き直し（resolveCanonical 廃止・name リダイレクト・looksLikeProfileMention ガード）。新規メモリの memory_category は常に NULL`
- `prompt-builder.patch.md`：`buildPrompt(ctx) への一本化は見送り。既存 buildNormalPrompt / buildSeriousPrompt 2 本体制のまま、normal 側から coreMemCtx 注入だけ外した`
- `extract.patch.md`：`今日の範囲では未適用（extraction.ts 書き換えは次回以降）。Gemini プロンプトは現状の long_term_candidate スキーマを維持。memory.ts 側のガードで profile 相当の長期候補を弾く`
- `app/api/chat/route.ts`：`パッチ非記載だが fieldLabel Record に name: '名前' を 2 箇所追加（profile.name 行が cleanup で増えたため）`
- `scripts/audit-core-memory.ts`：`DEPRECATED のまま放置・適用せず`

### Phase B 実測（バックアップ）
- [x] `backups/2026-04-18-profile.json` 保存済み（サイズ：`608` bytes・2 行）
- [x] `backups/2026-04-18-core_memory.json` 保存済み（サイズ：`4873` bytes・11 行）
- [x] 事後スナップショット `backups/2026-04-18-post-cleanup-*.json` も保存（cleanup 成功の証跡として）

### Phase C 実測（マイグレーション実行）
- [x] 007 は v2 で破棄・実行せず
- [x] 008 は v2 で破棄・実行せず
- [x] `cleanup_profile_duplicates.sql` 実行：`2026-04-18`・事前/事後 DO ブロックチェック通過・エラーなし
- [x] `lunaria_user_profile.name` 行新規追加：id=`254104a1-ab73-4bea-938f-1b7aaeeab1bd`・value=`悠平`
- [x] `lunaria_core_memory.memory_category='profile'` 残存：0 件（cleanup 前 2 件 → cleanup 後 0 件）

### Phase D 実測（棚卸）
v2 では supersede フラグが不要になったため、棚卸プロセスは不要化。`audit-core-memory.ts` は DEPRECATED のまま実行せず。cleanup SQL が唯一のデータ変更。
- [x] `audit-core-memory.ts`：`DEPRECATED・実行せず`
- [x] 重複候補件数：`2`（Phase A で既知：user_name / user_gender）
- [x] 自動 supersede 件数：`N/A`（supersede 概念を v2 で廃止）
- [x] 手動 supersede 件数：`N/A`

### Phase E/F 実測（コード適用と検証）
- [x] `tsc --noEmit` エラーなし：Yes（exit=0）
- [x] regex ガードレール自己テスト：reject 9/9・pass 11/11（over-reject なし）
- [ ] 検証シナリオ 1〜5 の結果：`_______________`（Phase E・ユーザー dev パネル検証待ち）

---

---

## Phase A：現状スキーマの確認（破壊的変更なし）

Supabase SQL Editor で以下を順に流して、結果をコピーしておく。
**1 ファイルにまとめたもの：** [`implementation/migrations/phase_a_inspect.sql`](./migrations/phase_a_inspect.sql)（丸ごと貼ってもブロック単位でもOK）

### A-1. `lunaria_user_profile` の現在カラム

```sql
SELECT column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'lunaria_user_profile'
 ORDER BY ordinal_position;
```

**確認ポイント**
- `gender`, `occupation` が存在するはず（006 で追加済み）
- `age_band`, `user_nickname`, `lunaria_nickname`, `lifestyle_pattern`, `archived` は **存在しないはず**（存在していたら 007 は skip できる）
- カラム型が想定と合うか（gender が text か enum か）

### A-2. `lunaria_core_memory` の現在カラム

```sql
SELECT column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'lunaria_core_memory'
 ORDER BY ordinal_position;
```

**確認ポイント**
- テキスト本体のカラム名（`text` か `content` か `memory_text` か）を確認。008 migration の RPC で使っているカラム名を実物に合わせて書き換える必要がある
- `superseded_by_profile`, `superseded_reason` は存在しないはず
- `user_id`, `importance`, `last_used_at` 相当のカラムがあるか（`pickMemories` で使う）

### A-3. 既存データのスナップショット

```sql
-- 現在の dev user の profile 値
SELECT * FROM lunaria_user_profile ORDER BY updated_at DESC LIMIT 5;

-- core_memory 件数と「属性っぽい」エントリの存在チェック
SELECT count(*) AS total FROM lunaria_core_memory;

SELECT id, user_id, left(text, 60) AS preview, created_at
  FROM lunaria_core_memory
 WHERE text ILIKE ANY (ARRAY['%男%','%女%','%エンジニア%','%SES%','%会社員%','%フリーランス%'])
 ORDER BY created_at DESC
 LIMIT 50;
```

> 2 つ目のクエリの列名（`text`）は A-2 の結果で正しい名前に差し替える。

**確認ポイント**
- dev ユーザー（gender: 男性, occupation: ITエンジニア・SES）が想定通りか
- core_memory に属性重複エントリが何件あるか体感する。0 件ならそもそも重複問題は発生していない → 予防的に進めるだけ

### A-4. 既存マイグレーションの適用状況

```sql
-- supabase cli を使っている場合
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;
```

**確認ポイント**
- 006 が適用済みか
- 007 / 008 がまだ入っていないか（入っていたら別名で作る）

---

## Phase B：バックアップ

適用中に何か壊した時のために、小さく取っておく。dev なので雑で OK。

```sql
-- profile の全レコードを JSON でダンプ
SELECT json_agg(row_to_json(t)) FROM lunaria_user_profile t;

-- core_memory の全レコードを JSON でダンプ
SELECT json_agg(row_to_json(t)) FROM lunaria_core_memory t;
```

結果を `lunaria-app/backups/2026-04-18-profile.json` と `lunaria-app/backups/2026-04-18-core_memory.json` に保存（ディレクトリは `.gitignore` 推奨）。

---

## Phase C：データクリーンアップ（スキーマ変更は無し）

v2 ではマイグレーション（007/008）はすべて破棄した。**ここで流すのは `scripts/cleanup_profile_duplicates.sql` 1 本のみ**。

Supabase SQL Editor で開いて実行：

- `implementation/scripts/cleanup_profile_duplicates.sql`

内容：
1. `lunaria_core_memory` の `memory_key='user_name', content='悠平'` を `lunaria_user_profile` に `field='name', value='悠平', source='setting'` として INSERT
2. 上記 core_memory 行を DELETE
3. `memory_key='user_gender', content='ユーザーの性別: 男性'` の core_memory 行を DELETE（user_profile に `field='gender', value='男性'` が既存のため）

スクリプトは BEGIN/COMMIT で囲み、事前チェック（該当行数 == 1）と事後チェック（`memory_category='profile'` の残存 == 0）を DO ブロックで実施。想定外データならエラーで止まる。

### 確認 SQL（COMMIT 後）

```sql
-- 1. profile マーカー付き core_memory が 0 件
SELECT count(*) FROM lunaria_core_memory WHERE memory_category = 'profile';
-- → 0

-- 2. user_profile に name 行が増えた
SELECT field, value, source FROM lunaria_user_profile WHERE field = 'name';
-- → ('name', '悠平', 'setting')

-- 3. gender は不変
SELECT field, value, source FROM lunaria_user_profile WHERE field = 'gender';
-- → ('gender', '男性', 'setting')
```

---

## Phase D：コード差分の適用

`implementation/patches/` 以下の 4 ファイルを対応する実ファイルに反映。推奨順：

1. `profile.patch.md` → `lib/lunaria/profile.ts`
   - `buildProfileSummary(userId)` を追加（EAV の行検索、`source='setting'` フィルタ）
   - `enqueuePending` / `peekPending` / `confirmPending` / `rejectPending` を追加（既存 `lunaria_pending_profile_updates` / `lunaria_profile_archive` を使用）
2. `memory.patch.md` → `lib/lunaria/memory.ts`
   - `pickMemories(userId, limit=1)` を追加
   - WHERE 句に `memory_category != 'profile'`（NULL も含める）
   - 列名は `content` / `score` / `last_seen`（v1 で想定した `text` / `importance` / `last_used_at` ではない）
3. `prompt-builder.patch.md` → `lib/lunaria/prompt-builder.ts`
   - 5 層化（Identity / State / Profile / Memories / Rules）
   - `pickMemories` 呼び出しは引数 1 個（profileKeywords なし）
4. `extract.patch.md` → `lib/lunaria/extract.ts`
   - 抽出プロンプトを `profile_updates` / `memory_candidates` の 2 配列出力に変更
   - profile_updates は `enqueuePending` へ
   - memory_candidates は `looksLikeProfileMention` で弾いてから昇格
   - 昇格時は `memory_category` を `null`（絶対に `'profile'` を付けない）

各パッチ適用後に `npm run build`（または `tsc --noEmit`）で型エラーがないか確認。

---

## Phase E：動作確認（検証シナリオ）

`PROFILE_MEMORY_INTEGRATION.md §4.5 / §5.5` のシナリオを dev パネルで通す。

| # | 入力 / 状態 | 期待挙動 |
|---|---|---|
| 1 | 起動直後、claude_serious 突入 | プロンプトに Profile 層が出る（「男性・ITエンジニア・SES」）。core_memory は `memory_category='profile'` を含まない（クリーンアップ後なのでそもそも 0 件） |
| 2 | 「俺フリーランスになったわ」 | occupation の pending 行が `lunaria_pending_profile_updates` に積まれる。core_memory には流れない |
| 3 | 次ターンでルナが trigger_message を引いて確認 → 「うん」 | `user_profile.occupation` 更新、`profile_archive` に old=ITエンジニア・SES / new=フリーランス、pending 行 DELETE |
| 4 | 「彼女ともう半年」 | profile 不動、core_memory に昇格候補として積まれる（`memory_category=NULL`） |
| 5 | 抽出プロンプトが `{field:'gender', value:'男性'}` 相当の候補を出した | extract.ts のガードレール（`looksLikeProfileMention`）で core_memory に流れない。pending にも既存値と同じなら実質ノーオペ |

### dev パネルに出したい値

- 各レイヤ採用/不採用（identity / state / profile / memories / rules）
- `pickMemories` 候補の memory_category（全部 NULL か）
- `enqueuePending` の書き込みログ

---

## Phase F：片付け

`implementation/README.md` のライフサイクルに従い、確定したものを `lunaria-app/` に取り込む：

- SQL ファイル `cleanup_profile_duplicates.sql` は 1 回限りなので `lunaria-app/scripts/` に移動 or そのまま破棄（作業ログだけ PROGRESS.md に残す）
- パッチ 4 本は `lunaria-app/lib/lunaria/` に実反映したら `implementation/patches/` 以下を片付ける
- 破棄済みの `migrations/007_*`, `migrations/008_*`, `scripts/audit-core-memory.ts` は DEPRECATED notice 付きで履歴として残すか、履歴不要なら削除

---

## Phase G：ロールバック手順（壊れた時）

### G-1. コード差分を戻す

```bash
git restore lib/lunaria/profile.ts lib/lunaria/memory.ts lib/lunaria/prompt-builder.ts lib/lunaria/extract.ts
```

### G-2. データクリーンアップの巻き戻し

Phase C で消した 2 行はバックアップ（Phase B）から再挿入：

```sql
-- user_gender を戻す
INSERT INTO lunaria_core_memory (user_id, type, content, score, memory_key, memory_category)
VALUES ('<dev_user_id>', 'name', 'ユーザーの性別: 男性', 3, 'user_gender', 'profile');

-- user_name を戻す（user_profile の追加行も戻す）
INSERT INTO lunaria_core_memory (user_id, type, content, score, memory_key, memory_category)
VALUES ('<dev_user_id>', 'name', '悠平', 3, 'user_name', 'profile');

DELETE FROM lunaria_user_profile
 WHERE user_id = '<dev_user_id>' AND field = 'name';
```

またはより安全に、Phase B の JSON ダンプから profile / core_memory 全体を入れ直す。

### G-3. マイグレーションのロールバックは不要

v2 ではスキーマ変更を行わないため、DDL の巻き戻しは必要ない。`superseded_by_profile` 列を追加する 008 も流していない。

---

## よく起こりそうなエラーと対処

| エラー | 原因 | 対処 |
|---|---|---|
| `cleanup aborted: user_name row count = 0, expected 1` | Phase A 時点と違うデータ（既に消えている or キーが違う） | 事前チェックの条件通りの行が存在するかを `SELECT memory_key, count(*) FROM lunaria_core_memory WHERE memory_category='profile' GROUP BY memory_key;` で確認し、スクリプト側の想定値を合わせて再実行 |
| `pickMemories` が想定外の件数を返す | `.or()` の PostgREST 構文が効いていない（クライアントバージョン違い） | `memory_category.is.null,memory_category.neq.profile` の書式を Supabase JS のバージョンに合わせる。効かなければクライアント側フィルタで妥協 |
| プロンプトに Profile が出ない | `buildProfileSummary` の `source='setting'` フィルタで 0 件になっている | `SELECT field, value, source FROM lunaria_user_profile` で source の実値を確認。`setting` 以外ならフィルタ条件を見直す |
| `enqueuePending` で同 field の pending が累積 | DELETE → INSERT のトランザクション競合 | 順序保証のため enqueuePending を 1 本の RPC 関数にくるむ（将来的な改修項目として PROGRESS.md に残す） |
| 抽出プロンプト差し替え直後、旧キー `core_memory_candidates` が返る | Gemini 側のキャッシュ/ドリフト | extract.ts のパース部で fallback（旧キー対応）を一定期間残す |
