# `/diary` UI レビュー

作成：2026-05-04
位置付け：`CLAUDE_HANDOFF_TASKS_2026-05-04.md` Task 1 の出力
方針：レビューのみ。コード編集なし

参照：
- `lunaria-app/app/diary/page.tsx`（406 行、Cowork マウントの読み込み末尾は `{show` で切れているが本体ロジックの 95% は可視）
- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`
- `lunaria/LUNARIA_DIARY_MEMORY_REVIEW.md`
- `lunaria/DIARY_V1_IMPLEMENTATION_REVIEW.md`

---

## 0. 総評

**Lunaria らしさは強く出ている**。「日々の月棚」「ルナがそっとしまっておく」「空き棚」「淡い月明かり」など、設計書 §1「a shelf where Luna keeps the days」の哲学が UI 全体に翻訳されている。

`Section` コンポーネント抽象化、accent カラー指定、empty state の文言、エラー文言（「月明かりが途切れました」）など、世界観の一貫性は高い。

**ただし、構造的な認識ズレが 2 点**：

1. **`memory_changes` がデフォルト展開で表示**されている → 監視感のリスク（`LUNARIA_DIARY_MEMORY_REVIEW.md` で指摘した懸念が現実化）
2. **transcript が aside（右カラム）に配置**されている → 「その日のこと」の主従関係が不明瞭（左 summary と右 transcript のどちらが authoritative か曖昧）

加えて、Stat ブロック（「会話数」「抽出メモ」「重要度」「参照会話」）が**やや内部メトリック露出**気味で、Lunaria の温度から浮いている。

→ Must-fix 2 件 + nice-to-have 6 件。下記で詳細列挙。

---

## 1. 表示項目の AI 日記/記憶設計との整合性チェック

設計書（`LUNARIA_DIARY_MEMORY_DESIGN.md`）と実装の項目マッピング：

| 設計の Daily Diary Field | 実装の表示位置 | 整合性 |
|---|---|---|
| `title` | `diaryTitleStyle` で h2 表示 | ⭕ |
| `summary` | "[date] の日記" Section 内に段落 | ⭕ |
| `events` | 「この日にあったこと」Section | ⭕ |
| `talked_about` | 「話したこと」Section（条件表示・pills） | ⭕ |
| `emotions` | 「感情の残響」Section（meter） | ⭕ |
| `luna_comment` | "[date] の日記" Section 上部 | ⭕ |
| `unresolved_issues` | 「まだ続きそうな話」Section | ⭕ |
| `next_topics` | 「次に話せそうなこと」Section | ⭕ |
| `memory_changes` | 「ルナが覚えたいこと」Section（条件表示） | ⭕ |
| `importance` | aside 「記録の気配」内 Stat | ⚠️ 内部値が直接露出 |
| `source_message_count` | aside 「記録の気配」内 Stat（"参照会話"） | ⚠️ 同上 |
| `generated_at` | aside 「記録の気配」内 Stat（"生成時刻"） | ⚠️ 同上 |

→ **項目漏れなし**。`LUNARIA_DIARY_MEMORY_DESIGN.md` Phase D1〜D3 の差分は実装済み。

加えて、設計書には無いが実装が独自に追加したもの：
- 「今月の棚」（aside）：`/api/diary/month` を呼んで月別 shelf 表示。Phase D5 想定の前倒し。良い実装
- 「記録の気配」（aside）：内部メトリックを集約した stat box。後述（§4.1）で要修正

---

## 2. 「日記」「会話ログ」「長期記憶候補」の境界評価

### 2.1 三層の現実装位置

| 層 | 役割 | 実装の位置 | デフォルト表示 |
|---|---|---|---|
| 日記（diary） | Luna の composed recollection | main column（左大）大半 | 展開 |
| 会話ログ（transcript） | 生の chat ログ | aside「その日の会話」 | **toggle（折りたたみ）** ✅ |
| 長期記憶候補（memory_changes） | 抽出された記憶 | main column 内 Section | **デフォルト展開** ⚠️ |

### 2.2 評価

#### ⭕ 良い点

- transcript を aside の toggle に閉じている：raw log が emotional center にならない設計。`LUNARIA_DIARY_MEMORY_DESIGN.md §4.2` の「Avoid making raw logs the emotional center of the UI」と整合
- 「ルナが覚えたいこと」というセクション名：「覚えた」（完了）ではなく「覚えたい」（候補）にしてあり、`action: candidate` の精神を見出しレベルで反映している。秀逸

#### ⚠️ 懸念 1：memory_changes がデフォルト展開で目に入る

`memoryChanges.length > 0` の条件で main column に出るので、記憶候補がある日は毎回**主観面に出てくる**。

- ユーザーから見ると「ルナが覚えようとしている内容のリスト」が主体的に見える
- これは「ルナが棚にしまう」哲学から外れる。**「しまうもののリストを毎回提示する」は監視の派生形**
- 加えて、各カードに `memoryActionLabels[item.action]` で「候補 / 保存 / 確認済み」というラベルが付く → 内部状態（governance state）の表面化

#### ⚠️ 懸念 2：transcript の位置（aside vs main）

`/diary` では transcript が右側 aside に配置されている。これは：
- 視覚的には「補足情報」扱い ✅
- でも情報構造としては「**その日のこと**」の二重表現になる

ユーザーが「左の `summary` を見ても何かズレを感じた時、右の transcript で確認しに行く」というワークフローを想定するなら、**main column の最下部に置く方が自然**（"必要なら下まで掘れる" 構造）。

aside に置く理由：縦長スクロールを避けたいなら理解できる。でも diary に「その日のこと」を求めて来るユーザーにとって、aside にあると「サブ情報」と認識される。

### 2.3 「日記 vs 会話ログ vs 記憶」が誤解されないか

UI 表現の見出しから推測されるユーザーの解釈：

| 見出し | ユーザーの解釈 | 設計意図との一致 |
|---|---|---|
| "[date] の日記" | ルナが書いた日記 | ⭕ |
| 「この日にあったこと」 | 客観的な事実列挙 | ⭕ |
| 「話したこと」 | 会話の話題タグ | ⭕ |
| 「まだ続きそうな話」 | 持ち越し話題 | ⭕ |
| 「次に話せそうなこと」 | 次回の話題候補 | ⭕ |
| 「ルナが覚えたいこと」 | ルナの記憶対象 | ⭕（ただし展開がリスク、§2.2 参照）|
| 「その日の会話」 | 生の chat ログ | ⭕ |
| 「記録の気配」 | データ統計 | ⚠️ Lunaria 哲学から浮く |

→ **見出し設計レベルでは三層分離は明確**。誤解は起きにくい。
→ ただし表示優先度（折りたたみ vs 展開）と配置（main vs aside）が哲学とズレるケースが 2 件（§2.2）。

---

## 3. ルナリア文言の強さ評価

### 3.1 ⭕ ちょうど良い（保持推奨）

| 文言 | 評価 |
|---|---|
| 「日々の月棚」 | 詩的だが具体性あり |
| 「ルナがそっとしまっておく場所」 | 哲学そのまま、押しつけがない |
| 「[date] の空き棚」 | empty state で世界観を保つ |
| 「淡い月明かり」（emotion empty） | 感情なしを「淡さ」で表現、巧み |
| 「月明かりが途切れました」（error） | 機械的でなく Lunaria 流 |
| 「言葉の輪郭だけが静かに残っているみたい」（luna_comment fallback） | 強すぎず弱すぎない、見事 |
| 「日記を綴っています...」（generating） | 「綴る」が手仕事感 |

### 3.2 ⚠️ 強すぎる（重い）

| 文言 | 懸念 | 推奨修正 |
|---|---|---|
| 「ルナが覚えたいこと」セクション内の `action` ラベル<br>（「候補」「保存」「確認済み」） | 内部状態の露出。「これは候補だけど」「これは保存された」を毎回見せると governance UI 化する | ラベル表示を削除、または confirmed のみアイコン表示 |
| 「重要度」（Stat） | 1〜5 の数値露出 | dev panel に移動 or 「☾ ☾ ☾」のような 5 段階アイコン化 |
| 「参照会話」（Stat） | 「ルナが何件のメッセージから日記を作ったか」の露出 | 削除、または dev panel に移動 |
| 「生成時刻」（Stat） | regenerate するときの参考にはなるが、平時は不要 | dev panel に移動 |

### 3.3 ⚠️ 弱すぎる（薄い）

| 文言 | 懸念 | 推奨修正 |
|---|---|---|
| 「未解決の話題はありません」 | 平凡。Lunaria の温度感ない | 「今のところ、続きの話はないみたい」 |
| 「次の話題はまだ見つかっていません」 | 機械的 | 「明日が見つけてくれるかも」 |
| 「まだ出来事は並んでいません」（events empty） | やや冷たい | 「この日は、まだ言葉にしていないみたい」 |
| 「会話数」「抽出メモ」（Stat label） | 純データラベル | §3.2 と一緒に dev panel 移動 |
| 「日記」「未生成」（Stat 値） | 機械的 | 「あり / まだ」程度に柔らかく |

### 3.4 設計と乖離した文言は無いか

- 「ルナが覚えたいこと」 — 設計の `action: candidate` を反映、👍
- 「会話を開く / 閉じる」 — toggle 用ボタン、機能的、Lunaria らしさは控えめだが許容
- エラー文言 4 種すべて Lunaria 流で書かれている、👍

---

## 4. 追加すべき UI 要素

### 4.1 実装必須（Lunaria 哲学維持のため）

#### Must-A: `memory_changes` セクションをデフォルト折りたたみに

現：`memoryChanges.length > 0` で main column に展開表示
推奨：`<details>` または `useState(showMemory)` で**デフォルト閉じ**、見出しは「ルナが覚えたいこと（n 件）」のように件数バッジ

理由：§2.2 の「監視感」回避。ユーザーが能動的に開く形にする

#### Must-B: 「記録の気配」Stat の整理

現状の Stat ブロック 6 行：
- 会話数 / 抽出メモ / 重要度 / 参照会話 / 生成時刻 / 日記

このうち：
- **本体に残す**：日記（あり/未生成）→「ルナの記録」の有無として意味あり
- **dev panel に移動**：会話数 / 抽出メモ / 重要度 / 参照会話 / 生成時刻

理由：これらは内部メトリックで、Lunaria の温度を冷やす。`/diary?dev=1` のような分岐や、ヘッダーの dev トグルで出し入れ可能にする

実装手間が大きいなら：**Stat 全体をデフォルト折りたたみ**にして見出し「内部の数字を見る」程度の分離でも可

#### Must-C: transcript の配置を main column 末尾に移動（または別ページ化）

現：aside 末尾の Section
推奨：main column の最下部（diary より下、memory より下）

理由：
- 「その日のこと」の情報階層を明確化（要約 → 出来事 → 話題 → 未解決 → 次回 → 記憶 → 生の会話 の順）
- aside は「メタ情報」（month shelf / stats / emotions）専用に統一する方がメンタルモデル明快

別案：transcript を `/diary/[date]/transcript` に分離（より大胆な分離）。これは現実装の改修コスト次第

### 4.2 nice-to-have（後回し可）

| # | 提案 | 価値 |
|---|---|---|
| 1 | 月の棚で `importance` に応じた glyph 強調（重要日に ☾） | 視覚的に「特別な日」が一目で見つかる |
| 2 | 「7 日前」「30 日前」「先月の今日」ジャンプボタン | 連続スクロールしないナビゲーション |
| 3 | luna_comment を引用風スタイル（左罫線・italic）化 | ルナの声を視覚的に区別 |
| 4 | 「この日をまとめる」ボタンを「日記がない時のみ表示」に変える | UI ノイズ削減（regenerate は dev panel へ） |
| 5 | 会話 transcript の各メッセージに timestamp 表示（既に `formatTime` ヘルパーあり） | 1 日の中の流れを把握 |
| 6 | 月の棚カードの「日記あり / 会話あり / [N]件」表示の文字数を絞る | aside の縦幅を抑える |
| 7 | empty state アイコン（小さな月） | 月モチーフの視覚継続 |
| 8 | error 表示の色を `#cc8888` 等に（赤系を抑制） | 失敗時のテンションを上げない |

