# 次の実装キュー 2026-05-04

作成：2026-05-04
位置付け：`CLAUDE_HANDOFF_TASKS_2026-05-04.md` Task 3 の出力。Codex に渡す実装候補を 5〜8 件に絞り込み
方針：完成に近づけるための実装に集中。**Vercel 本番公開は無料枠制約のため強く推さず後回し**

> 2026-05-09 note:
> This is a historical queue from 2026-05-04. Some items have already been completed or superseded.
> Use root `TASKS.md`, `PROGRESS.md`, and `HANDOFF.md` as the current AI_DEV_OS source of truth.

参照：
- `lunaria/DIARY_UI_REVIEW_2026-05-04.md`（Task 1 の出力）
- `lunaria/MEMORY_VIEWER_NEXT_PHASE_PLAN.md`（Task 2 の出力）
- `lunaria/POST_CODEX_STATUS_REVIEW.md`
- `lunaria/NEXT_PHASE_CANDIDATES.md`

優先順序：ガチャ → 日記 → 記憶 → チャット の順で見る。

---

## 0. 結論：8 件のキュー

| # | タスク | 価値 | リスク | 工数 | 分類 |
|---|---|---|---|---|---|
| 1 | Supabase に 014→015→016→017→018 を適用 | 最大ブロッカー解消 | 中 | 1 日 | ユーザー + Codex |
| 2 | `/diary` UI Must-A/B/C 修正 | 監視感の払拭 | 小 | 半日 | Codex |
| 3 | `memory.ts` `pickMemories` を `status='active'` フィルタ化 | D4 のデータ汚染防止 | 小 | 1 時間 | Codex |
| 4 | D4a：`/memory` ページ read-only 版 | ユーザーの記憶ガバナンス権の確立 | 中 | 1 日 | Codex |
| 5 | D4b：confirm + archive アクション | 記憶 governance MVP 完結 | 中 | 1 日 | Codex |
| 6 | `health.ts` の pool 判定 25 → 41 に更新 | health endpoint 信頼性 | 極小 | 30 分 | Codex |
| 7 | `PITY_THRESHOLD` を `lib/lunaria/constants.ts` に括り出し | ハードコード重複の解消 | 極小 | 1 時間 | Codex |
| 8 | プロンプト v9（v8 restructure 後の drift 改善） | 会話本軸の品質向上 | 中〜大 | 2〜3 日 | Claude → Codex |

**合計工数（v9 除く）**：約 4 日
**v9 含む合計**：約 6〜7 日

---

## 1. タスク詳細

### 1.1 #1：Supabase に 014→015→016→017→018 を順次適用

**ユーザー価値**：
- ガチャ・日記・記憶のすべてが**実 DB と整合**する状態になる
- `gacha:verify` / `supabase:verify` の FAIL がすべて解消
- `/admin/gacha` の Moon Fullness が動く
- 「ルナが拾ったかけら」が実 DB に保存される

**リスク**：中
- migration 5 本連続適用：途中で止まると半端な状態
- 既存 row への影響は default で吸収されるが、要観察
- backward compat で「適用前後どちらでもアプリは壊れない」保証はあるが、運用上は完了させたい

**編集対象ファイル**：なし（Supabase Studio での SQL 実行のみ）

**推定工数**：1 日（適用 + 検証 + ロールバック確認）

**分類**：ユーザー（Supabase Studio 操作）+ Codex（適用後の `npm run supabase:verify` / `gacha:verify` / `gacha:smoke` 実行）

**前提**：
- `SUPABASE_014_018_APPLY_RUNBOOK.md` の手順通り
- 順序：014 → 015 → 016 → 017 → 018
- 各段で確認 SQL を流す

**完了条件**：
- `npm run supabase:verify` PASS
- `npm run gacha:verify` PASS
- `/diary` で diary 生成 → v1 payload で保存される
- `/api/gacha/state` で `pity: { progress, threshold: 200, triggered }` が返る

---

### 1.2 #2：`/diary` UI Must-A/B/C 修正

**ユーザー価値**：
- 「監視されてる感」を減らし、Lunaria 哲学を UI レベルで完成させる
- `DIARY_UI_REVIEW_2026-05-04.md` で指摘した 3 点を反映

**リスク**：小（既存セクションの表示制御調整）

**編集対象ファイル**：
- `app/diary/page.tsx`

**作業内容**（Must-A / Must-B / Must-C）：
- **A**：`memory_changes` セクションをデフォルト折りたたみ
  - `useState(false)` で `showMemory` を持つ
  - 見出しを「ルナが拾ったかけら（{n} 件）」とし、件数バッジ付き
  - クリックで展開
