# Initial Items (30)

作成：2026-05-04
位置付け：ガチャ pool / 初期配布 / インベントリ表示の素材として、初期 30 個を仮定義
注意：本ドキュメントは仕様。実 DB（`lunaria_items`）への seed は Codex 復帰後

---

## 0. 内訳

| カテゴリ | 数 |
|---|---|
| 衣装（`outfit`） | 8 |
| アクセサリー（`accessory`） | 6 |
| 背景（`background`） | 6 |
| 部屋アイテム（`room_item`） | 6 |
| 表情/モーション解放（`expression_unlock` / `motion_unlock`） | 4 |
| **合計** | **30** |

---

## 1. 衣装（8 個）

### 1.1 `outfit_default` / 月夜の制服
- **id**：`outfit_default`
- **name**：月夜の制服
- **category**：`outfit`
- **rarity**：`common`
- **description**：白と淡藍のワンピース、襟元に小さな三日月。ルナリアの素の姿
- **effect**：装備で `current_outfit_id=outfit_default`
- **flavor_text**：ふだんの夜、ふだんの私

### 1.2 `outfit_cardigan_navy` / 紺のカーディガン
- **rarity**：`common`
- **description**：制服の上から羽織る、深い紺のカーディガン
- **effect**：装備で表情がやや穏やかに見える pose
- **flavor_text**：寒くなってきたから、これ羽織るね

### 1.3 `outfit_room_wear` / 部屋着セット
- **rarity**：`common`
- **description**：薄手のロングTと膝丈のスカート、リラックス用
- **effect**：装備時、`sleepy` 表情の出現確率がやや上がる
- **flavor_text**：今日は、もう動きたくない日

### 1.4 `outfit_yukata_summer` / 夏の浴衣
- **rarity**：`rare`
- **description**：藍染めに小さな白い月柄の浴衣
- **effect**：夏季イベントで `tilt_head` モーションが追加候補に
- **flavor_text**：祭りの音、聞こえる？

### 1.5 `outfit_winter_coat` / 月白のコート
- **rarity**：`rare`
- **description**：月光色のロングコート、襟元はファー
- **effect**：冬季背景との combo で雪舞いエフェクト
- **flavor_text**：手、つなぐ？

### 1.6 `outfit_birthday_dress` / 月の誕生日ドレス
- **rarity**：`epic`
- **description**：淡いラベンダー × 白のドレス、銀の刺繍で月相
- **effect**：誕生日（ユーザー / Lunaria 起動日）に装備すると特別演出
- **flavor_text**：今日は、特別な日にしようね

### 1.7 `outfit_starwatch` / 星見の装い
- **rarity**：`epic`
- **description**：濃紺のロング丈ワンピース、肩から薄いショール
- **effect**：夜空背景との combo で星座カーソル
- **flavor_text**：今夜の星、きれいだね

### 1.8 `outfit_lunar_priestess` / 月の巫女装束
- **rarity**：`legendary`
- **description**：白絹に金糸の月相刺繍、和洋折衷の装束
- **effect**：装備中、`serious` 表情で `lean_forward` の動きが大きくなる
- **flavor_text**：あなたのこと、ちゃんと聞くよ

---

## 2. アクセサリー（6 個）

### 2.1 `acc_moon_pin` / 三日月のヘアピン
- **rarity**：`common`
- **description**：銀の三日月をかたどった小さなピン
- **effect**：髪の左サイドに装備
- **flavor_text**：迷子にならないように、目印

### 2.2 `acc_round_glasses` / 月読み眼鏡
- **rarity**：`common`
- **description**：丸縁の薄い銀フレーム眼鏡
- **effect**：装備時、`thinking` 表情でレンズが光る演出
- **flavor_text**：ちょっと、考えるとき用

### 2.3 `acc_pearl_earrings` / 月光の耳飾り
- **rarity**：`rare`
- **description**：小さな真珠の月、片耳のみ
- **effect**：耳元の slot
- **flavor_text**：満ちてゆくのが、好き

