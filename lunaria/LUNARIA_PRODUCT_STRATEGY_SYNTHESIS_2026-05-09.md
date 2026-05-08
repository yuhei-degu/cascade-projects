# Lunaria Product Strategy Synthesis 2026-05-09

作成: 2026-05-09

位置付け: 追加戦略メモ 4 本とルナリア画像基準を、現在の実装方針に統合するための判断メモ。

参照元:
- `C:\Users\yuuve\Downloads\lunaria_core_strategy_memo.md`
- `C:\Users\yuuve\Downloads\lunaria_personalization_character_strategy.md`
- `C:\Users\yuuve\Downloads\lunaria_motion_outfit_asset_strategy.md`
- `C:\Users\yuuve\Downloads\lunaria_end_world_game_rough_plan.md`
- `C:\Users\yuuve\Downloads\ChatGPT Image 2026年5月7日 20_19_41.png`
- `lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md`

---

## 1. 結論

今回の 4 メモは、Lunaria の方向性としてかなり筋がよい。

ただし、すぐ実装するべきものと、設計だけ先に固定して後回しにするものは分ける。

採用する中核方針:

1. Lunaria は ChatGPT 代替ではなく、日々の会話・日記・記憶・関係性が積み上がる場所にする。
2. ルナリアは初期段階では 1 人に集中し、キャラ IP としての一貫性を守る。
3. ユーザー差分は、記憶・会話スタイル・衣装・アクセサリー・部屋・反応で出す。
4. 表情とモーションは、初期実装では `reaction` として束ねる方針を優先する。
5. ガチャは課金圧ではなく、日常・記憶・ルナリアの存在感を装飾する仕組みにする。
6. 終末世界ゲームは魅力的だが、Core/Diary/Memory/Character が安定してからの週次コンテンツにする。

最重要:

> 今は「全部作る」より、「あとで全部つながる芯」を固める段階。

---

## 2. Lunaria の勝ち筋

Lunaria は汎用 AI と正面衝突しない。

ChatGPT や Claude は、今この瞬間の知能として強い。
Lunaria は、積み上がる記憶・感情・会話・日記・キャラとの関係性で勝つ。

短い定義:

> 30 秒話すだけで、日記・記憶・ルナリアとの関係が育つ AI コンパニオン。

別表現:

> Lunaria は出来事を記録するアプリではなく、ルナリアと過ごした日々を残すアプリ。

この定義はかなり強い。
今後の機能追加は、必ずこの定義に戻して判断する。

---

## 3. 採用 / 保留 / 修正

### 採用

#### 3.1 日記は emotional diary と structured record の 2 層にする

採用理由:
- ユーザーが読み返したい日記と、AI/検索/外部連携に渡したい記録は用途が違う。
- 既存の Diary v1 payload とも相性がよい。
- 将来の `life_events` と自然につながる。

方針:
- UI に出す本文は、ルナリアの感情的な受け止めを含む。
- 内部保存には `events`, `talked_about`, `emotions`, `topics`, `memory_changes` などの構造化情報を持たせる。
- 将来、外部 AI 共有や月次分析に使う情報は structured record 側を使う。

#### 3.2 記憶・返答傾向・ユーザー設定を分離する

採用理由:
- `core_memories` に何でも入れると、記憶が汚れる。
- ユーザーの人生情報と、会話スタイルの好みは別物。
- ルナリアの根っこを固定したまま、接し方だけ調整できる。

分類:

| 種類 | 役割 |
|---|---|
| `core_memories` | 目標、悩み、人間関係、重要な出来事 |
| `memory_candidates` | 記憶化する前の候補 |
| `user_communication_profiles` | 返答スタイルの推定傾向 |
| `character_personality_settings` | ユーザーが明示的に調整したルナリアの接し方 |

#### 3.3 ルナリア 1 人に集中する

採用理由:
- 初期から複数キャラに広げると、人格・見た目・記憶・ガチャが全部分散する。
- ルナリアの愛着とブランド性を作る方が先。
- 女性向けキャラや別モデル展開は、コア体験が固まってからでよい。

固定する根っこ:
- 幼なじみ
- 軽いが逃げない
- 全肯定しない
- ユーモアがある
- 深刻な時だけ本気になる
- ユーザーの人生ログを一緒に背負う
- 戦友・共犯者のような距離感

#### 3.4 初期キャラ表示は 2D reaction 方式にする

採用理由:
- Live2D/3D より圧倒的に実装が軽い。
- 1 枚絵 + CSS motion でも存在感は十分出せる。
- 今の app の完成度を止めずに、ルナリアの「いる感」を足せる。

