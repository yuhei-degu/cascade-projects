# Lunaria Game Presentation Plan

作成：2026-05-16
位置付け：`/endworld`・`/games/memory-quest`・`/games/dream-repair` の **演出と雰囲気** を引き上げる設計
方針：ユーザー指定は「演出と雰囲気」軸。スコープは設計書 + 既存改修パッチ

参照：
- `app/endworld/page.tsx`（5 場面 linear、3 択、4 ステータス）
- `app/games/memory-quest/page.tsx`（3 章、2 択、能力チェック）
- `app/games/dream-repair/page.tsx`（3 幕、2 択、stat 不足で failure）
- `app/globals.css` L489〜L660（endworld の風景 CSS）
- `docs/CHARACTER_EXPRESSIONS.md` / `docs/CHARACTER_MOTIONS.md`（演出語彙）
- `docs/BRAND_GUIDE.md`（言葉と空気の方針）

---

## 0. 結論

3 つのゲームに共通する不満は、**雰囲気は良いのに「身体感覚」がない**こと。

具体的には：

1. **クリックすると即時に結果が出る** → 選択した「重み」が感じられない
2. **場面が瞬間切替** → 場所を歩いた感覚がない
3. **ルナがしゃべるだけ** → 場面内でルナが動かない（先に振り向く・近づく・止まる、がない）
4. **ステータスの動きが見えにくい** → 数字が静かに増えるだけ
5. **音と無音の差がない** → 全部「同じ静けさ」で、特別な瞬間がない

→ 「絵」と「文字」は揃っているが、**時間軸の演出**が足りない。

本書はこれを **最小の演出パッチ**で埋めるための設計。コードを書き直すのではなく、**遷移とタメを足す**だけで体感は変わる。

---

## 1. 演出 10 レバー（共通インフラとして引き上げる）

| # | レバー | 効果 | 工数 |
|---|---|---|---|
| 1 | Scene Prelude（場面導入カード） | 場所が変わる「節目」を作る | 小 |
| 2 | Choice Suspense（選択 → 結果に間） | 選択の重みを作る | 小 |
| 3 | Scene Curtain（場面遷移フェード） | 歩いた感覚を作る | 小 |
| 4 | Lunaria Whisper（補助セリフ） | ルナがその場にいる気配 | 小 |
| 5 | Stat Tick（数値の遅延カウントアップ） | 変化が「起きた」と見える | 小 |
| 6 | Ambient Particle（場面ごとの粒子） | 場所固有の空気 | 中 |
| 7 | Subtle Parallax（背景レイヤー差動） | 奥行きと呼吸 | 中 |
| 8 | Ambient Audio（場面ごとの環境音） | 五感の追加（オプション） | 中〜大 |
| 9 | Beat-paced Reveal（一文ずつ出す） | 詩性と緊張 | 中 |
| 10 | Endgame Tableau（終幕の静止画） | 余韻と「持ち帰り」感 | 中 |

→ MVP は **#1〜#5**。これだけで体感は明確に変わる。
→ #6〜#10 は順次。Codex 復帰後にまとめて。

---

## 2. レバーごとの仕様

### 2.1 Scene Prelude（場面導入カード）

#### 何が起きる
- 場所が変わる瞬間、画面に **小さなカード** が 1.8 秒だけ現れる
- 表示：「場所名 / キャプション / 月相アイコン」
- 同時に背景は **fade-in**（黒に近い透明から実景へ）

#### 実装
- 場面切替直後、`prelude = true` のステートで 1.8 秒キープ
- 1.8 秒後 `prelude = false`、本来の UI が現れる
- 共通：`<ScenePrelude title={name} caption={caption} icon="moon" />`
- アニメ：opacity 0 → 1 → 0、translateY 8px → 0

#### 心理的効果
- 「歩いて着いた」と感じる
- 場所名がリッチに刻まれる（ジャンプ感の解消）

#### 適用先
- endworld：5 場面切替時すべて
- memory-quest：3 章切替時
- dream-repair：3 幕切替時

---

### 2.2 Choice Suspense（選択 → 結果の間）

#### 何が起きる
- 選択ボタンを押す
- ボタンが押された後、**結果の line が出るまでに 600〜900ms の余白**
- その間、ルナリアの「ためらい / 視線が動く / うなずく」の補助セリフが現れる
- 例：「（ルナの視線が、少し動いた）」
- 余白終了後、結果 line + stat 変動が同時に到達

#### 実装
- click → `pending` フェーズに移行
- 600ms 後に `revealed` フェーズへ
- 結果カードに `transition: opacity 400ms`
- 補助セリフは pending の 600ms 内に小さく出す

#### 心理的効果
- 選択肢の重みが増す（即時 = 軽く見える）
- ルナが「考えている時間」がある = 一緒にいる感
- 連打されにくくなる

