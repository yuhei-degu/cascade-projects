# Assistant Reply Schema

作成：2026-05-04
位置付け：AI 返答を「文字列」から「構造体」へ。2D / 音声 / 演出 / 記憶パイプラインを駆動するための共通契約

---

## 0. 目的

現在、Lunaria の AI 返答は `message: string` のみ。
これだと：
- 立ち絵の表情 / モーションを駆動できない
- 音声 TTS の声色（voice_tone）を切り替えられない
- 記憶 candidate / 日記 candidate を作るかをテキスト解析で推定するしかない
- topic_tags の構造化ができない（後段の検索 / 可視化に不利）

→ 返答を **構造体**にすることで、UI / 音声 / DB がそれぞれ自分の必要な要素だけ参照できるようにする。

---

## 1. 型定義

```ts
export type AssistantReply = {
  message: string;
  emotion?: string;
  expression?: string;
  motion?: string;
  voice_tone?: string;
  topic_tags?: string[];
  should_create_memory_candidate?: boolean;
  should_create_diary_candidate?: boolean;
};
```

### 1.1 各フィールドの意味

| フィールド | 必須 | 用途 | 値の例 |
|---|---|---|---|
| `message` | yes | ユーザーに表示する本文 | `"うん、それしんどいね…"` |
| `emotion` | no | 内面感情（解析 / 日記抽出用） | `"sad"` / `"warm"` / `"playful"` |
| `expression` | no | 立ち絵の表情 | `CHARACTER_EXPRESSIONS.md` の ID |
| `motion` | no | 立ち絵のモーション | `CHARACTER_MOTIONS.md` の ID |
| `voice_tone` | no | TTS の声色 | `"soft"` / `"firm"` / `"playful"` / `"sleepy"` |
| `topic_tags` | no | 話題タグ（diary / 検索用） | `["仕事", "睡眠"]` |
| `should_create_memory_candidate` | no | 記憶候補を作るか | `true` / `false` |
| `should_create_diary_candidate` | no | 日記候補を作るか | `true` / `false` |

### 1.2 `emotion` vs `expression` vs `voice_tone` の住み分け

- **`emotion`**：内面の感情ラベル（記憶 / 日記の解析で使う、ユーザーには見せない）
- **`expression`**：立ち絵の表情 ID（ユーザーに見える）
- **`voice_tone`**：音声の声色（ユーザーに聞こえる）

→ 三者は連動するが、別カテゴリ。`emotion="sad"` でも、ルナの選択で `expression="gentle_smile"`（強がり）になる場合もある。

---

## 2. 値の語彙

### 2.1 `emotion` 候補（解析向け）
- `warm` / `playful` / `sad` / `serious` / `calm` / `surprised` / `relieved` / `worried`
- 一旦この 8 種で開始。`extraction.ts` の解析スコープと合わせる

### 2.2 `expression` 候補
→ `CHARACTER_EXPRESSIONS.md` の 12 種ベタ参照（`normal` / `smile` / `gentle_smile` / `teasing` / `surprised` / `thinking` / `sad` / `serious` / `embarrassed` / `sleepy` / `excited` / `relieved`）

### 2.3 `motion` 候補
→ `CHARACTER_MOTIONS.md` の 10 種ベタ参照（`idle` / `tilt_head` / `nod` / `shake_head` / `look_away` / `lean_forward` / `close_eyes` / `small_wave` / `arms_crossed` / `soft_laugh`）

### 2.4 `voice_tone` 候補
- `soft`：やわらかい（共感 / 受け止め）
- `firm`：はっきり（serious 系）
- `playful`：軽口 / 茶化し
- `sleepy`：深夜時間帯 / ゆるい
- `bright`：嬉しい / excited 寄り
- `quiet`：静かに同意 / relieved 寄り

### 2.5 `topic_tags`
- 自由文字列、複数可。1 ターン 0〜5 個目安
- 既存の `extraction.ts` の `talked_about` と整合させる
- 例：`["仕事", "上司", "睡眠不足"]`

---

## 3. JSON 出力例

### 3.1 軽い雑談
```json
{
  "message": "ね、今日めずらしく早いじゃん。",
  "emotion": "playful",
  "expression": "teasing",
  "motion": "tilt_head",
  "voice_tone": "playful",
  "topic_tags": [],
  "should_create_memory_candidate": false,
  "should_create_diary_candidate": false
}
```

### 3.2 シリアスな相談
```json
{
  "message": "うん…そっか、それはしんどいね。聞かせて。",
  "emotion": "sad",
  "expression": "sad",
  "motion": "lean_forward",
  "voice_tone": "soft",
  "topic_tags": ["仕事", "上司"],
  "should_create_memory_candidate": true,
  "should_create_diary_candidate": true
}
```

### 3.3 ガチャ legendary 獲得
```json
{
  "message": "えっ……これ、すごくない？",
  "emotion": "surprised",
  "expression": "surprised",
  "motion": "idle",
  "voice_tone": "bright",
  "topic_tags": ["ガチャ"],
  "should_create_memory_candidate": false,
  "should_create_diary_candidate": false
}
```

