-- =============================================================
-- phase_a_inspect.sql
-- 目的：Phase A「現状スキーマの確認」を 1 ファイルにまとめたもの
-- 作成日：2026-04-18
-- 安全性：すべて SELECT のみ。破壊的変更なし。
-- 使い方：
--   Supabase SQL Editor に丸ごと貼って実行してもよいし、
--   A-1 / A-2 / A-3 / A-4 のブロック単位で範囲選択して実行してもよい。
--   A-3 の最後のクエリだけは A-2 で判明した本文列名に合わせて
--   書き換えてから流すこと（デフォルトは `text` と仮定）。
-- 記録：結果は APPLY_CHECKLIST.md の「実測値ログ」節に追記する。
-- =============================================================


-- ================================================================
-- A-1. lunaria_user_profile の現在カラム
-- 見るもの：gender の data_type / udt_name、006 で追加された列
-- ================================================================
SELECT column_name, data_type, udt_name, column_default, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'lunaria_user_profile'
 ORDER BY ordinal_position;


-- ================================================================
-- A-2. lunaria_core_memory の現在カラム
-- 見るもの：
--   - 本文列名（text / content / memory_text / その他）
--   - user_id 列が本当に user_id か
--   - created_at / importance / last_used_at の有無
--   - superseded_by_profile が未だ存在しないこと
-- ================================================================
SELECT column_name, data_type, udt_name, column_default, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'lunaria_core_memory'
 ORDER BY ordinal_position;


-- ================================================================
-- A-3. データ量スナップショット
--   3-1) profile の直近レコード
--   3-2) core_memory 総件数
--   3-3) 属性重複候補の目視（★本文列名を A-2 の結果に合わせる）
-- ================================================================

-- 3-1) 現在の profile（直近 5 件）
SELECT *
  FROM lunaria_user_profile
 ORDER BY updated_at DESC NULLS LAST
 LIMIT 5;

-- 3-2) core_memory 総件数
SELECT count(*) AS total_memories
  FROM lunaria_core_memory;

-- 3-3) 属性重複候補（ILIKE）
-- ✅ 2026-04-18：A-2 で本文列名が `content` と判明したため書き換え済み。
SELECT id,
       user_id,
       type,
       memory_category,
       left(content, 60) AS preview,
       created_at
  FROM lunaria_core_memory
 WHERE content ILIKE ANY (
         ARRAY['%男%','%女%','%エンジニア%','%SES%','%会社員%','%フリーランス%']
       )
 ORDER BY created_at DESC
 LIMIT 50;


-- ================================================================
-- A-4. 既存マイグレーションの適用状況
-- 無ければ手動ログで代用。エラーが出ても無視してよい。
-- ================================================================
SELECT version, name, executed_at
  FROM supabase_migrations.schema_migrations
 ORDER BY version DESC
 LIMIT 10;


-- ================================================================
-- （おまけ）superseded_by_profile がまだ存在しないことを一発で確認
-- ================================================================
SELECT EXISTS (
  SELECT 1
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'lunaria_core_memory'
     AND column_name  = 'superseded_by_profile'
) AS superseded_column_already_exists;
