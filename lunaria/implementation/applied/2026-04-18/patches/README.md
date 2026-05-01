# patches/ の使い方

このディレクトリの `.patch.md` は「こう書き換える」を意図ベースでまとめたもの。
**line-level diff ではない**ので、実ファイルの関数名／変数名／import 構造に合わせて適用時にマージする。

## 適用順（推奨）

1. `profile.patch.md` → `lib/lunaria/profile.ts`
2. `memory.patch.md`  → `lib/lunaria/memory.ts`
3. `prompt-builder.patch.md` → `lib/lunaria/prompt-builder.ts`
4. `extract.patch.md` → `lib/lunaria/extract.ts`

各パッチ適用後に `npx tsc --noEmit` で型エラーがないか確認。

## 共通前提（v2・2026-04-18 更新）

- Supabase クライアントは `lib/supabase.ts` の `db` or `supabase` を想定
- **スキーマ変更は無し**。007 / 008 のマイグレーションは破棄済み（DEPRECATED）
- `lunaria_user_profile` は **EAV**：`(id, user_id, field, value, source, created_at, updated_at)`
- `lunaria_core_memory` の本文列は `content`、重要度は `score`、参照時刻は `last_seen`
- プロフィール相当行は `memory_category = 'profile'` で分離。`pickMemories` はこれを除外する
- pending は既存 `lunaria_pending_profile_updates`、履歴は既存 `lunaria_profile_archive` を使用
- 適用前に `scripts/cleanup_profile_duplicates.sql` を 1 度流してから実装に入る
