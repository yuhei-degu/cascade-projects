# patch: `lib/lunaria/extract.ts`

## 目的

- セッション終了時のバッチに「振り分けガードレール」を足す
- 候補を `profile_updates[]` と `memory_candidates[]` に分岐
- `profile_updates` は **既存 `lunaria_pending_profile_updates` に enqueue**
- `memory_candidates` は profile 相当フィールドを弾いてから core_memory に昇格

v1 と違い、supersede 再同期呼び出しは削除（supersede フラグそのものが無い）。

---

## 想定されている現行フロー（推測）

```ts
export async function extractOnSessionEnd(userId: string, msgs: Msg[]) {
  const json = await callGemini(extractionPrompt(msgs))
  const { core_memory_candidates } = parseLatestJson(json)
  for (const c of core_memory_candidates) {
    if (await meetsPromotionCriteria(c)) await saveCoreMemory(userId, c)
  }
}
```

---

## 変更方針

1. 抽出プロンプトに「役割分離」の指示を追加
2. JSON パース対象を `profile_updates` と `memory_candidates` の 2 配列に
3. profile_updates は `enqueuePending(userId, field, value, triggerMessage)` へ
4. memory_candidates は **profile 相当 field に該当するキーワードをテキストに含むものを弾く**
5. 昇格時に `memory_category` を明示的に設定（`null` or `'episode'` など、`'profile'` ではない値）

---

## 抽出プロンプト差分

```ts
const EXTRACTION_PROMPT = `
（前略）

以下の 2 配列を JSON で出力せよ。

"profile_updates": 以下のキーに対する値の変化のみ含める。
  - name              (ユーザーの呼び名。EAV: field='name')
  - gender            (自由文。EAV: field='gender'。"男性" / "女性" / "その他" など)
  - occupation        (肩書き・業種)
  - age_band          ("10代" / "20代" / "30代" / "40代" / "50代" / "60代以上")
  - user_nickname     (ユーザー本人の呼ばれ方)
  - lunaria_nickname  (ユーザーがルナリアを呼ぶ呼称)
  - lifestyle_pattern (夜勤 / リモート / 子育て中 など繰り返し言及があるもの)

  出力形式：
    { "field": <上記キー>, "value": <文字列>, "trigger_message": <該当発話1文> }

  以下は含めない：
  - 単なる一人称（「俺」「あたし」等の単独使用）
  - 推測・あいまいな表現（「〜かも」「〜っぽい」）
  - 1 回きりの冗談や比喩

"memory_candidates": 感情的重みのあるエピソード・価値観・関係性のみ含める。
  以下は含めないこと：
  - profile_updates に出したキーに該当する単純な自己紹介
  - 1 セッション限定の話題
  - 推測
  - 文脈のない固有名詞単体

出力は最後に 1 つの JSON オブジェクトのみ。
{
  "profile_updates": [...],
  "memory_candidates": [...]
}
`
```

---

## 新フロー（コード差分）

```ts
import {
  enqueuePending,
  buildProfileSummary,
} from './profile'

const ALLOWED_PROFILE_FIELDS = new Set([
  'name',
  'gender',
  'occupation',
  'age_band',
  'user_nickname',
  'lunaria_nickname',
  'lifestyle_pattern',
])

type ProfileUpdate = {
  field: string
  value: string
  trigger_message: string
}

type MemoryCandidate = {
  text: string
  type?: 'pattern' | 'goal' | 'name' | 'value'
  score?: number
}

export async function extractOnSessionEnd(userId: string, msgs: Msg[]) {
  const raw = await callGemini(EXTRACTION_PROMPT + '\n\n' + formatMsgs(msgs))
  const parsed = parseLatestJson(raw) as {
    profile_updates?: ProfileUpdate[]
    memory_candidates?: MemoryCandidate[]
  }

  // ---- 1. profile_updates を pending に積む ---------------------
  for (const u of (parsed.profile_updates ?? [])) {
    if (!isAllowedProfileField(u.field)) continue
    if (!u.value || u.value.trim().length === 0) continue
    await enqueuePending(
      userId,
      u.field,
      u.value.trim(),
      u.trigger_message ?? '',
    )
  }

  // ---- 2. memory_candidates をフィルタして昇格 ------------------
  // Profile 層との重複を避けるガードレール：属性言及っぽい候補は弾く
  const candidates = (parsed.memory_candidates ?? [])
    .filter(c => !!c?.text && c.text.trim().length > 0)
    .filter(c => !looksLikeProfileMention(c.text))

  for (const c of candidates) {
    if (await meetsPromotionCriteria(c)) {
      await saveCoreMemory(userId, {
        type: c.type ?? 'pattern',
        content: truncate(c.text, 60),
        score: c.score ?? 3,
        memory_category: null,      // ★'profile' を付けない
        memory_key: null,
      })
    }
  }
}

function isAllowedProfileField(field: string): boolean {
  return ALLOWED_PROFILE_FIELDS.has(field)
}

/**
 * 抽出テキストが「単純な属性自己紹介」に見えるかの雑判定。
 * - "ユーザーの性別:" / "職業:" などの定型文
 * - 短文かつ属性キーワード単独（「男性」「ITエンジニア」等のみで感情語なし）
 */
function looksLikeProfileMention(text: string): boolean {
  const t = text.trim()
  // 1. 定型ラベルで始まるもの
  if (/^(ユーザーの|俺の|私の|あたしの)?(名前|性別|職業|年齢|年代|呼び名)[:：]/.test(t)) {
    return true
  }
  // 2. 短文かつ属性キーワードのみ（感情表現が無い）
  if (t.length <= 20 && /^(男性|女性|ITエンジニア|SES|フリーランス|会社員|学生)$/.test(t)) {
    return true
  }
  return false
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}
```

---

## `saveCoreMemory` の想定シグネチャ

既存の `saveCoreMemory` が wide でない場合、以下の列を明示的に埋める：

```ts
await db.from('lunaria_core_memory').insert({
  user_id: userId,
  type: c.type ?? 'pattern',
  content: truncatedText,
  score: c.score ?? 3,
  hit_count: 1,
  memory_key: null,
  memory_category: null,       // profile と区別するため null or 'episode' 等
})
```

**`memory_category='profile'` は絶対に付けない**。プロンプト注入で除外される側に行ってしまう。

---

## 動作確認

- `extraction parse error` のログが出ないか（4/12 の「複数 JSON ブロックがある場合は最後のものを優先」修正との整合）
- `profile_updates` が `lunaria_pending_profile_updates` に積まれるか（Supabase で件数確認）
- `memory_candidates` のうち `looksLikeProfileMention` で弾かれたものがログに出るか（`console.debug` 推奨）
- 昇格した core_memory 行の `memory_category` が `null`（or 'episode' 等）であることを SQL で目視

---

## 注意

- 既存の JSON パーサ（`parseLatestJson`）がキー名を正確に拾えるか確認。Gemini が旧フォーマット（`core_memory_candidates` のみ）を返す過渡期があるので、**一定期間は旧キーも fallback で受ける**とよい：

  ```ts
  const memoryCandidates =
    parsed.memory_candidates
    ?? (parsed as any).core_memory_candidates
    ?? []
  ```

- `truncate` で 60 字制限にしているが、既存ロジックで切っているなら二重に切らない
- `meetsPromotionCriteria` が「同一トピックが 3 セッション以上登場」を判定する既存関数なら、引数シグネチャに合わせる
- `looksLikeProfileMention` は雑判定。誤爆（本当はエピソード）が出たらキーワードから外す。Phase F の dev パネル検証で見える化する
