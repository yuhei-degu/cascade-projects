# Memory Viewer 次フェーズ設計

作成：2026-05-04
位置付け：`CLAUDE_HANDOFF_TASKS_2026-05-04.md` Task 2 の出力。Phase D4（memory provenance UI）の最小 MVP 設計
方針：設計のみ。コード編集なし、migration 作成なし。DB 未確認の推測は「要確認」と明記

参照：
- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md` §4.3 / §11 Phase D4
- `lunaria/LUNARIA_DIARY_MEMORY_REVIEW.md` §1.2 / §5
- `lunaria/DIARY_V1_IMPLEMENTATION_REVIEW.md` §6
- `lunaria-app/supabase/migrations/018_core_memory_provenance.sql`
- `lunaria-app/lib/lunaria/memory.ts`

---

## 0. スコープと前提

### 0.1 何を作るか

D4 の最小 MVP として：

1. `/memory` ページ：ユーザーが**日付別**または**全体**で、ルナが覚えていることを見られる場所
2. `/diary` の `memory_changes` セクションからのリンク：その日に抽出された記憶候補から、永続化された記憶への遷移
3. 削除・修正・確認の UX フロー

### 0.2 前提

- **Supabase 適用は未確定**：014/015/016/017/018 の本番適用順は別 Runbook 管理
- 018 適用後、`lunaria_core_memory` には provenance カラム（`source_date` / `source_message_id` / `confidence` / `status` / `last_confirmed_at` / `created_by` / `notes`）が存在
- `/diary/page.tsx` ヘッダーに既に `<Link href="/memory">記憶へ</Link>` がある（要確認：実装済みかリンク先未作成か）

### 0.3 D4 の最小 MVP の境界

✅ **入れる**：
- 全記憶一覧
- 日付別フィルター（source_date 基準）
- status 表示と切替（active / archived / confirmed）
- 削除（status='archived' へ移動、論理削除）
- 訂正（content edit、confidence を下げる）
- 確認（status='confirmed' + last_confirmed_at 更新）

❌ **入れない**（v3 以降）：
- 検索
- ソート切替（recent / important / oldest）
- bulk 操作
- 記憶のマージ
- LLM による訂正提案

---

## 1. 想定ユーザーシナリオ

### 1.1 「ルナは何を覚えてるんだろう」

ユーザーが好奇心で見にくる。

→ `/memory` トップ：全 active 記憶のカードグリッド、最新の `source_date` 順

### 1.2 「これ、いつ話したっけ」

特定の話題を思い出したい。

→ `/memory?date=YYYY-MM-DD` で日付指定 / カード上の source_date クリックで `/diary?date=...` へ遷移

### 1.3 「この記憶、もう違うかも」

引っ越したのにまだ前の住所が残ってる、転職したのに前職が残ってる、等。

→ カードの「︙」メニュー → 「ちょっと違う」→ inline edit → confidence 0.5 に自動降格

### 1.4 「これは絶対忘れないでほしい」

大事な相談、決意、目標。

→ 「ずっと覚えてて」アクション → `status='confirmed'` + `last_confirmed_at` 記録

### 1.5 「この記憶、もう要らない」

過去の悩みを残しておきたくない、削除したい。

→ 「棚から外す」アクション → 確認モーダル → `status='archived'`

### 1.6 「ルナが私のこと、どれくらい知ってるんだろう」

unease（監視されてる感）を払拭するために、自分から見に来る。

→ `/memory` で全件閲覧、`created_by` 別に「ルナが拾ってくれた / 私が教えた」を分かるようにする

---

## 2. `/memory` ページレイアウト案

### 2.1 全体構造

```
[Header]
  ← 日記へ
  Lunaria Memory
  ルナの引き出し
  ルナがずっと覚えていることの棚。古くなったら外してもいい。

[Toolbar]
  [全部] [この月] [日付指定 ▼]
  並び順: 新しい順 / 重要度順
  状態: ✅ 残してる / 外したものを見る

[Grid] 
  カード × N
  各カード:
    {content}
    {type バッジ}    {source date}
    {confidence indicator}  {created_by indicator}
    [︙ menu]

[Footer]
  外したもの：N 件（クリックで開く）
