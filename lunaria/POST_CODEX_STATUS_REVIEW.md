# Post-Codex 棚卸しレビュー

作成：2026-05-02
位置付け：Claude セッションが止まっている間に Codex が大幅に進めた作業を、現状の master ベースで棚卸し
方針：実装はせず、**何が起きたか / 何が未完か / どこにリスクがあるか**を整理

---

## 0. 結論サマリ

**Codex はガチャ周辺で当初想定の 3〜4 倍の作業を完了させていた**。具体的には：

- 候補 C（月箱コンテンツ v2）→ **完了**（migration 014）
- 候補 E（天井システム）→ **完了**（migration 015 + gacha.ts 改修）
- 加えて、運用堅牢化（migration 013）、health check、admin 用 stats、logger を追加

未完なのは候補 D（**本番デプロイ**）と、認識共有が要る設計判断 1 つ（**天井閾値 = 100 連**）。

→ 次に着手すべきは **D（本番反映 + 閾値合意）**。

---

## 1. 実装が進んだ全項目

### 1.1 DB migration（3 本追加：013 / 014 / 015）

| migration | 種別 | 内容 | 行数 |
|---|---|---|---|
| `013_gacha_operational_hardening.sql` | 運用堅牢化 | `history.pool_id` / `inventory.pool_id` の FK index 追加、`draw_gacha` / `grant_gacha_ticket` の `search_path` 固定 | 36 |
| `014_gacha_content_v2.sql` | コンテンツ v2 | A 区分 6 件 UPDATE + B 区分 4 件 UPDATE + 11 件 INSERT（common_a 3 / common_b 2 / epic 1 / urban_legend 5）。**Pool 30 → 41** | 94 |
| `015_gacha_pity_system.sql` | 天井基盤 | `lunaria_gacha_pity_state` テーブル、`history` に `pity_before` / `pity_after` / `pity_triggered` カラム追加、`draw_gacha_v2` RPC 新設、既存履歴からの backfill | 281 |

すべて idempotent。`if not exists` / `on conflict do nothing` / `or replace` で再実行安全。

### 1.2 アプリコード（gacha.ts + 補助 3 ファイル）

| ファイル | 状態 | 内容 |
|---|---|---|
| `lib/lunaria/gacha.ts` | 大幅改修 | `fetchPityState` / `executeDraw` の RPC 切替（v2 → fallback v1）/ `pity_required` 例外で urban_legend 強制リトライ / `isMissingPityInfrastructure` で本番未適用環境でも壊れない |
| `lib/lunaria/health.ts` | 新規 | health endpoint 用の DB / Gemini / pool / default_user チェッカー |
| `lib/lunaria/gacha-stats.ts` | 新規 | admin 用統計（pity_triggered の集計など想定） |
| `lib/lunaria/logger.ts` | 新規 | ログ整形ヘルパー（推測） |
| `lib/lunaria/gacha-copy.ts` | 既存 | UI コピー集約（候補 B 完了時に作成済み） |

### 1.3 ドキュメント（5 本追加）

| 文書 | 役割 |
|---|---|
| `GACHA_PITY_SYSTEM_DESIGN.md` | 天井システム設計書（100 連推奨と理由） |
| `MOONBOX_V2_FINAL_REVIEW.md` | v2 採用案の最終レビュー（**Codex 製、Claude 元タスクと同名**）|
| `MIGRATION_PLAN.md` | migration 適用計画 |
| `RETURN_CHECKLIST.md` | セッション復帰時のチェックリスト（推測） |
| `SPEC.md` | 全体仕様書（推測） |

### 1.4 NEXT_PHASE_CANDIDATES のステータスアップデート

候補 C / E は実装完了、しかし `NEXT_PHASE_CANDIDATES.md` は**まだ "未着手" のまま**。整合性が崩れている。

---

## 2. 設計妥当性レビュー（重要：ここを最優先で議論）

### 2.1 天井閾値 = 100 連 の妥当性 ⚠️ 要レビュー

`GACHA_PITY_SYSTEM_DESIGN.md` の根拠：
- 1 日 5 回ペース → 100 連 = 約 **20 日**
- urban_legend を 1 ヶ月以内に必ず一度は出す

これに対する**懸念**：

| 観点 | 評価 |
|---|---|
| 期待値 | 1,000 連に 1 回 = **約 200 日**（自然確率） |
| 100 連天井 | **5 倍の救済**。月 1.5 回ペースで urban_legend が確定 |
| 結果 | urban_legend 15 種を 1 年で **約 18 回**獲得 → コンプリートに迫る速度 |
| 哲学整合 | 「都市伝説」の希少性が大幅減。SNS 話題性（「俺は宇宙猫見たことある」）が薄まる |

