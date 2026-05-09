# DB Design：character_states

作成：2026-05-04
位置付け：ルナリア（または将来の他キャラ）の **現在の装備 / 表情 / モーション / 親密度** を 1 行で保持するテーブルの設計案
注意：migration は本仕様で確定後、Codex 復帰後に作成する。**今はテーブル化しない**

---

## 0. 目的

現状：装備状態 / 親密度 / 現在表情 を保持する場所がない（または分散している）。

→ 1 ユーザー × 1 キャラに対して **現在の状態を 1 行**にまとめて持つ。

このテーブルが満たすこと：
- どの衣装 / 背景 / 部屋アイテムを装備しているか
- 現在の表情 / モーション（最後の AssistantReply 由来）
- 親密度（affinity_level）
- 最後の interaction 時刻

---

## 1. 候補スキーマ

```sql
create table public.lunaria_character_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,
  character_profile_id text not null references public.character_profiles(id),

  -- 装備状態
  current_outfit_id text references public.lunaria_items(id),
  current_background_id text references public.lunaria_items(id),
  current_diary_skin_id text references public.lunaria_items(id),
  equipped_accessories text[] not null default '{}',
  room_items text[] not null default '{}',

  -- 表情 / モーション（最後の AI 返答由来）
  current_expression text,
  current_motion text,

  -- 親密度
  affinity_level integer not null default 0,
  affinity_streak_days integer not null default 0,

  -- 解放状態
  unlocked_expressions text[] not null default '{normal,gentle_smile,thinking,sad,serious}',
  unlocked_motions text[] not null default '{idle,nod,tilt_head}',
  unlocked_voices text[] not null default '{}',

  -- 連動
  last_interaction_at timestamptz,
  last_diary_at timestamptz,

  -- メタ
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, character_profile_id)
);
```

→ unique 制約：1 ユーザー × 1 キャラに対して 1 行。

---

## 2. 各カラムの意味

| カラム | 意味 |
|---|---|
| `id` | 内部主キー |
| `user_id` | ユーザー |
| `character_profile_id` | どのキャラの状態か（現状 `lunaria` のみ） |
| `current_outfit_id` | 現在装備中の衣装。`null` ならデフォルト `outfit_default` |
| `current_background_id` | 現在の背景 |
| `current_diary_skin_id` | 日記スキン |
| `equipped_accessories` | アクセサリーの id 配列（最大 3）|
| `room_items` | 部屋アイテム id 配列（最大 8）|
| `current_expression` | 直近の AI 返答の表情 ID |
| `current_motion` | 直近の AI 返答のモーション ID |
| `affinity_level` | 親密度 0〜100 |
| `affinity_streak_days` | 連続会話日数 |
| `unlocked_expressions` | 解放済み表情の配列 |
| `unlocked_motions` | 解放済みモーションの配列 |
| `unlocked_voices` | 解放済み音声の配列 |
| `last_interaction_at` | 最後にチャットした時刻 |
| `last_diary_at` | 最後の日記生成時刻 |

---

## 3. user_items との関係

`user_items` は **所有しているアイテムの記録**（誰が何を持っているか、複数行）。
`character_states` は **そのうち何を装備しているか**（1 行）。

```
[user_items]                  [character_states]
user_id, item_id              user_id, current_outfit_id, ...
                              current_outfit_id IN user_items.item_id
                              ↑ 装備するときは user_items に存在チェック
```

### 3.1 装備変更時のフロー
1. ユーザーがアイテム A を装備したい
2. `user_items` に `(user_id, A)` が存在するか確認
3. 存在すれば `character_states.current_outfit_id = A` 更新
4. `user_items.is_equipped` も更新（可視化用）

### 3.2 アイテム削除時の整合
- `user_items` から削除されたら `character_states.current_outfit_id` を NULL に（または default に戻す）
- → トリガーで自動更新

---

## 4. AI 返答の expression / motion との関係

### 4.1 受信フロー
```
[chat API]
  ├ AssistantReply を生成
  ├ message を返す
  └ expression / motion を character_states に upsert
       ↓
[next render]
  └ <LunariaPortrait> が character_states.current_expression を参照
```

### 4.2 永続化の意図
- 一時的な表情変化は character_states.current_* に書く（揮発でなく永続）
- ページリロードしても直近の表情が保持される
- 複数 device 間で同期される

