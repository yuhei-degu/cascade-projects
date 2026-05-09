# DB Design：life_events

作成：2026-05-04
位置付け：Lunaria を「ライフログ OS」に拡張するための **イベントログ層** の設計案
注意：migration は本仕様で確定後、Codex 復帰後に作成。**今はテーブル化しない**

---

## 0. 目的

現状：日記 / 記憶 / ガチャ / プロフィール変更 が**バラバラに保存**されている。

将来：
- AI グラスからの位置情報イベント
- カレンダーアプリからの予定通知
- 健康データ（睡眠 / 運動）の取り込み
- 外部音楽アプリの再生履歴
- ユーザー手動の「ライフメモ」

→ これらを **統一フォーマット**で保存し、**diary / memory / 検索 / AI 文脈** に流せるようにする。

ただし、**「ライフログを集めること」自体が目的ではない**。Lunaria の会話と日記の質を上げるために必要なものだけ取り込む。

---

## 1. 候補スキーマ

```sql
create table public.lunaria_life_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lunaria_users(id) on delete cascade,

  -- イベント分類
  event_type text not null,
  -- 例: 'diary_generated', 'memory_confirmed', 'item_obtained', 'gacha_pull',
  --     'profile_updated', 'streak_milestone', 'mood_logged',
  --     'external_calendar', 'external_health', 'external_music',
  --     'glasses_capture', 'manual_note'

  source text not null,
  -- 例: 'app_internal', 'gacha', 'diary', 'memory',
  --     'external_calendar', 'external_health',
  --     'glasses', 'manual'

  -- 時刻
  occurred_at timestamptz not null,

  -- 内容
  title text,
  summary text,
  raw_ref jsonb not null default '{}'::jsonb,
  -- 元データへの参照: { "diary_log_id": "...", "memory_id": "...", "gacha_pull_id": "..." }

  -- プライバシー
  privacy_level text not null default 'private'
    check (privacy_level in ('private', 'lunaria_only', 'redacted')),

  -- メタ
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

→ 論理削除（deleted_at）で残すか、物理削除にするかは要議論（§10.1）。

---

## 2. 各カラムの意味

| カラム | 意味 |
|---|---|
| `id` | 主キー |
| `user_id` | ユーザー |
| `event_type` | イベント種別の細分 |
| `source` | データの出所 |
| `occurred_at` | 実際にイベントが起きた時刻（取り込み時刻ではない）|
| `title` | 見出し（短文）|
| `summary` | 詳細（長くても 200 字程度）|
| `raw_ref` | 元データへの参照 |
| `privacy_level` | プライバシー区分（§5）|
| `metadata` | その他補足 |
| `created_at` | DB 投入時刻 |
| `deleted_at` | 論理削除時刻 |

### 2.1 `event_type` の語彙

| カテゴリ | 値 |
|---|---|
| 日記 | `diary_generated` / `diary_regenerated` |
| 記憶 | `memory_added` / `memory_confirmed` / `memory_archived` / `memory_corrected` |
| ガチャ | `gacha_pull` / `item_obtained` / `legendary_obtained` |
| プロフィール | `profile_updated` / `personality_tuned` |
| ストリーク | `streak_milestone_7` / `streak_milestone_30` / `streak_milestone_100` |
| ムード | `mood_logged` |
| 外部 | `external_calendar` / `external_health` / `external_music` |
| AI グラス | `glasses_capture` / `glasses_voice_memo` |
| 手動 | `manual_note` |

### 2.2 `source` の語彙

| 値 | 意味 |
|---|---|
| `app_internal` | アプリ内部発生 |
| `gacha` | ガチャシステム |
| `diary` | 日記生成 |
| `memory` | 記憶システム |
| `profile` | プロフィール |
| `external_calendar` | 外部カレンダー（GCal / iOS）|
| `external_health` | 外部ヘルス（Apple Health 等）|
| `glasses` | AI グラス |
| `manual` | ユーザー手動 |

---

## 3. AI グラス / 外部アプリ連携との関係

### 3.1 AI グラスのケース
- ユーザーがグラスで音声メモを残す → `event_type: 'glasses_voice_memo'`
- 場所情報付きの「いま夕日きれい」→ `event_type: 'glasses_capture'`、metadata に `{ location, timestamp_local }`
- これらは **diary 生成時にコンテキストとして使える**：「今日、夕日が綺麗だったね」

### 3.2 外部アプリ連携のケース
- カレンダーから「明日 14 時に通院」→ 翌日 `external_calendar` event
- 健康アプリから「今日 5 時間睡眠」→ `external_health`
- これらは **chat の文脈に薄く渡す**：「今日眠そうだね、5 時間しか寝てないらしいよ」

### 3.3 取り込みポリシー
- 全部取り込まない（個人情報過剰）
- ユーザーが連携を**明示的にオン**にしたソースのみ
- `privacy_level` で利用範囲を制限

---

## 4. diary / memory / gacha / external の扱い

### 4.1 diary との関係
- 日記生成イベントを `event_type: 'diary_generated'` で記録
- `raw_ref: { diary_log_id: '...' }`
- 日記の **コンテキスト元** にもなる：
  - 1 日の `life_events` を集約 → diary 生成プロンプトに渡す（将来）

### 4.2 memory との関係
- candidate 承認時 → `event_type: 'memory_confirmed'`
- archive 時 → `event_type: 'memory_archived'`
- これらは記憶ガバナンス UI のタイムライン表示に使える

### 4.3 gacha / item との関係
- ガチャ施行 → `event_type: 'gacha_pull'`（`gacha_pulls` のデータも参照）
- アイテム取得 → `event_type: 'item_obtained'` / `legendary_obtained`
- レアリティ高めのみ記録（common はスキップ）

### 4.4 external との関係
- すべて `source: 'external_*'`
- ユーザーが連携を切ったら、**過去の events も非表示**にする（プライバシー）

---

## 5. core_memory に直接入れず life_events を経由する理由

### 5.1 役割分離
- **`life_events`**：「いつ何があったか」の事実層
- **`lunaria_core_memory`**：「ユーザーがどんな人か」の解釈層

→ 同じ事象でも、life_event = 起きたこと、core_memory = それから読み取れる傾向

### 5.2 例
- life_event：「2026-04-12 22:00 に外部カレンダーから "母誕生日" 通知」
- core_memory：（ユーザーが記憶として残したいと言ったら）「家族行事を大切にする傾向」

→ life_event は機械が記録、core_memory は **ユーザーまたはルナリアが解釈して候補化**。

### 5.3 直接 core_memory に書かない理由
- 大量の life_events が core_memory を埋めると、LLM プロンプトが希釈される
- 「ガチャを引いた」が記憶に残るのは不自然
- ユーザーの「私はこういう人」という記憶層を、ノイズで汚さない

### 5.4 candidate 経路を通す
- 価値ある life_event → memory_candidate（pending）→ ユーザー or LLM が承認 → core_memory
- 自動取り込みは禁止

---

## 6. プライバシーレベル

### 6.1 値
- `private`：保存のみ、LLM プロンプトには使わない
- `lunaria_only`：LLM プロンプトに渡せる、ただしルナとの会話内のみ
- `redacted`：内容を伏せた上で、頻度 / 時刻情報のみ使う

### 6.2 実装上のフィルタ
- diary 生成時：`privacy_level in ('lunaria_only')`
- chat プロンプト：同上
- redacted は「最近イベントが多い」程度の抽象情報のみ使う

### 6.3 ユーザー UI
- 各 event ごとにプライバシーを変更可能
- 「これは知っててほしい」「これは記録だけ」「これは伏せて」

---

## 7. インデックス

```sql
create index idx_life_events_user_time on public.lunaria_life_events(user_id, occurred_at desc) where deleted_at is null;
create index idx_life_events_type on public.lunaria_life_events(user_id, event_type, occurred_at desc) where deleted_at is null;
create index idx_life_events_source on public.lunaria_life_events(user_id, source, occurred_at desc) where deleted_at is null;
```

---

## 8. RLS

```sql
alter table public.lunaria_life_events enable row level security;

