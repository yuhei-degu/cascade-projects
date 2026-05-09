# Item System Spec

作成：2026-05-04
位置付け：アイテムカテゴリの固定。ガチャ / インベントリ / 衣装切替 / 部屋演出 / 表情解放のすべてが本仕様に従う

---

## 0. 大原則

1. アイテムは **見た目・演出・思い出** を増やすもの。**強さ・有利さ**は増やさない
2. **ガチャ獲得ログ / アイテム獲得ログは `lunaria_core_memory` に入れない**
3. 必要に応じて `lunaria_life_events` に軽く記録するのは可
4. アイテム自体のメタは `lunaria_items`（候補テーブル、09 で seed 済）。ユーザー所有は `user_items`（候補、`DB_USER_ITEMS.md` 参照）

→ 「ガチャでルナが私を覚えるようになる」は誤った設計。記憶は会話と日記から育つ。

---

## 1. カテゴリ一覧

| ID | 日本語 | ガチャ対象 | 無料配布対象 | character_state 反映 | core_memory 入れる？ |
|---|---|---|---|---|---|
| `outfit` | 衣装 | ✅ | ✅（イベント / 初期配布） | ✅（`current_outfit_id`） | ❌ |
| `accessory` | アクセサリー | ✅ | △（季節） | ✅（`equipped_accessories[]`） | ❌ |
| `background` | 背景 | ✅ | ✅ | ✅（`current_background_id`） | ❌ |
| `room_item` | 部屋アイテム | ✅ | △ | ✅（`room_items[]`） | ❌ |
| `expression_unlock` | 表情解放 | ✅ | ❌ | ✅（`unlocked_expressions[]`） | ❌ |
| `motion_unlock` | モーション解放 | ✅ | ❌ | ✅（`unlocked_motions[]`） | ❌ |
| `voice_unlock` | 音声解放（将来） | ✅ | ❌ | ✅（`unlocked_voices[]`） | ❌ |
| `special_diary_skin` | 日記スキン | ✅ | △（記念） | ✅（`current_diary_skin`） | ❌ |
| `special_event_item` | 期間限定 | ✅ | ✅（イベント期間） | △（期間中のみ） | ❌ |

---

## 2. 各カテゴリ詳細

### 2.1 `outfit`（衣装）
- **何を表すか**：ルナリアの服装、季節衣装、特別衣装。立ち絵差分の主因
- **ガチャ対象**：✅ 主軸
- **無料配布**：✅ 初期配布のデフォルト衣装、誕生日衣装、ユーザー継続報酬
- **character_state 反映**：`current_outfit_id`（1 装備）
- **core_memory に入れない理由**：服装は趣味の表れであっても、記憶（ユーザーの傾向 / 価値観）ではない
- **life_events に入れる例**：「初めての季節衣装獲得」「誕生日衣装を着替えた」（任意）

### 2.2 `accessory`（アクセサリー）
- **何を表すか**：髪飾り / イヤリング / リボン / メガネ等
- **ガチャ対象**：✅
- **無料配布**：△ 季節限定 / イベント限定で配布可
- **character_state 反映**：`equipped_accessories[]`（複数同時装備可、最大 3 個）
- **core_memory に入れない理由**：装飾品は記憶の対象ではない

### 2.3 `background`（背景）
- **何を表すか**：チャット画面 / `/character` ページの背景。窓辺、夜景、図書室、月夜の海等
- **ガチャ対象**：✅
- **無料配布**：✅ デフォルト背景セット
- **character_state 反映**：`current_background_id`
- **core_memory に入れない理由**：場所選択は気分の表れ。記憶ではない

### 2.4 `room_item`（部屋アイテム）
- **何を表すか**：部屋ビュー（将来実装）の家具。本棚 / カップ / ぬいぐるみ等
- **ガチャ対象**：✅
- **無料配布**：△
- **character_state 反映**：`room_items[]`（最大 8 個）
- **core_memory に入れない理由**：物体所有は会話の話題にはなりうるが、記憶ではない

### 2.5 `expression_unlock`（表情解放）
- **何を表すか**：デフォルト 6 種以外の表情を解放する権利
- **ガチャ対象**：✅
- **無料配布**：❌（解放感のため）
- **character_state 反映**：`unlocked_expressions[]`（解放済みのみ AI が選べる）
- **core_memory に入れない理由**：能力解放は仕様、記憶ではない
- **AI 返答との関係**：解放されていない表情は AssistantReply で出さない（fallback `normal`）

### 2.6 `motion_unlock`（モーション解放）
- 同上。`unlocked_motions[]` で管理

### 2.7 `voice_unlock`（音声解放、将来）
- TTS 導入後に有効
- `unlocked_voices[]`：声色のバリエーション

### 2.8 `special_diary_skin`（日記スキン）
- **何を表すか**：`/diary` ページの紙質 / 罫線 / フォント / 装飾
- **ガチャ対象**：✅
- **無料配布**：△ 記念日 / マイルストーン
- **character_state 反映**：`current_diary_skin`
- **core_memory に入れない理由**：スキンは表現、記憶ではない