- **B**：「記録の気配」Stat ブロックを折りたたみ or dev panel 化
  - 案 A（簡単）：Section 全体を `<details>` でデフォルト閉じ、見出し「内部の数字を見る」
  - 案 B（推奨）：URL `?dev=1` で表示分岐、それ以外では非表示
- **C**：transcript（「その日の会話」Section）を main column の最下部に移動
  - aside から main column の `memory_changes` の下へ
  - aside は month shelf / emotions / records 統計のみに整理

**推定工数**：半日

**分類**：Codex（仕様明確、機械的修正）

**完了条件**：
- `/diary` を開いた時、memory_changes は閉じている
- 「内部の数字を見る」が折りたたみで存在する（or `?dev=1` で表示）
- transcript が main column 下部にある
- tsc 通過、build 成功

---

### 1.3 #3：`memory.ts` `pickMemories` を `status='active'` フィルタ化

**ユーザー価値**：
- D4 で archive した記憶が LLM プロンプトに混入する事故を防ぐ
- 「ユーザーが消したのに、ルナが話題に出す」を構造的に防止

**リスク**：小（フィルタ条件 1 行追加のみ）

**編集対象ファイル**：
- `lib/lunaria/memory.ts`

**作業内容**：
```ts
// pickMemories と getCoreMemoryContext のクエリに追加：
.in('status', ['active', 'confirmed'])
// または
.not('status', 'in', '(archived,deleted)')
```

**注意点**：
- 018 適用後でないと `status` カラムが存在しない → 適用前は backward compat fallback で skip するロジックが必要、または #1 完了後に着手
- 既存 row は default 'active' なので、フィルタ追加で挙動が変わるのは archived 化したあと
- v3 の Memory delete UI 実装前に入れておかないと、記憶削除しても LLM に出てきて事故る

**推定工数**：1 時間（読み込み 2 箇所修正 + テスト）

**分類**：Codex

**前提**：#1（018 適用）完了

**完了条件**：
- `pickMemories` / `getCoreMemoryContext` で status filter が効く
- archived な記憶が `claude_serious` プロンプトに注入されない
- tsc 通過、`npm run gacha:smoke` 影響なし

---

### 1.4 #4：D4a：`/memory` ページ read-only 版

**ユーザー価値**：
- ユーザーが「ルナが何を覚えているか」を見られる
- 設計書 §10 「ownership, not capture」の最初の歩

**リスク**：中（新規ページ + 新規 API）

**編集対象ファイル**（新規）：
- `app/memory/page.tsx`
- `app/api/memory/route.ts`（GET 全件 + ?date=フィルタ）

**作業内容**：
- `MEMORY_VIEWER_NEXT_PHASE_PLAN.md` §2〜§3 のレイアウト・カード設計
- カード表示（content / type / source_date / confidence 言語化 / created_by アイコン / status 表示）
- フィルター：全部 / この月 / 日付指定
- 削除・訂正・確認はまだ無し（read-only）
- archived はこの段階では非表示

**推定工数**：1 日

**分類**：Codex

**前提**：#1（018 適用）完了 + #3（status フィルタ）完了

**完了条件**：
- `/memory` で全 active 記憶がカード表示
- 日付フィルターで `?date=YYYY-MM-DD` 動作
- カード上の source_date クリック → `/diary?date=...` 遷移
- ヘッダーから `/diary` へ往来可能

---

### 1.5 #5：D4b：confirm + archive アクション

**ユーザー価値**：
- 記憶のガバナンスを完結（覚えてて / 棚から外す）
- 「これは違うかも」訂正は #4d で別タスク化

**リスク**：中（status 変更の DB 操作 + UI フロー）

**編集対象ファイル**：
- `app/memory/page.tsx`（拡張）
- `app/api/memory/[id]/route.ts`（新規、PATCH for status / last_confirmed_at）
- `lib/lunaria/memory.ts`（confirm/archive ヘルパー追加可）

**作業内容**：
- `MEMORY_VIEWER_NEXT_PHASE_PLAN.md` §4.2 / §4.4 のフロー実装
- カードの「︙」メニュー → confirm / archive
- archive 確認モーダル
- 「外したもの」セクション（折りたたみ）+ restore ボタン
- トースト：「ちゃんと覚えとくね」「外したよ。話してくれたことは、それでも残ってる」

**推定工数**：1 日

**分類**：Codex（仕様明確）

**前提**：#4 完了

**完了条件**：
- confirm で `status='confirmed'` + `last_confirmed_at=now()`
- archive で `status='archived'`、フェードアウト
- restore で `status='active'`
- 確認モーダルが Lunaria らしい文言

---

### 1.6 #6：`health.ts` の pool 判定 25 → 41 に更新

**ユーザー価値**：
- v2 適用後の本来の pool 件数（41）で health 判定
- `>= 25` のままだと 014 未適用でも health=ok になり misleading

**リスク**：極小（数字 1 箇所変更）

