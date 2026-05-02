# 月箱コンテンツ v2 最終レビュー

作成：2026-05-02  
目的：`MOONBOX_V2_PROPOSAL.md` を実装 migration に落とす前の最終採否レビュー。  
範囲：コンテンツレビューのみ。DB migration・アプリコードは作成しない。

参照：
- `lunaria/MOONBOX_V2_PROPOSAL.md`
- `lunaria/MOONBOX_V2_DECISION_BRIEF.md`
- `lunaria/MOONBOX_ITEM_GUIDELINES.md`
- `lunaria/MOONBOX_IMPLEMENTATION_PLAN.md`
- `lunaria-app/supabase/migrations/012_gacha_content_v1.sql`

---

## 0. 結論

v2 は **採用 21 件**で進めるのがよい。

- 既存アイテムの変更：10 件
- 新規アイテムの追加：11 件
- migration 番号候補：`014_gacha_content_v2.sql`
- v2 適用後の想定 pool：30 → 41 アイテム

`013_gacha_operational_hardening.sql` は既に使用済みなので、コンテンツ v2 は `014` が安全。

---

## 1. 採用 / 保留 / 修正の分類

### 1.1 採用

そのまま、または軽微な文言調整だけで v2 に入れてよいもの。

| 区分 | 対象 | rarity | 判定 | レビュー |
|---|---|---:|---|---|
| 既存リネーム | 月見クッション | common_a | 採用 | common に月モチーフを薄く入れる判断として自然。家具としてのささやかさも残る。 |
| 既存リネーム | 表紙の取れた本 | common_a | 採用 | 「古い本」より個体感が出る。過剰に神秘化していない。 |
| 既存リネーム | 光の雫ペンダント | common_b | 採用 | common_b の詩情を少し上げる変更として妥当。rare_b ほど強くない。 |
| 既存リネーム | 名前のないコイン | rare_b | 採用 | rare_b と urban_legend の中間にある謎として機能する。 |
| 既存リネーム | 誰かのリング | urban_legend | 採用 | 関係性の余白が強い。断定しないため Lunaria らしさが残る。 |
| 既存リネーム | 無音の鈴 | urban_legend | 採用 | 物理法則を 1 つだけ崩す良い都市伝説。既存の「音」ギミックとして明快。 |
| 説明更新 | 木の小さな椅子 | common_a | 採用 | 「ふたりで座るには少し狭い」は関係性を示しつつ重すぎない。 |
| 説明更新 | 革のしおり | common_b | 採用 | 本と記憶のモチーフに接続できる。 |
| 説明更新 | 銀のリング | common_b | 採用 | 既存の強いリング系と違い、日用品寄りのまま成立する。 |
| 説明更新 | 刺繍ハンカチ | common_b | 採用 | 「L」は採用。ただし説明は直接的すぎないよう少しだけ柔らかくする。 |
| 新規追加 | 木の小箱 | common_a | 採用 | からっぽの封筒とは違い、日用品としての安心感がある。 |
| 新規追加 | 朝の湯のみ | common_a | 採用 | 生活感が強く、低レアの嬉しさを作れる。 |
| 新規追加 | 古いマッチ箱 | common_a | 採用 | 小さな音の描写があり、common_a として十分に詩的。 |
| 新規追加 | 空色のリボン | common_b | 採用 | 身につける小物として自然。色の記憶が残る。 |
| 新規追加 | 細紐のブレスレット | common_b | 採用 | common_b の露出頻度を支える地味な良品。 |
| 新規追加 | 月夜の鏡 | epic | 採用 | urban_legend に上げず epic に置く方が、epic 帯の当たり感が増す。 |
| 新規追加 | 名のない地図 | urban_legend | 採用 | 旅情・記憶・空白のモチーフが強い。 |
| 新規追加 | 古いカメラ | urban_legend | 採用 | 「シャッター音だけ残る」が Lunaria の残響テーマと合う。 |
| 新規追加 | 鏡うつしの本 | urban_legend | 採用 | 鏡・本・浮かぶ一行の組み合わせが強い。説明はやや調整推奨。 |
| 新規追加 | 月光のティーポット | urban_legend | 採用 | 月モチーフと生活感の接続がよい。 |
| 新規追加 | ふたりの傘 | urban_legend | 採用 | 採用。ただし説明を一段弱め、関係性の押しつけを避ける。 |