### 4.3 v3 候補（D4 着手後）

- memory_changes の「削除」「訂正」アクション（D4 範囲）
- memory provenance への遷移ボタン（→ `/memory/[id]`）
- 連続日付ハイライト（「3 日連続で会話している」など、ただし監視感に注意）

---

## 5. 「実装必須」と「後回し」の分離

### 5.1 必須（実装前に対応推奨、Lunaria 哲学を守るため）

1. **Must-A**：`memory_changes` セクションをデフォルト折りたたみ
2. **Must-B**：Stat ブロックを dev panel または折りたたみに分離
3. **Must-C**：transcript を main column 末尾に移動

### 5.2 後回し（運用しながら判断）

- nice-to-have の 1〜8（§4.2）
- v3 候補の memory provenance 関連（§4.3）

### 5.3 様子見（このままで良いかも）

- 「今月の棚」aside：現状で機能十分
- 各セクションの accent カラー：詩的、世界観整合
- `Section` コンポーネント抽象化：保守性高い

---

## 6. 議論したい論点

1. **Must-A の実装方式**：`<details>` HTML 要素 / `useState` + ボタン / 件数バッジで未開封を示す、どれが良いか
2. **Must-B の dev 分離**：URL パラメタ `?dev=1` / localStorage フラグ / 既存の dev パネル機能との統合、どれが既存パターンに合うか
3. **Must-C の transcript 配置**：main column 末尾 vs 別ページ `/diary/[date]/transcript`
4. **「ルナの一言」fallback** の頻度：「言葉の輪郭だけが静かに残っているみたい」が同じ日に何度も生成される場合、固定文として目立つので、複数候補をローテーションすべきか
5. **`memory_changes` の `action` ラベル**：「候補 / 保存 / 確認済み」を全削除するか、`confirmed` のみアイコン化するか

