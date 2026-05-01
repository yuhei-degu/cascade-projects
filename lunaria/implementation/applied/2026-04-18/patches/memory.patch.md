# patch: `lib/lunaria/memory.ts`

## 目的

- `pickMemories(userId, limit)` を新設 or 既存関数を拡張して、**`memory_category != 'profile'` のエントリだけ取る**ようにする

v1 版では supersede フラグと profile キーワード substring 除外の 2 段構えだったが、Phase A で `memory_category='profile'` マーカーが既に存在することが判明したため、**WHERE 句を 1 行足すだけ**に縮小。

---

## 1. 実スキーマに合わせた列名

Phase A 実測の通り：

| 用途 | 列名 |
|---|---|
| 本文 | `content`（v1 で想定していた `text` ではない） |
| 重要度 | `score integer DEFAULT 3`（`importance` ではない） |
| 参照時刻 | `last_seen timestamptz`（`last_used_at` ではない） |

以下のコードはこの実名に合わせている。

---

## 2. 追加するコード

```ts
export type MemoryRow = {
  id: string
  user_id: string
  type: 'pattern' | 'goal' | 'name' | 'value' | string
  content: string
  score: number | null
  hit_count: number | null
  last_seen: string | null
  created_at: string
  memory_key: string | null
  memory_category: string | null
}

/**
 * claude_serious 時に 1 件だけ注入する core_memory を選ぶ。
 * - memory_category='profile' は注入対象外（profile 層で注入済み）
 * - score 降順 → last_seen 昇順（古い=最近話してないものを優先して再掘り）
 */
export async function pickMemories(
  userId: string,
  limit: number = 1,
): Promise<MemoryRow[]> {
  const { data, error } = await db
    .from('lunaria_core_memory')
    .select('id, user_id, type, content, score, hit_count, last_seen, created_at, memory_key, memory_category')
    .eq('user_id', userId)
    .or('memory_category.is.null,memory_category.neq.profile')
    .order('score', { ascending: false, nullsFirst: false })
    .order('last_seen', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    console.error('[memory] pickMemories failed', error)
    return []
  }
  return (data ?? []) as MemoryRow[]
}
```

### `.or(...)` 句の意味

`memory_category` は NULL 許容。既存データでは `NULL` または `'profile'` の 2 値しか入っていないが、将来別値（例：`episode` / `preference`）を追加しても壊れないよう「profile 以外」で絞る。

PostgREST 構文の `.or()` は内部で `(memory_category IS NULL OR memory_category <> 'profile')` に展開される。

### 並び順の意図

- `score DESC`：重要度高いものから
- `last_seen ASC NULLS FIRST`：同 score なら最近話してない（= 古い参照）を先に。1 件しか注入しないので、毎回同じのが出ないように意図的に散らす

---

## 3. 既存 `getCoreMemories` との関係

- `getCoreMemories`（全件取得系）は dev パネル等で使い続けて OK
- プロンプト構築では必ず `pickMemories` を通す

---

## 4. 動作確認

dev パネルに以下を出して検証：

```
[memory debug]
  pickMemories(limit=1):
    id: <uuid>
    type: pattern
    memory_category: NULL
    content: "...(最初の 40 文字)..."
    score: 5, last_seen: 2026-04-12
```

チェック項目：
- `memory_category='profile'` の行が返っていないこと（Phase Bのクリーンアップ後は該当行が 0 件なので、即座には体感できないが、仮に 1 件挿入して試すとよい）
- `limit=1` で 1 件だけ返ること
- score が高いものから返ること

---

## 5. 注意

- **light_normal / light_probe では呼ばない**。SPEC.md の「claude_serious 時のみ 1 件」ルールを守る
- Supabase JS クライアントのバージョンによって `nullsFirst` オプションがサポートされない場合は、`.order('last_seen', { ascending: true })` だけで妥協可。NULLS FIRST/LAST の挙動は DB デフォルトに依存する
- `limit` 引数を 2 以上にしても動くが、プロンプト肥大の原因になるので claude_serious でも当面 1 固定で運用する
