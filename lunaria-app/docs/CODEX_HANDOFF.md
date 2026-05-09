# Codex Handoff

作成：2026-05-04
位置付け：Codex のレート制限解除後にすぐ投げるための引き継ぎ書
方針：Claude Code 側で **仕様書 + 軽量 mock UI** は揃えた。ここからは Codex の領域

---

## 0. 前提：今の状態

- `docs/STATUS.md`：プロジェクト現状
- `docs/TASK_BOARD.md`：Now / Next / Later のタスク分類
- `docs/` 配下に：2D / アイテム / ガチャ / ブランド / 性格 / DB の仕様書 13 本
- `components/character/LunariaPortrait.tsx`：mock の立ち絵コンポーネント
- `app/items/page.tsx`：mock のアイテム一覧
- `app/character/page.tsx`：mock のルナリア状態
- migration は提案のみ（`DB_*.md`）。本実装は未着手
- 既存の `/`, `/diary`, `/memory`, `/gacha`, `/admin/gacha` は無変更

---

## 1. Codex 復帰後に最初にやること（順序つき）

### Step 1：Supabase migration 014→019 の本番適用（ユーザー作業）
- 参照：`lunaria/SUPABASE_014_018_APPLY_RUNBOOK.md` + `SUPABASE_019_MEMORY_CANDIDATES_RUNBOOK.md`
- ユーザーが Supabase Studio で順次 apply
- Codex は `npm run supabase:verify` / `gacha:verify` の PASS 確認担当

### Step 2：memory candidate 承認 / 却下 / 保留の本実装
- `app/api/memory/candidates/route.ts` を PATCH 対応に拡張
- `lib/lunaria/memory-candidates.ts` の `approveCandidate` / `rejectCandidate` / `archiveCandidate` を追加
- `/memory` ページに承認 / 却下ボタンを足す（既に表示はある）
- 承認時：`lunaria_core_memory` に upsert（`saveCoreMemory` 経由）

### Step 3：core_memories への承認反映パイプライン
- candidate 承認 → `lunaria_core_memory` 行 1 件 insert（status='active', confidence=candidate.confidence, source_date=candidate.source_date）
- candidate.status='approved'、reviewed_at=now()、reviewed_by=user_id

### Step 4：日記由来の memory candidate 生成
- `lib/lunaria/diary.ts` の生成パイプライン後、`payload.memory_changes` の各候補を `saveMemoryCandidate(source_type='diary')` で candidate 化
- 既に `extraction.ts` が抽出している candidate 群と差別化（diary ベース vs conversation ベース）

### Step 5：character_states / user_items のテーブル作成
- 仕様：`docs/DB_CHARACTER_STATES.md` / `docs/DB_USER_ITEMS.md`
- migration 020 / 021 を新規作成
- 既存 user 用に default 行を seed

### Step 6：items mock UI を DB 接続に置き換え
- `/api/items` を実装（GET 全件 + ?category=... フィルタ）
- `/api/character/state` を実装（GET / PATCH for 装備変更）
- `app/items/page.tsx` / `app/character/page.tsx` の mock データ参照を fetch に
- `components/character/LunariaPortrait.tsx` の `imageUrl` prop に CDN 画像を渡せるようにする

### Step 7：AssistantReply JSON schema を chat 経路に導入
- 仕様：`docs/ASSISTANT_REPLY_SCHEMA.md`
- `lib/prompt.ts` の system prompt 末尾に JSON 出力指示
- ストリーミング：本文 chunked + 最終 meta 1 行 (`data: {"meta":...}`)
- クライアント：meta 受信で `<LunariaPortrait>` を更新

---

## 2. Codex に渡すべきタスク（仕様書付きで投げる）

### Task 1：memory candidates review UI 本実装
- 仕様：`docs/STATUS.md` + 既存 `/memory` のスケルトン
- API 拡張：`PATCH /api/memory/candidates/{id}` で status を `approved` / `rejected` / `archived` に
- UI：「承認」「却下」「保留」「詳しく」ボタン
- 承認後フロー：core_memory に書き込み + UI を「育てている記憶」へ移動

### Task 2：character_states / user_items migration（020 / 021）
- 仕様：`docs/DB_CHARACTER_STATES.md` / `docs/DB_USER_ITEMS.md`
- 既存ユーザー用の default 行 seed（衣装 / 背景 デフォルト装備）
- RLS policy + index + trigger（`updated_at`）
- 既存 `gacha_pulls` データから `user_items` を backfill

### Task 3：gacha 結果 → user_items 反映
- `lib/lunaria/gacha.ts` の `executeDraw` を：
  - 既存：`gacha_pulls` 1 行 insert
  - 追加：`user_items` upsert（初取得 INSERT / 重複 UPDATE duplicate_count）
- `event_type='item_obtained'` の life_event を任意で記録（rare 以上のみ）