→ **重要**：ガチャ獲得は `should_create_memory_candidate=false`。これは `core_memory` に入れない原則（`ITEM_SYSTEM_SPEC.md`）と整合。`life_events` には別途記録。

---

## 4. 既存実装への導入方針

### 4.1 段階導入

#### Stage 1：内部パススルー（破壊的変更なし）
- LLM プロンプトには「JSON で返してね」と指示し、parse する
- パース失敗時は `message: rawText` の fallback で既存挙動を維持
- 既存 `chat` route は `message` のみ返し続ける

#### Stage 2：UI が `expression` / `motion` を消費
- `<LunariaPortrait>` を `expression` / `motion` で駆動（Phase 8 で mock 実装、Codex 復帰後に AssistantReply と接続）
- chat レスポンスに `expression` / `motion` を追加（既存クライアントは無視するだけなので互換）

#### Stage 3：candidate フラグを利用
- `should_create_memory_candidate=true` で `saveMemoryCandidate` を呼ぶ
- `should_create_diary_candidate=true` を `extraction.ts` の入力にする

#### Stage 4：voice_tone を TTS に渡す
- TTS 採用時に `voice_tone` をボイスパラメタにマップ

### 4.2 LLM プロンプト改修方針

`lib/prompt.ts` / `lib/lunaria/prompt-builder.ts` のシステムプロンプト末尾に：

```
返答は以下の JSON 形式で返してください：
{
  "message": "...本文...",
  "expression": "normal | smile | gentle_smile | ...",
  "motion": "idle | nod | tilt_head | ...",
  "emotion": "warm | playful | sad | serious | ...",
  "voice_tone": "soft | firm | playful | ...",
  "topic_tags": ["..."],
  "should_create_memory_candidate": false,
  "should_create_diary_candidate": false
}
```

→ ストリーミングとの兼ね合い：JSON ストリームは難しいので、**初期段階は non-streaming** で構造化、ストリーミングは `message` だけ別出力する 2 段方式も検討。

### 4.3 zod schema

```ts
import { z } from 'zod'

export const AssistantReplySchema = z.object({
  message: z.string().min(1),
  emotion: z.string().optional(),
  expression: z.string().optional(),
  motion: z.string().optional(),
  voice_tone: z.string().optional(),
  topic_tags: z.array(z.string()).optional(),
  should_create_memory_candidate: z.boolean().optional(),
  should_create_diary_candidate: z.boolean().optional(),
})

export type AssistantReply = z.infer<typeof AssistantReplySchema>
```

→ パース失敗時の fallback：`{ message: rawText }`

---

## 5. ストリーミングとの整合

現状：Gemini ストリーミングで部分文字列を逐次返している。

提案：**ストリーム中は `message` だけ流す**、ストリーム終了後に **メタ JSON 1 行** を最後に流す。

```
data: {"chunk":"うん…"}
data: {"chunk":"そっか、"}
data: {"chunk":"それはしんどいね"}
data: {"meta":{"expression":"sad","motion":"lean_forward","topic_tags":["仕事"]}}
data: [DONE]
```

→ クライアントは meta を受け取り次第 `<LunariaPortrait>` を更新。
→ ストリーム中は表情は default（`thinking`）→ meta 受信で切り替え

---

## 6. 既存データとの整合

| 既存フィールド | 新フィールドへのマッピング |
|---|---|
| `messages.role='assistant', messages.content` | `AssistantReply.message` |
| `lunaria_diary_logs.payload.emotions` | 1 ターンの `emotion` を集約 |
| `lunaria_diary_logs.payload.talked_about` | ターンごとの `topic_tags` を集約 |
| `lunaria_memory_candidates`（019） | `should_create_memory_candidate=true` で生成 |

→ 既存 row にメタを後付けするのは無理。**今後の row のみ**新フィールドを持つ。

---

## 7. NG な値運用

- `expression` を返答ごとに毎回違う値にする（チラつき、§CHARACTER_EXPRESSIONS §4 参照）
- `should_create_memory_candidate=true` を 1 ターンで複数回出す（spam）
- `topic_tags` に長文を入れる（タグは短い名詞。文章は `message` 側）
- `voice_tone="excited"` を deep serious 文脈で出す

---

## 8. 議論したい論点

1. **ストリーミング対応**：1 段（chunked text + final meta）vs 2 段（meta 先 / text 後）vs non-streaming
2. **emotion の語彙**：8 種で開始 vs 既存 `extraction.ts` の `emotions` と完全一致
3. **`should_create_*` の責任**：LLM 側で判定 vs サーバー側で post-process（ハイブリッド推奨）
4. **fallback 失敗時のメトリクス**：JSON parse 失敗を logger に集約して観察ループへ
5. **互換性**：既存 chat API のレスポンス shape をどう拡張するか

---

## 9. 関連
- `CHARACTER_EXPRESSIONS.md` / `CHARACTER_MOTIONS.md`（語彙の定義元）
- `lib/lunaria/extraction.ts`（topic / emotion 解析）
- `lib/lunaria/memory-candidates.ts`（candidate 保存経路）
- `lib/lunaria/diary.ts`（日記 candidate 経路）
- `lib/prompt.ts` / `lib/lunaria/prompt-builder.ts`（プロンプト改修対象）
