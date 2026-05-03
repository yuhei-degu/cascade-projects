# Lunaria 次フェーズ候補 整理

作成：2026-04-28
更新：2026-05-03
位置付け：現状の棚卸しと次に取り組むべき候補の比較。

---

## 0. 現在地

完了済み：

- Phase G ガチャ MVP（DB / RNG / API / UI）
- Phase G+ ガチャリアクション（LLM 駆動 + フォールバック）
- Phase G++ 月箱演出（演出オーバーレイ・結果モーダル整備）
- 012 月箱コンテンツ v1
- 候補 A：gacha-reaction.ts 配列差し替え
- 候補 B：UI コピー v2 適用
- 候補 C：月箱コンテンツ v2 migration 作成（014、DB適用待ち）
- 候補 E：天井システム基盤 + アプリ段階対応（015 + 016、DB適用待ち / 200連採用）
- ガチャ運用チェック CLI（`gacha:report` / `gacha:smoke` / `gacha:verify`）
- `/admin/gacha` の運用ダッシュボード

現在の最重要ブロッカー：

- 接続先 Supabase 実DBには `014` / `015` / `016` がまだ未適用
- 天井閾値は Claude レビューを受けて 200 連を採用。`016_gacha_pity_threshold.sql` で `draw_gacha_v2` を置き換える
- Vercel 本番公開は無料枠制約のため後回し。まずローカル + 接続先 Supabase の整合を優先

---

## 1. 候補別ステータス

| 候補 | 状態 | 次アクション | 主担当 |
|---|---|---|---|
| A. gacha-reaction 配列差し替え | 完了 | なし | Codex |
| B. UI コピー v2 適用 | 完了 | なし | Codex |
| C. 月箱コンテンツ v2 実装 | コード完了 / DB適用待ち | Claude文言QA → `014`適用 | Claude + Codex |
| D. Supabase適用 + 動作確認 | 最優先 | `014` → `015` → `016` 適用、`gacha:verify` | ユーザー + Codex |
| E. 天井システム | コード完了 / 200連採用 / DB適用待ち | `016` 適用後にローカル検証 | Codex |
| F. プロンプト v9 | 未着手 | ガチャDB整合後に再検討 | Claude |
| G. コイン購入 MVP | 未着手 | 天井・DB整合後に設計 | Claude → Codex |
| H. Live2D 統合 | 未着手 | ユーザー側アート進捗待ち | ユーザー + Claude |

---

## 2. 優先順位

### 第 1 位：候補 D（Supabase 014/015/016 適用 + 動作確認）

理由：

- コードは 015/016 対応済みだが、接続先 Supabase はまだ 014/015/016 未適用
- `gacha:verify` が FAIL している状態を解消したい
- Vercel 本番公開は無料枠制約で後回しだが、DBとローカルの整合は先に取れる

実行順：

1. SQL Editor で `014_gacha_content_v2.sql` を適用
2. SQL Editor で `015_gacha_pity_system.sql` を適用
3. SQL Editor で `016_gacha_pity_threshold.sql` を適用
4. `npm run gacha:verify`
5. `npm run gacha:smoke`

### 第 2 位：天井閾値の運用検証

理由：

- Claude レビューで 100 連は強すぎ、500 連は遠すぎると判断
- 初期リリースは 200 連で、救済感と都市伝説感の中間を取る
- 運用後に `gacha:report` / admin の Moon Fullness で進み方を見る

判断履歴：

- `100`: 約20日。体験は強いが希少性は下がる
- `200`: 約40日。中間案として採用
- `300`: 約60日。都市伝説感を残しやすい
- `500`: 約100日。初期設計に近いが救済感は弱め

### 第 3 位：ドキュメント整合性の継続更新

理由：

- Codex実装が早く進み、古い計画書との差分が大きい
- Claudeレビュー結果を取り込んで、判断履歴を残す必要がある

対象：

- `PROGRESS.md`
- `NEXT_PHASE_CANDIDATES.md`
- `PROD_DEPLOY_STATUS.md`
- `GACHA_PITY_SYSTEM_DESIGN.md`

---