### 1.2 修正

採用してよいが、実装前に名前または説明を調整した方がよいもの。

| 元案 | 修正案 | 理由 |
|---|---|---|
| 刺繍ハンカチ：`すみっこに小さく「L」の刺繍` | `すみっこに小さな「L」の刺繍がある` | 「L」は採用。説明文を少し平熱にし、意味をユーザー側に開く。 |
| ふたりの傘：`一人で差すと内側に小さな雨音がする` | `一人で差すと、内側だけ雨音が近くなるらしい` | 「ふたり」は強い語なので、説明側は噂として柔らかくする。 |
| 月夜の鏡：`鏡面には部屋が映るのに、なぜか月だけが浮かぶ` | `月のある夜だけ、縁取りが淡く光る` | epic では物理法則違反を避ける。都市伝説ではなく「特別な実在品」に寄せる。 |
| 鏡うつしの本：`鏡越しに開くと、物語が一行ずつ浮かんでくる` | `鏡越しに開くと、読んだ覚えのない一行が浮かぶらしい` | 物理違反は 1 つに絞り、「らしい」で urban_legend 化する。 |
| 月光のティーポット：`お湯を注ぐと、立ち上る湯気が三日月の形になるという` | `お湯を注ぐと、湯気が三日月の形になるという` | 文字数を少し詰め、説明文として扱いやすくする。 |

### 1.3 保留

v2 では入れない。v3 以降で再評価する。

| 候補 | 判定 | 理由 |
|---|---|---|
| 花瓶 → 朝の花瓶 | 保留 | 効果が小さく、v2 の migration に入れる優先度は低い。 |
| 貝殻のブローチ → 砂浜のブローチ | 保留 | 悪くないが、既存の砂浜モチーフと近くなる。 |
| 虹色イヤリング → プリズムイヤリング | 保留 | 名前変更の体験差が薄い。 |
| 北欧チェア → 寄り添いチェア | 保留 | 関係性モチーフがやや直接的。椅子は「木の小さな椅子」の説明更新だけで十分。 |
| 満たされないグラス | 保留 | 魔法の道具感が強い。Lunaria の「ささやかな贈り物」から少し外れる。 |
| 風になる紙ヒコーキ | 保留 | 詩的だが「届く」メタファーが強く、他の関係性アイテムと被る。 |

---

## 2. レビュー観点

### 2.1 Lunaria らしさ

採用リストは全体として Lunaria らしい。

- 日用品を起点にしている
- 月・記憶・関係性のモチーフがある
- 「強い魔法」ではなく「ほんの少し変」という線に留まっている
- ハズレ感を作らず、common でも受け取りやすい

注意点は `誰かのリング`、`ふたりの傘`、`刺繍ハンカチ` の関係性モチーフが近いこと。3 つとも採用してよいが、説明文を控えめにして「告白」ではなく「余白」にする。

### 2.2 重複感

重複リスクは中程度。

- `木の小箱` と `からっぽの封筒` は「空っぽ」モチーフが近い
- `月夜の鏡` と `鏡うつしの本` は鏡モチーフが近い
- `誰かのリング` と `銀のリング` はリング名が近い
- `影のない傘` と `ふたりの傘` は傘モチーフが近い

ただし、役割が分かれているため許容できる。

- `木の小箱`：common_a の落ち着く日用品
- `からっぽの封筒`：urban_legend の開けられない謎
- `月夜の鏡`：epic の飾りたくなる実在品
- `鏡うつしの本`：urban_legend の読めない一行
- `銀のリング`：common_b の身につける小物
- `誰かのリング`：urban_legend の関係性の余白
- `影のない傘`：影の喪失
- `ふたりの傘`：雨音と距離感