```

### 2.2 ヘッダーコピー

```
Lunaria Memory
ルナの引き出し
ルナがずっと覚えていることの棚。古くなったら外してもいい。
```

「外してもいい」と最初に提示することで、**ユーザーに編集権限がある**ことを伝える（`LUNARIA_DIARY_MEMORY_DESIGN.md §10` Privacy and Control の精神）。

### 2.3 カード型 vs リスト型

→ **カード型推奨**。各記憶を「個」として尊重するため。リストにすると「在庫一覧」感が出る

カードサイズ：1 件最大 4 行程度。content / メタ（小さく）/ アクション（必要時）

### 2.4 件数の上限と pagination

最初は **直近 50 件 + "もっと見る"** で十分。100 件超えてからソート / pagination を考える

---

## 3. 表示項目の詳細設計

### 3.1 各カラムの UI 表現

| 018 のカラム | 内部値 | UI 表現 |
|---|---|---|
| `content` | 文字列 | カード本文（中央、最大 100 字程度） |
| `type` | value / pattern / goal / trigger / name 等 | 小さなテキストバッジ（左上） |
| `source_date` | 日付 | 「2026-04-12」or「先月の今頃」（右下、小さく） |
| `source_message_id` | uuid | 内部参照のみ。`/diary?date=...` への遷移リンク |
| `confidence` | 0.00〜1.00 / null | テキスト：「はっきり / 中 / ぼんやり / -」（数値露出 NG） |
| `status` | active / candidate / confirmed / archived / deleted | active = 表示なし / confirmed = ★アイコン / archived = カード自体表示せず（「外したもの」セクションへ）|
| `last_confirmed_at` | timestamptz / null | confirmed カードのホバーで表示 |
| `created_by` | llm / user_explicit / profile_sync / migration | アイコン：ルナ顔 / ユーザー顔 / -（migration は表示なし） |
| `notes` | 文字列 / null | カード詳細クリックで展開 |

### 3.2 confidence の言語化

数値（0.85 とか）の露出は監視感が強い。

```
0.0〜0.3 → 表示なし or 「ぼんやり」
0.4〜0.6 → 「半分くらい」
0.7〜0.9 → （表示なし、デフォルト扱い）
1.0     → 「はっきり」（confirmed と組み合わせて表示）
null    → 何も表示しない
```

### 3.3 created_by の表現

```
llm           → ルナが拾った（小さな ☾ アイコン）
user_explicit → 私が教えた（小さな ✦ アイコン）
profile_sync  → 設定から（歯車アイコン、小さく）
migration     → 表示なし
```

→ ユーザーが「これは私が言ったから覚えてる」「これはルナが察した」を区別できる

### 3.4 各カードのサンプルレンダリング

```
┌─────────────────────────────────┐
│ [value]                         │
│                                 │
│ 仕事のストレスで                │
│ 眠れないことがある              │
│                                 │
│ ☾ ルナが拾った  4 月 12 日   ︙ │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ [goal] ★                        │  ← confirmed 印
│                                 │
│ 半年後にフリーランス            │
│ として独立したい                │
│                                 │
│ ✦ 私が教えた   3 月 24 日    ︙ │
└─────────────────────────────────┘
```

---

## 4. 削除・修正・確認 UX フロー

### 4.1 「︙」メニュー展開

カード右下の三点メニューをクリックで：

```
これ、覚えてて      → confirm へ
ちょっと違うかも    → 訂正へ
棚から外す         → archive へ
詳しく見る         → 詳細モーダル
```

### 4.2 confirm（覚えてて）フロー

1. 「︙」 → 「これ、覚えてて」
2. インライン確認 trigger（モーダル不要、軽量）
   - "「{content}」をずっと覚えてもらう。いい？" → [はい] [やめる]
3. 「はい」で：
   - `status = 'confirmed'`
   - `last_confirmed_at = now()`
   - カードに ★ 表示
   - トースト「ちゃんと覚えとくね」
4. **再 confirm（confirmed → confirmed）**：last_confirmed_at だけ更新、何も表示しない（しつこい確認が出ない）

### 4.3 訂正（ちょっと違う）フロー

1. 「︙」 → 「ちょっと違うかも」
2. inline edit：content が textarea に変わる
3. 編集 → [保存] / [やめる]
4. 「保存」で：
   - `content = 新内容`
   - `confidence = MIN(現値, 0.5)` （ユーザーが修正したので確信度を下げる）
   - `status = 'active'`（confirmed → active に降格）
   - トースト「直しといた」

### 4.4 archive（外す）フロー

1. 「︙」 → 「棚から外す」
2. 確認モーダル：
   ```
   ┌─────────────────────────┐
   │ これ、ルナの棚から         │
   │ 外していい？              │
   │                          │
   │ 「{content の冒頭 30 字}」  │
   │                          │
   │ [外す] [やめる]           │
   └─────────────────────────┘
   ```
3. 「外す」で：
   - `status = 'archived'`
   - カードがフェードアウト → 「外したもの」セクションへ
   - トースト「外したよ。話してくれたことは、それでも残ってる」（記憶 ≠ 会話の区別を強調）

### 4.5 「外したもの」セクション

ページ最下部、デフォルト折りたたみ：

```
> 外したもの（5 件）

  クリックで展開 → archived な記憶のリスト
  各カードに「戻す」ボタン（status を 'active' に戻す）