## 3. 候補 C：月箱コンテンツ v2

状態：コード完了 / DB適用待ち。

成果物：

- `MOONBOX_V2_FINAL_REVIEW.md`
- `014_gacha_content_v2.sql`
- `gacha:verify` の v2 pool check

内容：

- 既存 10 アイテム更新
- 新規 11 アイテム追加
- active pool 30 → 41

残作業：

- Claude の月箱 v2 文言最終QA
- SQL Editor で `014` 適用
- `npm run gacha:verify` で 41 件確認

---

## 4. 候補 E：天井システム

状態：コード完了 / 200連採用 / DB適用待ち。

成果物：

- `GACHA_PITY_SYSTEM_DESIGN.md`
- `015_gacha_pity_system.sql`
- `016_gacha_pity_threshold.sql`
- `draw_gacha_v2`
- `draw_gacha_v2` 自動切替 + legacy fallback
- `/gacha` の「月が満ちるまで」表示
- `/admin/gacha` の Moon Fullness 表示
- `gacha:report` / `gacha:verify` の pity check

残作業：

- SQL Editor で `015` → `016` 適用
- `npm run gacha:verify` で pity table / columns / RPC 確認

---

## 5. 次に Claude へ任せるもの

`CLAUDE_HANDOFF_TASKS_2026-05-03.md` の優先順：

1. Task 1：天井閾値レビュー
2. Task 4：Supabase 014/015 Runbookレビュー
3. Task 3：月箱 v2 文言最終QA
4. Task 2：ドキュメント整合性レビュー

---

## 6. Codex が次に進める候補

Claudeレビュー待ちの間に進められるもの：

- `PROGRESS.md` / `PROD_DEPLOY_STATUS.md` の更新
- `gacha:verify` の改善
- `014/015` 適用後のCLI/ブラウザ検証
- 閾値が100以外になった場合の `016` 実装

---

## 7. 後続候補

### F. プロンプト v9

ガチャDB整合が取れた後に再開。`lib/prompt.ts` は副作用が大きいため、Claude の人格監修を先に入れる。

### G. コイン購入 MVP

かぶり経済の出口。天井と月箱v2が落ち着いた後に設計する。

### H. Live2D 統合

ユーザー側のアート進捗待ち。技術調査だけ先行するなら Claude 向き。

---

## 8. 関連ドキュメント

- `POST_CODEX_STATUS_REVIEW.md`
- `CLAUDE_HANDOFF_TASKS_2026-05-03.md`
- `SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md`
- `MOONBOX_V2_FINAL_REVIEW.md`
- `GACHA_PITY_SYSTEM_DESIGN.md`
- `PROGRESS.md`

## 9. AI日記 / 記憶閲覧（基礎実装済み / schema拡張は後回し）

状態：D1/D2 + 月別棚 + generate-on-demand + diary v1 schema準備 + memory provenance準備は実装済み。DB適用と長期記憶閲覧UIはガチャDB安定化後。

成果物：

- `LUNARIA_DIARY_MEMORY_DESIGN.md`
- `CLAUDE_DIARY_MEMORY_REVIEW_TASK.md`
- `LUNARIA_DIARY_MEMORY_REVIEW.md`

方針：

- まずはガチャDB安定化を優先
- AI日記は「ログビュー」ではなく「ルナがその日をしまっておく棚」として設計する
- 日記 / 会話ログ / 長期記憶変更を分ける
- `user_day` のようなユーザー行動推測フィールドは採用しない
- 長期記憶閲覧は provenance schema を入れてから実装する

実装済み：

1. `/diary` read-only page
2. `GET /api/messages?date=YYYY-MM-DD`
3. generate-on-demand diary action
4. month shelf

実装済み追加：

1. `017_diary_v1_schema.sql`（title / talked_about / source_message_count / generated_at）
2. diary v1 prompt / parser / UI
3. DB未適用時のlegacy upsert fallback
4. `018_core_memory_provenance.sql`
5. core memory provenance save/read fallback

次候補：

1. `017` / `018` を Supabase に適用して diary regenerate + memory save 確認
2. memory provenance / delete / correct surface