初期構造:

```ts
type AssistantReply = {
  message: string;
  reaction?: string;
  voice_tone?: string;
  topic_tags?: string[];
  should_create_memory_candidate?: boolean;
  should_create_diary_candidate?: boolean;
};
```

初期 reaction 候補:

| reaction | 用途 |
|---|---|
| `normal_idle` | 通常待機 |
| `gentle_idle` | 穏やかに受け止める |
| `smile_nod` | ポジティブな相槌 |
| `small_wave` | 起動・終了・軽い挨拶 |
| `teasing_tilt` | からかい、軽口、共犯者感 |
| `serious_forward` | 深刻な相談、逃げない返答 |
| `thinking_pose` | 考え中、判断保留 |
| `sad_lookdown` | 辛さへの寄り添い |
| `surprised_react` | ガチャ高レア、想定外の話 |
| `presenting_item` | 日記完成、ガチャ結果、記憶候補提示 |

#### 3.5 ビジュアル基準は「紫髪・月・柔らかい距離感」に寄せる

今回の画像は、現時点のルナリア基準としてかなり使える。

採用する要素:
- 紫からラベンダー寄りの髪
- 月モチーフの髪飾りとネックレス
- 近い距離感だが、過剰に押し出さない表情
- 部屋・カーテン・花・柔らかい光の生活感
- 夜/月/記憶の印象を持つカラーパレット

注意する要素:
- 胸元や露出をアプリの標準表現にしすぎない。
- Lunaria は「親密さ」は持つが、アプリ全体の第一印象は安心感・記憶・相棒感を優先する。
- 画像は魅力の方向性として採用し、UI 実装ではやや落ち着いた衣装・構図に調整する。

---

### 保留

#### 3.6 終末世界ゲーム

保留理由:
- コンセプトは強いが、今入れると Core/Diary/Memory の完成が遅れる。
- ゲームシステムは一度入れると運用・バランス調整・コンテンツ供給が必要になる。
- 「週次イベント」として成功させるには、日記・記憶・ガチャ・キャラ状態が先に必要。

ただし、方針としては採用寄り。

位置付け:

> Lunaria のメインではなく、日々の会話・日記・記憶・ガチャに意味を与える週次サブコンテンツ。

実装タイミング:
- Memory governance MVP 完了後
- Character state の最小実装後
- ガチャ報酬が `user_items` / `character_state` に反映されるようになった後

#### 3.7 3D-Core / 2D-Output

保留理由:
- 長期思想としては良いが、今は素材制作・モデリング・Live2D/3D 管理が重い。
- 現状の最短価値は、静止 2D + reaction + CSS motion で出せる。

残す設計思想:
- ファイル名・reaction ID・outfit ID は、将来 3D/Live2D に差し替えやすい命名にする。
- app 側は「画像がどの技術で作られたか」を知らない構造にする。

#### 3.8 複数キャラ / 女性向けモデル

保留理由:
- 初期から広げると、Lunaria のキャラ IP が薄くなる。
- 記憶・ガチャ・衣装・会話スタイルの軸が増えすぎる。

残す拡張口:
- `character_profiles`
- `character_profile_id`
- `base_prompt`
- `visual_assets`
- `gacha_items`

ただし、MVP では実装優先度は低い。

---

### 修正して採用

#### 3.9 `expression + motion` より、まずは `reaction`

既存メモには `expression` と `motion` の分離案もある。
ただし、実装初期では組み合わせ爆発が起きやすい。

修正案:
- app MVP は `reaction` で始める。
- 内部 doc では、reaction を将来 `expression + motion` に分解可能な単位として扱う。
- `reaction` ID は `normal_idle` のように、意味が分かる複合名にする。

#### 3.10 `life_events` は中核思想だが、実装は急がない

`life_events` は将来の AI グラス・外部アプリ連携の背骨として重要。
ただし、今すぐ DB 実装すると抽象テーブルだけが増える。

修正案:
- まず設計 doc を固定する。
- 実装は Diary/Memory/Character state の接続点が見えてから。
- 先に `source_type` / `source_id` を各テーブルで守る。

---

## 4. 次の実装優先順位

### Priority 1: Memory governance を完成させる

理由:
- すでに `memory_candidates` の土台がある。
- ユーザーが「ルナが何を覚えたか」を見て、承認/却下できることは信頼に直結する。
- AI 日記と長期記憶の境界を守るためにも最優先。