### 2.3 ガチャ報酬としての嬉しさ

v2 の価値は高い。

- common_a +3 により序盤の「また同じ」が減る
- common_b +2 により低〜中頻度帯の小物が増える
- epic +1 により上位レアの体験が薄くならない
- urban_legend +5 により長期の話題性が持続する

特に `朝の湯のみ`、`木の小箱`、`空色のリボン` は低レアでも「もらって悪くない」感が出る。月箱の思想に合う。

### 2.4 説明文の詩情

v2 は詩情が出ているが、urban_legend 以外で物理法則を崩しすぎないようにする。

- common：実用感 + 少しの情景
- common_b：身につける小物 + ささやかな個体感
- epic：飾りたくなる特別感。物理違反はしない
- urban_legend：噂・曖昧さ・物理違反 1 つ

この線を守れば、ガチャが射幸心ではなく「小さな贈り物」として残る。

---

## 3. 既存 item name との衝突リスク

`lunaria_gacha_pool.name` は unique index があるため、完全一致は migration 失敗または `on conflict` で無視される。

### 3.1 完全一致に注意する名前

以下は 012 適用後の既存名または近接名と衝突しやすい。v2 migration 作成時に SQL で再確認する。

| v2 候補 | 衝突・近接対象 | 判定 |
|---|---|---|
| 木の小箱 | `からっぽの封筒`、既存の小物系 | 完全一致はなさそう。ただし「空っぽ」説明が近い。 |
| 月夜の鏡 | `鏡うつしの本` | 同一 migration 内で鏡モチーフが 2 件になる。説明で役割を分ける。 |
| ふたりの傘 | `影のない傘` | 傘が 2 件になる。都市伝説ギミックは異なるため許容。 |
| 誰かのリング | `銀のリング` | リングが 2 件になる。rarity と説明で役割を分ける。 |
| 名のない地図 | `名前のないコイン` | 「名のない / 名前のない」が近い。カテゴリが違うため許容。 |
| 月光のティーポット | `月光のチョーカー` | 「月光の」が重なる。月箱テーマとして許容。 |

### 3.2 実装前の確認 SQL