```

これにより「削除しても復元できる」という安心感を提供。完全削除（`status = 'deleted'`）は v3 以降に検討。

### 4.6 操作時のトースト集

- confirm 完了：「ちゃんと覚えとくね」
- 訂正完了：「直しといた」
- archive 完了：「外したよ。話してくれたことは、それでも残ってる」
- restore（archived → active）：「また棚に戻したよ」

---

## 5. `/diary` との連動

### 5.1 `/diary` の `memory_changes` セクションから

各カード（`memory_changes` 内）に：
- 「詳しく」リンク → `/memory#${memory_id}` または `/memory?highlight=${id}`
- これにより「その日抽出された候補 → 永続記憶のページ」への遷移ができる

ただし、`memory_changes` は diary の 1 フィールドであり、独立した row ID を持つわけではない。実装上：
- `memory_changes[].content` で `lunaria_core_memory.content` を検索 → 該当 row へ
- もしくは 018 schema に `diary_memory_change_id` のような関連付けを別 table で管理（v3 範囲）

→ MVP では **「詳しく」リンクは provide しない**。`/diary` の `memory_changes` は「その日の候補」、`/memory` は「永続記憶」と明確に分けて、相互リンクは next phase に

### 5.2 `/memory` から `/diary` への遷移

各カードの `source_date` バッジクリック → `/diary?date=${source_date}` へ遷移

→ 「この記憶、どの日に拾われたんだろう」が辿れる。これは MVP に**入れる**

### 5.3 ヘッダー間の往来

- `/diary` ヘッダー：「← ルナの部屋へ」「記憶へ」「月箱へ」（既存）
- `/memory` ヘッダー：「← 日記へ」「← ルナの部屋へ」

往来コストを下げる

---

## 6. AI 日記と長期記憶の違いコピー

### 6.1 二者の本質的な違い

| 軸 | AI 日記 | 長期記憶 |
|---|---|---|
| 時間軸 | **1 日のスナップショット** | **継続的、現在進行形** |
| 編集権 | 再生成 / 削除 | 削除 / 訂正 / 確認 |
| 役割 | あの日を思い出すための棚 | ルナが今もあなたを思い出すための棚 |
| 表現 | 「日々の月棚」 | 「ルナの引き出し」 |
| データ | `lunaria_diary_logs`（日付固定） | `lunaria_core_memory`（流動的） |

### 6.2 `/memory` ヘッダーコピー候補

3 案：

**A. シンプル系**
```
ルナの引き出し
ルナがずっと覚えていることの棚。
古くなったら外してもいい。
```

**B. 詩的系**
```
日々の月棚は、その日の影。
ルナの引き出しは、ずっと持っている光。
```

**C. 機能寄り系**
```
記憶の棚
ルナが覚えていること、削除や修正もできる場所。
```

→ **僕の推奨：A**。シンプルで、編集権を最初に提示している

### 6.3 セクション内の説明文

`/memory` の Toolbar の上などに小さく：

```
ルナはあなたとの会話から、ちょっとずつ覚えていくよ。
「もう違う」「これは大事」って言ってくれたら、ちゃんと直す。
```

### 6.4 `/diary` 内の `memory_changes` セクション

`/diary` の memory_changes セクション見出しは現在「ルナが覚えたいこと」。これは**この日の候補**を意味するなら正しい。

ただし `action: 'saved'` のカードもこのセクションに混じる可能性 → 「覚えたいこと」だと saved の意味と合わない。

推奨見出し変更：「**ルナが拾ったかけら**」（その日抽出された記憶候補）。これなら candidate / saved 両方に整合する

その下に小さく：
```
ここから、ずっと残るかは別の話。
ルナの引き出しで、続きを見られるよ。
```

→ `/memory` への自然な誘導

---

## 7. 実装ステップ案（D4a〜D4d）

### D4a：`/memory` ページの read-only 版

工数：1 日

- `app/memory/page.tsx` 新規
- `app/api/memory/route.ts` 新規（GET 全件 / GET ?date=...）
- カード一覧表示
- フィルター（全部 / この月 / 日付指定）
- archived は表示しない（読み取りのみ）
- 削除・訂正・確認 UI はまだ無し

### D4b：confirm + archive アクション

工数：1 日

- `app/api/memory/[id]/route.ts` 新規（PATCH for status / last_confirmed_at）
- カードに「︙」メニュー追加
- 「これ、覚えてて」/「棚から外す」のフロー実装
- archive 確認モーダル
- 「外したもの」セクション（折りたたみ）+ restore ボタン

### D4c：訂正（content edit）