**編集対象ファイル**：
- `lib/lunaria/health.ts` L132（`total >= 25` → `>= 41`）

**作業内容**：
```ts
checks.gacha_pool = total >= 41
  ? { ok: true, total, by_rarity: ..., latency_ms: ... }
  : { ok: false, error: 'gacha_pool_too_small', ... }
```

**推定工数**：30 分（修正 + smoke test）

**分類**：Codex

**前提**：#1（014 適用）完了
- 014 未適用環境で health 走らせると `gacha_pool_too_small` になるので、適用後に変更するのが順序的に安全

**完了条件**：
- `/api/health` で pool が 41 件あれば ok
- 41 未満なら `gacha_pool_too_small` で degraded

---

### 1.7 #7：`PITY_THRESHOLD` を `constants.ts` に括り出し

**ユーザー価値**：
- 閾値変更時に複数箇所を編集する必要がなくなる
- 将来 100 / 300 に変更したい時の影響範囲を最小化

**リスク**：極小（重複定義の解消）

**編集対象ファイル**（新規 + 編集）：
- `lib/lunaria/constants.ts`（新規）：`export const PITY_THRESHOLD = 200`
- `lib/lunaria/gacha.ts`：import に変更
- `lib/lunaria/gacha-stats.ts`：import に変更
- `lib/lunaria/health.ts`：必要なら import

**作業内容**：
- `constants.ts` 新規作成
- 既存 2 箇所のハードコード `const PITY_THRESHOLD = 200` を削除
- import 追加

**推定工数**：1 時間

**分類**：Codex

**前提**：なし（独立に進められる）

**完了条件**：
- tsc 通過
- `grep -rn "PITY_THRESHOLD = 200"` で `constants.ts` のみがヒット
- gacha.ts / gacha-stats.ts は import 経由で参照

---

### 1.8 #8：プロンプト v9（v8 restructure 後の drift 改善）

**ユーザー価値**：
- Lunaria の本軸（会話キャラ）の品質向上
- v8 restructure 以降の運用で観察された character drift を集めて改善

**リスク**：中〜大（プロンプト変更は副作用が読みにくい）

**編集対象ファイル**：
- `lib/prompt.ts`（v8 restructure 同等の慎重さ要）
- 必要に応じて `lib/lunaria/prompt-builder.ts`、`gacha-reaction.ts` の prompt 部分

**作業内容**（候補）：
- `buildReactionPrompt` の「やった、エピック！」例示を改修（`GACHA_REACTION_REVIEW.md §6` で指摘済）
- 時間帯同期（朝・夜でプロンプト微調整）
- アイテム名のプレースホルダー機能（リアクションテンプレで `{item}` を使う）
- v8 restructure 後の運用ログから drift パターン集める

**推定工数**：2〜3 日

**分類**：Claude（人格監修・哲学判断）→ Codex（実装）

**前提**：v8 restructure 後の運用ログがある程度溜まっていること

**完了条件**：
- 既存の v8 keep-list 文言が後退していない
- 新しく drift していたパターンが解消
- ローカル smoke で character ブレなし

→ **これは「実装」よりも「観察 + 設計」が主**。Codex 単独では難しい。Claude が drift 観察→設計→Codex に渡す流れ。**今すぐ着手するより、#1〜#5 の後**。

---

## 2. 着手順序の推奨

### 短期（1〜2 日）：DB 整合化フェーズ

1. **#1（Supabase 適用）** — すべての前提
2. **#6（health pool 判定 41 化）** — 1 完了直後
3. **#3（memory pickMemories status filter）** — D4 着手前に必須
4. **#7（PITY_THRESHOLD 定数化）** — 並列で進められる小タスク

### 中期（2〜3 日）：UI / D4 フェーズ

5. **#2（/diary UI Must-A/B/C）** — 監視感の払拭、UX 完成度向上
6. **#4（/memory read-only）** — ユーザーの記憶確認権
7. **#5（confirm + archive）** — 記憶ガバナンス完結

### 長期（数日 + ログ観察）

8. **#8（プロンプト v9）** — 上記安定化後、Claude 設計待ち

---

## 3. 「ユーザー作業あり」が必要なもの

#1 のみ：

- Supabase Studio にログインして SQL Editor で migration 実行
- 014 → 015 → 016 → 017 → 018 の順序で 1 つずつ
- 各段階で `npm run supabase:verify` 確認

それ以外は **Claude / Codex で完結**。

---

## 4. キューに入れなかった候補（記録）

以下は意図的に今回の 8 件から外した：

