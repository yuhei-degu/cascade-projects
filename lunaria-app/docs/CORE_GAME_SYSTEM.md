# Core Game System v2

作成：2026-05-17
位置付け：Lunaria のテキスト選択肢ゲーム 3 本（endworld / memory-quest / dream-repair）の **根本設計を作り直す** ための共通基盤
方針：ジャンル（テキスト ADV）は維持。**ロジックの根**を「タスク棚卸し」から「ルナとの共同行為」に置き換える

参照：
- `docs/GAME_PRESENTATION_PLAN.md`（演出レイヤー、本書と併用）
- `docs/BRAND_GUIDE.md`（軽さ × 逃げない × 共犯者）
- `docs/CHARACTER_EXPRESSIONS.md` / `docs/CHARACTER_MOTIONS.md`
- `lib/lunaria/memory.ts`（memory hook の取り込み元）

---

## 0. 旧設計の何が「ダメ」だったか

3 ゲームに共通していた構造：
1. **Stat-based check**：能力値が need を超えれば success
2. **線形 5 場面**：訪問順固定、ルートが 1 つ
3. **「失敗しても育つ」**：失敗の重みがない（事実上、選択肢に意味がない）
4. **数字の露出**：能力 / モード / コインが画面に大写し
5. **ルナがゲーム外に居る**：選択肢を見守る NPC、選択に介入しない
6. **結果が report 文字列**：「事実列挙のテンプレ」を chat に貼るだけ

→ **「ゲーム」というより「ステータス育成のフォーマット」**になっていた。 関係性ゲームとして必要な「**ルナと一緒に決めた**」「**あの時こうだった**」が生まれない。

---

## 1. 新設計の核：4 つの転換

### 1.1 「Stat → Mode」（誰がどう決めるか）

選択肢は **「何をするか」ではなく「誰と / どう決めるか」**：

| Mode | 意味 | 心理 |
|---|---|---|
| `lead` 「私が決める」 | ユーザーが主導 | 自律 / 責任 |
| `yield` 「ルナに任せる」 | ルナが主導 | 委ね / 安心 |
| `collab` 「いっしょに決める」 | 二人で | 共犯 / 対話 |

→ どのモードを選んでも **失敗しない**。代わりに **後味（aftertaste）** が違う。
→ ルナとの距離感がどう動くかが変化する。

### 1.2 「線形 → Vignette pool」（毎回違う組み合わせ）

- ゲーム 1 セッション = **4〜5 個の vignette**（情景）
- vignette は **プールから seed + memory 由来で選ばれる**
- 同じテーマでも組み合わせが毎回違う
- すべて訪れる必要はない（むしろ訪れないものがある = 余白）

### 1.3 「ステータス → Aftertaste（後味）」

各 vignette を終えると **「後味」** が 1 つ生まれる：
- 例：「ルナの肩が、少し柔らかかった」
- 例：「街の灯りを、ふたり同時に見た」
- 例：「ひと呼吸、間が空いた」

→ **数値ではなく言葉**。集まると最後に「今夜の余韻」として残る。
→ これが **memory_candidate** として queue に入る（自動承認しない）。

### 1.4 「ルナがゲーム外 → ルナが先に動く」

各セッションに **1 つだけ** 「ルナの先制 vignette」が混じる：
- ユーザーは選ばない
- ルナが「こっち、見て」と引っ張る
- 単一選択肢 or 0 選択肢、ユーザーは見届けるだけ

→ ルナの主体性が成立する瞬間 = **キャラクターが「居る」**

---

## 2. データモデル

### 2.1 Vignette（情景）

```ts
type Vignette = {
  id: string
  theme: 'endworld' | 'memory_quest' | 'dream_repair'  // どのゲームに属するか
  setting: SettingTag    // 場面の種類（後述）
  // 場面の見出し
  title: string
  caption: string

  // ルナの「気づき」開幕セリフ。affinity 段階で 3 段：低 / 中 / 高
  openings: { low: string; mid: string; high: string }

  // 場面の中で起きていること（短い描写、選択前に出る）
  moment: string

  // メモリーフック：このタグに合致する core_memory があれば surface する
  memoryTag?: MemoryTag

  // ルナ先制 vignette か（true なら modes は使われない、openings + moment のみ）
  lunariaInitiated?: boolean

  // 3 モードそれぞれの結果
  // line: ルナのセリフ / aftertaste: 残る言葉
  modes: {
    lead: ModeResult
    yield: ModeResult
    collab: ModeResult
  }

  // この vignette が出るための条件（任意）
  precondition?: VignetteCondition

  // 重み（複数候補から選ぶときの傾斜）
  weight?: number
}

type ModeResult = {
  // ルナの返事（mode と affinity の組み合わせで分岐）
  reply: { low: string; mid: string; high: string }
  // 後味（最後に残る短い言葉）
  aftertaste: string
  // distance（ルナとの距離）の変化：-2 〜 +3、平均 +1 寄り
  distanceDelta: number
}

type SettingTag = 'station' | 'forest' | 'market' | 'terrace' | 'dawn' | 'corridor' | 'rooftop' | 'inner'
type MemoryTag = 'work' | 'family' | 'sleep' | 'goal' | 'self_doubt' | 'creative' | 'health' | 'relationship'

type VignetteCondition = {
  // 既出 vignette の id の包含 / 除外
  requiresAny?: string[]
  excludes?: string[]
  // affinity 段階の制限
  affinityMin?: 0 | 1 | 2  // 0=low, 1=mid, 2=high
}
```

