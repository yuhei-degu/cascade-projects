# Character Profile Expansion

作成：2026-05-04
位置付け：将来の女性向けモデルや別キャラ展開に備えた **character_profile** の構造設計
注意：DB migration は本仕様で確定後、Codex 復帰後に作成

---

## 0. 目的

現状：ルナリア 1 体のみ。プロンプト・立ち絵・声・アイテムがハードコード気味。

将来：
- 男性向けモデル（現状）
- **女性向けキャラ展開**（新規）
- スタイル違い（やわらか / 大人びた / 子供っぽい）
- 季節限定キャラ（イベント期間のみ）
- ユーザー自作キャラ（v3 以降）

→ ハードコードを `character_profile` に集約して、複数キャラを切り替え可能にする。

**ただし、今は 1 キャラのみで運用する**。本ドキュメントは将来の拡張に備えた**設計の準備**。

---

## 1. character_profile の構造

```ts
type CharacterProfile = {
  // 識別
  id: string                      // 'lunaria' / 'lunaria_f' / 'sora' 等
  display_name: string            // 'ルナリア' / 'ソラ' 等
  short_name: string              // 'ルナ' （会話で使う愛称）

  // ペルソナ
  base_prompt: string             // 固定人格（核）のプロンプト
  personality_default: PersonalitySettings  // デフォルトの 6 軸値
  voice_default_tone: string      // 'soft' / 'firm' / 'playful'

  // ビジュアル
  visual_assets: {
    portrait_default: string      // public/lunaria/portrait/default/
    portrait_root: string
    color_main: string            // 髪色 (hex)
    color_eye: string             // 目色 (hex)
  }

  // 表情 / モーション語彙
  expression_vocab: string[]      // ['normal', 'smile', ...] - 全 12 種から選ぶ
  motion_vocab: string[]          // ['idle', 'nod', ...]

  // ガチャ / アイテム
  gacha_pool_id: string           // 'pool_lunaria_v2'
  default_outfit_id: string       // 'outfit_default'
  default_background_id: string

  // 公開状態
  is_default: boolean             // 新規 user の起動時 default
  is_active: boolean              // 利用可能か
  unlock_condition: string | null // 'free' / 'subscription' / 'event_xxx'

  // メタ
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 2. 共通化する項目（character_profile に持たない）

以下はキャラに依存しない**システム共通**：

| 項目 | 場所 | 理由 |
|---|---|---|
| 表情タグ ID（`normal` / `smile` etc.） | `CHARACTER_EXPRESSIONS.md` | 全キャラ共通の語彙 |
| モーションタグ ID（`idle` / `nod` etc.） | `CHARACTER_MOTIONS.md` | 同上 |
| `AssistantReply` schema | `ASSISTANT_REPLY_SCHEMA.md` | 共通契約 |
| 6 軸の定義 | `PERSONALITY_TUNING_SPEC.md` | キャラ越え共通 |
| カラーパレット | `UI_COLOR_PALETTE.md` | アプリ全体 |
| ガチャ pity / 確率 | `lib/lunaria/gacha.ts` | システム共通 |
| 日記 / 記憶テーブル | DB schema | system level |

→ キャラを増やしてもこれらは触らない。

---

## 3. キャラごとに分ける項目

| 項目 | 例（ルナリア） | 例（架空：ソラ） |
|---|---|---|
| `id` | `lunaria` | `sora` |
| `display_name` | ルナリア | ソラ |
| `short_name` | ルナ | ソラ |
| `base_prompt` | 月夜の幼なじみ | 朝寄りの妹分 |
| `personality_default.sweetness` | 3 | 4 |
| `personality_default.teasing` | 3 | 2 |
| `voice_default_tone` | `soft` | `bright` |
| `visual_assets.color_main` | `#1f2342` | `#fde0a8` |
| `visual_assets.color_eye` | `#9bb4d6` | `#ff8e8e` |
| `expression_vocab` | 12 種全部 | 6 種限定 |
| `motion_vocab` | 10 種全部 | 8 種 |
| `gacha_pool_id` | `pool_lunaria_v2` | `pool_sora_v1` |
| `default_outfit_id` | `outfit_default` | `outfit_sora_default` |

---

## 4. base_prompt の分離方針

### 4.1 現状（ハードコード）
`lib/prompt.ts` 直書き：
- 「あなたは Lunaria。月夜の…」
- 「軽いが逃げない、共犯者…」

### 4.2 将来（character_profile 由来）
```ts
const buildSystemPrompt = (profile: CharacterProfile, settings: PersonalitySettings) => {
  return `
${profile.base_prompt}

## 今日の温度感
${tuningSection(settings)}

## 共通ルール
${COMMON_RULES}
`
}
```

→ `base_prompt` はキャラ固有、`COMMON_RULES` は全キャラ共通（ハラスメント禁止 / 児童保護 / 機械語禁止 / etc.）。

### 4.3 base_prompt の長さ
- 300〜600 字程度
- 性格コア + 世界観の核
- 表情 / モーション語彙はここでは指定しない（共通仕様参照）

---

## 5. visual_assets の構造

