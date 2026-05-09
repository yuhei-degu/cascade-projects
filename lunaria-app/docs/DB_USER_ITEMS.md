# DB Design：user_items

作成：2026-05-04
位置付け：ユーザーが所有しているアイテムの記録テーブルの設計案
注意：migration は本仕様で確定後、Codex 復帰後に作成。**今はテーブル化しない**

---

## 0. 目的

現状：ガチャ結果は `gacha_pulls` に記録されているが、「ユーザー X がアイテム Y を持っている」を直接示すテーブルがない（または間接的）。

→ 所有のソース・オブ・トゥルースとして `user_items` を持つ。
- 装備の前提（`character_states.current_outfit_id` の参照先）
- インベントリの表示元
- 重複処理 / コイン化の起点

---

## 1. 候補スキーマ

```sql
create table public.lunaria_user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,
  item_id text not null references public.lunaria_items(id) on delete cascade,

  -- 取得文脈
  obtained_from text not null check (obtained_from in (
    'gacha', 'free_grant', 'event_reward', 'subscription_grant', 'admin_grant', 'streak_bonus'
  )),
  obtained_at timestamptz not null default now(),

  -- 装備フラグ（character_states との同期用、可視化便利）
  is_equipped boolean not null default false,

  -- 重複情報
  duplicate_count integer not null default 0,  -- 2 個目以降の取得回数
  last_obtained_at timestamptz not null default now(),

  -- メタ
  metadata jsonb not null default '{}'::jsonb,
  -- 例: { "gacha_pull_id": "...", "event_id": "spring_2026" }

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, item_id)
);
```

→ unique 制約：1 ユーザー × 1 アイテムは 1 行のみ（重複は `duplicate_count` で表現）

---

## 2. 各カラムの意味

| カラム | 意味 |
|---|---|
| `id` | 主キー |
| `user_id` | ユーザー |
| `item_id` | アイテム ID（`lunaria_items.id`）|
| `obtained_from` | 取得経路 |
| `obtained_at` | 初回取得時刻 |
| `is_equipped` | 現在装備中か（`character_states` との同期）|
| `duplicate_count` | 2 個目以降の取得回数 |
| `last_obtained_at` | 最終取得時刻（重複時に更新）|
| `metadata` | 取得文脈の追加情報 |

### 2.1 `obtained_from` の値
- `gacha`：通常ガチャ
- `free_grant`：初期配布 / 自然付与
- `event_reward`：季節 / イベント参加
- `subscription_grant`：課金特典
- `admin_grant`：運営手動付与（補填等）
- `streak_bonus`：連続日記 / 連続会話の報酬

---

## 3. gacha_pulls との関係

### 3.1 既存
`gacha_pulls`：
- 1 行 = 1 ガチャ施行（その回に何が出たかの履歴）

### 3.2 新規 user_items
- 1 行 = 1 アイテムの所有
- gacha 由来の場合、`metadata.gacha_pull_id` で履歴を辿れる

### 3.3 連動フロー
```
[ガチャ実行]
  ├ gacha_pulls に 1 行追加（履歴）
  └ user_items に upsert
       ├ 初取得 → INSERT (obtained_from='gacha')
       └ 重複 → UPDATE duplicate_count += 1, last_obtained_at = now()
```

### 3.4 重複時の処理
- `duplicate_count > 0` なら、UI で「2 個目」と表示
- 「コイン化」アクション → user_items.duplicate_count -= 1 + コイン付与
- 重複が user 体験を損なわないよう、デフォルトでは「2 個目を持っている」状態をやさしく表示

---

## 4. character_states との関係

```
[user_items]                  [character_states]
user_id, item_id              user_id, current_outfit_id (= item_id)
                              ↑ 装備するときは user_items に存在チェック
```

### 4.1 装備変更時のフロー
1. ユーザー：「衣装 A を装備したい」
2. `user_items` に `(user_id, A)` 存在確認
3. `character_states.current_outfit_id = A` 更新
4. `user_items` 側：旧 outfit `is_equipped=false`、新 outfit `is_equipped=true`

### 4.2 削除時の整合
- `user_items` row 削除（理論上は admin 操作のみ）→ `character_states.current_outfit_id` も NULL に
- `lunaria_items` 側で item 削除（ゲーム的には起きないはず）→ ON DELETE CASCADE で連鎖

→ 実運用では item を delete することはほぼない。`lunaria_items.is_active = false` で運用上の非表示にする想定。

---

## 5. core_memory に入れないルール

### 5.1 原則
- アイテム所有は **`user_items` のみ**
- `lunaria_core_memory` に書き込まない
- `lunaria_diary_logs` に自動言及しない（ユーザーが話題にしたら触れる程度）
- 必要なら `lunaria_life_events` に軽く（任意、レアリティ高めのみ）