---

## 7. 関連ドキュメント

- `LUNARIA_DIARY_MEMORY_DESIGN.md`：設計書
- `LUNARIA_DIARY_MEMORY_REVIEW.md`：実装前 must-fix 提示
- `DIARY_V1_IMPLEMENTATION_REVIEW.md`：017 schema/コードレビュー
- `MEMORY_VIEWER_NEXT_PHASE_PLAN.md`：次タスク（Task 2 で生成）
- `NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md`：次タスク（Task 3 で生成）

---

## 8. まとめ

`/diary` UI は**実装品質が高く、Lunaria 世界観が UI まで一貫している**。`Section` 抽象化・accent カラー・empty state 文言など、設計書の哲学が翻訳されている。

ただし**実装前に 3 点だけ修正したい**：

1. `memory_changes` がデフォルト展開で見えるのは「監視感」のリスク → 折りたたみへ
2. Stat ブロック（重要度・参照会話・生成時刻など）は内部メトリック露出気味 → dev panel または折りたたみへ
3. transcript の配置が aside にあって主従が曖昧 → main column 末尾へ

この 3 点だけ整えれば、`/diary` は Lunaria の哲学を完全に体現する場所になる。
それ以外（nice-to-have / v3 候補）は運用ログを見ながら順次。

Codex への引き渡しは `NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md` #2（Must-A/B/C）にまとまっている。