### 4.3 揮発でいいフィールド？
- `current_expression` / `current_motion` は永続でいいが、connection 切れて時間経過したら **idle に戻す** 仕様も検討
- 例：`last_interaction_at` から 5 分以上経過 → render 側で idle 表示

---

## 5. Live2D への接続

### 5.1 Live2D 導入後
- `current_expression` を Live2D の表情モーフ ID にマップ
- `current_motion` を Live2D のモーション ID にマップ
- `current_outfit_id` を Live2D のテクスチャグループにマップ

### 5.2 マッピングテーブル
- `character_profiles.visual_assets.live2d_motion_map` に格納（キャラ別）
- 例：`{"nod": "motion_nod_01.motion3.json", ...}`

### 5.3 実装段階
- v0：静止画 PNG（`<LunariaPortrait>`）
- v1：パーツ差分（手 / 目だけ別レイヤー）
- v2：Live2D Cubism

→ character_states のスキーマは v0/v1/v2 すべてで使い回せる。

---

## 6. インデックス

```sql
create index idx_character_states_user_active on public.lunaria_character_states(user_id, character_profile_id);
create index idx_character_states_last_interaction on public.lunaria_character_states(user_id, last_interaction_at desc);
```

→ ユーザー切替の最近キャラ取得が O(log n)。

---

## 7. RLS

```sql
alter table public.lunaria_character_states enable row level security;

create policy "users_own_character_states"
  on public.lunaria_character_states
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 8. 親密度（affinity）の運用

### 8.1 増え方
- 会話 1 ターンで +0.5（max 100）
- 日記生成で +1
- ガチャ獲得は **増えない**（関係性とは別レイヤー）
- 連続日数 streak で月初にボーナス

### 8.2 減り方
- 14 日以上不在で -10
- ユーザーが「やっぱりこれは違う」と言うシナリオでは減らない（拒絶しすぎない）

### 8.3 表示
- ユーザーには数値を見せない方針
- 段階表示：「初対面 / 顔見知り / 友達 / 親しい / 共犯者」（5 段階）
- 0〜20 / 20〜40 / 40〜60 / 60〜80 / 80〜100

→ `BRAND_GUIDE.md §11` の議論論点と合わせる。

---

## 9. 例：1 ユーザーの行データ

```json
{
  "id": "...",
  "user_id": "00000000-0000-0000-0000-000000000001",
  "character_profile_id": "lunaria",
  "current_outfit_id": "outfit_winter_coat",
  "current_background_id": "bg_window_night",
  "current_diary_skin_id": null,
  "equipped_accessories": ["acc_moon_pin"],
  "room_items": ["room_mug_warm", "room_notebook"],
  "current_expression": "gentle_smile",
  "current_motion": "idle",
  "affinity_level": 47,
  "affinity_streak_days": 12,
  "unlocked_expressions": ["normal","smile","gentle_smile","teasing","thinking","sad","serious"],
  "unlocked_motions": ["idle","nod","tilt_head","lean_forward","close_eyes"],
  "unlocked_voices": [],
  "last_interaction_at": "2026-05-04T22:13:00Z",
  "last_diary_at": "2026-05-03T23:50:00Z",
  "created_at": "2026-04-01T00:00:00Z",
  "updated_at": "2026-05-04T22:13:00Z"
}
```

---

## 10. 議論したい論点

1. **`character_profile_id` を `text` で持つか `uuid` で持つか**：text の方が読みやすい / クエリで `'lunaria'` 直接書ける
2. **`equipped_accessories` を配列で持つか**：JSON object（slot 別）の方が柔軟だが冗長
3. **`current_expression` の auto-idle**：5 分後に idle へ戻す trigger or アプリ側で計算
4. **`unlocked_*` を別テーブル化**：v0 は配列で十分、v3 で multi-character になったら正規化
5. **affinity の上限 100**：100 / 1000 / 無限のどれか（100 推奨、丁度感）

---

## 11. 関連
- `DB_USER_ITEMS.md`（user_items の構造）
- `DB_LIFE_EVENTS.md`（life_events の位置付け）
- `CHARACTER_EXPRESSIONS.md` / `CHARACTER_MOTIONS.md`（語彙）
- `ITEM_SYSTEM_SPEC.md`（装備 slot 定義）
- `CHARACTER_PROFILE_EXPANSION.md`（character_profile との関係）