### 2.9 `special_event_item`（期間限定）
- **何を表すか**：クリスマス / バレンタイン / 七夕など、特定期間のみ装備可
- **ガチャ対象**：✅（イベント期間中のみ）
- **無料配布**：✅ 参加報酬
- **character_state 反映**：△ 期間中のみ装備可、期間後は所有のみ
- **core_memory に入れない理由**：イベント参加は `life_events` 行き

---

## 3. レアリティ × カテゴリ

| カテゴリ | common | rare | epic | legendary |
|---|---|---|---|---|
| `outfit` | ✅ | ✅ | ✅ | ✅ |
| `accessory` | ✅ | ✅ | ✅ | △ |
| `background` | ✅ | ✅ | ✅ | △ |
| `room_item` | ✅ | ✅ | △ | △ |
| `expression_unlock` | ❌ | ✅ | ✅ | ✅ |
| `motion_unlock` | ❌ | ✅ | ✅ | △ |
| `voice_unlock` | ❌ | ❌ | ✅ | ✅ |
| `special_diary_skin` | ✅ | ✅ | ✅ | △ |
| `special_event_item` | ✅ | ✅ | △ | △ |

→ `expression / motion / voice` は希少性ある体験として中以上のみ。

---

## 4. 装備ルール

### 4.1 同時装備制限
- `outfit`：1 個
- `background`：1 個
- `current_diary_skin`：1 個
- `accessory`：最大 3 個
- `room_items`：最大 8 個
- `expression_unlock` / `motion_unlock` / `voice_unlock`：所有 = 解放（装備概念なし）

### 4.2 衝突解決
- 同一 slot に新装備 → 旧装備は `is_equipped=false` に
- アクセサリーの slot（hair / ears / neck）は `metadata.slot` で管理

### 4.3 デフォルト復帰
- ユーザーが「素のルナ」を選べるように、`outfit_default` / `background_default` は常に存在 + 装備可能

---

## 5. 「core_memory に入れない」を守るルール

### 5.1 原則
- アイテム獲得 → `gacha_pulls` テーブルに記録
- ユーザー所有 → `user_items` テーブル
- イベント文脈の記録 → `life_events`（任意、軽く）
- **`lunaria_core_memory` には絶対に書き込まない**

### 5.2 なぜか
- core_memory は「ユーザーがどう生きてるか」の記憶
- 「ルナが何の服を着てるか」「ガチャで何が出たか」は別レイヤー
- 混ぜるとプロンプトに `"ユーザーは epic 衣装を持っている"` のような無関係文脈が入り、会話が安っぽくなる

### 5.3 LLM プロンプトへの取り扱い
- `current_outfit` / `current_background` などの装備状態は **キャラクターステートとして渡す** が、core_memory とは別 section
- 装備変更時のリアクション（「あ、その服かわいいじゃん」）は **その瞬間の会話** に留め、次の会話には引きずらない（state lookup でその都度判断）

---

## 6. ガチャ vs 無料配布の境界

| イベント | ガチャ | 無料配布 |
|---|---|---|
| 通常ガチャ | ✅ | ❌ |
| pity 200 連到達 legendary | ✅（保証） | ❌ |
| 初期配布（5 衣装 + 3 背景） | ❌ | ✅ |
| 誕生日 | ❌ | ✅（特別衣装 1 個） |
| 連続日記 7 日 / 30 日 | ❌ | ✅（記念スキン） |
| 季節イベント参加報酬 | △ | ✅ |
| 月替わり | ❌ | ✅（壁紙系） |

→ 関係性が育つことの祝福は無料配布、運の演出はガチャ。

---

## 7. 議論したい論点

1. **アクセサリー同時装備数**：3 個 vs 5 個（多すぎると見た目が混雑）
2. **room_item の段階導入**：MVP に部屋ビューを入れるか後回しか（後回し推奨）
3. **`special_event_item` の期間後**：完全装備不可 vs 期間後はメタ情報残してコレクションのみ
4. **`expression_unlock` を本当にガチャ対象にするか**：unlock の "獲得感" vs 「ルナの表情は最初から全部欲しい」のユーザー心理
5. **重複時の処理**：所有済みアイテム再 pull → コイン変換 / ピース化 / 重複表示

---

## 8. 関連
- `INITIAL_ITEMS.md`（初期 30 個の具体）
- `GACHA_DESIGN_PHILOSOPHY.md`（射幸性の方針）
- `DB_USER_ITEMS.md`（user_items テーブル設計）
- `DB_CHARACTER_STATES.md`（装備状態テーブル）
- `DB_LIFE_EVENTS.md`（life_events への記録ルール）
- `lib/lunaria/gacha.ts` / `gacha-stats.ts` / `gacha-reaction.ts`
