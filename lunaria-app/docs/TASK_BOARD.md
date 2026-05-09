# Lunaria Task Board

最終更新：2026-05-04
方針：Codex 制限中。本ボードは仕様/UI/タスク整理用。Codex 復帰後に Next 列をそのまま投げる。

---

## Now：Codex 制限中に Claude Code 側で進めるタスク

### 仕様（docs/）
- [x] 2D キャラ仕様（`LUNARIA_VISUAL_GUIDE.md`）
- [x] 表情タグ仕様（`CHARACTER_EXPRESSIONS.md`）
- [x] モーションタグ仕様（`CHARACTER_MOTIONS.md`）
- [x] AI 返答 JSON schema（`ASSISTANT_REPLY_SCHEMA.md`）
- [x] アイテムカテゴリ仕様（`ITEM_SYSTEM_SPEC.md`）
- [x] 初期アイテム 30 個（`INITIAL_ITEMS.md`）
- [x] ガチャ哲学（`GACHA_DESIGN_PHILOSOPHY.md`）
- [x] ブランド方針（`BRAND_GUIDE.md`）
- [x] ロゴ方向性（`LOGO_DIRECTION.md`）
- [x] UI カラー（`UI_COLOR_PALETTE.md`）
- [x] 性格チューニング（`PERSONALITY_TUNING_SPEC.md`）
- [x] character_profile 拡張（`CHARACTER_PROFILE_EXPANSION.md`）
- [x] DB 設計：`character_states`（`DB_CHARACTER_STATES.md`）
- [x] DB 設計：`user_items`（`DB_USER_ITEMS.md`）
- [x] DB 設計：`life_events`（`DB_LIFE_EVENTS.md`）

### 軽量 UI 実装（mock）
- [x] `components/character/LunariaPortrait.tsx`（Live2D 差し替え前提の placeholder）
- [x] `app/items/page.tsx`（mock で INITIAL_ITEMS 表示）
- [x] `app/character/page.tsx`（mock でルナリア状態表示）

### 引き継ぎ
- [x] `docs/CODEX_HANDOFF.md`（Codex 復帰後の最初のタスク）

---

## Next：Codex 復帰後にすぐ投げるタスク

### Memory 系（最優先）
- [ ] memory candidate **承認/却下/保留** の本実装（`/api/memory/candidates` の PATCH 拡張 + UI ボタン）
- [ ] candidate 承認 → `core_memories` への反映パイプライン
- [ ] 日記由来 memory candidate の生成（`extraction.ts` の出力を candidate へ）
- [ ] `memory.ts` の `pickMemories` を `status='active'` フィルタ化
- [ ] `/memory` の confirm / archive / restore アクション本実装

### DB migration（提案 → 実装）
- [ ] `character_states` migration 作成（`docs/DB_CHARACTER_STATES.md` を仕様書として）
- [ ] `user_items` migration 作成（`docs/DB_USER_ITEMS.md` を仕様書として）
- [ ] `life_events` migration 作成（`docs/DB_LIFE_EVENTS.md` を仕様書として）
- [ ] gacha_pulls → user_items 反映（既存の獲得フローを user_items 経由に）

### UI 接続
- [ ] `/items` を mock から DB 接続に置き換え
- [ ] `/character` を mock から DB 接続に置き換え
- [ ] `<LunariaPortrait>` の expression / motion を AssistantReply の値で駆動

### AI 構造化
- [ ] `AssistantReply` JSON schema を chat 経路に導入
- [ ] expression / motion / topic_tags を返答に含める
- [ ] `should_create_memory_candidate` フラグで candidate 生成を起動

### 既存タスクとの連動（参照：`lunaria/NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md`）
- [ ] Supabase 014→019 の本番適用（**ユーザー作業**）
- [ ] `health.ts` pool 判定 25 → 41
- [ ] `PITY_THRESHOLD` を `lib/lunaria/constants.ts` に括り出し
- [ ] `/diary` Must-A/B/C 修正

---

## Later：後回し

- [ ] Live2D 本格対応（モデル制作 + ランタイム統合）
- [ ] 女性向けキャラモデル展開（character_profile_id で分離）
- [ ] AI グラス連携（life_events 経由）
- [ ] 課金本番導入（Stripe / Apple / Google）
- [ ] 外部アプリ連携（カレンダー / 健康データ）
- [ ] プロンプト v9（drift 観察ベース改善）
- [ ] Vercel 本番公開 project（無料枠制約のため後回し）
- [ ] 検索 / bulk archive / マージ（記憶 v3 候補）

---

## 優先順位の考え方

```
ガチャ → 日記 → 記憶 → チャット品質 → 2D 表現
```

DB 整合化（Supabase 適用）はすべての前提。次に記憶ガバナンス完結（candidate review）。
2D / Live2D は仕様を固めて Codex 復帰後に段階導入。

## 「ユーザー作業」が必要なもの
- Supabase Studio での migration 順次適用（014→019）
- 2D 立ち絵素材の発注 / 制作
- ロゴ素材の発注 / 制作
- 課金ストアの登録