#### 適用先
- 3 ゲーム全部

---

### 2.3 Scene Curtain（場面遷移フェード）

#### 何が起きる
- 結果 reveal の後、**1.2 秒のカーテン** が画面に下りる
- カーテン中央に小さな月相アイコン + 「次の場所」のテキスト
- カーテンが上がると、新場面が現れる

#### 実装
- 共通：`<SceneCurtain show={transitioning} message="..." />`
- 背景が `fixed inset-0 z-50` でフェードオーバー
- 完全黒ではなく、`rgba(8,10,16,0.92)` で月光を残す

#### 心理的効果
- 場所が「変わる」が儀式化される
- 連続クリックの誤入力ガード

#### 適用先
- endworld：場面切替時
- memory-quest：章切替時
- dream-repair：幕切替時

---

### 2.4 Lunaria Whisper（補助セリフ）

#### 何が起きる
- 選択肢が現れる前 / pending 中 / 場面切替直後、**ルナの短いセリフ** が現れる
- 例（pending 中）：「（一回、息を吸う）」
- 例（場面到着）：「ここ、好きかも」
- 主要 line とは別レイヤー、薄い色 + italic で「補助」と分かる

#### 実装
- `<LunariaWhisper text="..." variant="ambient" />`
- 文字数 6〜18 字程度、句読点少なめ
- 800ms かけて fade-in、3 秒キープ、消えない（次が来たら上書き）

#### 心理的効果
- ルナが「画面の外から話してる」のではなく「**そばにいる**」感
- 沈黙が痛くならない（無音のままだと作品が止まって見える）

#### 適用先
- 3 ゲーム全部

#### 文言の語彙（共通プール）
```
ambient（場面到着時）：
  「ここ、初めて？」 / 「夜の匂いだね」 / 「いつもより、月が近い」
  「ちょっと、立ち止まろうか」 / 「呼吸、合わせてくれる？」

pending（選択 → 結果の間）：
  「（少しだけ目を細めた）」 / 「（息を吸って、また吐いた）」
  「（ううん、と小さく頷いた）」 / 「（ふ、と笑った）」

choice-hover（任意）：
  「それでもいいかも」 / 「ふーん」 / 「いい目してる」
```

---

### 2.5 Stat Tick（数値の遅延カウントアップ）

#### 何が起きる
- ステータス変動時、数字が **300ms かけて段階的に変わる**
- 例：mood 52 → 60 が `52 → 54 → 56 → 58 → 60` と動く
- 同時にバーがフィルアニメ
- 数値変化中、軽い「+8」のフローティングテキスト

#### 実装
- 各 stat に `displayValue` を別 state で持つ
- 真の `value` 変動時、`requestAnimationFrame` でなめらかに追従
- 既存 `<Meter>` を `<AnimatedMeter>` に差し替え

#### 心理的効果
- 数値が「動いた」と認識できる
- ガジェットゲーム感

---

### 2.6 Ambient Particle（場面ごとの粒子）

#### 何が起きる
- 場面ごとに **薄い粒子** が舞う
- 駅：埃が静かに浮かぶ
- 森：光のしずく
- 市場：温かい湯気
- テラス：星屑
- 朝焼け：花びら

#### 実装
- CSS `radial-gradient` を擬似粒子として複数 layer + `@keyframes drift`
- もしくは canvas で 30 粒子程度

#### 工数：中（CSS で軽く対応 → MVP）

---

### 2.7 Subtle Parallax（背景レイヤー差動）

#### 何が起きる
- マウス移動 / 画面スクロール時、奥背景と手前背景が **微差で動く**
- 奥（月・空）：移動量 5px
- 中（建物）：移動量 12px
- 手前（ルナ立ち絵）：移動量 20px

#### 実装
- `transform: translateX(var(--parallax-x))` で `mousemove` listener
- 微差 = 視差効果、奥行き感

---

### 2.8 Ambient Audio（場面ごとの環境音）

#### 何が起きる
- 場面に応じた **環境音 BGM**（静かなアンビエント）
- ボタン操作で **クリック音**
- 結果 reveal で **ベル音**

#### 実装
- `<audio>` 要素 + `playsInline` + 自動再生は user gesture 後
- ミュートトグル必須（デフォルト OFF）
- 素材：30 秒のループ × 5 場面

#### 工数：中〜大（素材調達）

---

### 2.9 Beat-paced Reveal（一文ずつ出す）

#### 何が起きる
- 結果テキストや prelude キャプションを **一文ずつ** 流す
- 例：「列車の音が少し静かになった。」→ 700ms → 「『今なら、聞こえる』とルナリアが小さく頷く。」

#### 実装
- 改行 or 句点でテキストを分割、`setTimeout` で順次表示
- 既に表示されたテキストは透明度を下げる