実装候補:
1. `/api/memory/candidates` の PATCH 拡張。
2. `/memory` で candidate の承認 / 却下 / 保留。
3. 承認時に `core_memories` へ昇格。
4. 却下時に今後の抽出に軽い negative signal を残す。

### Priority 2: AssistantReply reaction foundation

理由:
- ルナリアの存在感を一気に上げられる。
- 2D/Live2D の前段階として安全。
- Chat / Diary / Gacha / Memory すべてで使える。

実装候補:
1. `lib/lunaria/reactions.ts` に reaction ID と fallback を定義。
2. chat response の内部構造化設計を doc 化。
3. まずは実レスポンスを壊さず、UI 側で rule-based reaction を選ぶ。
4. その後、LLM JSON response に `reaction` を入れる。

### Priority 3: Character state minimal design

理由:
- ガチャ、衣装、日記、終末世界ゲームの合流点になる。
- ただし migration は急がず、まず設計を詰める。

最小項目:
- `user_id`
- `character_profile_id`
- `current_outfit_id`
- `current_accessory_set_id`
- `current_background_id`
- `affinity_level`
- `last_reaction`
- `updated_at`

### Priority 4: User communication profile design

理由:
- core memory を汚さず、返答スタイルだけ最適化できる。
- 性格決めつけのリスクを避けられる。

注意:
- 年齢や性格を断定しない。
- confidence と evidence を持つ。
- ユーザーがリセット/上書きできる前提にする。

### Priority 5: End-world game design only

理由:
- 楽しいが、今は実装しない方がよい。
- ただし仕様を寝かせておくと、ガチャ外れアイテムや親密度の使い道を設計しやすくなる。

次に作るなら:
- `lunaria/LUNARIA_END_WORLD_GAME_DESIGN.md`
- DB はまだ作らない。
- 20〜30 イベント程度のテキスト MVP に絞る。

---

## 5. ルナリアらしさの基準

Lunaria で採用する表現:
- 「記録した」より「しまっておいた」
- 「分析した」より「拾った」
- 「報酬を獲得」より「月箱から出てきた」
- 「記憶を保存」より「ルナが覚えておく」
- 「削除」より「棚から外す」

避ける表現:
- 監視
- ログ収集
- スコアで人間を評価
- ガチャ結果を人生の重要記憶に混ぜる
- ユーザーの性格や年代を断定する

---

## 6. 実装で守るガードレール

1. AI 返答、日記、記憶、キャラ状態を混ぜない。
2. `core_memories` には長期的に重要なものだけ入れる。
3. memory candidate をユーザーが管理できるようにする。
4. プロフィール情報を core memory に重複保存しない。
5. ガチャ結果は core memory に入れない。
6. キャラの根っこは固定し、接し方だけ調整する。
7. 表情/モーション/Live2D は会話ロジックと疎結合にする。
8. `source_type` / `source_id` / `prompt_version` / `deleted_at` を軽視しない。

---

## 7. Claude に渡すとよいレビュー

次に Claude が使えるなら、以下を渡すとよい。

```text
Lunaria の 2026-05-09 戦略統合メモをレビューして。

対象:
- lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md
- lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md
- lunaria-app/docs/LUNARIA_VISUAL_GUIDE.md
- lunaria-app/docs/CHARACTER_EXPRESSIONS.md
- lunaria-app/docs/CHARACTER_MOTIONS.md

見てほしいこと:
1. 「AI日記アプリ」から「AIコンパニオン型ライフログOS」への拡張前提として破綻がないか
2. reaction 方式と expression/motion 分離案の優先順位が妥当か
3. ルナリア1人集中方針と将来の女性向けモデル展開の切り分けが妥当か
4. 終末世界ゲームを後回しにする判断が妥当か
5. 次に Codex が実装すべき順番に抜けや危険がないか

注意:
- コード編集はしない
- DB migration も作らない
- レビュー結果は lunaria/LUNARIA_PRODUCT_STRATEGY_REVIEW_2026-05-09.md に出力
```

---

## 8. 現時点の判断

Lunaria は、AI日記だけなら中規模アプリ。
しかし今回の方針どおり、記憶・キャラ状態・ガチャ・2D表現・週次ゲーム・外部連携まで見据えるなら、大規模プロダクトの入口にいる。

だからこそ、今やるべきことは派手な機能追加ではなく、以下の順番。

```text
記憶ガバナンス
  ↓
reaction foundation
  ↓
character state
  ↓
user communication profile
  ↓
life_events
  ↓
週次ゲーム / Live2D / 外部連携
```

この順番なら、Lunaria は「AI日記」から自然に「ルナリアと日々を残す場所」へ育てられる。