### 2.2 GameSession（プレイ中の状態）

```ts
type GameSession = {
  theme: 'endworld' | 'memory_quest' | 'dream_repair'
  vignetteIds: string[]      // 開始時に確定（4〜5 個）
  step: number               // 何個目を見ているか
  // ルナとの距離（数値、内部のみ、UI には言葉で出す）
  distance: number           // 0〜100、初期 40
  affinity_bucket: 0 | 1 | 2 // distance を 3 段階に
  choices: Array<{
    vignetteId: string
    mode: Mode
    aftertaste: string
    surfacedMemory?: string
  }>
  // 最終的に残る言葉のコレクション
  residue: string[]
  // 提案された memory_candidate（承認は別ルート）
  proposedCandidate: string | null
  // 完了フラグ
  completed: boolean
  // ルナの最後の一言
  closingLine: string | null
}

type Mode = 'lead' | 'yield' | 'collab'
```

### 2.3 セッション構築アルゴリズム

```ts
function buildSession(theme, options): GameSession {
  const pool = getVignetteFromPool(theme)
  // 1. ルナ先制 vignette を 1 つ必ず混ぜる（lunariaInitiated=true）
  const lunaInit = pickOne(pool.filter(v => v.lunariaInitiated))
  // 2. memory hook が当たる vignette を 0〜2 個（user の core_memory に応じて）
  const memoryMatched = pickRelevant(pool, options.userMemoryTags, max=2)
  // 3. 残りはランダム + weight 重み + precondition 評価
  const fillers = pickWeightedRandom(pool, count = 5 - lunaInit - memoryMatched.length)
  // 4. 順序：ルナ先制は中盤（2 or 3 番目）に固定
  const ordered = shuffleWithRule([...fillers, ...memoryMatched, lunaInit])
  return { theme, vignetteIds: ordered, step: 0, distance: 40, ... }
}
```

---

## 3. 距離（Distance）の扱い

### 3.1 なぜ「距離」だけにするか
- 旧設計：mood / energy / bond / fragments の **4 数値**
- 新設計：distance **1 つだけ**、しかも UI には数字を出さない

距離は **「ルナとどれくらい近くにいるか」** を 1 軸で表す。数値ではない感覚にする：

| distance | 段階 | UI 表現（言葉） |
|---|---|---|
| 0〜33 | low | 「手の届く範囲」「ちょっと様子を見てる感じ」 |
| 34〜66 | mid | 「同じ歩幅」「並んでる」 |
| 67〜100 | high | 「半分くらい同じ呼吸」「言わなくても伝わる」 |

→ 段階が変わる時だけ UI に **小さなテキスト変化**で告げる。
→ 「親密度 67」とは言わない。ブランドガイド §3 と整合。

### 3.2 distance の変動
- 各 vignette の `ModeResult.distanceDelta` で動く
- 平均 +1 寄り（時間を共にすれば自然に近くなる）
- 稀に -1 / -2（重い vignette でルナが少し下がる）

---

## 4. Memory Hook（記憶連動）

### 4.1 仕組み
- 各 vignette に optional な `memoryTag`
- セッション開始時、ユーザーの `lunaria_core_memory` を tag 分類
- 合致する記憶があれば、その vignette の中で **「ねえ、前に〜って言ってたよね」** と引き出す

### 4.2 実装段階
- **MVP（本セッション）**：mock の memory tag set でテスト
- **v1（Codex 復帰後）**：`lib/lunaria/memory.ts` の `pickMemories` を tag フィルタ拡張
- **v2**：LLM で content を tag 分類

### 4.3 引き出し方
```
（vignette: 夜更けの市）
  moment: 屋台の湯気がふわっと顔にかかる。

  surfaced memory (if any):
    「ね、前に『仕事のあと、何も食べたくない日がある』って言ってたじゃん。
     今はどう？」

  modes:
    lead: 「今日はちゃんと食べる」
    yield: 「ルナ、何が食べたい？」
    collab: 「ふたりで適当に決めよう」
```