#### 心理的効果
- 詩性 / 緊張感
- 読み飛ばし防止

---

### 2.10 Endgame Tableau（終幕の静止画）

#### 何が起きる
- エンディングに到達すると、**専用の絵柄カード** が現れる
- カードには：エンディング名 + 一行 + 立ち絵 + 月相
- 「ルナリアに報告する」ボタンが出る前に **3 秒の余韻**

#### 実装
- ending 確定後、`<EndingTableau ending={state.ending}>` を全画面に
- 内部はカード型 + 拡大演出（scale 0.96 → 1）

---

## 3. 共通インフラ：`components/games/`

新規ファイル：

```
components/games/
  SceneCurtain.tsx        ← #3 と #1（prelude）兼用、フェード幕
  ScenePrelude.tsx        ← #1、場面導入カード
  LunariaWhisper.tsx      ← #4、補助セリフ
  AnimatedMeter.tsx       ← #5、stat tick
  AmbientParticles.tsx    ← #6、粒子レイヤー（v2 で）
  useChoiceSuspense.ts    ← #2、フックで pending/revealed/transitioning を管理
```

→ MVP として、まず **SceneCurtain.tsx** を 1 本作り、これで #1 + #3 を兼用する。

---

## 4. 状態機械（3 ゲーム共通）

すべての場面ベースゲームに以下のフェーズを導入：

```
[prelude]      ← 場面到着直後 1.8s（Scene Prelude 表示）
  ↓
[idle]         ← ユーザー入力待ち（選択肢表示）
  ↓ click
[pending]      ← 700ms（Whisper 表示、結果は隠し）
  ↓
[revealed]     ← 800ms（結果 line 表示、stat tick 進行）
  ↓ wait 800ms
[transitioning] ← 1.2s（SceneCurtain フェード、新場面の prelude へ）
  ↓
[prelude]      ← 次の場面の prelude
```

→ 1 クリックあたり合計 **約 3 秒**の体験。連打を避け、リズムを作る。

---

## 5. ゲームごとの具体パッチ

### 5.1 endworld（最優先・本セッションで実施）

#### 適用するレバー
- ✅ #1 Scene Prelude
- ✅ #2 Choice Suspense
- ✅ #3 Scene Curtain
- ✅ #4 Lunaria Whisper
- ⏳ #5〜#10 は次フェーズ

#### 既存コードへの差分（要点）
- `WeekendState` に `phase: 'prelude' | 'idle' | 'pending' | 'revealed' | 'transitioning'` を追加
- `choose` を「即時更新」ではなく **段階更新** に書き直し
- `<SceneCurtain show={...}>` を main 内に重ねる
- choices 表示を `phase === 'idle'` に gate

#### 期待効果
- 場面切替で「歩いた感」
- 選択 → 結果の間に呼吸
- ルナの whisper で 1 人ぼっち感の解消
- 5 場面 linear のままでも体感は別物

---

### 5.2 memory-quest（次フェーズ、Codex 渡し）

#### 適用するレバー
- #1 Scene Prelude（章ごと）
- #2 Choice Suspense（success / failure の見せ方を整える）
- #4 Lunaria Whisper

#### 既存コードへの差分（要点）
- `chapterIndex` 変化時に prelude を 1.8s 挟む
- success / failure 判定後、即「結果 line」を出さず、**0.7s の沈黙 + Whisper** を挟む
- 能力値 visualisation を「数字 + メーター + 言葉」3 段で再構成
  - 例：「memory 18」だけでなく「（あなたの記憶は、まだ柔らかい）」を併記

#### 別途検討：能力チェックの可視化
- 現状：能力 >= need で success、足りなければ failure
- 改善：need の手前 80% / 100% / 120% で **微差の結果**（部分的に成功 / 揺らぐ成功）
- これは仕様変更なので Codex 復帰後の判断

---

### 5.3 dream-repair（次フェーズ、Codex 渡し）

#### 適用するレバー
- #1 Scene Prelude（幕ごと）
- #2 Choice Suspense
- #4 Lunaria Whisper
- #10 Endgame Tableau（夢から覚める演出）

#### 既存コードへの差分（要点）
- `sceneIndex` 変化時に prelude
- 「修復印」獲得時、画面端に小さなパーティクル
- 完了時：朝焼けカード（1 枚絵的）+ 「現実に持ち帰る言葉」を中央に大書

---

## 6. シナリオ多様化（v2、本書のスコープ外だが記録）

演出だけでは「**毎回同じものを見る**」感が残る。リプレイ性のために以下を v2 で：