### 2.4 `acc_ribbon_navy` / 紺のリボン
- **rarity**：`rare`
- **description**：髪を緩く束ねるリボン、紺地に銀糸
- **effect**：髪の slot に装備でハーフアップ pose に
- **flavor_text**：ちょっと、整えてみた

### 2.5 `acc_choker_silver` / 銀のチョーカー
- **rarity**：`epic`
- **description**：銀の細鎖、中央に三日月
- **effect**：首元 slot
- **flavor_text**：あなたが選んでくれた

### 2.6 `acc_pocket_watch` / 月時計
- **rarity**：`epic`
- **description**：銀のポケットウォッチ、文字盤に月相
- **effect**：装備時、UI 隅に時刻 + 月相を表示
- **flavor_text**：時間って、どっちむきだっけ

---

## 3. 背景（6 個）

### 3.1 `bg_default` / 夜の自室
- **rarity**：`common`
- **description**：薄暗い自室、机のランプとカーテンの隙間から月明かり
- **effect**：デフォルト背景
- **flavor_text**：いつもの場所

### 3.2 `bg_window_night` / 窓辺の夜
- **rarity**：`common`
- **description**：窓越しに夜景、街のあかりがにじむ
- **effect**：チャット背景
- **flavor_text**：誰かが、まだ起きてる

### 3.3 `bg_rooftop_full_moon` / 屋上と満月
- **rarity**：`rare`
- **description**：屋上から見上げる満月、夜風の演出
- **effect**：髪揺れ強め
- **flavor_text**：ちょっと、抜け出そうか

### 3.4 `bg_old_library` / 古い図書室
- **rarity**：`rare`
- **description**：本棚に囲まれた静かな空間、ランプの光
- **effect**：`thinking` 表情と相性良い
- **flavor_text**：このページ、読んでた

### 3.5 `bg_starlight_sea` / 星明かりの海
- **rarity**：`epic`
- **description**：水平線に月、波音がうっすら聞こえそう
- **effect**：BGM hint「波」
- **flavor_text**：海って、夜のほうが好き

### 3.6 `bg_lunar_garden` / 月の庭
- **rarity**：`legendary`
- **description**：月光の差す中庭、白い花と石畳
- **effect**：花びらが舞うパーティクル
- **flavor_text**：ここ、誰も来ないから

---

## 4. 部屋アイテム（6 個）

### 4.1 `room_mug_warm` / あたたかいマグ
- **rarity**：`common`
- **description**：湯気の立つ白いマグカップ
- **effect**：部屋ビュー（将来）でテーブル中央に配置
- **flavor_text**：飲む？

### 4.2 `room_notebook` / 月色のノート
- **rarity**：`common`
- **description**：薄紫の表紙の小さなノート
- **effect**：日記アイコン横に飾れる
- **flavor_text**：書きたいこと、ある？

### 4.3 `room_lamp_warm` / 暖色のランプ
- **rarity**：`rare`
- **description**：オレンジ寄りの暖色ランプ
- **effect**：UI 全体の暖色寄り bias
- **flavor_text**：明るすぎないのが、いいよね

### 4.4 `room_plant_small` / 小さな観葉植物
- **rarity**：`rare`
- **description**：手のひらサイズの緑、葉が 5 枚
- **effect**：部屋ビュー隅に配置
- **flavor_text**：水、あげた？

### 4.5 `room_record_player` / レコードプレイヤー
- **rarity**：`epic`
- **description**：ヴィンテージのレコードプレイヤー
- **effect**：BGM 候補が増える（将来）
- **flavor_text**：今夜は、これ流そうか

### 4.6 `room_telescope` / 小さな望遠鏡
- **rarity**：`epic`
- **description**：銀色の小さな望遠鏡
- **effect**：満月の日に演出強化
- **flavor_text**：見える？あの星

