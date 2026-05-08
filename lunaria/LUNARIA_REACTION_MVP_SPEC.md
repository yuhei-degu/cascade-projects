# Lunaria Reaction MVP Spec

作成: 2026-05-09

位置付け: `lunaria-app/docs/` に残っていた表情・モーション・ビジュアルメモから、いま実装に使える要素だけを抽出した正本仕様。

参照:
- `lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md`
- `lunaria/DOC_TRIAGE_2026-05-09.md`
- `lunaria-app/docs/LUNARIA_VISUAL_GUIDE.md`（未コミット保留資料）
- `lunaria-app/docs/CHARACTER_EXPRESSIONS.md`（未コミット保留資料）
- `lunaria-app/docs/CHARACTER_MOTIONS.md`（未コミット保留資料）

---

## 1. 結論

Lunaria の初期キャラ表現は、`expression + motion` を直接実装せず、まず **reaction** として束ねる。

理由:

- 表情とモーションを最初から分けると組み合わせ爆発が起きる。
- 今の最重要価値は「ルナがそこにいる感じ」を軽く出すこと。
- `reaction` は後から `expression + motion` に分解できる。
- Chat / Diary / Memory / Gacha すべてで同じ reaction ID を使える。

初期実装の型イメージ:

```ts
type LunariaReactionId =
  | 'normal_idle'
  | 'gentle_idle'
  | 'smile_nod'
  | 'small_wave'
  | 'teasing_tilt'
  | 'serious_forward'
  | 'thinking_pose'
  | 'sad_lookdown'
  | 'surprised_react'
  | 'presenting_item'
```

---

## 2. MVP Reaction 10 種

| reaction | 役割 | expression相当 | motion相当 | 優先度 |
|---|---|---|---|---|
| `normal_idle` | 通常待機、聞いている | `normal` | `idle` | P0 |
| `gentle_idle` | 穏やかに受け止める | `gentle_smile` | `idle` | P0 |
| `smile_nod` | 軽い肯定、うなずき | `smile` / `gentle_smile` | `nod` | P0 |
| `small_wave` | 起動、終了、またね | `smile` / `gentle_smile` | `small_wave` | P1 |
| `teasing_tilt` | 軽口、ツッコミ、共犯者感 | `teasing` | `tilt_head` | P0 |
| `serious_forward` | 深刻な相談、逃げない返答 | `serious` | `lean_forward` | P0 |
| `thinking_pose` | 返答前の思考、判断保留 | `thinking` | `tilt_head` / `look_away` | P1 |
| `sad_lookdown` | 辛さへの寄り添い | `sad` | `close_eyes` / `nod` | P1 |
| `surprised_react` | 高レア、想定外、驚き | `surprised` | `idle` | P1 |
| `presenting_item` | ガチャ結果、日記完成、記憶候補提示 | `gentle_smile` / `smile` | custom pose | P0 |

P0 は最初のコード定義と fallback に必ず入れる。
P1 は画像素材がなくても、`normal_idle` または `gentle_idle` に fallback できる。

---

## 3. 用途別デフォルト

| 場面 | default reaction |
|---|---|
| ホーム待機 | `normal_idle` |
| 通常チャット | `normal_idle` |
| 軽い肯定・受容 | `gentle_idle` |
| ポジティブ雑談 | `smile_nod` |
| 軽口・ツッコミ | `teasing_tilt` |
| 真面目モード | `serious_forward` |
| 返答生成中 | `thinking_pose` |
| ユーザーが辛そう | `sad_lookdown` |
| ガチャ common / rare | `presenting_item` |
| ガチャ epic 以上 | `surprised_react` |
| 日記生成完了 | `presenting_item` |
| 記憶候補提示 | `presenting_item` |
| 深夜帯の待機 | `gentle_idle`（将来 `sleepy_idle` 検討） |

---

## 4. Fallback ルール

画像素材・衣装・アクセサリーが増えると、すべての組み合わせを作るのは破綻する。
そのため、最初から fallback を仕様に含める。

入力:

```ts
{
  outfitId: string;
  reaction: LunariaReactionId;
}
```

探索順:

```text
1. outfit + requested reaction
2. outfit + outfit default reaction
3. default outfit + requested reaction
4. default outfit + normal_idle
```

例:

```text
outfit = moon_cafe
reaction = teasing_tilt

1. public/lunaria/portrait/moon_cafe/teasing_tilt.png
2. public/lunaria/portrait/moon_cafe/normal_idle.png
3. public/lunaria/portrait/default/teasing_tilt.png
4. public/lunaria/portrait/default/normal_idle.png
```