| 候補 | 外した理由 |
|---|---|
| Vercel 本番専用 project 作成 | **無料枠制約のため強く推さず**、素材揃い・アクセス需要が出てから |
| D4c（content edit / 訂正） | inline edit の UX 検証が要る、D4b 完了後に検討 |
| D4d（/diary との連動） | MVP では `/memory` から `/diary` の片道のみで十分。双方向は v3 |
| コイン購入 MVP（候補 G） | 月箱 v2 + 天井がまだ本番未反映、運用ログを見てから |
| Live2D 統合（候補 H） | ユーザー側のアート進捗待ち |
| プロフィール EAV の `created_by='profile_sync'` 自動設定 | 018 適用後、`setProfile` 経路の改修が必要だが、急がない |
| `LUNARIA_ADMIN_STATUS_TOKEN` 本番環境変数追加 | Vercel 本番デプロイが後回しなので、合わせて後回し |
| `error: any` → `unknown` 型統一 | コード品質改善だが緊急でない |
| LLM 失敗時カウンタ | 運用観察ツールとして有用だが、現状の console.log で当面足りる |

---

## 5. 「Codex 向き / Claude 向き / ユーザー作業あり」の分類

### 5.1 Codex 向き（仕様明確、機械的実装）

#2 / #3 / #4 / #5 / #6 / #7

→ **6 件の Codex タスク**。`MEMORY_VIEWER_NEXT_PHASE_PLAN.md` と `DIARY_UI_REVIEW_2026-05-04.md` を仕様書として渡せばそのまま実装可能。

### 5.2 Claude 向き（設計判断・人格監修）

#8 のみ（プロンプト v9）

→ Claude が運用ログを観察して drift パターン抽出 → 設計を Codex に渡す流れ。

### 5.3 ユーザー作業あり

#1（Supabase Studio での SQL 実行）

→ 1 日の Supabase 操作と検証コマンド実行が必要。手順は既存 Runbook で揃っている。

---

## 6. リスク総評

### 6.1 全体リスク：中

- 最大リスクは **#1（Supabase 適用）** の操作ミス → ただし migration はすべて idempotent + backward compat 設計なので、手順守れば事故率は低い
- **#5（archive）** は status 変更が DB に書き込まれるので、ロールバック手順を明示しておく

### 6.2 タスク間依存

```
#1 ─┬─→ #6（pool 件数）
    ├─→ #3（memory status filter）─→ #4（/memory read）─→ #5（confirm/archive）
    └─→ #2（/diary UI）

#7 は独立、いつ着手しても良い
#8 は #1〜#5 の安定後
```

### 6.3 フィードバックループ

- #1 完了後、ユーザーが実機で `/gacha` / `/diary` を触って体験確認
- #4 完了後、ユーザーが `/memory` で「ルナが何覚えてる」を見て驚き / 違和感をフィードバック
- これを踏まえて Claude が #8 のプロンプト v9 に反映

---

## 7. 議論したい論点

1. **#1 の適用タイミング**：今すぐ vs 週末まとめて
2. **#2 Must-B のやり方**：折りたたみ式 vs `?dev=1` URL 分岐、どちらが既存 dev panel パターンに近いか
3. **#4 / #5 の `app/memory/[id]/route.ts` のパス命名**：既存の `/api/admin/pool-stats` パターンに合わせるか、`/api/memory/...` でフラット化するか
4. **#7 の `constants.ts`** に他に括り出すもの（`USER_ID`、`MAX_TICKETS = 50`、coin rates など）があるか
5. **#8 プロンプト v9** に着手するタイミング：#5 完了後 vs 完了から 1〜2 週間運用ログ収集後

---

## 8. 関連ドキュメント

- `DIARY_UI_REVIEW_2026-05-04.md`：#2 の仕様書
- `MEMORY_VIEWER_NEXT_PHASE_PLAN.md`：#3〜#5 の仕様書
- `SUPABASE_014_018_APPLY_RUNBOOK.md`：#1 の手順書
- `POST_CODEX_STATUS_REVIEW.md`：#6 / #7 の根拠
- `GACHA_PITY_THRESHOLD_REVIEW.md`：閾値変更時の参照
- `LUNARIA_DIARY_MEMORY_REVIEW.md`：#3 の意図
- `lib/lunaria/memory.ts`（編集対象 #3）
- `lib/lunaria/health.ts`（編集対象 #6）
- `lib/lunaria/gacha.ts` / `gacha-stats.ts`（編集対象 #7）

---

## 9. まとめ

8 件のキューで、**4 日で UI 完成度・記憶ガバナンス・運用品質をまとめて引き上げ**できる。

優先順序は：
1. **#1** で DB 整合化（最大ブロッカー解消）
2. **#6 / #3 / #7** を並行で小タスク消化
3. **#2** で UI Must-fix
4. **#4 / #5** で Memory Viewer 完成
5. **#8** はその後の長期改善

Vercel 本番公開は無料枠制約のため、本キューには含めない。素材揃いやアクセス需要が出てから別途検討する。
