# Lunaria Status

## 現在の確認日時
- 2026-05-04（Asia/Tokyo）

## リポジトリ位置
- Windows: `C:\Users\yuuve\CascadeProjects\lunaria-app`
- Cowork mount: `/sessions/serene-upbeat-clarke/mnt/lunaria-app`

## 現在存在する主要機能

### コア
- AI 会話（Gemini ストリーミング、prompt v8 restructure 適用済み）
- ガチャ（pity 200、月箱 v2 content、リアクション機能）
- AI 日記（Diary v1：title / summary / events / talked_about / emotions / luna_comment / unresolved_issues / next_topics / memory_changes）
- 月箱 / インベントリ
- core memory（018 で provenance：source_date / source_message_id / confidence / status / last_confirmed_at / created_by / notes）
- memory candidates（019：pending / approved / rejected の review queue）

### ガバナンス系
- `/memory` ページに記憶 + candidate 表示（confirm / archive / restore は実装途上）
- diary 月棚（`/api/diary/month`）

## 現在存在する主要ページ
- `/`（ルナの部屋・チャット）
- `/diary`（AI 日記、月棚 aside、transcript toggle）
- `/memory`（記憶閲覧、candidate review の足場あり）
- `/gacha`、`/gacha/inventory`
- `/admin/gacha`（pool / pity モニタリング）

## 現在存在する主要 lib/lunaria モジュール
- `affinity.ts` / `date.ts` / `diary.ts` / `emotion.ts` / `extraction.ts`
- `gacha.ts` / `gacha-copy.ts` / `gacha-reaction.ts` / `gacha-stats.ts`
- `health.ts` / `logger.ts` / `memory.ts` / `memory-candidates.ts`
- `profile.ts` / `prompt-builder.ts` / `routing.ts` / `state-summary.ts`
- `subscription.ts` / `topic.ts` / `types.ts`

## 現在存在する主要 DB / migration

```
001_lunaria_init.sql
002_routing_review.sql
003_seed_dev_user.sql
004_lunaria_diary.sql
005_lunaria_state.sql
006_user_profile.sql
007_core_memory_normalize.sql
008_subscription_and_memory_surface.sql
009_gacha.sql
010_gacha_seed.sql
011_lock_gacha_rpc.sql
012_gacha_content_v1.sql
013_gacha_operational_hardening.sql
014_gacha_content_v2.sql
015_gacha_pity_system.sql
016_gacha_pity_threshold.sql
017_diary_v1_schema.sql
018_core_memory_provenance.sql
019_memory_candidates.sql
```

→ **014〜019 の本番適用は未確定**（Codex 制限中なので Supabase Studio で順次適用するフェーズ）

## 現在の未完了タスク（高〜中優先）

### High（DB / 整合）
- [ ] Supabase 本番に 014→015→016→017→018→019 を順次適用（**ユーザー作業**）
- [ ] `lib/lunaria/memory.ts` の `pickMemories` / `getCoreMemoryContext` を `status='active'` フィルタ化
- [ ] `lib/lunaria/health.ts` の `gacha_pool` 判定を `>=25` から `>=41` に更新
- [ ] `PITY_THRESHOLD = 200` を `lib/lunaria/constants.ts` に括り出し（重複解消）

### Mid（UI）
- [ ] `/diary` Must-A：`memory_changes` セクションをデフォルト折りたたみ
- [ ] `/diary` Must-B：「記録の気配」Stat ブロックを dev panel または折りたたみへ
- [ ] `/diary` Must-C：transcript を main column 末尾へ移動
- [ ] `/memory` 削除（archive）/ 訂正（content edit）/ 確認（confirmed + last_confirmed_at）アクション
- [ ] memory candidates 承認 / 却下 / 保留の本実装（プロトタイプは `/memory` 内）
- [ ] core_memories への承認反映パイプライン
- [ ] 日記由来 memory candidate 生成（diary → candidate）

### Low（仕様 / 拡張）
- [ ] 2D キャラ仕様の固定化（本タスクで対応）
- [ ] アイテム / 衣装 / 背景 / 演出の体系化（本タスクで対応）
- [ ] character_states / user_items / life_events の **設計書のみ作成**（migration は今は作らない）
- [ ] プロンプト v9 候補の収集

## 現在進行中の方針
- Codex がレート制限中 → 大規模実装はしない
- 本タスクでは仕様書 + mock UI に集中
- migration は提案レベル、本実装は Codex 復帰後
- DB 接続が必要な画面は mock で代用してよい

## 注意点
- `/memory` ページは記憶閲覧 + candidate review のスケルトンが既に存在 → **壊さない**
- `lunaria_memory_candidates` は 019 で提案、本適用は別途 Runbook（`SUPABASE_019_MEMORY_CANDIDATES_RUNBOOK.md`）
- ガチャ / 日記 / 記憶の既存ロジックは安定運用中。リファクタは控える
- 設計参照：`lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`、`lunaria/PROFILE_MEMORY_INTEGRATION.md`
- ブランド・キャラ仕様は本タスクで初期化（既存にない）
- 「ライフログ OS」の遠景は意識するが、今は **見える形と仕様の固定** に絞る

## 関連ドキュメント
- 本タスクで作成：`docs/TASK_BOARD.md` / `docs/CODEX_HANDOFF.md` / Phase 3〜7 の各仕様書
- 既存（lunaria/）：`NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md` / `DIARY_UI_REVIEW_2026-05-04.md` / `MEMORY_VIEWER_NEXT_PHASE_PLAN.md`