**僕の感触**：100 連は**甘すぎ**。urban_legend が「日常の小さな贈り物」化して、希少性の磁力が消える。

**代替提案**：
- **300 連**：60 日に 1 回 = 期待値の 1.5 倍救済。離脱期（半年）は防げるが希少感は維持
- **200 連**：40 日に 1 回 = 中間案。比較的バランスが良い
- 100 連維持：urban_legend を「希少」ではなく「日常」と再定義する選択。これも哲学次第

→ **ユーザー判断必須**：100 / 200 / 300 / 500 のどれにするか。Codex は 100 で migration を作ってしまっているが、`015` の閾値は `>= 99` とハードコードされてるので **migration 016 で UPDATE して調整可能**。

### 2.2 v2 コンテンツの 4 判断ポイント結果

`MOONBOX_V2_PROPOSAL.md §8` で挙げた 4 つの未決ポイント、Codex がどう処理したか：

| 判断ポイント | Codex の決定 | 私の見解 |
|---|---|---|
| 「L」刺繍（刺繍ハンカチ） | **採用**（014 line 54）| OK。世界観にルナの存在を一文字だけ匂わせる仕掛けは良い |
| ふたりの傘（urban_legend） | **採用**（014 line 82）| OK だが「誰かのリング」と関係性ヒントが被る懸念は依然。要観察 |
| 月夜の鏡 | **epic に配置**（014 line 72）| OK。urban_legend に上げる選択肢もあったが、epic 帯の充実は妥当 |
| リアクション拡充範囲 | 未確認（`gacha-reaction.ts` 詳細未確認）| 後ほど別途確認推奨 |

### 2.3 backward compat 設計 ✅ 評価高い

`gacha.ts` の `isMissingPityInfrastructure` フォールバック設計は秀逸：

- 本番 Supabase に migration 015 が**未適用でも `gacha.ts` は壊れない**
- v2 RPC が見つからなければ自動で v1 RPC にフォールバック
- 段階的 rollout が可能

これは Codex の運用センス。本番反映時の事故率を大幅に下げる。

### 2.4 backfill ロジックの妥当性 ✅

`015` の §3 backfill：
- 既存ユーザーの `draws_since_urban_legend` を**最大 99 でキャップ**
- 即座に天井発動可能な状態で初期化

これも気が利いている。ロールアウト直後に「天井に既に達してる人」が urban_legend を引ける。

---

## 3. 認識のズレ / リスク

### 3.1 ドキュメントのバージョン整合性

| ドキュメント | 状態 |
|---|---|
| `NEXT_PHASE_CANDIDATES.md` | C / E が "未着手" のまま。要更新 |
| `MOONBOX_V2_PROPOSAL.md` | 提案書として残しつつ、`MOONBOX_V2_FINAL_REVIEW.md`（Codex 製）が採用版になっている |
| `MOONBOX_V2_FINAL_REVIEW.md` | 当初は Claude タスクだったが Codex が作成。**authoritative かどうか**の整理が要る |
| `GACHA_PITY_SYSTEM_DESIGN.md` | 100 連の妥当性についてユーザー合意未確認 |

### 3.2 本番未反映

`PROD_DEPLOY_STATUS.md` が示すとおり、本番は **migrations 012 まで**で止まっている。
dev / コードは 015 まで進んでいる。**本番との乖離が 3 migration 分**。

加えて：
- 既存 Vercel project（`cascade-projects` / `cascade-projects-lvq1`）は Certi-AI Hub をビルドしており、**Lunaria は本番デプロイされていない**
- `VERCEL_LUNARIA_PROJECT_SETUP.md` 通りに専用 Vercel project を作る作業は未着手と思われる

### 3.3 天井閾値の意思決定追跡が弱い

100 連という数字は Codex が `GACHA_PITY_SYSTEM_DESIGN.md` 内で結論しているが：
- ユーザー合意のサインがどこにもない
- Claude 元提案（`MOONBOX_V2_PROPOSAL` で 500 連を仮定）との明示的差分が記録されていない
- migration 015 を本番適用すると、**実質的にこの 100 連がフィックス**する

→ **本番適用前に、閾値の最終判断をドキュメントで残す**べき。

### 3.4 並行作業の協調コスト

このセッションだけで Codex は：
- 3 migration（013/014/015）
- 4 ファイル（gacha.ts 大幅改修 + 3 新規）
- 5 ドキュメント

を作成。**1 セッション分の Claude より遥かに早い**。

協調モデルとしては：
- Claude：戦略・設計・人格監修・哲学レビュー
- Codex：実装・テスト・運用堅牢化

