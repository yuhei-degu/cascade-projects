# NEXT_PHASE_CANDIDATES 更新提案

作成：2026-05-03
位置付け：master 実態と `NEXT_PHASE_CANDIDATES.md` のズレを解消するための差分提案
方針：既存ファイルを直接編集せず、変更案として整理

参照：
- `lunaria/NEXT_PHASE_CANDIDATES.md`（更新対象）
- `lunaria/POST_CODEX_STATUS_REVIEW.md`
- `lunaria/PROGRESS.md`
- `lunaria/MOONBOX_V2_FINAL_REVIEW.md`
- `lunaria/GACHA_PITY_SYSTEM_DESIGN.md`
- `lunaria/SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md`

---

## 1. 古い記述の洗い出し

`NEXT_PHASE_CANDIDATES.md` で実態と乖離している箇所：

| Section | 古い記述 | 実態 |
|---|---|---|
| 完了済みリスト（行 6-13） | C / E が含まれていない | C（migration 014）と E（migration 015）が完了済み |
| 候補 C（行 65-78） | 「未着手 / ユーザー確認 → Codex 実装（合意後）」 | **実装済み**：014 が master にマージ |
| 候補 E（行 97-107） | 「500 連で urban_legend 確定」「Claude（設計）→ Codex（実装）」 | **100 連で実装済み**：015 が master にマージ。閾値要レビュー |
| 候補 D（行 82-93） | 「migration 010〜012 適用」 | 014/015 まで含めて未適用。`SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md` に手順あり |
| §3 トップ 3（行 169-197） | 1 位 D / 2 位 C / 3 位 F | C 完了で 2 位は別候補に。D は本番 Vercel 制約のため後ろへ |
| §6 ロードマップ（行 240-253） | D → C 順 | D は無料枠制約で後回し。閾値判断と migration 適用が先 |

---

## 2. 候補別ステータス更新案

### 2.1 候補 C：月箱コンテンツ v2 実装【完了に変更】

```diff
- ### 1.3 候補 C：月箱コンテンツ v2 実装（MOONBOX_V2_PROPOSAL.md 適用）
+ ### 1.3 候補 C：月箱コンテンツ v2 実装（MOONBOX_V2_PROPOSAL.md 適用）【完了】

  **作業内容**：`013_gacha_content_v2.sql` 新規作成。
+ → 実際は `014_gacha_content_v2.sql` として実装。
+
+ **完了メモ（2026-05-02）**：
+ - `MOONBOX_V2_FINAL_REVIEW.md` で 21 件採用決定（更新 10 + 新規 11）
+ - `014_gacha_content_v2.sql` 作成・master 反映済み
+ - 4 判断ポイント（「L」刺繍 / ふたりの傘 / 月夜の鏡 / リアクション拡充範囲）はすべて Codex が `MOONBOX_V2_FINAL_REVIEW.md` で結論。「L」採用、「ふたりの傘」採用（説明緩和）、「月夜の鏡」epic 配置、リアクション範囲は別 PR
+ - **Supabase 適用は未完了**。`SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md` 参照
+ - pool 実数：30 → 41（適用後）
```

### 2.2 候補 E：天井システム導入【完了に変更、ただし閾値レビュー要】

```diff
- ### 1.5 候補 E：天井システム導入
+ ### 1.5 候補 E：天井システム導入【実装完了 / 閾値レビュー中】

- **作業内容**：500 連で urban_legend 確定の天井（pity）システム実装。
+ **作業内容**：~~500 連で~~ **100 連で** urban_legend 確定の天井（pity）システム実装。
+ → 実際は `015_gacha_pity_system.sql` + `lib/lunaria/gacha.ts` で実装。
+
+ **完了メモ（2026-05-02 ／ 閾値レビュー 2026-05-03）**：
+ - `lunaria_gacha_pity_state` テーブル追加、`lunaria_gacha_history` に `pity_before` / `pity_after` / `pity_triggered` カラム追加
+ - `draw_gacha_v2` RPC 新設（旧 RPC は残す。アプリは v2 / v1 自動切替の backward compat 設計）
+ - 既存履歴からの backfill ロジック実装（`least(history数, 99)`）
+ - 閾値 = 100 連（Codex 推奨）→ `GACHA_PITY_THRESHOLD_REVIEW.md` で 200 連を Claude 推奨。**ユーザー判断待ち**
+ - **Supabase 未適用**。閾値判断と一緒に `SUPABASE_GACHA_014_015_APPLY_RUNBOOK` で適用予定
```