```sql
select name, rarity, category
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

このクエリで新規追加予定 11 件が既に存在する場合、`insert ... on conflict do nothing` だけだと「追加されたつもりで実は増えない」事故が起きる。実装時は適用後の rarity count を必ず確認する。

---

## 4. migration に落とせる最終採用リスト

### 4.1 既存 UPDATE：名前 + 説明変更

| old_name | new_name | rarity | category | final_description |
|---|---|---|---|---|
| やわらかいクッション | 月見クッション | common_a | furniture | ぼーっとする時間にちょうどいい |
| 古い本 | 表紙の取れた本 | common_a | small_item | 最初のページに誰かのサインがある |
| 水晶のペンダント | 光の雫ペンダント | common_b | accessory | 角度を変えると虹色に折れる |
| 古代風コイン | 名前のないコイン | rare_b | accessory | 片面だけに紋章が彫られている |
| 指輪 | 誰かのリング | urban_legend | urban_legend | 指に通すとほんのり暖かいらしい |
| 満月の鈴 | 無音の鈴 | urban_legend | urban_legend | 振ると音はしないけど、静けさが返ってくるらしい |

### 4.2 既存 UPDATE：説明のみ変更

| name | rarity | category | final_description |
|---|---|---|---|
| 木の小さな椅子 | common_a | furniture | ふたりで座るには少し狭い |
| 革のしおり | common_b | small_item | 中ほどのページに挟まっていた |
| 銀のリング | common_b | accessory | サイズはちょうどいい |
| 刺繍ハンカチ | common_b | small_item | すみっこに小さな「L」の刺繍がある |

### 4.3 新規 INSERT：common_a

| name | rarity | category | drop_weight | image_url | final_description |
|---|---|---|---:|---|---|
| 木の小箱 | common_a | small_item | 1 | `/img/gacha/placeholder.png` | 中身は空っぽなのに、持っているだけで落ち着く |
| 朝の湯のみ | common_a | small_item | 1 | `/img/gacha/placeholder.png` | 縁が少し欠けている、温かい飲み物が似合う |
| 古いマッチ箱 | common_a | small_item | 1 | `/img/gacha/placeholder.png` | 振ると、中で乾いた音がする |

### 4.4 新規 INSERT：common_b

| name | rarity | category | drop_weight | image_url | final_description |
|---|---|---|---:|---|---|
| 空色のリボン | common_b | accessory | 1 | `/img/gacha/placeholder.png` | 結ぶと、結び目が少しだけ大きくなる |
| 細紐のブレスレット | common_b | accessory | 1 | `/img/gacha/placeholder.png` | 革紐に小さなビーズが一つだけついている |

### 4.5 新規 INSERT：epic

| name | rarity | category | drop_weight | image_url | final_description |
|---|---|---|---:|---|---|
| 月夜の鏡 | epic | small_item | 1 | `/img/gacha/placeholder.png` | 月のある夜だけ、縁取りが淡く光る |

### 4.6 新規 INSERT：urban_legend

| name | rarity | category | drop_weight | image_url | final_description |
|---|---|---|---:|---|---|
| 名のない地図 | urban_legend | urban_legend | 1 | `/img/gacha/placeholder.png` | 描かれた町の名前だけが、すべて空白になっているらしい |
| 古いカメラ | urban_legend | urban_legend | 1 | `/img/gacha/placeholder.png` | フィルムはないのに、撮るとシャッター音だけ残るらしい |
| 鏡うつしの本 | urban_legend | urban_legend | 1 | `/img/gacha/placeholder.png` | 鏡越しに開くと、読んだ覚えのない一行が浮かぶらしい |
| 月光のティーポット | urban_legend | urban_legend | 1 | `/img/gacha/placeholder.png` | お湯を注ぐと、湯気が三日月の形になるという |
| ふたりの傘 | urban_legend | urban_legend | 1 | `/img/gacha/placeholder.png` | 一人で差すと、内側だけ雨音が近くなるらしい |

---

## 5. 適用後の期待値

v2 適用後の active pool は以下を期待する。

| rarity | v1 後 | v2 後 |
|---|---:|---:|
| common_a | 5 | 8 |
| common_b | 5 | 7 |
| rare_a | 3 | 3 |
| rare_b | 3 | 3 |
| epic | 2 | 3 |
| legendary | 2 | 2 |
| urban_legend | 10 | 15 |
| total | 30 | 41 |

確認 SQL：

```sql
select rarity, count(*)
  from public.lunaria_gacha_pool
 where is_active = true
 group by rarity
 order by rarity;
```

---

## 6. 実装時のガードレール

- 既存 migration `010`、`012`、`013` は編集しない
- 新規 migration は `014_gacha_content_v2.sql`
- 既存 item の変更は DELETE + INSERT ではなく UPDATE
- 新規 item は `insert ... on conflict (name) do nothing`
- 適用後に rarity count と active total を確認する
- `gacha-reaction.ts` の追加は別 PR にしてもよい。v2 コンテンツ migration と混ぜない方がレビューしやすい
- パチンコ・射幸心用語は説明文にも UI 文言にも入れない

---

## 7. 最終判断

v2 は実装してよい。

ただし、migration 作成前に以下だけ守る。

1. `014_gacha_content_v2.sql` として作る
2. `月夜の鏡` は epic のまま、説明文を物理違反なしにする
3. `ふたりの傘` は採用するが、説明を噂調に弱める
4. `刺繍ハンカチ` の `L` は採用するが、意味を説明しない
5. 適用後の active pool が 41 件になることを確認する
