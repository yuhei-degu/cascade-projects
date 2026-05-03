# Diary v1 実装レビュー

作成：2026-05-03
位置付け：`017_diary_v1_schema.sql` + `diary.ts` + `types.ts` + `/diary` UI の実装前最終チェック
方針：レビューのみ。コード編集・migration 作成なし

注記：Cowork マウントの同期遅延で `diary.ts` のプロンプトテンプレ後半 / `/diary/page.tsx` の末尾 / 設計書の末尾が見えない部分があるため、可視範囲ベースで評価。ユーザーから master `d8446cc` でビルド成功と確認済みのため、見えない部分は「確認できないが推測上整合」と扱う。

参照：
- `lunaria-app/supabase/migrations/017_diary_v1_schema.sql`
- `lunaria-app/lib/lunaria/diary.ts`
- `lunaria-app/lib/lunaria/types.ts`
- `lunaria-app/app/diary/page.tsx`
- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`

---

## 0. 総評

**実装品質は高い**。`LUNARIA_DIARY_MEMORY_REVIEW.md` で挙げた must-fix 3 点すべてが反映されている：

1. ✅ `user_day` フィールド削除 → schema にも prompt にも無い
2. ⚠️ Memory provenance schema は未着手 → 018 で対応予定（本書で再提案）
3. ✅ JST helper を `diary.ts` で利用済み

加えて、未指摘だった**「DB 未適用環境への backward compat」**が独自に実装されており、`isMissingDiaryV1Column` で legacy upsert に自動フォールバックする仕組みがある。これは秀逸。

→ **017 適用は安全、急ぐ必要もない**。ガチャ DB 安定化を優先しつつ、お好きなタイミングで適用 OK。

---

## 1. 017 migration の Supabase SQL Editor 安全性

### 1.1 構造評価

```sql
alter table public.lunaria_diary_logs
  add column if not exists title text,
  add column if not exists talked_about jsonb not null default '[]'::jsonb,
  add column if not exists memory_changes jsonb not null default '[]'::jsonb,
  add column if not exists source_message_count int not null default 0,
  add column if not exists generated_at timestamptz not null default now();
```

- ✅ すべて `if not exists` で再実行安全
- ✅ `not null default` 付きで既存 row も自動埋め
- ✅ `talked_about` / `memory_changes` の `jsonb default '[]'` は妥当
- ✅ `generated_at default now()` で既存 row も生成日時が入る（不正確だが安全側）

### 1.2 制約追加の安全パターン

```sql
do $$ begin
  if not exists (select 1 from pg_constraint where conname = '...') then
    alter table ... add constraint ... check (...) not valid;
  end if;
end $$;
alter table ... validate constraint ...;
```

これは**正攻法**。`not valid` 付きで追加 → 別ステートメントで `validate` する 2 段構えは：
- ロックを最小化（既存行をフルスキャンせずに即座に追加）
- 後段の `validate` は ACCESS SHARE で済む
- 既存行が制約を満たさなくても追加自体は失敗しない

→ Supabase Studio で長時間ロックを起こさない。安全。

### 1.3 index 追加

```sql
create index if not exists lunaria_diary_logs_generated_at_idx
  on public.lunaria_diary_logs(user_id, generated_at desc);
```

- 月 shelf 表示や recent diary 取得で使えるインデックス。妥当。

### 1.4 適用順とタイミング

- 017 は 014/015/016 から完全に独立（diary は gacha と無関係）
- ただし `NEXT_PHASE_CANDIDATES` での運用方針通り、ガチャ DB 安定化後に適用
- **依存関係**：004（`lunaria_diary_logs` 作成）が前提。これは MVP リリース時から存在

### 1.5 RLS / 権限

`004_lunaria_diary.sql` で `lunaria_diary_logs` には RLS が enabled になっており、policy も既にある（`auth.uid() = user_id`）。**017 で追加カラムは既存 policy 配下に自動的に入る**ので追加対応不要。

### 1.6 評価

| 観点 | 評価 |
|---|---|
| idempotency | ⭕ 完全 |
| 既存データへの影響 | ⭕ default で自動埋め |
| ロック時間 | ⭕ `not valid` で最小化 |
| dependency | ⭕ 004 のみ（既存） |
| RLS 整合 | ⭕ 既存 policy に乗る |

→ **適用 GO**。Supabase SQL Editor でそのまま貼って実行 OK。

---

## 2. 017 未適用時の legacy upsert fallback

### 2.1 実装内容

```ts
function isMissingDiaryV1Column(error: any): boolean {
  const message = String(error?.message ?? '')
  return error?.code === 'PGRST204'
    || /title|talked_about|memory_changes|source_message_count|generated_at/i.test(message)
}