の役割分担が機能してる。ただし**Claude のレビューを待たずに Codex が決定する**パターンが増えると、品質ガードが弱くなる。今回の閾値 = 100 連 がその最初の事例。

---

## 4. 候補別ステータス（NEXT_PHASE_CANDIDATES の最新化）

| 候補 | 名目ステータス | 実態 |
|---|---|---|
| A. gacha-reaction 配列差し替え | 完了 | 完了（変化なし） |
| B. UI コピー v2 適用 | 完了 | 完了（変化なし） |
| C. 月箱コンテンツ v2 実装 | 未着手 | **完了**（014 + Codex 4 判断ポイント決定） |
| D. 本番動作確認 + Vercel | 未着手 | **未着手**（最優先候補に昇格） |
| E. 天井システム導入 | 未着手 | **完了**（015 + gacha.ts、ただし閾値要レビュー） |
| F. プロンプト v9 | 未着手 | 未着手（変化なし） |
| G. コイン購入 MVP | 未着手 | 未着手（変化なし） |
| H. Live2D 統合 | 未着手 | 未着手（変化なし） |

---

## 5. 次にやるべきこと（優先度順）

### 第 1 位：天井閾値 100 連の最終承認 / 修正

- ユーザーに「100 連のままで良いか / 200・300・500 に変更するか」決断を求める
- 決定後、必要なら migration 016 で `lunaria_gacha_pity_state` の閾値関連定数を更新
- `GACHA_PITY_SYSTEM_DESIGN.md` に「ユーザー合意済み: 2026-05-XX」を追記

### 第 2 位：候補 D（本番デプロイ）

- `VERCEL_LUNARIA_PROJECT_SETUP.md` 通りに新 Vercel project 作成
- 本番 Supabase に migrations 013 / 014 / 015 を順番に適用
- `npm run prod:check -- https://<lunaria-prod-url>` で smoke test
- **天井閾値の決定が固まってから**実施するのが望ましい

### 第 3 位：ドキュメント整合性の修復

- `NEXT_PHASE_CANDIDATES.md` を実態に合わせて更新（C / E を完了表記に、新規候補を追加）
- `MOONBOX_V2_PROPOSAL.md` と `MOONBOX_V2_FINAL_REVIEW.md` の関係を明示（draft / final）
- `PROGRESS.md` に Phase G+++ として今回の作業をまとめ

### 第 4 位：候補 F or G

- 上 3 つが片付いた後の選択
- F（プロンプト v9）：会話キャラの本軸改善
- G（コイン購入 MVP）：かぶり経済の出口

---

## 6. このレビューを書いた目的（メタ）

1. **ステータスの可視化**：Codex の作業が一気に進んだ結果、何がどこまで終わってるかを俯瞰する地図が必要
2. **未決事項の浮き彫り**：天井閾値の妥当性のような**実装は終わったが哲学的判断が抜けている**項目を顕在化
3. **次の判断材料**：D（本番デプロイ）に進む前に、閾値とドキュメント整合性を片付けるべき理由を明示
4. **協調パターンの観察**：Codex 主導の implementation-first vs Claude 主導の design-first のバランスを今後どうするか

---

## 7. 議論したい論点（ユーザー判断必須）

1. **天井閾値**：100 / 200 / 300 / 500 連のどれにするか（§2.1）
2. **本番デプロイのタイミング**：閾値決定後すぐに 013-015 反映するか、もう少し dev で寝かせるか
3. **`MOONBOX_V2_FINAL_REVIEW.md` の authoritative 判定**：Codex 製のものを最終版として扱うか、Claude が再レビューするか
4. **次フェーズ選択**：F（プロンプト v9）か G（コイン購入）か、それとも別軸の H（Live2D）の技術調査だけ先行か

これら 4 つにユーザー判断が出れば、`NEXT_PHASE_CANDIDATES` を最新化して次の仕事に入れる。

---

## 8. 関連ドキュメント

- `NEXT_PHASE_CANDIDATES.md`：旧フェーズ候補リスト（要更新）
- `MOONBOX_V2_PROPOSAL.md` / `MOONBOX_V2_FINAL_REVIEW.md`：v2 設計
- `GACHA_PITY_SYSTEM_DESIGN.md`：天井システム設計（100 連の根拠）
- `PROD_DEPLOY_STATUS.md`：本番ブロッカー
- `PROD_DEPLOY_RUNBOOK.md`：本番適用手順
- `VERCEL_LUNARIA_PROJECT_SETUP.md`：新 Vercel project 作成手順
- `MIGRATION_PLAN.md`：migration 適用計画（Codex 製）
- `RETURN_CHECKLIST.md`：セッション復帰チェックリスト（Codex 製）
- `SPEC.md`：仕様書（Codex 製）
