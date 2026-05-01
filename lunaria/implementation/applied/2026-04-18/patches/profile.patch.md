# patch: `lib/lunaria/profile.ts`

## 目的

- **EAV 前提**の `buildProfileSummary(userId)` を新設：`lunaria_user_profile` から行単位で属性を取得し、プロンプト注入用 1 行サマリを返す
- **`resyncSupersededFlag` は廃止**（v1 から削除）。supersede フラグはそもそも追加しない設計になった
- pending / confirm / archive フローは既存テーブル（`lunaria_pending_profile_updates` / `lunaria_profile_archive`）に合わせる

v1 版は wide columns 前提＋supersede RPC 連動だったが、Phase A で実スキーマが EAV かつ既存 pending/archive テーブルが揃っていることが判明したため全面書き直し。

---

## 1. Profile サマリ組み立て

### 型

```ts
export type ProfileSummary = {
  text: string   // プロンプト注入用の 1 行（空文字なら注入スキップ）
}
```

v1 の `keywords: Set<string>` は削除。core_memory 側の除外は `memory_category != 'profile'` で済むようになり、substring 比較は不要。

### 取得関数

```ts
type ProfileRow = { field: string; value: string; source: string }

async function getProfileRows(userId: string): Promise<ProfileRow[]> {
  const { data, error } = await db
    .from('lunaria_user_profile')
    .select('field, value, source')
    .eq('user_id', userId)
    .eq('source', 'setting')    // 設定由来のみ採用。推定値は別ソースで入れる運用
  if (error) {
    console.error('[profile] getProfileRows failed', error)
    return []
  }
  return (data ?? []) as ProfileRow[]
}
```

### サマリ生成

```ts
export async function buildProfileSummary(userId: string): Promise<ProfileSummary> {
  const rows = await getProfileRows(userId)
  if (rows.length === 0) return { text: '' }

  const m = new Map<string, string>()
  for (const r of rows) m.set(r.field, r.value)

  // 表示優先順（age_band → gender → occupation → lifestyle_pattern）
  const parts: string[] = []
  const order: Array<{ field: string; transform?: (v: string) => string }> = [
    { field: 'age_band' },
    { field: 'gender' },
    { field: 'occupation' },
    { field: 'lifestyle_pattern' },
  ]
  for (const { field, transform } of order) {
    const v = m.get(field)
    if (v && v.trim().length > 0) {
      parts.push(transform ? transform(v) : v)
    }
  }

  const lunariaNickname = m.get('lunaria_nickname') || 'ルナ'
  if (parts.length === 0) return { text: '' }

  const text = `【相手について】${parts.join('・')}。ルナのことは「${lunariaNickname}」と呼ぶ。`
  return { text: truncate(text, 80) }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}
```

### 動作確認

dev user の実データ（gender=男性 / occupation=ITエンジニア・SES / name=悠平）では以下が出る想定：

```
【相手について】男性・ITエンジニア・SES。ルナのことは「ルナ」と呼ぶ。
```

- age_band / lifestyle_pattern は未登録なので出ない
- name は本文に入れない（一人称呼称に使うなら別層で扱う）

---

## 2. Pending / Confirm / Archive フロー（既存テーブル版）

### 概要

矛盾検出時：`lunaria_pending_profile_updates` に INSERT。
ユーザー確認で確定：`lunaria_user_profile` を UPDATE、`lunaria_profile_archive` に old/new を INSERT、pending 行を DELETE。
却下：pending 行を DELETE。

### API 追加

