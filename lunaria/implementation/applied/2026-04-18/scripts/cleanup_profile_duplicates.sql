-- =============================================================
-- cleanup_profile_duplicates.sql
-- =============================================================
-- 目的：Phase A で特定したプロフィール二重管理の 2 行をクリーンアップ
--
-- 対象：
--   1. lunaria_core_memory.memory_key='user_name', content='悠平'
--      → lunaria_user_profile に name として移送してから削除
--   2. lunaria_core_memory.memory_key='user_gender', content='ユーザーの性別: 男性'
--      → user_profile に同値が既存のため単に削除
--
-- 前提：
--   - dev user 1 人分のみ
--   - user_profile は EAV 形式 (field, value, source)
--   - 実行前に Phase A の Q7 で上記 2 行の存在を確認済み
--
-- 実行方法：
--   Supabase SQL Editor に丸ごと貼って実行。BEGIN/COMMIT で囲んであるので
--   途中でエラーが出れば自動ロールバックされる。
--
-- 検証（実行後）：
--   1. lunaria_core_memory に memory_category='profile' の行が 0 件になること
--   2. lunaria_user_profile に field='name', value='悠平' が 1 行存在すること
--   3. lunaria_user_profile に field='gender', value='男性' が 1 行存在すること（既存・不変）
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 事前チェック：想定と違うデータが入っていたら即アボート
-- -------------------------------------------------------------
DO $$
DECLARE
  v_name_count    integer;
  v_gender_count  integer;
  v_profile_count integer;
BEGIN
  -- user_name の core_memory 行が 1 件だけ存在することを確認
  SELECT count(*) INTO v_name_count
    FROM lunaria_core_memory
   WHERE memory_category = 'profile'
     AND memory_key = 'user_name';

  IF v_name_count <> 1 THEN
    RAISE EXCEPTION
      'cleanup aborted: user_name row count = %, expected 1 (Phase A 実測と不一致)',
      v_name_count;
  END IF;

  -- user_gender の core_memory 行が 1 件だけ存在することを確認
  SELECT count(*) INTO v_gender_count
    FROM lunaria_core_memory
   WHERE memory_category = 'profile'
     AND memory_key = 'user_gender';

  IF v_gender_count <> 1 THEN
    RAISE EXCEPTION
      'cleanup aborted: user_gender row count = %, expected 1 (Phase A 実測と不一致)',
      v_gender_count;
  END IF;

  -- user_profile の memory_category='profile' 行が他にないことを確認
  SELECT count(*) INTO v_profile_count
    FROM lunaria_core_memory
   WHERE memory_category = 'profile';

  IF v_profile_count <> 2 THEN
    RAISE EXCEPTION
      'cleanup aborted: memory_category=profile total = %, expected 2',
      v_profile_count;
  END IF;
END $$;

-- -------------------------------------------------------------
-- 1) user_name を user_profile へ移送
-- -------------------------------------------------------------
-- 既に field='name' が user_profile にある場合は INSERT せず、core_memory 側だけ消す
INSERT INTO lunaria_user_profile (user_id, field, value, source)
SELECT cm.user_id, 'name', cm.content, 'setting'
  FROM lunaria_core_memory cm
 WHERE cm.memory_category = 'profile'
   AND cm.memory_key = 'user_name'
   AND NOT EXISTS (
     SELECT 1 FROM lunaria_user_profile up
      WHERE up.user_id = cm.user_id
        AND up.field   = 'name'
   );

-- -------------------------------------------------------------
-- 2) core_memory から profile 相当 2 行を削除
-- -------------------------------------------------------------
DELETE FROM lunaria_core_memory
 WHERE memory_category = 'profile'
   AND memory_key IN ('user_name', 'user_gender');

-- -------------------------------------------------------------
-- 事後チェック：期待状態になっているか検証
-- -------------------------------------------------------------
DO $$
DECLARE
  v_remaining integer;
  v_name_in_profile integer;
BEGIN
  SELECT count(*) INTO v_remaining
    FROM lunaria_core_memory
   WHERE memory_category = 'profile';

  IF v_remaining <> 0 THEN
    RAISE EXCEPTION
      'post-check failed: memory_category=profile remaining = %, expected 0',
      v_remaining;
  END IF;

  SELECT count(*) INTO v_name_in_profile
    FROM lunaria_user_profile
   WHERE field = 'name';

  IF v_name_in_profile < 1 THEN
    RAISE EXCEPTION
      'post-check failed: user_profile.name row count = %, expected >= 1',
      v_name_in_profile;
  END IF;
END $$;

COMMIT;

-- -------------------------------------------------------------
-- 目視確認用（COMMIT 後に流す）
-- -------------------------------------------------------------
-- SELECT field, value, source FROM lunaria_user_profile ORDER BY field;
-- SELECT id, type, memory_key, memory_category, left(content, 40) AS preview
--   FROM lunaria_core_memory
--  ORDER BY created_at DESC;