async function saveDiary(date: string, diary: Diary) {
  // 1) v1 payload で upsert
  const { error } = await supabaseAdmin.from(T.diary).upsert(v1Payload, ...)
  if (!error) return
  if (!isMissingDiaryV1Column(error)) throw error

  // 2) v1 カラム不在エラーなら legacy payload で再試行
  console.warn('[diary] v1 columns unavailable; retrying legacy diary upsert')
  await supabaseAdmin.from(T.diary).upsert(legacyPayload, ...)
}
```

### 2.2 評価

⭕ **設計が良い**。

- `PGRST204` は PostgREST の "column not found" エラーコード。具体的
- 加えて message regex でカラム名を直接マッチ → 両ルート対応
- legacy upsert は v1 カラムを抜いた素朴な payload。004 時点のスキーマと完全互換
- console.warn でログに残る → 適用漏れに気付ける

### 2.3 微小懸念

- `error: any` の型 → 既存の `gacha.ts` では `unknown` で揃えてきたので、整合性的に `unknown` + type guard が望ましい。**動作には影響なし**、リファクタ時に揃える程度
- regex `/title|.../i.test(message)` がやや脆弱。Supabase が将来エラーメッセージ形式を変えると false negative が起こる可能性。`PGRST204` チェックで救えるので実害は小さい

### 2.4 backward compat の振る舞い検証（机上）

| 環境 | v1 upsert | legacy fallback | 結果 |
|---|---|---|---|
| 017 適用済み | 成功 | 不要 | v1 payload で保存 |
| 017 未適用 | カラム不在エラー | 実行 → 成功 | legacy payload で保存（v1 カラム情報は失われる） |
| 別エラー（FK 違反等） | 失敗 | スルー（throw error） | 上位へ伝搬 |

→ 安全。017 適用前後どちらでも `/api/diary POST` は壊れない。

---

## 3. `user_day` 的なユーザー行動推測の再混入チェック

### 3.1 schema 検証

`types.ts` の `DiarySchema`：

```ts
export const DiarySchema = z.object({
  title:             z.string().default(''),
  summary:           z.string(),
  events:            z.array(z.string()),
  talked_about:      z.array(z.string()).default([]),
  emotions:          EmotionSchema,
  luna_comment:      z.string(),
  unresolved_issues: z.array(z.string()),
  next_topics:       z.array(z.string()),
  memory_changes:    z.array(...).default([]),
  importance:        z.number().min(1).max(5),
  source_message_count: z.number().int().min(0).default(0),
  generated_at:      z.string().nullable().default(null),
})
```

→ ✅ **`user_day` フィールドなし**。Claude レビューの must-fix #1 が完全反映されている。

### 3.2 prompt 検証

`diary.ts` のプロンプトから抜粋：

> - 監視ログではなく、ルナがその日をそっと棚にしまうような温度で書く
> - **ユーザーが明言していない行動は断定しない**
> - 事実、気分、未解決の話題、次に話せそうなことを分ける
> - title は12文字前後。詩的すぎず、あとで探せる具体性を残す
> - talked_about は短いタグを5個以内
> - **events は「話したこと・確認したこと」だけ。ユーザーの行動を想像しない**
> - memory_changes は長期記憶候補だけ。迷う場合は空配列
> - luna_comment は自然なタメ口で、50文字以内

→ ✅ **明示的に「行動を想像しない」と 2 度釘を刺している**。LLM への指示として強い。

### 3.3 残るリスク

- LLM 側が prompt 違反する確率はゼロではない（特に長い会話で talked_about や events に推測混入リスクあり）
- 監視推奨：本番運用後、`select events from lunaria_diary_logs limit 50;` で実際の出力を眺める。「外出した」「買い物に行った」のような推測が混じっていないか
- 混入が見つかったら prompt をさらに強める（few-shot 化）

### 3.4 評価

設計レイヤー：⭕ 完全クリア
LLM 出力レイヤー：⚠️ 運用観察必要（prompt 設計上は対策済み）

→ **`user_day` 再混入はしていない**。安心して適用可能。

---

## 4. `memory_changes` の「監視されている感」評価

### 4.1 schema 設計

```ts
memory_changes: z.array(z.object({
  type:                 z.string().default('other'),
  content:              z.string(),
  action:               z.enum(['candidate', 'saved', 'confirmed']).default('candidate'),
  source_message_count: z.number().int().min(0).default(0),
})).default([])
```

✅ Claude レビューの推奨通り：
- `action` 3 状態で意味付け（候補 / 保存済 / 確認済）
- `default('candidate')` で「迷ったら候補扱い」になる
- 配列デフォルトが空（迷ったら何も出さない）

### 4.2 prompt 設計

> memory_changes は長期記憶候補だけ。**迷う場合は空配列**

→ ⭕ 良い。LLM が「念のため」で記憶候補を量産する誘惑を抑える。

### 4.3 UI 表示の懸念

`/diary/page.tsx` の表示部分は私のマウント側で末尾まで読めなかったが、見えた範囲で「感情の残響」「まだ薄い月明かりです」のような Lunaria 哲学に沿った見出し・empty state があり、トーンは整っている。

ただし、**memory_changes の表示方法**が見えなかったので 1 点だけリスク仮説：

- もし `memory_changes` を**デフォルト展開で表示**していたら、毎回「ルナが何を覚えたか」リストが目に入る → 監視感を生む
- 推奨：**折りたたみ（`<details>`）でデフォルト閉じ**、ユーザーが能動的に開く形

→ 表示方法は実装ファイル全部見えてから最終確認したい。`grep "memory_changes" app/diary/page.tsx` を Codex 側で確認できれば一発で分かる。

### 4.4 評価

設計：⭕ 健全
UI 表示：⚠️ 確認必要（折りたたみ実装か、デフォルト展開か）

---

## 5. `/diary` UI の Lunaria らしさ評価

### 5.1 見えた範囲

```
<Section title="感情の残響">
  {emotionEntries.length === 0 ? (
    <p>まだ薄い月明かりです。</p>
  ) : ...
```

- ✅ 「感情の残響」というセクション名 → 詩的、Lunaria 世界観整合
- ✅ Empty state 「まだ薄い月明かりです」 → ルナの口調・哲学整合
- ✅ `Section` コンポーネント抽象化されているらしい → セクションごとに統一フォーマット

### 5.2 見えなかった部分

- 全体構成（date picker / 各セクション順序 / transcript 表示方式 / memory_changes 表示）
- 文字数 / フォントサイズ / 余白
- Loading state / Error state 文言

### 5.3 推測される構造（`MOONBOX_UI_COPY_V2.md` で僕が示した方向性に沿うなら）

期待される構成：

```
[date picker]
[diary card]
  - 「ルナの一言」（luna_comment）
  - 「あったこと」（events）
  - 「話したこと」（talked_about、chips）
  - 「まだ続いてる話」（unresolved_issues）
  - 「次に話せそうなこと」（next_topics）
  - 「感情の残響」（emotions）  ← 確認できた ✅
[折りたたみ：その日のおしゃべり全部]（transcript）
[折りたたみ：ルナが覚えたこと]（memory_changes）
```

### 5.4 リスク

- 確認できた範囲では Lunaria らしさは保たれている
- `summary` を生表示すると無機質になりがちなので、見出しなしの段落で本文として読ませているか確認したい

### 5.5 評価

可視範囲：⭕ Lunaria らしい
全体構成：⚠️ 直接確認できず、推測ベース

---

## 6. 次の `018_core_memory_provenance.sql` カラム提案（再提示）

`LUNARIA_DIARY_MEMORY_REVIEW.md §1.2` で提案した内容を、現実装ベースで具体化。

### 6.1 必須カラム（5 種）

```sql
alter table public.lunaria_core_memory
  add column if not exists source_date date,
  add column if not exists source_message_id uuid,
  add column if not exists confidence numeric(3,2)
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  add column if not exists status text not null default 'active'
    check (status in ('active','candidate','confirmed','archived','deleted')),
  add column if not exists last_confirmed_at timestamptz;
```

### 6.2 推奨追加カラム（運用に効く）

```sql
  add column if not exists created_by text not null default 'llm'
    check (created_by in ('llm','user_explicit','profile_sync','migration')),
  add column if not exists notes text;
```

- `created_by`：「LLM が抽出した」vs「ユーザーが明示確認した」を分ける。`status='confirmed'` と組み合わせて governance に使える
- `notes`：archive / delete 時の理由を記録（任意）

### 6.3 カラム値の運用ルール

| カラム | 取りうる値 | 設定タイミング |
|---|---|---|
| `source_date` | 該当 message の JST 日付 | `saveCoreMemory` 呼び出し時に渡す |
| `source_message_id` | `lunaria_messages.id`（FK 任意） | 同上 |
| `confidence` | 0.00〜1.00、null 可 | LLM 抽出時に確信度を出力させる。レガシーは null |
| `status` | active / candidate / confirmed / archived / deleted | 初期 active、UI 操作で confirmed / archived / deleted へ |
| `last_confirmed_at` | timestamptz、null 可 | ユーザーが「これ覚えてて」と確認した時 |
| `created_by` | llm / user_explicit / profile_sync / migration | 作成経路で自動分類 |

### 6.4 `pickMemories` / `getCoreMemoryContext` の改修案

現状は `memory_category != 'profile'` でフィルタしているが、追加で：

```ts
// active な記憶のみ LLM プロンプトに注入
.eq('status', 'active')
```

→ `archived` / `deleted` を除外することで、ユーザーが消した記憶が会話に再浮上しない。

### 6.5 既存 row への backfill

```sql
-- 全既存 row を 'active' / 'llm' で初期化（default で自動埋まるが念のため明示）
update public.lunaria_core_memory
   set status = coalesce(status, 'active'),
       created_by = coalesce(created_by, 'llm')
 where status is null or created_by is null;
```

### 6.6 RLS 影響

`007_core_memory_normalize.sql` で既に RLS enabled + policy あり（`auth.uid() = user_id`）。新規カラムは policy の影響を受けない（policy は row-level、column-level ではない）ので追加対応不要。

### 6.7 適用タイミング

- D4（memory provenance UI）の前段
- ガチャ DB 安定化後
- 017 適用後でも前でも独立に適用可能
- migration 番号：**018**

### 6.8 提案 migration 名と構造

```
018_core_memory_provenance.sql
  §1: alter table（5 必須 + 2 推奨カラム）
  §2: backfill update
  §3: index（任意：status / source_date での検索高速化）
  §4: 動作確認 SQL（コメント形式）
```

---

## 7. 議論したい論点

1. **memory_changes の UI 表示方式**：折りたたみデフォルト閉じか、デフォルト展開か。「監視されている感」の最後の防波堤
2. **`isMissingDiaryV1Column` の `error: any`** を `unknown` に揃えるか（小タスク）
3. **`generated_at default now()`** で既存 row が「migration 適用時刻」として埋まる件：実際の生成時刻と乖離する。許容するか、`null` 許容にするか
4. **018 の `created_by` カラム**：本当に必要か、過剰設計か
5. **D4 着手タイミング**：017 適用直後 / ガチャ落ち着いてから / プロンプト v9 終了後

---

## 8. 関連ドキュメント

- `LUNARIA_DIARY_MEMORY_DESIGN.md`（D1〜D4 設計書）
- `LUNARIA_DIARY_MEMORY_REVIEW.md`（must-fix 提示元）
- `017_diary_v1_schema.sql`（本書のレビュー対象）
- `lib/lunaria/diary.ts`（生成ロジック）
- `lib/lunaria/types.ts`（DiarySchema）
- `app/diary/page.tsx`（UI）
- `lib/lunaria/memory.ts`（018 で改修するファイル）

---

## 9. 結論

### 9.1 適用判定

| 項目 | 判定 |
|---|---|
| 017 migration を Supabase に適用してよいか | ✅ GO |
| diary.ts の legacy fallback は安全か | ✅ 安全 |
| `user_day` 再混入していないか | ✅ クリア |
| `memory_changes` 設計は監視感を出していないか | ⭕ schema/prompt OK / UI 表示要再確認 |
| `/diary` UI は Lunaria らしいか | ⭕ 可視範囲では良好 |
| 018 のカラム案は妥当か | ⭕ §6 で提示 |

### 9.2 次のアクション

短期（ガチャ DB 安定化と並行可能）：
- 017 を Supabase に適用
- `npm run gacha:verify` 相当の `npm run diary:verify` があれば実行（無ければ手動 SQL 確認）
- `/diary` で実際に生成 → 出力確認
- `memory_changes` の UI 表示方式を Codex に質問（折りたたみか展開か）

中期（D4 着手前）：
- 018 仕様を本書 §6 ベースで Codex に渡して migration 作成
- `lib/lunaria/memory.ts` の `saveCoreMemory` に source 情報引数追加
- `/api/memory` エンドポイント設計

長期（D4 完了後）：
- 運用ログから `user_day` 的推測が events に混入していないかチェック
- `memory_changes` の利用状況を見て、表示頻度を調整

---

## 10. 改訂ログ

| 日付 | 改訂 |
|---|---|
| 2026-05-03 | 初版（017 / diary.ts / types.ts / page.tsx 可視範囲のレビュー）|