### Task 4：AssistantReply JSON schema 導入
- 仕様：`docs/ASSISTANT_REPLY_SCHEMA.md` §4
- zod schema：`lib/lunaria/types.ts` に `AssistantReplySchema` を追加
- `app/api/chat/route.ts`：ストリーミング final で meta JSON を 1 chunk 流す
- クライアント側：`<LunariaPortrait>` に expression / motion を流し込む

### Task 5：/diary UI Must-A/B/C 修正（既存の DIARY_UI_REVIEW より）
- 仕様：`lunaria/DIARY_UI_REVIEW_2026-05-04.md` §5.1
- A：`memory_changes` セクションをデフォルト折りたたみ
- B：「記録の気配」Stat ブロックを dev panel または折りたたみ
- C：transcript を main column 末尾へ移動

### Task 6：health.ts pool 判定 25 → 41 + PITY_THRESHOLD 定数化
- 仕様：`lunaria/NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md` #6 / #7
- `lib/lunaria/health.ts` L132 修正
- `lib/lunaria/constants.ts` 新規 + `PITY_THRESHOLD = 200` を import 化

---

## 3. Codex に渡さない（Claude or ユーザー作業）

| 項目 | 担当 | 理由 |
|---|---|---|
| Supabase 014〜019 適用 | ユーザー | Studio 操作 |
| 立ち絵 PNG / Live2D 制作 | ユーザー（外注） | 素材制作 |
| ロゴ制作 | ユーザー（外注） | 素材制作 |
| プロンプト v9 設計 | Claude | 人格判断・観察 |
| ブランド文言の最終決定 | Claude → ユーザー | 哲学的判断 |
| 課金導入の判断 | ユーザー | ビジネス判断 |

---

## 4. 進めない / 後回しにすべきこと

- Live2D 本格対応（v3、立ち絵 PNG 整備の後）
- 女性向けキャラ展開（ルナリア完成後）
- AI グラス連携（life_events 仕様だけ作っておく）
- 外部アプリ連携（同上）
- Vercel 本番公開 project（無料枠制約）

---

## 5. ヒント：Codex に投げる時のテンプレ

```
タスク：[Task X の名前]

参照ドキュメント：
- docs/[該当 spec].md
- lunaria/[該当ドキュメント].md（必要なら）

編集対象：
- [ファイルパス]

完了条件：
- [...]
- [...]
- npm run build PASS
- 既存テストがあれば PASS
```

→ 仕様書を **コピペで渡せる粒度**で書いたので、迷わない。

---

## 6. 注意点

### 6.1 既存機能を壊さない
- `/`, `/diary`, `/memory`, `/gacha`, `/admin/gacha` の挙動は変えない
- migration は backward compat（既存データに影響しない default）
- `lib/lunaria/memory.ts` の `pickMemories` を変更する時は status filter だけにし、他のロジックを触らない

### 6.2 mock データの後始末
- `app/items/page.tsx` の `INITIAL_ITEMS` 定数 → DB 接続後は削除
- `app/character/page.tsx` の `MOCK_STATE` → DB 接続後は削除
- どちらも TODO コメントを書いてあるので grep で見つけられる

### 6.3 仕様書の更新
- spec を変更したら**必ず docs を更新**
- 「コードと spec のズレ」は最大の負債
- spec を変更したら commit message に書く

### 6.4 ストリーミング崩しに注意
- AssistantReply 導入時、既存ストリーミングを壊さないよう **段階導入**
- まず meta 無しで動作確認 → meta 追加 → クライアント反映の順

### 6.5 RLS 漏れ
- 新テーブル（character_states / user_items / life_events）すべて RLS 必須
- migration 内で `enable row level security` + policy の両方を書く

---

## 7. 完了の定義（Codex 復帰後の v1 マイルストーン）

以下が揃ったら v1 完了：
- [ ] Supabase 014〜019 本番適用済み
- [ ] memory candidate 承認/却下フロー動作
- [ ] core_memories への承認反映パイプライン動作
- [ ] character_states + user_items テーブル稼働
- [ ] /items, /character ページが DB 接続
- [ ] gacha 結果が user_items に反映
- [ ] AssistantReply 構造体が chat 経路で動作（expression / motion が立ち絵に反映）
- [ ] /diary Must-A/B/C 反映済み
- [ ] health.ts pool 判定が 41
- [ ] PITY_THRESHOLD 定数化
- [ ] npm run build PASS
- [ ] npm run supabase:verify PASS
- [ ] npm run gacha:verify PASS

---

## 8. 関連
- `docs/STATUS.md`
- `docs/TASK_BOARD.md`
- `lunaria/NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md`（既存の Codex 向け queue、本ドキュメントと併用）
- `lunaria/CLAUDE_HANDOFF_TASKS_2026-05-04.md`（Claude Code 向け、本タスクの起点）