```ts
visual_assets: {
  portrait_root: 'public/sora/portrait',
  portrait_default: 'default/normal.png',
  color_main: '#fde0a8',
  color_eye: '#ff8e8e',
  // 将来 Live2D
  live2d_model_path?: string
  live2d_motion_map?: Record<string, string>  // motion_id -> file
}
```

→ `<LunariaPortrait>` を `<CharacterPortrait profile={...}>` にリネーム検討（v2）。

---

## 6. gacha_pool の分離

### 6.1 pool テーブル
```sql
-- 既存：lunaria_gacha_pool（仮）
-- 候補：profile_id カラム追加
alter table lunaria_gacha_pool
  add column profile_id text references character_profiles(id);
```

→ pool は profile ごとに別物。`pool_lunaria_v2` には Lunaria 用のアイテムのみ。

### 6.2 アイテム共有 vs 分離
- `room_item` / `bg_*` 系は共通可（部屋は誰のものでもない）
- `outfit_*` / `acc_*` は profile 専用（衣装はキャラに依存）

→ items テーブルに `profile_scope: 'shared' | 'lunaria' | 'sora' | ...` を持つ。

---

## 7. outfits の構造

```ts
type Outfit = {
  id: string                // 'outfit_default' / 'outfit_sora_default'
  profile_id: string | null // null = shared
  name: string
  rarity: string
  visual_path: string       // 立ち絵差分の root
  // ...
}
```

→ 立ち絵は `{portrait_root}/{outfit_id}/{expression}.png` の構造。

---

## 8. 女性向けモデルの位置付け

### 8.1 「今すぐ実装しない」理由
- ルナリア（現状）の品質を 100% に近づけるのが先
- 1 キャラの世界観 / コピー / アート / 立ち絵差分の整合化に時間かかる
- 2 キャラ目を出すと運用負担が 2 倍（全アイテムを 2 本立て）
- ユーザーの「ルナと続ける」体験を分散させない

### 8.2 後から追加しやすくする設計の方針
- すべてを `character_profile` に集約 → migration 1 本で 2 キャラ目追加可
- ハードコード `'lunaria'` を grep で漏れなく置換できるよう、定数化
- アセット dir を `public/lunaria/` から `public/{profile_id}/` に移行
- プロンプト関数を `(profile, settings, context) => string` の純関数に

→ 本ドキュメントは女性向けモデルの設計ではなく、**追加可能な状態を保つ準備**。

### 8.3 いつ女性向けを出すか
- 想定：v3 以降（Codex 復帰 + ルナリア v9 安定 + 課金導入後）
- 順序：**ルナリア完成 → 課金 → ユーザー基盤 → 別キャラ追加**
- 別キャラ追加は「拡張機能」として、既存ユーザーには影響なく

---

## 9. ユーザーが複数キャラ持つ時

### 9.1 切り替えモデル
- ユーザーは複数キャラを所有可能（subscription による）
- 同時に「アクティブ」なのは 1 キャラ
- 切り替え時、各キャラの記憶 / 日記は分離

### 9.2 記憶 / 日記の分離
- `lunaria_core_memory` / `lunaria_diary_logs` に `profile_id` カラム追加
- 切り替えた時、もう片方のキャラの記憶は出てこない
- 実装：DB クエリで `where profile_id = current` を必ず付ける

### 9.3 親密度の分離
- `character_states` も profile_id 別に保持
- 「ルナとは仲良し / ソラとは初対面」が両立する

---

## 10. 段階的移行計画

### 10.1 Phase A：構造の準備（本タスク）
- 仕様書作成 ✅
- ハードコードのリストアップ
- character_profile テーブルの設計案（migration は作らない）

### 10.2 Phase B：1 キャラだけで profile 化（Codex 復帰後）
- `character_profiles` テーブル migration 作成
- `lunaria` を 1 行 insert
- ハードコード参照を profile 由来に切替
- 動作変わらないこと確認

### 10.3 Phase C：profile_id を memory / diary に追加
- 既存 row に default profile_id 設定
- クエリに `where profile_id = current` 追加

### 10.4 Phase D：2 キャラ目を追加（v3）
- 別 character_profile を 1 行追加
- 専用アセット用意
- 切替 UI 実装

→ 各 Phase は破壊的変更を避け、backward compat を保つ。

---

## 11. 議論したい論点

1. **profile_id の命名**：`lunaria` か `chara_lunaria` か `lunaria_v1`
2. **デフォルトキャラ移行時の挙動**：既存 user に自動で `lunaria` を割当 vs ユーザー初回選択
3. **base_prompt の更新ポリシー**：profile 行の更新で reload vs 起動時のみ load
4. **女性向けキャラのトーン**：男性向けと同じ「幼なじみ / 共犯者」軸 vs 別軸
5. **ユーザー自作キャラ**：v3 以降の課題、設計はまだ深掘りしない

---

## 12. 関連
- `LUNARIA_VISUAL_GUIDE.md`（visual_assets の参照元）
- `CHARACTER_EXPRESSIONS.md` / `CHARACTER_MOTIONS.md`（共通語彙）
- `PERSONALITY_TUNING_SPEC.md`（personality_default の構造）
- `ASSISTANT_REPLY_SCHEMA.md`
- `lib/prompt.ts` / `lib/lunaria/prompt-builder.ts`（profile 化対象）
- `BRAND_GUIDE.md`（キャラを増やす時のブランド一貫性）