### 2.3 候補 D：本番動作確認 + Vercel 環境整備【後回し扱いに変更】

```diff
- ### 1.4 候補 D：本番動作確認 + Vercel 環境整備
+ ### 1.4 候補 D：本番動作確認 + Vercel 環境整備【後回し / Supabase 適用のみ先行可】

  **作業内容**：
- - 現在の master を Vercel 本番へ反映、Supabase 本番に migration 010〜012 適用
- - 本番で `/gacha` / `/gacha/inventory` の動作確認
+ - 既存 Vercel 本番（cascade-projects）は Certi-AI Hub をビルドしており、Lunaria 本番デプロイには新規 Vercel project が必要
+ - **Vercel 無料枠の制約により、新規 project の常時 deploy は後回し**
+ - 代替：**Supabase 適用と dev 環境での検証を先に完了**（`SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md`）
  - ログ監視（Gemini API 失敗率 / fallback 発火率）

+ **新しい 2 段階構成**：
+ - **D-1（先行可）**：Supabase 本番（or dev で代替）に 014/015 適用、`gacha:verify` PASS、ローカル dev で smoke
+ - **D-2（後回し）**：Vercel 専用 project 作成・本番デプロイ・URL smoke。無料枠制約があるため、優先度を下げて素材揃いやアクセス需要が出てから

  **実装リスク**：**中**。本番固有の事象（Vercel タイムアウト、Gemini API レート制限、Supabase 接続プール）が発覚する可能性。

- **分類**：ユーザー確認（環境変数・Supabase 認証情報）+ Claude（手順策定）
+ **分類**：D-1 はユーザー（Supabase Studio 操作）+ Claude（手順策定済み）/ D-2 は将来再評価
```

### 2.4 完了済みリスト追記案

```diff
  完了済み：
  - Phase G ガチャ MVP（DB / RNG / API / UI）
  - Phase G+ ガチャリアクション（LLM 駆動 + フォールバック）
  - Phase G++ 月箱演出（演出オーバーレイ・結果モーダル整備）
  - 012 月箱コンテンツ v1（リネーム + urban_legend 5 種追加）
  - 候補 A：gacha-reaction.ts 配列差し替え（GACHA_REACTION_REVIEW.md 適用）
  - `buildReactionPrompt` 内のレアリティ直呼び例示の改修
  - 候補 B：UI コピー v2 適用（`lib/lunaria/gacha-copy.ts` + `/gacha` 組み込み）
+ - 候補 C：月箱コンテンツ v2 実装（migration 014、コード反映済 / Supabase 未適用）
+ - 候補 E：天井システム導入（migration 015 + gacha.ts、コード反映済 / Supabase 未適用 / 閾値レビュー中）

  加えて Codex 側で：
  - 011 RPC のセキュリティハードニング（`service_role` 限定）
  - API endpoint の `unknown` 型エラーハンドリング統一
  - `lunaria_gacha_pool.name` の unique index 化（重複防止）
  - インベントリ画面のビジュアル強化（カテゴリ glyph・gradient 背景・「月箱の棚」へリネーム）
+ - migration 013（FK index + RPC search_path 固定）
+ - `lib/lunaria/health.ts`（health endpoint 用ロジック）
+ - `lib/lunaria/gacha-stats.ts`（admin 用統計）
+ - `lib/lunaria/logger.ts`
+ - `scripts/gacha-verify.js` / `scripts/gacha-smoke.js` / `scripts/gacha-report.js` / `scripts/prod-selfcheck.js` / `scripts/env-check.js`
+ - `MOONBOX_V2_FINAL_REVIEW.md` / `GACHA_PITY_SYSTEM_DESIGN.md` / `MIGRATION_PLAN.md` / `RETURN_CHECKLIST.md` / `SPEC.md`
```