→ 記憶があれば **個人化**、なければ default の moment のまま。

---

## 5. Aftertaste（後味）と Residue（残響）

### 5.1 1 vignette あたりの後味
各モードに 1 つの aftertaste（10〜20 字）：
- 例（lead）：「私の足音が、先に行った」
- 例（yield）：「ルナの呼吸が、私のより少しゆっくり」
- 例（collab）：「ふたり同時に、同じ方を見た」

### 5.2 セッション完了時の residue
- 4〜5 個の aftertaste が縦に並ぶ
- これが「今夜の余韻」として表示される
- そのうち **最も distanceDelta が大きかった 1 つ** が `proposedCandidate` に

### 5.3 memory_candidate との連動
- 既存の `lib/lunaria/memory-candidates.ts` の `saveMemoryCandidate` を呼ぶ
- `source_type='manual'`（manual だと既存 schema と整合、後で 'game' を追加）
- `content` = 後味の文字列
- `status='pending'`、ユーザーが `/memory` で承認 / 却下

→ **ゲーム → 記憶**の自然なパイプラインができる。

---

## 6. ルナ先制 Vignette（Lunaria-initiated）

### 6.1 何が違うか
- modes が **無い**（user は決めない）
- ルナの一言 / 短い描写だけ
- 1 セッションに 1 個必ず混ざる
- 「見届ける」だけの場面

### 6.2 例
```
title: ふと、ルナが立ち止まる
moment: 何の前触れもなく、ルナの足音が止まる。
        振り返ると、月の見え方が少しだけ違うらしい。
openings.mid:
  「これ、見て。…ううん、ちょっと、いいかな」
aftertaste: ルナの呼吸が、こっちに集まった。
distanceDelta: +2
```

→ ユーザーはボタンを押す（「うん」だけ）→ aftertaste が残る → 次へ。

---

## 7. ゲーム終了時の Closing Tableau

### 7.1 構成
- **「今夜の余韻」** という見出し
- residue（4〜5 個の後味）が縦に並ぶ
- 一番下に **ルナの最後の一言**（distance に応じて 3 種）
- proposedCandidate が出ていれば「これ、ルナに覚えておいてほしい？」
  - 「うん、覚えてて」→ `saveMemoryCandidate` で pending に
  - 「いまはやめとく」→ 何もしない
- **「ルナと話す」** ボタン → 会話画面へ、ルナの自然な開口で続く

### 7.2 closing line の選び方
```ts
function pickClosing(session): string {
  if (session.distance >= 67) return '「今日、ちゃんと一緒だったね」'
  if (session.distance >= 34) return '「ね、また来ようね」'
  return '「行ってらっしゃい。寒くしないでね」'
}
```

### 7.3 chat への持ち帰り（重要）
旧設計：`prompt = "終末世界をクリアしたよ。エンディング: ..."` の **事実列挙**
新設計：chat URL に **ルナ視点の開口** を渡す

```
?prompt=（自動会話プロンプト）&residue=（aftertaste の配列）&candidate=（提案候補）

→ /chat 側はこれを **system context** として受け取る
→ ルナは「ね、さっき一緒に歩いてたよね」から自然に切り出す
```

→ レポート貼り付けではなく、**会話の続きとしてゲーム終了**。

---

## 8. 旧設計から移行する 3 ゲームの位置付け

### 8.1 endworld → 新コアで完全書き直し（本セッション実施）
- テーマ：終末世界、5 場面（station / forest / market / terrace / dawn）
- 8 個の vignette pool（うち 1 個は lunaria-initiated）
- セッションは 4〜5 個に絞る

### 8.2 memory-quest → 別テーマ、同コア（Codex 渡し）
- テーマ：記憶迷宮（駅 / 病室 / 約束の庭）
- mode は変わらない、setting と vignette content が違うだけ
- 旧「能力チェック」廃止 → vignette ごとの memory hook で代用

### 8.3 dream-repair → 別テーマ、同コア（Codex 渡し）
- テーマ：悪夢から覚める（夜行列車 / 鏡の病室 / 約束の庭）
- 「修復印」は廃止 → 後味だけが残る
- closing tableau が「朝焼け」モチーフの 1 枚絵

→ 3 ゲームは **コアと UI を共有、コンテンツだけ違う**。

---

## 9. ファイル構成