実装では `supportedReactions` を outfit ごとに持てるようにする。

---

## 5. アセット命名

MVP の推奨パス:

```text
public/lunaria/portrait/{outfit_id}/{reaction}.png
```

例:

```text
public/lunaria/portrait/default/normal_idle.png
public/lunaria/portrait/default/gentle_idle.png
public/lunaria/portrait/default/presenting_item.png
```

衣装が増えた場合:

```text
public/lunaria/portrait/moon_cafe/normal_idle.png
public/lunaria/portrait/moon_cafe/presenting_item.png
```

ファイル命名の禁止:

- `image1.png`
- `smile-new-final.png`
- `luna_かわいい.png`
- `SSR_result.png`

名前は UI の演出用途ではなく、システムが参照できる ID に合わせる。

---

## 6. Visual Guardrails

採用する方向:

- 紫からラベンダー寄りの髪。
- 月モチーフは髪飾り、襟元、背景などに控えめに使う。
- 表情は小〜中の振れ幅。
- 静かで、夜・月明かり・部屋の近さを感じる。
- 親密だが押し付けない。

避ける方向:

- 過度なフリル、ゴスロリ、メイド風。
- 水着や露出を標準衣装にする。
- 目が大きすぎる強いデフォルメ。
- 猫耳・しっぽなどの属性詰め込み。
- 服全面の月柄や過度な発光。
- 暴力・流血・死を連想させる演出。

今回の画像基準から採用するもの:

- 紫髪。
- 三日月アクセサリー。
- 柔らかい部屋の光。
- 近い距離感。
- 穏やかで少し神秘的な目線。

調整するもの:

- アプリ標準では露出を控えめにする。
- デフォルト衣装は白〜淡藍のワンピース + 薄手カーディガン寄り。

---

## 7. 実装順序

### Step 1: 定数だけ追加

ファイル候補:

```text
lunaria-app/lib/lunaria/reactions.ts
```

中身:

- `LUNARIA_REACTIONS`
- `DEFAULT_REACTION`
- `REACTION_FALLBACKS`
- `getReactionFallbacks(reaction)`
- `getReactionForContext(context)`

この段階では UI 表示を変えない。

### Step 2: UI 側の placeholder

ファイル候補:

```text
lunaria-app/components/lunaria/LunariaPortrait.tsx
```

または既存構造に合わせる。

この段階では画像がなくても壊れないようにする。

### Step 3: ガチャ・日記・記憶候補だけ reaction を使う

最初に使う場所:

- `/gacha` 結果モーダル
- `/diary` 生成完了
- `/memory` 記憶候補提示

チャット本文の LLM JSON 化は後回し。

### Step 4: Chat response に reaction を入れる

LLM に直接 `reaction` を返させるのは最後。

先に rule-based で十分:

```text
serious route -> serious_forward
gacha high rarity -> surprised_react
memory candidate -> presenting_item
default -> normal_idle
```

---

## 8. 将来の expression/motion 分解

`reaction` は固定の終着点ではない。
後で Live2D や細かい動きが必要になったら、以下へ分解する。

```ts
type AssistantVisualState = {
  reaction?: LunariaReactionId;
  expression?: string;
  motion?: string;
  voice_tone?: string;
}
```

ただし、MVP では `reaction` を優先する。

分解タイミング:

- 立ち絵素材が 10 reaction 以上揃った。
- UI 側に portrait component がある。
- ガチャ・日記・記憶候補で reaction の運用ログが取れた。
- `reaction` だけでは表現が足りない具体例が出た。

---

## 9. NG 実装

- Chat LLM の返答形式をいきなり全面 JSON 化する。
- 表情とモーションを最初から自由組み合わせにする。
- 衣装ごとに全 reaction 素材を必須にする。
- ガチャ高レアすべてで過剰な `excited` 演出にする。
- 深刻な相談で笑顔・軽口系 reaction を出す。
- キャラの見た目をユーザーごとに根本変更する。

---

## 10. 次の Codex タスク

次に実装するなら、以下だけに絞る。

```text
Lunaria reaction MVP の定数ファイルを追加して。

対象:
- lunaria/LUNARIA_REACTION_MVP_SPEC.md

やること:
1. `lunaria-app/lib/lunaria/reactions.ts` を追加
2. reaction ID 10 種を union / readonly list として定義
3. default / fallback / context mapping を定義
4. 既存 UI や API の挙動はまだ変えない
5. build が通ることを確認

注意:
- Chat response JSON 化はまだしない
- 画像ファイルは追加しない
- DB migration は作らない
```
