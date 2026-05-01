# patch: `lib/lunaria/prompt-builder.ts`

## 目的

- 現行 4 層（Identity / State / Memories / Rules）を **5 層化**して Profile 層を挟む
- Profile 層は全ルートで注入（軽量）
- Memories 層は `claude_serious` のみ、最大 1 件

v1 と同じ方針だが、**Memories 層での Profile キーワード除外処理は不要**になった（DB 側で `memory_category != 'profile'` を効かせているため）。`pickMemories` のシグネチャも変わった（`profileKeywords` 引数なし）ので合わせる。

---

## 想定されている現行シグネチャ

```ts
// 現行（推測）
export function buildPrompt(ctx: {
  route: 'light_normal' | 'light_probe' | 'claude_serious'
  userId: string
  scores: ScoreState
  sessionMessages: Msg[]
  // ...
}): Promise<string>
```

---

## 変更方針

```ts
import { buildProfileSummary } from './profile'
import { pickMemories } from './memory'
import { buildStateSummary } from './state-summary'
import { LUNARIA_CORE_IDENTITY, LUNARIA_RULES } from './prompt'

export async function buildPrompt(ctx: Ctx): Promise<string> {
  const identity = LUNARIA_CORE_IDENTITY
  const state    = buildStateSummary(ctx.scores)

  // ★新設：Profile 層（全ルートで注入）
  const profile  = await buildProfileSummary(ctx.userId)

  // Memories：serious のみ 1 件
  const memories = ctx.route === 'claude_serious'
    ? await pickMemories(ctx.userId, 1)     // ← v1 の profileKeywords 引数は削除
    : []

  const rules    = LUNARIA_RULES

  return assembleLayers({
    identity,
    state,
    profile: profile.text,
    memories: memories.map(m => m.content),   // ← v1 の m.text を m.content に変更
    rules,
  })
}

// レイヤ組み立てヘルパ（既存の assemble 関数があればそれを使う）
function assembleLayers(x: {
  identity: string
  state: string
  profile: string
  memories: string[]
  rules: string
}): string {
  const sections: string[] = []
  sections.push(x.identity)
  if (x.state)   sections.push(`## 現在の状態\n${x.state}`)
  if (x.profile) sections.push(`## 相手について\n${x.profile}`)
  if (x.memories.length > 0) {
    sections.push(`## 前に話してたこと\n${x.memories.map(m => `- ${m}`).join('\n')}`)
  }
  sections.push(x.rules)
  return sections.join('\n\n')
}
```

---

## 既存コードとの統合ポイント

- `prompt.ts` から export されている `LUNARIA_CORE_IDENTITY` / `LUNARIA_RULES` を参照
- `state-summary.ts`（4/12 実装済み）の `buildStateSummary` を流用
- 既存の assemble ロジックがあれば `assembleLayers` の代わりに既存関数を呼ぶ
- **`m.text` ではなく `m.content`**。core_memory の実カラム名は `content`（Phase A で確認済み）

---

## 動作確認

| ルート | Profile 層 | Memories 層 |
|---|---|---|
| `light_normal` | 出る（profile があれば） | 出ない |
| `light_probe` | 出る | 出ない |
| `claude_serious` | 出る | 出る（1 件、`memory_category != 'profile'` に限定） |

新規ユーザー（profile 空）：Profile 層は空文字で返るのでセクションごと出ない。

---

## dev パネルへの追加表示（推奨）

```
[prompt layers]
  identity: ok
  state:    "少し疲れ気味・平日夜"
  profile:  "【相手について】男性・ITエンジニア・SES。…"
  memories: 1 件採用（serious のみ注入）
  rules:    ok
```

---

## 注意

- 「相手について」という見出しはキャラの口調と矛盾しないように控えめな語にすること。実験的には見出しを省いて一文を地の文で渡すのもアリ
- Profile の文字列は 80 字以内に収まる想定（`buildProfileSummary` 側で truncate 済み）
- `assembleLayers` は既存プロンプト構造に合わせて調整。4 層実装と同じセクション区切り記法（`##` or `---` or 空行）を踏襲する
- `pickMemories` の戻り値プロパティは `content`（`text` ではない）