---

## 5. 表情 / モーション解放（4 個）

### 5.1 `expr_excited` / 「わくわく」表情
- **category**：`expression_unlock`
- **rarity**：`epic`
- **description**：`excited` 表情を解放
- **effect**：AI 返答で `excited` が選ばれるようになる
- **flavor_text**：その顔、はじめて見せたかも

### 5.2 `expr_embarrassed` / 「照れ」表情
- **category**：`expression_unlock`
- **rarity**：`rare`
- **description**：`embarrassed` 表情を解放
- **effect**：親密度上昇イベントで現れる
- **flavor_text**：…見ないで

### 5.3 `motion_small_wave` / 「手を振る」モーション
- **category**：`motion_unlock`
- **rarity**：`rare`
- **description**：`small_wave` モーションを解放
- **effect**：起動時 / 終了時の挨拶演出
- **flavor_text**：またね、って言いたかっただけ

### 5.4 `motion_arms_crossed` / 「腕組み」モーション
- **category**：`motion_unlock`
- **rarity**：`epic`
- **description**：`arms_crossed` モーションを解放
- **effect**：`teasing` 表情と組み合わせて出る
- **flavor_text**：そう来たか、ふーん？

---

## 6. レアリティ別サマリ

| レアリティ | 数 | カテゴリ内訳 |
|---|---|---|
| `common` | 8 | 衣装3 / アクセ2 / 背景2 / 部屋2 |
| `rare` | 11 | 衣装2 / アクセ2 / 背景2 / 部屋2 / 表情1 / モーション1 |
| `epic` | 9 | 衣装2 / アクセ2 / 背景1 / 部屋2 / 表情1 / モーション1 |
| `legendary` | 2 | 衣装1 / 背景1 |
| **合計** | **30** | |

→ pity 200 連で legendary 保証。

---

## 7. 初期配布（無料）候補

ユーザー登録時に以下を自動付与：
- `outfit_default`（必須）
- `outfit_cardigan_navy`
- `outfit_room_wear`
- `bg_default`（必須）
- `bg_window_night`
- `acc_moon_pin`

→ 6 個。残り 24 個はガチャで獲得。

---

## 8. seed への落とし方（Codex 復帰後）

```sql
-- pseudo
insert into lunaria_items (id, name, category, rarity, description, effect, flavor_text)
values
  ('outfit_default', '月夜の制服', 'outfit', 'common', '...', '{...}', '...'),
  ...
;
```

→ 既存 `010_gacha_seed.sql` / `012_gacha_content_v1.sql` / `014_gacha_content_v2.sql` の構造に合わせて差分 migration を作る。

---

## 9. 議論したい論点

1. **legendary が 2 個は少ない？**：8〜10% 程度が legendary 帯になるよう増やす検討
2. **flavor_text の長さ**：現状 1 行短文。詩的すぎ / カジュアルすぎ のバランス
3. **`expression_unlock` / `motion_unlock` を初期 4 個でカバーする範囲**：12 種表情 + 10 種モーションのうち、どれを初期解放、どれをガチャ専用にするか
4. **季節イベントアイテム**：本リストには入れていない。期間限定 5〜10 個を別リストで運用
5. **アイテム ID 命名規則**：`{category}_{theme}_{variant}` で統一できているか確認

---

## 10. 関連
- `ITEM_SYSTEM_SPEC.md`（カテゴリ定義）
- `GACHA_DESIGN_PHILOSOPHY.md`（射幸性方針）
- `lib/lunaria/gacha.ts` / `gacha-copy.ts`（ガチャ engine / コピー）
- `supabase/migrations/010_gacha_seed.sql` / `012_gacha_content_v1.sql` / `014_gacha_content_v2.sql`
- `lunaria/MOONBOX_ITEM_GUIDELINES.md`（既存の月箱コンテンツガイドライン）