```ts
export type PendingUpdate = {
  id: string
  field: string
  detected_value: string
  trigger_message: string
  created_at: string
}

/** 会話中 or 抽出で属性変化を検知したら呼ぶ */
export async function enqueuePending(
  userId: string,
  field: string,
  detectedValue: string,
  triggerMessage: string,
): Promise<void> {
  // 同 field の既存 pending があれば上書き（最新の detected_value を残す）
  await db
    .from('lunaria_pending_profile_updates')
    .delete()
    .eq('user_id', userId)
    .eq('field', field)

  const { error } = await db
    .from('lunaria_pending_profile_updates')
    .insert({
      user_id: userId,
      field,
      detected_value: detectedValue,
      trigger_message: triggerMessage,
    })
  if (error) console.error('[profile] enqueuePending failed', error)
}

/** 確認キューを 1 件取得（次ターンで「〜でいい？」と聞く用） */
export async function peekPending(userId: string): Promise<PendingUpdate | null> {
  const { data, error } = await db
    .from('lunaria_pending_profile_updates')
    .select('id, field, detected_value, trigger_message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[profile] peekPending failed', error)
    return null
  }
  return (data as PendingUpdate | null) ?? null
}

/** ユーザーが「うん」と言ったら：profile を更新、archive に old/new、pending を消す */
export async function confirmPending(userId: string, pendingId: string): Promise<void> {
  const { data: p, error: e1 } = await db
    .from('lunaria_pending_profile_updates')
    .select('field, detected_value')
    .eq('id', pendingId)
    .eq('user_id', userId)
    .single()
  if (e1 || !p) {
    console.error('[profile] confirmPending: pending not found', e1)
    return
  }

  // 旧値を取る（無ければ空文字）
  const { data: oldRow } = await db
    .from('lunaria_user_profile')
    .select('value')
    .eq('user_id', userId)
    .eq('field', p.field)
    .maybeSingle()
  const oldValue = (oldRow?.value as string | undefined) ?? ''

  // user_profile を upsert（存在すれば UPDATE、なければ INSERT）
  if (oldRow) {
    await db
      .from('lunaria_user_profile')
      .update({ value: p.detected_value, source: 'setting', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('field', p.field)
  } else {
    await db
      .from('lunaria_user_profile')
      .insert({
        user_id: userId,
        field: p.field,
        value: p.detected_value,
        source: 'setting',
      })
  }

  // archive に old/new を積む（new field のときも空文字 old として残す）
  await db
    .from('lunaria_profile_archive')
    .insert({
      user_id: userId,
      field: p.field,
      old_value: oldValue,
      new_value: p.detected_value,
    })

  // pending を消す
  await db
    .from('lunaria_pending_profile_updates')
    .delete()
    .eq('id', pendingId)
}

/** ユーザーが否定したら pending を消すだけ */
export async function rejectPending(userId: string, pendingId: string): Promise<void> {
  await db
    .from('lunaria_pending_profile_updates')
    .delete()
    .eq('id', pendingId)
    .eq('user_id', userId)
}
```

### 真実権限

- Profile 優先（SPEC.md §「矛盾時の真実権限」準拠）
- 矛盾検出は `enqueuePending` に集約。DB レベルの supersede フラグは持たない
- archive は参照専用（プロンプト注入しない・トラブル時の調査用）

---

## 3. 既存コードとの結線

- 既存 `getActiveProfile` 相当があれば残すが、`buildProfileSummary` とは独立
- `confirmPending` は **他から `resyncSupersededFlag` を呼ばない**（v1 から変更）
- 抽出バッチ（`extract.ts`）からは `enqueuePending` のみ呼ぶ

---

## 4. 動作確認

| 観点 | 期待 |
|---|---|
| Profile サマリ取得 | dev user で「男性・ITエンジニア・SES」を含む 1 行が返る |
| 空 profile | `text === ''` で返る（注入ロジック側でスキップ） |
| pending 積み | `enqueuePending('occupation', 'フリーランス', '俺フリーになったわ')` 後、`peekPending` で 1 件返る |
| confirm | `confirmPending` 実行後：`user_profile.occupation` が更新・archive に old/new・pending 0 件 |
| reject | pending 0 件、profile/archive 不変 |

---

## 5. 注意

- `source='setting'` で絞っているため、推定由来の行（source='inferred' 等）は現状サマリに出ない。運用で推定値を使いたくなったら source 条件を見直す
- `updated_at` はトリガで自動更新される想定。トリガが無い環境では上記コードのように明示的に入れる
- `lunaria_pending_profile_updates` には `status` 列がない。pending かどうかは「そこに存在するか」で判定する（DELETE で解消）