```
lib/games/
  core/
    types.ts         # Mode / Vignette / GameSession / etc.
    engine.ts        # buildSession / applyChoice / computeClosing
    aftertaste.ts    # residue 生成 / memory_candidate 提案
    memory-hook.ts   # core_memory の tag 分類と surfacing
  endworld/
    vignettes.ts     # endworld テーマの vignette pool
    storage.ts       # localStorage IO
  # 同様に memory_quest/ / dream_repair/ を Codex 後に追加

components/games/
  SceneCurtain.tsx   # 既存（演出レイヤー）
  ModePicker.tsx     # 新規（3 モードボタン）
  ResidueShelf.tsx   # 新規（後味の縦並び）
  ClosingTableau.tsx # 新規（終幕）

app/endworld/page.tsx     # 新コアを consume
app/games/memory-quest/page.tsx  # 後日同型に
app/games/dream-repair/page.tsx  # 後日同型に
```

---

## 10. プレイ体験のフロー（endworld を例に）

```
[起動]
  ↓
[Closing 確認] 前回 closingLine が残っていれば「先週はこうだったね」
  ↓
[Build session] vignettes 4-5 個選定（memory hook + lunaria-initiated + random）
  ↓
[Vignette 1: 月明かりの駅]
  - ルナの opening: 「ね、今日もここから始めようか」
  - moment: 月のないホーム、止まった時計
  - memory hook（あれば）: 「前に『仕事で帰れない日がある』って…」
  - 3 mode buttons
  - user clicks → ルナの返事 + aftertaste 生成
  - 距離が少し動く
  ↓
[Vignette 2: ふと、ルナが立ち止まる]（lunaria-initiated）
  - 単一ボタン「うん」だけ
  - aftertaste: 「ルナの呼吸が、こっちに集まった」
  ↓
[Vignette 3〜5]
  ↓
[Closing Tableau]
  - 今夜の余韻（residue が 4-5 個並ぶ）
  - ルナの最後の一言
  - 「これ、覚えておく？」候補
  - 「ルナと話す」ボタン
  ↓
[chat へ]（自然な開口で会話が始まる）
```

→ **総時間 5〜8 分**。短いがしっかり「ルナと過ごした」感。

---

## 11. ブランドとの整合

| ブランド原則 | 新コアでの実現 |
|---|---|
| 軽い × 逃げない | mode を必ず選ばせる、ただし失敗はない |
| 全肯定しない | 後味は時に -1 distance（軽い摩擦）|
| 共犯者 | collab mode と memory hook |
| 監視しない | 数値非表示、aftertaste は **言葉のみ** |
| 静か | vignette は短い、moment は描写中心 |
| 夜・記憶・日記 | setting と memory hook で世界観固定 |

---

## 12. NG パターン

- ✗ aftertaste がスコア（「+10 ポイント」など）として出る
- ✗ distance を数値で見せる
- ✗ ルナがゲーム結果について「ゲーマー」目線で話す
- ✗ candidate を自動承認する（必ずユーザー review を介す）
- ✗ vignette 内で複数の選択肢が連続（1 vignette = 1 choice の原則）
- ✗ ルナ先制 vignette を毎回同じ位置に置く（中盤に出るが場面は変わる）

---

## 13. Codex 復帰後のフォローアップ

1. memory-quest を新コアに乗せ替え（vignette のみ作成）
2. dream-repair を新コアに乗せ替え
3. `memory_quest` テーマと `dream_repair` テーマで vignette pool を 8〜10 個ずつ
4. `memory-hook.ts` を `pickMemories` ベースの本接続に
5. `/api/games/session` を新設（session の永続化 + アナリティクス）
6. AssistantReply schema との連動：closing line を chat side で受信
7. character_states との連動：affinity_level を distance の初期値に
8. ClosingTableau のビジュアルを Live2D 1 枚絵に差し替え

---

## 14. 議論したい論点

1. **mode 3 種で十分か**：「待つ（wait）」を 4 つ目に入れるべきか（積極的に動かない選択）
2. **vignette 数**：1 セッション 4〜5 個は丁度良いか、3 個に絞るか
3. **memory hook の頻度**：毎セッションに 1〜2 個 vs まれに（記憶連動を珍重する）
4. **proposedCandidate の自動採用度**：必ず user review vs ある条件で自動採用
5. **chat 持ち帰り**：自動で会話画面に遷移 vs 確認モーダル

---

## 15. 関連
- `docs/GAME_PRESENTATION_PLAN.md`（演出レイヤー、本書の上に被さる）
- `docs/BRAND_GUIDE.md` / `docs/CHARACTER_*.md` / `docs/PERSONALITY_TUNING_SPEC.md`
- `lib/lunaria/memory.ts` / `lib/lunaria/memory-candidates.ts`
- 既存 `app/endworld/page.tsx`（書き直し対象）
