# Lunaria AI Diary / Memory Design Review

作成：2026-05-03
位置付け：`LUNARIA_DIARY_MEMORY_DESIGN.md` の実装前レビュー
方針：プロダクト方向性と memory 分類の確認のみ。コードや migration は作らない

参照：
- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`（レビュー対象）
- `lunaria-app/app/api/diary/route.ts`（D1/D2 実装済み）
- `lunaria-app/lib/lunaria/diary.ts`
- `lunaria-app/app/api/messages/route.ts`
- `lunaria-app/supabase/migrations/004_lunaria_diary.sql`
- `lunaria-app/lib/lunaria/memory.ts`
- `lunaria/PROFILE_MEMORY_INTEGRATION.md`

---

## 0. 結論（Overall Verdict）

**設計の方向性は基本的に正しい**。「a shelf where Luna keeps the days」という比喩が Lunaria の世界観と整合し、Daily Diary / Transcript / Memory Changes の 3 分割もそれぞれ役割が明確。Phase D1/D2 は既に実装済みで、コードを読むかぎり**設計と実装が乖離していない**。

ただし、**実装前に必ず修正すべき点が 1 つ**ある：

> **`user_day` フィールドは現提案のままでは危険**。「外出前に開発を任せた」のような**ユーザー行動の推測**を構造的に促してしまう。明示されない行動を Luna が記述すると、即座に「監視されている感」を生むので、運用前に緩和必須。

それ以外はリスク許容範囲内で、D3/D4 へ段階的に進める設計として妥当。

---

## 1. Must-fix before implementation（必須修正）

### 1.1 ⛔ `user_day` フィールドの再設計

**問題**：

設計書 §5 の例：
```json
"user_day": ["外出前に開発を任せた", "戻ってAI日記の見返し方を相談した"]
```

これは**ユーザーが明言していない行動の推測**になる可能性が高い。「開発を任せた」はチャット内容から推測できるが、「外出前に」は会話に出ていなければ Luna が想像しているだけ。

`diary.ts` のプロンプトには既に「ユーザーが明言していない行動は断定しない」とあるが、**スキーマに `user_day` フィールドが構造的に存在すると、LLM はそれを埋めようとして推測する**。これは「監視されている感」の温床。

**修正案 A**（強く推奨）：`user_day` を廃止し、`events` に統合する
- `events` は「その日に話したこと・確認したこと」のみを記述する
- 「ユーザーが何をしていたか」を別フィールドにしない

**修正案 B**：`user_day` を残すなら、**ユーザーが明示的に語ったことのみ**に厳格化
- フィールド名を `user_mentioned_activities` に変える（推測しないことを名前で示す）
- プロンプトに「ユーザーが直接『〜した』と言ったことだけ。Luna の想像は禁止」と明記
- 各要素にソース引用（user_message_id）を持たせる

**僕の推奨**：A。シンプルに `user_day` を削除して `events` に寄せる方が事故が起きにくい。

### 1.2 ⛔ Memory provenance のスキーマ確定なしに D4 着手しない

**問題**：

`lunaria_core_memory` の現スキーマ（`memory.ts` の `saveCoreMemory` から推測）には：
- `type` / `content` / `score` / `hit_count` / `last_seen` / `memory_category`

がある。しかし設計書 §4.3 で要求されている：
- `source_date`
- `source_message_id`
- `confidence`
- `status`（active / archived 等）
- `last_confirmed_at`

は**現状存在しない**。

→ D4（memory change surface）を実装する前に、これらカラム追加 migration が必要。「Phase D4 までに schema 更新する」を計画に明記しないと、D4 実装段階で「あれ、ソース辿れない」になる。

**修正案**：
- D4 の前段に **D3.5: Memory schema 拡張**を入れる
- 新規 migration（仮：`017_core_memory_provenance.sql` 相当）で 5 カラム追加
- 既存 row は backfill 不可（`source_message_id` は失われている）→ NULL 許容

### 1.3 ⛔ JST helper の現実装確認

**問題**：

設計書 §7 で JST helper の追加が future implementation として書かれているが、`diary.ts` を見ると既に **`getJstDayRange` / `getJstDateString` を import している**（`from './date'`）。

→ **既に実装済み**。設計書 §7 を「将来の追加」と書くと、実装者が「まだ無いのか」と誤認するリスク。

**修正案**：設計書 §7 を「実装済み（diary.ts / route.ts で利用中）」に書き換える。または別レビューで設計書本体を更新。

---

## 2. Nice-to-have improvements（推奨改善）

### 2.1 `talked_about` の冗長性を整理

設計書 §5 の `talked_about: ["月箱v2", "天井200連", "AI日記", "記憶の見せ方"]` は実質的に**タグ**。一方 `events` は「あった出来事・話したこと」を文として持つ。

両者の役割が曖昧。提案：
- `talked_about` は**タグ配列**（5 個以下、各 8 文字以内のキーワード）と明記
- `events` は**文の配列**（各 30 文字以内、出来事として読める文）と明記

→ UI 側で `talked_about` はチップ表示、`events` は箇条書き表示というように使い分けが自然になる。

### 2.2 `title` の生成プロンプト追加

`title` フィールドが提案されているが、`diary.ts` のプロンプトでは生成されていない（既存スキーマには無く、提案のみ）。

実装時の方針：
- 「その日 1 行で表したら何の日か」を 12 文字以内で
- 詩的すぎず、検索可能な具体性を持たせる
- 例：「月箱の準備を進めた日」「久しぶりに自己開示できた日」

### 2.3 `memory_changes` を 3 状態で表現

設計書 §5 の例：
```json
"memory_changes": [{ "type": "preference", "content": "...", "action": "candidate" }]
```

`action` の取りうる値を明示：
- `candidate`：抽出されたが core_memory には未保存
- `saved`：core_memory に保存された
- `confirmed`：ユーザーが「これ覚えてて」等で確定したもの

D4 で `confirmed` を入れると、`saved` と `candidate` の差別化になる。

### 2.4 「重要度 5 / 4 / 3 / 2 / 1」の意味を明示

`importance: 4` の例があるが、5 段階の意味づけが無い。実装時に：
- 5：人生の節目（大きな決断、深い自己開示、大きな喜び/悲しみ）
- 4：感情強い、未解決の重さ
- 3：通常の会話
- 2：軽い雑談
- 1：挨拶のみ

を Luna 内部の判断基準として固定する。

### 2.5 `unresolved_issues` の expire ルール

未解決 issue が放置されると `getMorningOpening` で永久に蒸し返される懸念。
- 30 日以上前の `unresolved_issues` は expired 扱い
- expire したら別の `next_topics` へ自動降格、または完全削除

これは現実装の `getMorningOpening` のロジック改善案として残しておく。

---

## 3. Suggested Final Diary Schema v1

修正済みの推奨スキーマ：

```json
{
  "date": "2026-05-03",
  "title": "月箱の準備を進めた日",
  "summary": "今日はガチャの月箱と天井まわりを整理し、次に何を安定させるかを決めていた。",
  "events": [
    "月箱v2の最終レビューを進めた",
    "天井閾値を200連で決めた",
    "AI日記の設計レビューを依頼した"
  ],
  "talked_about": ["月箱", "天井", "AI日記"],
  "emotions": {
    "joy": 1, "anger": 0, "sadness": 0,
    "shyness": 0, "loneliness": 0, "anxiety": 1
  },
  "luna_comment": "今日は、未来の棚を作る話をした日だったね。",
  "unresolved_issues": ["Supabase 014/015/016 apply", "AI diary UI design"],
  "next_topics": ["DB適用後の動作確認", "日記UIの設計レビュー"],
  "memory_changes": [
    {
      "type": "preference",
      "content": "ユーザーは重要でない作業をClaudeへ振り分けたい",
      "action": "candidate",
      "source_message_count": 2
    }
  ],
  "importance": 4,
  "source_message_count": 24,
  "generated_at": "2026-05-03T14:32:00+09:00"
}
```

### 主要変更点（提案 → 推奨 v1）

| 元提案 | 推奨 v1 | 理由 |
|---|---|---|
| `user_day` 配列 | **削除**（`events` に統合）| 行動推測の構造化を防ぐ |
| `events` | 文の配列（30 字以内）| `talked_about` との差別化 |
| `talked_about` | タグ配列（8 字以内 5 個まで）| UI 側で chips 表示 |
| `memory_changes[].action` | `candidate` / `saved` / `confirmed` の 3 状態 | D4 で意味付けが必要 |
| `source_message_count` | 新規追加 | 「何を元に書かれたか」の透明性 |
| `generated_at` | 新規追加 | regenerate 時の判別 |

### DB スキーマへの落とし込み

`lunaria_diary_logs` 既存カラム：
- `summary`, `events`, `emotions`, `luna_comment`, `unresolved_issues`, `next_topics`, `importance`

追加が必要なカラム：
- `title text`（新規）
- `talked_about jsonb`（新規）
- `memory_changes jsonb`（新規）
- `source_message_count int`（新規）
- `generated_at timestamptz default now()`（新規）

→ 別 migration（仮：`018_diary_v1_schema.sql`）で追加。Phase D3 の前に実施。

---

## 4. UX Copy Suggestions（ルナの口調で）

### 4.1 既存の Empty States（OK・微修正）

```
- "この日は、まだルナの棚にしまうものがないみたい。"        → そのまま OK
- "この日のこと、今まとめる？"                              → そのまま OK
- "うまく綴れなかった。もう一度だけ、月明かりを集めてみる。"  → そのまま OK
```

これらはルナの千束テンポと整合してる。

### 4.2 Diary card の各セクション見出し

| セクション | 推奨見出し | 補足 |
|---|---|---|
| `title` 表示 | （タイトル単独で大きく） | フォントサイズで主役化 |
| `summary` 表示 | （見出し無し、本文のみ） | summary は地の文として読ませる |
| `luna_comment` | 「ルナの一言」 | 既存通り |
| `events` | 「あったこと」 | 既存「what happened」より柔らかい |
| `talked_about` | 「話したこと」 | chips 表示前提 |
| `unresolved_issues` | 「まだ続いてる話」 | 「open」より自然 |
| `next_topics` | 「次に話せそうなこと」 | 既存通り |
| `memory_changes` | 「ルナが覚えたこと」 | D4 で実装、デフォは折りたたみ |
| transcript | 「その日のおしゃべり全部」 | デフォルト折りたたみ |

### 4.3 Memory provenance UI（D4 用）

ユーザーが「これ何で覚えてるの」と思った時の説明文：

```
- 確認ボタン押下時：
  「2026-04-12 の夜、悠平が『最近仕事つらい』って言ってたから、ルナが覚えてた。」