---

## 3. 優先順位 トップ 3 の差し替え案

```diff
  ## 3. 優先順位 トップ 3（推奨）

- ### 第 1 位：候補 D（本番動作確認 + Vercel 環境整備）
+ ### 第 1 位：候補 D-1（Supabase 014/015 適用 + dev smoke）

  **理由**：
- - 候補 A / B が完了し、ガチャ体験は短期でかなり整った
- - 今まで dev でしか確認していない機能が積み上がっている
- - 本番で `/gacha` / `/gacha/inventory` / Supabase RPC / Gemini fallback が動くかを早めに確認したい
- - 本番特有の問題（Vercel タイムアウト、環境変数差分、Supabase 接続）を早く知るほど後戻りが少ない
+ - master に 014/015 + コード変更が反映済みだが、**Supabase 側の DB は未適用**でアプリと不整合状態
+ - `SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md` で適用手順は揃っている
+ - 本番 Vercel デプロイ（D-2）は無料枠制約で後回しだが、Supabase 適用は dev 環境で完結する
+ - **閾値判断（GACHA_PITY_THRESHOLD_REVIEW.md）が固まってから適用**するのが望ましい
+
+ → 順序：(a) 閾値合意（100 / 200 / 300 / 500 のどれか）→ (b) 必要なら migration 016 作成 → (c) Supabase 適用 → (d) `npm run gacha:verify` PASS

- ### 第 2 位：候補 C（月箱コンテンツ v2 実装）
+ ### 第 2 位：候補 F（会話プロンプト v9）

  **理由**：
- - v1 の反応・演出が固まってきたので、次の「月箱の中身」拡張として自然
- - v2 の 4 判断ポイントは、実装前にユーザー判断が必要
- - DB migration は本番確認と絡むため、D の結果を見てから適用順を決めるのが安全
+ - C / E は実装済みなので、コードベースの「次の主要改善余地」は Lunaria の本軸（会話キャラ）
+ - `buildReactionPrompt` 例示改修は完了したが、`lib/prompt.ts` 本体の v8 → v9 改善は未着手
+ - ガチャ周辺が落ち着いた今がコア機能改善のタイミング

- ### 第 3 位：候補 F（会話プロンプト v9）
+ ### 第 3 位：候補 G または H 系の小規模調査

  **理由**：
- - ガチャ側の演出が一段落したので、Lunaria 本体の会話品質に戻るタイミングが近い
- - ただし `lib/prompt.ts` は副作用が大きいので、Claude の人格監修・ログ観察を挟んでからが安全
- - `buildReactionPrompt` の例示改修は完了済みなので、次は本体プロンプトの drift 観察に集中できる
+ - G（コイン購入 MVP）or H（Live2D 技術調査）の事前検討メモを作っておく
+ - 実装に入る前のスケッチで、ユーザー（悠平）のアート進捗・素材状況と並行検討
```

---

## 4. ロードマップ案の差し替え

```diff
  ## 6. ロードマップ案（参考）

  短期（1〜2 週間）：
- - **D → C**（順番）：本番基盤固め + 月箱コンテンツ v2 判断/実装
- - 並行：小タスク 2, 5, 10 で運用ドキュメントを整備
+ - **閾値合意 → D-1（Supabase 適用）**：014/015 を dev に反映、`gacha:verify` PASS まで
+ - 並行：小タスク 2, 4, 5 で運用ドキュメント整備（README, SQL クエリ集, 環境変数チェックリスト）

  中期（1 ヶ月）：
- - **C**（月箱コンテンツ v2 実装、ユーザー判断後）
- - **F**（プロンプト v9）
- - **E**（天井システム）
+ - **F**（プロンプト v9）：v8 restructure 後のログから drift パターンを集めて改善
+ - 閾値運用ログ収集（pity_triggered 発火回数、自然 urban_legend 出現率）
+ - 必要なら **migration 016**（閾値調整）

  長期（2 ヶ月〜）：
  - **G**（コイン購入 MVP）
  - **H**（Live2D 統合 Phase I）
+ - **D-2**（Vercel 専用 project 作成）：素材が揃って本番アクセス需要が出てから
```