create policy "users_own_life_events"
  on public.lunaria_life_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## 9. 例：行データ

```json
[
  {
    "id": "...",
    "user_id": "...",
    "event_type": "diary_generated",
    "source": "diary",
    "occurred_at": "2026-05-03T23:50:00Z",
    "title": "5月3日の日記",
    "summary": "仕事のあと、母と長電話。",
    "raw_ref": { "diary_log_id": "..." },
    "privacy_level": "lunaria_only",
    "metadata": { "diary_date": "2026-05-03" }
  },
  {
    "id": "...",
    "user_id": "...",
    "event_type": "legendary_obtained",
    "source": "gacha",
    "occurred_at": "2026-05-04T22:13:00Z",
    "title": "月の巫女装束 を取得",
    "summary": "200 連 pity 到達で legendary 取得",
    "raw_ref": { "user_item_id": "...", "gacha_pull_id": "..." },
    "privacy_level": "lunaria_only",
    "metadata": { "rarity": "legendary" }
  },
  {
    "id": "...",
    "user_id": "...",
    "event_type": "external_health",
    "source": "external_health",
    "occurred_at": "2026-05-04T07:00:00Z",
    "title": "睡眠 5h",
    "summary": null,
    "raw_ref": { "provider": "apple_health" },
    "privacy_level": "redacted",
    "metadata": { "hours": 5 }
  }
]
```

---

## 10. 議論したい論点

1. **論理削除 vs 物理削除**：deleted_at で残す（復元可能）vs 削除依頼で物理削除（GDPR 配慮）
2. **保持期間**：無期限 vs 1 年自動 archive vs ユーザー設定
3. **`event_type` の語彙の確定方法**：列挙 vs 自由文字列（ENUM 化のリスク）
4. **外部連携の取り込み頻度**：リアルタイム / 1 時間ごと / 日次バッチ
5. **`raw_ref` の参照整合**：FK 化 vs JSON で緩く（推奨：JSON で緩く）
6. **AI グラス連携の優先度**：今は仕様、実装は v3 以降

---

## 11. 関連
- `DB_CHARACTER_STATES.md`
- `DB_USER_ITEMS.md`
- `ITEM_SYSTEM_SPEC.md`（gacha / item の core_memory 禁止ルールと整合）
- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`（diary / memory の境界）
- `lunaria/PROFILE_MEMORY_INTEGRATION.md`（profile / memory の境界）