- 削除確認モーダル：
  「これ、ルナの棚から外していい？戻したくなったら、また話してくれれば覚えるね。」

- 削除完了後：
  「外したよ。話してくれたことは、それでも残ってる。」

- 訂正アクション：
  「ちょっと違ったかも？正しい言い方を教えてくれたら、書き直しておく。」
```

### 4.4 Generate-on-demand（D3）アクション

```
- 生成中：
  「この日のこと、思い出してみる…」

- 生成成功：
  「綴れたよ。読んでみて。」

- 生成失敗（メッセージはあるが diary 化できなかった）：
  「うーん、今日のこと、まだうまく言葉にできない。明日もう一度ためしてみる？」

- 生成失敗（メッセージが無い）：
  「この日は、ルナの棚にしまうものがないみたい。お話しが無かった日。」
```

### 4.5 Calendar/month view（D5 future）

カレンダー上の日付ごとマーカー：
- `importance >= 4` → 月のマーク（●）
- 普通の日 → 小さな点（・）
- 会話無し → 何も無し

ホバー時：「●：その日のこと、ちゃんと覚えてる」

---

## 5. Implementation Caution Notes for Codex

### 5.1 D1 / D2 は完了として扱う

設計書 §11 に "Phase D1: implemented on 2026-05-03 / Phase D2: implemented on 2026-05-03 for basic day transcript fetching and display" と書かれており、`app/api/diary/route.ts` と `app/api/messages/route.ts` を読むかぎり整合する。

→ 残りの作業は **D3 / D4 のみ**。設計書を更新するなら「D1/D2 は完了」を冒頭に明示。

### 5.2 D3 着手前に必須の作業（順序）

1. **設計書本体を更新**（§1.1 で指摘した `user_day` 削除、§1.3 の JST helper 既存化を反映）
2. **Diary schema 拡張 migration**（仮 `018_diary_v1_schema.sql`）：`title` / `talked_about` / `memory_changes` / `source_message_count` / `generated_at` を追加
3. **`diary.ts` のプロンプト更新**：新スキーマに合わせて生成 JSON を変える
4. **`DiarySchema` zod の更新**（`lib/lunaria/types.ts` にあるはず）
5. **`/api/diary` レスポンスに `generated_at`, `source_message_count`, `has_messages` を追加**
6. **`/diary` UI に新フィールド表示を追加**

→ ガチャ DB 安定化（014/015/016 適用）が終わってから着手。

### 5.3 D4 着手前に必須の作業

1. **Memory provenance schema migration**（仮 `019_core_memory_provenance.sql`）：
   - `source_date date`
   - `source_message_id uuid`（FK 任意）
   - `confidence numeric(3,2)`（0.00〜1.00）
   - `status text default 'active'` check in `('active','archived','deleted','candidate')`
   - `last_confirmed_at timestamptz`
2. **`saveCoreMemory` の signature 拡張**：source 情報を受け取れるように
3. **`/api/memory` 系の新規エンドポイント**：
   - `GET /api/memory` — 一覧
   - `POST /api/memory/:id/confirm` — confirm
   - `DELETE /api/memory/:id` — delete
   - `PATCH /api/memory/:id` — correct
4. **UI（`/diary` 内に折りたたみ、または別画面 `/memory`）**

→ 4 〜 6 ステップに分かれるので、D4 を**さらに D4a〜D4c に分割**するのが安全。

### 5.4 触ってはいけないもの

- **`/api/chat`** の本体ロジック（diary 生成フローと混ぜない）
- **`/api/chat`** が呼んでいる `extractTurnTopic` / `getMorningOpening`（既存挙動を変えない）
- **`lib/prompt.ts`**（プロンプト v9 は別タスク）
- **既存ガチャ系**（`/api/gacha/*`、`lib/lunaria/gacha.ts`）

### 5.5 リスク管理

| リスク | 対策 |
|---|---|
| `user_day` 推測でユーザーが「監視されてる感」 | §1.1 で削除推奨 |
| Raw transcript がデフォルト表示で重い | デフォルト折りたたみ、`<details>` 要素で実装 |
| `memory_changes` が大量に diary に並ぶ | 1 日 3 件まで表示、それ以上は「他 N 件」 |
| Diary 生成中の API timeout | `gemini-2.5-flash` の thinking 込みで `max_tokens=2000` 推奨（既に `diary.ts` は 700 だが、新スキーマで増えるなら拡張）|
| JST 日付バグ | 既に `getJstDateString` / `getJstDayRange` 実装済み、新規エンドポイントでも必ず使う |
| Diary 重複生成 | 既存 `upsert ... on conflict (user_id, diary_date)` で対応済み |

### 5.6 テスト観点（D3 完了時）

- [ ] 同じ日に 2 回 generate しても 1 行のみ
- [ ] `force: true` で regenerate できる
- [ ] message 0 件の日は `no_source` を返す
- [ ] message あり / extraction なしの日は messages から source 構築
- [ ] JST 0 時前後（UTC 15 時前後）で日付が正しく分離
- [ ] `memory_changes` が `candidate` 状態で diary に記録される

### 5.7 テスト観点（D4 完了時）

- [ ] memory 一覧で `source_date` / `source_message_id` が正しく辿れる
- [ ] 削除した memory は `status='deleted'` になり、prompt 注入から除外
- [ ] confirm した memory は `status='confirmed'` で永続化
- [ ] memory provenance UI で `confidence < 0.5` のものは「（推測）」マーク

---

## 6. 段階的ロードマップ（修正版）

設計書 §11 を補強した推奨ロードマップ：

```
[完了] D0  Design Review                  ← この文書
[完了] D1  Read-only Diary Page
[完了] D2  Date-filtered Messages

──────（gacha DB 安定化が終わるまで一旦停止）──────

[未着手] D2.5 設計書本体更新（user_day 削除、JST helper 既存化反映）
[未着手] D3a  Diary schema 拡張 migration（018）
[未着手] D3b  diary.ts プロンプト更新 + DiarySchema zod 更新
[未着手] D3c  /api/diary レスポンス拡張
[未着手] D3d  /diary UI で新フィールド表示

──────（D3 完成後、運用ログを 1〜2 週間観察）──────

[未着手] D4a  core_memory provenance migration（019）
[未着手] D4b  /api/memory 系エンドポイント
[未着手] D4c  /diary 内 memory_changes 折りたたみ表示
[未着手] D4d  delete / correct UX
```

各 phase 完了時にユーザー確認を挟むのが安全。

---

## 7. 議論したい論点

### 7.1 `user_day` を本当に削るか

僕の推奨は「削除」だが、ユーザー（悠平）が「今日何してたか」を **意図的に** Luna に語る運用なら、`user_mentioned_activities` として残しても良い。判断はユーザー自身。

### 7.2 Memory の confirm UX

設計書 §10 で「Delete or correct a memory」が future としてあるが、**confirm（明示的に永続化を確定する）** UX は未提案。
- 候補：チャット中に Luna が「これ覚えてていい？」と聞いて、ユーザーが「うん」で `status='confirmed'`
- これは積極的な記憶ガバナンスとして価値があるが、押しつけがましくならない頻度設計が要る

### 7.3 Diary を Luna 自身の声で書くか、中立か

設計書 §12 の open question：
- 推奨：**Luna の声で書く**（`luna_comment` 以外も柔らかい一人称トーン）
- 理由：`summary` だけ無機質で `luna_comment` だけ千束テンポだと違和感が出る
- ただし `events` / `unresolved_issues` は中立的事実列挙で OK

### 7.4 ユーザーが diary を編集できるか

設計書 §12 の open question：
- 推奨：**編集できない（v1）**。理由は「ルナがしまった棚を、ユーザーが書き換える」のは比喩的に違和感
- 代替：`memory_changes` の delete/correct で十分（記憶レイヤーで訂正できればよい）
- v3 以降に「コメント追加（ユーザーから Luna への返信）」機能はアリ

### 7.5 Raw message の retention

- 推奨：**デフォルト無期限**（無料版でも）
- ただし `lunaria_users.plan='free'` の場合、core_memory の decay は既に 7 日（subscription.ts）。message 本体は別軸で残す
- 「N ヶ月後に raw message を削除する」をユーザーが選択できる UI は v3 以降

---

## 8. 関連ドキュメント

- `LUNARIA_DIARY_MEMORY_DESIGN.md`：レビュー対象
- `PROFILE_MEMORY_INTEGRATION.md`：profile / core_memory の真実権限分離（D4 設計時に参照）
- `004_lunaria_diary.sql`：既存 diary スキーマ
- `app/api/diary/route.ts` / `lib/lunaria/diary.ts`：D1/D2 実装
- `lib/lunaria/memory.ts`：core memory 操作
- `NEXT_PHASE_CANDIDATES.md` §9：本機能の優先度（後回し扱い）

---

## 9. まとめ

設計書は**プロダクト方向性として優れている**。Lunaria の「shelf where Luna keeps the days」哲学が一貫しており、データ構造・API・UI が分離設計されている。

**実装前必須修正は 3 点**：
1. `user_day` フィールドの再設計（推測の構造化を防ぐ）
2. memory provenance schema の確定（D4 着手前）
3. JST helper の現実装反映（設計書本体を update）

**D3 / D4 着手は gacha DB 安定化（014/015/016 適用）後**。それまでは設計書本体の修正と migration 仕様詰めだけ進めて準備しておく形が安全。