---

## 5. PROGRESS.md への追記文案

`PROGRESS.md` に **2026-05-02 / 05-03 のセクションとして追記**する短い更新文：

```markdown
# ルナリア 進捗記録 - 2026-05-02 / 05-03（Phase G+++ ：v2 コンテンツ + 天井システム）

## 概要

Codex が並行作業で月箱コンテンツ v2 と天井システムを一気に実装。
コード側は master に反映済み、Supabase 側は適用待ち。

## Codex 主導で完了したもの

### コンテンツ v2（候補 C 相当）
- `MOONBOX_V2_FINAL_REVIEW.md` で 21 件採用決定
- `014_gacha_content_v2.sql`：UPDATE 10 件 + INSERT 11 件
- pool 30 → 41（urban_legend 10 → 15 含む）
- 4 判断ポイント（L 刺繍 / ふたりの傘 / 月夜の鏡 epic 配置 / リアクション範囲）すべて結論

### 天井システム（候補 E 相当）
- `015_gacha_pity_system.sql`：`lunaria_gacha_pity_state` テーブル + `draw_gacha_v2` RPC + history 監査カラム
- `lib/lunaria/gacha.ts`：v2 / v1 自動切替・backward compat 完備
- `/gacha` に「月が満ちるまで」表示、`/admin/gacha` に Moon Fullness
- 閾値：**100 連**（Codex 推奨）

### 運用堅牢化
- `013_gacha_operational_hardening.sql`：FK index + RPC search_path 固定
- `lib/lunaria/health.ts`、`gacha-stats.ts`、`logger.ts`
- `scripts/`：`gacha-verify.js` / `gacha-smoke.js` / `gacha-report.js` / `prod-selfcheck.js` / `env-check.js`

## Claude 側のレビュー

- `POST_CODEX_STATUS_REVIEW.md`：棚卸し
- `GACHA_PITY_THRESHOLD_REVIEW.md`：閾値 100 → 200 推奨（要ユーザー判断）
- `MOONBOX_V2_COPY_FINAL_QA.md`：014 文言の最終 QA（適用前差し替え推奨があれば指摘）
- `SUPABASE_GACHA_014_015_RUNBOOK_REVIEW.md`：適用 Runbook の抜けチェック
- `NEXT_PHASE_STATUS_UPDATE_PROPOSAL.md`：本フェーズの完了反映と D の後回し化

## 残タスク

1. 天井閾値の最終承認（100 / 200 / 300 / 500）
2. Supabase に 014/015（必要なら 016）適用
3. `npm run gacha:verify` PASS 確認
4. ローカル dev で smoke
5. NEXT_PHASE_CANDIDATES の更新適用

本番 Vercel 専用 project（候補 D-2）は無料枠制約で後回し。
```

---

## 6. 適用方法の提案

このドキュメント自体は提案のみ。実際の `NEXT_PHASE_CANDIDATES.md` への反映は別作業：

1. ユーザーが本提案を読んで OK / 修正指示を出す
2. Codex 側で `NEXT_PHASE_CANDIDATES.md` を §2-§4 の diff 通りに編集
3. `PROGRESS.md` に §5 の追記文を貼り付け
4. commit & push

`NEXT_PHASE_STATUS_UPDATE_PROPOSAL.md` 自体は、適用後も**変更履歴のスナップショット**として残してよい。

---

## 7. 議論したい論点

1. **D-2（Vercel 専用 project）を「後回し」と明示してよいか**：素材揃い・アクセス需要が出てから、という条件設定
2. **閾値判断のタイミング**：D-1 の Supabase 適用と同時に決めるか、まず 100 で適用してログ見るか
3. **2 位を C（既完了）→ F（プロンプト v9）に差し替えてよいか**：あるいは別候補（小タスク群消化）か

---

## 8. 関連ドキュメント

- `NEXT_PHASE_CANDIDATES.md`（更新対象）
- `POST_CODEX_STATUS_REVIEW.md`（実態把握）
- `GACHA_PITY_THRESHOLD_REVIEW.md`（閾値判断材料）
- `SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md`（適用手順）
- `PROGRESS.md`（追記先）