工数：1 日

- `app/api/memory/[id]/route.ts` の PATCH 拡張（content / confidence）
- inline edit UI
- 訂正時に confidence を `MIN(現値, 0.5)` に降格するロジック

### D4d：`/diary` との連動

工数：半日

- `/memory` カード → `/diary?date=...` リンク
- `/diary` の `memory_changes` セクション見出し変更（「ルナが拾ったかけら」）
- `/diary` から `/memory` への補足リンク文

→ **合計 3.5 日**で D4 完了。ガチャ DB 安定化の後、F（プロンプト v9）の合間で進められる規模

---

## 8. v3 候補（D4 完了後の延長）

設計しておくが MVP には入れない：

| # | 機能 | 価値 |
|---|---|---|
| 1 | 検索（content 部分一致） | 大量記憶になった時必須 |
| 2 | ソート切替（new / important / oldest） | 探索性 |
| 3 | LLM による訂正提案（古くなった記憶の検出） | 自動メンテ |
| 4 | bulk archive（複数選択） | 大掃除用 |
| 5 | 記憶のマージ（重複検出） | 整頓 |
| 6 | provenance link（source_message_id → 該当 message へ） | "なぜ覚えたか" の遡及 |
| 7 | confidence の手動調整 | パワーユーザー向け |
| 8 | export（JSON ダウンロード） | データポータビリティ |

---

## 9. 議論したい論点

1. **「ルナの引き出し」「日々の月棚」の語感**：「引き出し」は閉じてる感。「棚」より閉鎖的に聞こえる？「ルナの抽斗（ひきだし）」など別表現候補
2. **削除の論理 vs 物理**：MVP は status='archived' のみ（復元可能）にするか、`status='deleted'` も選べるようにするか
3. **memory ID をユーザーに見せるか**：`/memory#${id}` でアンカー機能を作るなら id 露出が必要。URL 上にだけなら OK か
4. **confidence の数値非表示判断**：`confidence < 0.4` を「ぼんやり」とラベル表示すると「私の言ったこと、ルナはあやふやに覚えてる」と気付いて気まずい可能性。**全 confidence 値を表示せず、ただし confirmed のみ ★ 表示**が最もシンプルかも
5. **`/memory` route と `/api/memory` 命名**：既存の API 群（`/api/diary`, `/api/gacha/*`）と整合してる。OK
6. **migration 018 適用タイミング**：014/015/016/017 に揃えて bundle 適用するか、D4a 着手直前に単独適用するか。bundle 推奨

---

## 10. ⚠️ 要確認事項（DB 未適用の推測）

以下は 018 適用後に**実機で確認すべき**項目：

- [ ] `lunaria_core_memory` の RLS policy が新カラムに自動適用されるか（既存 `auth.uid() = user_id` でカバーされるはず）
- [ ] `source_message_id` の FK `on delete set null` が想定通り動くか（メッセージ削除時に記憶は残り、リンクのみ切れる）
- [ ] `created_by = 'profile_sync'` が現状の `setProfile` ルートで自動設定されるか（018 では default 'llm' なので、profile_sync ロジックを別途実装する必要あり）
- [ ] 既存 row の backfill が想定通り（status='active', created_by='llm'）
- [ ] `memory.ts` の `pickMemories` / `getCoreMemoryContext` が status='active' のみフィルタしているか（要 read：未確認）

最後の点は重要：D4 で archive した記憶が、LLM プロンプト注入には残ったままだと「ユーザーは消したのに、ルナは話題に出す」事故が起きる

---

## 11. 関連ドキュメント

- `LUNARIA_DIARY_MEMORY_DESIGN.md` §4.3 / §10 / §11 D4
- `LUNARIA_DIARY_MEMORY_REVIEW.md` §1.2 / §5.3
- `DIARY_V1_IMPLEMENTATION_REVIEW.md` §6（018 schema 確認）
- `DIARY_UI_REVIEW_2026-05-04.md`（diary UI の現状）
- `018_core_memory_provenance.sql`（実装済み schema）
- `lib/lunaria/memory.ts`（save/read 経路、要 D4b 拡張）

---

## 12. まとめ

D4 の最小 MVP は **3.5 日工数**で完成可能。

要点：
- `/memory` で全 active 記憶をカード表示、日付フィルター可能
- 各カードで confirm（★）/ 訂正（inline）/ archive（softdelete）の 3 アクション
- 数値（confidence）は非表示、状態（status）は意味的にのみ表示
- 「ルナの引き出し」コピーで日記との役割分化を明示
- `/diary` との相互リンクで往来コスト最小化

これにより、Lunaria の「ユーザーが記憶ガバナンスを持つ」哲学が実装レベルで成立する。