### 5.2 なぜか
- core_memory は「ユーザーがどう生きてるか」の記憶層
- 「何の服を持ってるか」は別レイヤー（記憶ではない）
- 混入すると：
  - LLM プロンプトに `"ユーザーは epic 衣装を持っている"` が入る
  - 会話が「ガチャ自慢」に寄る
  - 関係性の純度が下がる

### 5.3 違反時の影響
- `pickMemories` の出力に items 関連が混ざる
- ルナの返答が「あの服可愛いよね」を恒常的に発する（不自然）
- 記憶ガバナンス UI（`/memory`）に items が表示される

---

## 6. life_events への記録ルール（任意）

### 6.1 記録すべきケース
- legendary / epic 取得時
- 初の衣装獲得 / 初の `expression_unlock`
- 連続日記達成での記念衣装獲得

### 6.2 記録すべきでないケース
- common / rare 取得（ノイズになる）
- 通常のガチャの 1 回 1 回（履歴は `gacha_pulls` で足りる）
- 装備の付け外し

### 6.3 life_events への書き込み形式
```ts
{
  event_type: 'item_obtained',
  source: 'gacha',
  occurred_at: '...',
  title: '誕生日衣装',
  summary: 'epic 衣装「月の誕生日ドレス」を取得',
  raw_ref: { user_item_id: '...', gacha_pull_id: '...' },
  privacy_level: 'private',
}
```

→ `DB_LIFE_EVENTS.md` 参照。

---

## 7. インデックス

```sql
create index idx_user_items_user on public.lunaria_user_items(user_id, obtained_at desc);
create index idx_user_items_user_equipped on public.lunaria_user_items(user_id, is_equipped) where is_equipped;
create index idx_user_items_item on public.lunaria_user_items(item_id);
```

→ インベントリ画面の表示が O(log n)、装備中アイテム取得も高速。

---

## 8. RLS

```sql
alter table public.lunaria_user_items enable row level security;

create policy "users_own_user_items"
  on public.lunaria_user_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 9. インベントリ画面の主要クエリ

### 9.1 全アイテム + メタ
```sql
select ui.*, i.name, i.category, i.rarity, i.description
from lunaria_user_items ui
join lunaria_items i on i.id = ui.item_id
where ui.user_id = auth.uid()
order by ui.obtained_at desc;
```

### 9.2 装備中のみ
```sql
select * from lunaria_user_items
where user_id = auth.uid() and is_equipped = true;
```

### 9.3 カテゴリ別カウント
```sql
select i.category, count(*)
from lunaria_user_items ui
join lunaria_items i on i.id = ui.item_id
where ui.user_id = auth.uid()
group by i.category;
```

---

## 10. 例：行データ

```json
[
  {
    "id": "...",
    "user_id": "...",
    "item_id": "outfit_default",
    "obtained_from": "free_grant",
    "obtained_at": "2026-04-01T00:00:00Z",
    "is_equipped": false,
    "duplicate_count": 0,
    "last_obtained_at": "2026-04-01T00:00:00Z",
    "metadata": {}
  },
  {
    "id": "...",
    "user_id": "...",
    "item_id": "outfit_winter_coat",
    "obtained_from": "gacha",
    "obtained_at": "2026-05-02T22:30:00Z",
    "is_equipped": true,
    "duplicate_count": 0,
    "last_obtained_at": "2026-05-02T22:30:00Z",
    "metadata": { "gacha_pull_id": "..." }
  }
]
```

---

## 11. 議論したい論点

1. **重複処理の方針**：`duplicate_count` で吸収 vs 別の duplicate item テーブル
2. **`is_equipped` フラグの sync**：character_states と user_items 両方持つ vs 片方のみ
3. **コイン化の単位**：rarity 別の交換レート（common 1 コイン / rare 5 / etc.）
4. **`obtained_from` の追加候補**：'trade' (将来のユーザー間取引) を想定するか
5. **削除（archive）アクション**：ユーザーが「これ要らない」と言ったら true delete vs hide

---

## 12. 関連
- `DB_CHARACTER_STATES.md`
- `DB_LIFE_EVENTS.md`
- `ITEM_SYSTEM_SPEC.md`（カテゴリ定義）
- `INITIAL_ITEMS.md`（具体アイテム）
- `GACHA_DESIGN_PHILOSOPHY.md`（重複時の哲学）
- 既存：`lib/lunaria/gacha.ts` / `gacha-stats.ts`
- 既存 migration：`009_gacha.sql` / `010_gacha_seed.sql`