| 案 | 説明 | 工数 |
|---|---|---|
| 場所順をシャッフル | 5 場所 / 3 章 の訪問順をランダム化 | 小 |
| 「来訪済み」フラグ | 2 周目以降は別文言 / 別選択肢 | 中 |
| ルナの先制発話 | 場面 1 つだけは「ルナが先に動く」 | 中 |
| 持ち越し relic | 前回拾った relic が今回会話に出る | 中 |
| 親密度連動 | 高 affinity 時のみ表示される選択肢 | 中 |
| 季節分岐 | 日付に応じて空・粒子・lineが変わる | 中〜大 |

→ これらは **キャラクター人格 + life_events + character_states** と組み合わせると効く。本書のレバー実装後、Codex 復帰後の v2 で。

---

## 7. 会話の質との接続（補足）

ユーザーは「演出と雰囲気」を主に選んだが、会話品質も以下が効くと予想：

- ゲーム完了時の `report.prompt` を **長文 dump ではなく、ルナが自分で持ち帰る出だし** に
  - 現状：`「終末世界をクリアしたよ。エンディング: ...」`（事実列挙）
  - 改善：`「ね、ちょっと帰ってきたよ。…月の駅で、私の手を引いてくれてたの覚えてる？」`（ルナ視点で会話を開く）

これは `app/endworld/page.tsx` の `buildReport` を 1 関数差し替えで対応可能。本書のスコープ外だが、`docs/CODEX_HANDOFF.md` の Task に追加する。

---

## 8. 優先順位とロードマップ

### 本セッション（Claude Code）
1. ✅ 本設計書を書く
2. ✅ `components/games/SceneCurtain.tsx` を新規追加
3. ✅ endworld に #1 + #2 + #3 + #4 をパッチ（高インパクト・既存コード破壊なし）
4. ✅ memory-quest / dream-repair は **prelude のみ軽量適用**
5. ✅ tsc で検証

### Codex 復帰後（Phase 1）
6. memory-quest / dream-repair に #2（Choice Suspense）+ #5（Stat Tick）
7. `<AmbientParticles>` 実装、場面ごとの粒子
8. Endgame Tableau の本実装
9. `buildReport` 文体改善（事実 → ルナ視点）

### Codex 復帰後（Phase 2）
10. Ambient Audio（素材調達）
11. Parallax
12. シナリオシャッフル / 来訪済みフラグ
13. character_states / life_events との連動

---

## 9. NG 演出運用

- ✗ 全場面に同じ粒子 / 同じ BGM → 場所の差が消える
- ✗ 効果音をクリック / 結果 / 切替の全部に乗せる → 騒がしい
- ✗ ルナの whisper を 1 秒に 1 回出す → 喋りすぎ、ノイズ化
- ✗ ステータス変化に派手なパーティクル → ゲーム感が出すぎる（Lunaria は雰囲気優先）
- ✗ 終末世界が「楽しい」演出に振れる → ブランドの「夜・静か・共犯者」と矛盾

---

## 10. 議論したい論点

1. **総プレイ時間**：1 場面 3 秒 × 5 = 15 秒では短すぎ？1 場面ごとに `lean_forward` / `close_eyes` のような余韻を入れて 25〜30 秒に
2. **音の扱い**：MVP は無音で良いか、最初から軽く乗せるか
3. **能力チェックの見せ方**（memory-quest）：数字を見せる vs 言葉だけ（「まだ柔らかい / もう少し / ちょうど良い / 強い」）
4. **失敗の意味**：現状は「失敗しても育つ」。これは優しすぎる？1 場面くらいは「失敗するとルナがしばらく無言」のような重みを作るか
5. **エンディング演出**：5 種が文字だけで終わるのを 1 枚絵 + ルナの最後の 1 行に強化するか

---

## 11. 関連ドキュメント
- `docs/CHARACTER_EXPRESSIONS.md`（表情語彙、whisper と組み合わせ）
- `docs/CHARACTER_MOTIONS.md`（モーション語彙）
- `docs/BRAND_GUIDE.md`（言葉と空気の境界）
- `docs/UI_COLOR_PALETTE.md`（演出の色基準）
- `docs/ASSISTANT_REPLY_SCHEMA.md`（将来：チャットの expression / motion 連動）
- `docs/CODEX_HANDOFF.md`（本書の Phase 1 / Phase 2 を Task として追記予定）

---

## 12. まとめ

3 ゲームすべてに共通する不満は「**雰囲気は良いが時間軸の演出が薄い**」。

直す方法は単純で、**遷移とタメと whisper を足す**だけで体感は変わる。本書の MVP（#1〜#4）は約半日工数。残り（#5〜#10）は Codex 復帰後に段階導入。

シナリオの多様化（リプレイ性）は別軸の課題で、演出が整ってから v2 で。

→ 「絵」と「文字」と「動き」の三角が揃って初めて、ルナリアと **遊んでいる**感が出る。
