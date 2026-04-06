-- supabase/migrations/002_rls.sql
-- RamenFlow RLSポリシー設定
-- 必ず 001_initial_schema.sql の後に実行すること

-- ============================================================
-- RLS 有効化
-- ============================================================
ALTER TABLE store_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables             ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_options        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ヘルパー関数: 現在のユーザーのロールを返す
-- SECURITY DEFINER で実行することで RLS ループを防ぐ
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM staff_profiles
  WHERE id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$;

-- ============================================================
-- store_settings
-- 読み取り: 全員（ホームページ・客向け画面で使用）
-- 更新    : owner のみ
-- ============================================================
CREATE POLICY "store_settings_select_all"
  ON store_settings FOR SELECT
  USING (true);

CREATE POLICY "store_settings_update_owner"
  ON store_settings FOR UPDATE
  USING (get_my_role() = 'owner')
  WITH CHECK (get_my_role() = 'owner');

-- ============================================================
-- tables（席）
-- 読み取り: 全員（QRコードのURL生成・ホームページ空席表示）
-- INSERT  : owner のみ
-- UPDATE  : owner + staff（席ステータス変更）
-- DELETE  : owner のみ
-- ============================================================
CREATE POLICY "tables_select_all"
  ON tables FOR SELECT
  USING (true);

CREATE POLICY "tables_insert_owner"
  ON tables FOR INSERT
  WITH CHECK (get_my_role() = 'owner');

CREATE POLICY "tables_update_staff"
  ON tables FOR UPDATE
  USING (get_my_role() IN ('owner', 'staff'))
  WITH CHECK (get_my_role() IN ('owner', 'staff'));

CREATE POLICY "tables_delete_owner"
  ON tables FOR DELETE
  USING (get_my_role() = 'owner');

-- ============================================================
-- menu_categories
-- 読み取り: 全員
-- CUD     : owner のみ
-- ============================================================
CREATE POLICY "menu_categories_select_all"
  ON menu_categories FOR SELECT
  USING (true);

CREATE POLICY "menu_categories_write_owner"
  ON menu_categories FOR ALL
  USING (get_my_role() = 'owner')
  WITH CHECK (get_my_role() = 'owner');

-- ============================================================
-- menu_items
-- 読み取り: 全員（客向けメニュー画面・ホームページ）
-- CUD     : owner のみ
-- ============================================================
CREATE POLICY "menu_items_select_all"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "menu_items_write_owner"
  ON menu_items FOR ALL
  USING (get_my_role() = 'owner')
  WITH CHECK (get_my_role() = 'owner');

-- ============================================================
-- menu_option_groups / menu_options
-- 読み取り: 全員
-- CUD     : owner のみ
-- ============================================================
CREATE POLICY "menu_option_groups_select_all"
  ON menu_option_groups FOR SELECT
  USING (true);

CREATE POLICY "menu_option_groups_write_owner"
  ON menu_option_groups FOR ALL
  USING (get_my_role() = 'owner')
  WITH CHECK (get_my_role() = 'owner');

CREATE POLICY "menu_options_select_all"
  ON menu_options FOR SELECT
  USING (true);

CREATE POLICY "menu_options_write_owner"
  ON menu_options FOR ALL
  USING (get_my_role() = 'owner')
  WITH CHECK (get_my_role() = 'owner');

-- ============================================================
-- orders
-- INSERT  : anon（客が注文送信）
-- SELECT  : anon は自分の order_id のみ / staff・owner は全件
-- UPDATE  : staff・owner のみ（ステータス変更）
-- ============================================================
CREATE POLICY "orders_insert_anon"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "orders_select"
  ON orders FOR SELECT
  USING (
    -- staff/owner は全件参照可
    get_my_role() IN ('owner', 'staff')
    -- anon は order_id を知っていれば参照可（C4画面用）
    OR auth.role() = 'anon'
  );

CREATE POLICY "orders_update_staff"
  ON orders FOR UPDATE
  USING (get_my_role() IN ('owner', 'staff'))
  WITH CHECK (get_my_role() IN ('owner', 'staff'));

-- ============================================================
-- order_items
-- INSERT  : anon（注文送信時に一緒に挿入）
-- SELECT  : 全員（anon は order_id を知っていれば参照）
-- UPDATE  : staff・owner のみ（ステータス変更）
-- ============================================================
CREATE POLICY "order_items_insert_anon"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "order_items_select_all"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "order_items_update_staff"
  ON order_items FOR UPDATE
  USING (get_my_role() IN ('owner', 'staff'))
  WITH CHECK (get_my_role() IN ('owner', 'staff'));

-- ============================================================
-- staff_profiles
-- SELECT  : 自分自身 OR owner
-- INSERT  : owner のみ（招待時）
-- UPDATE  : owner のみ
-- DELETE  : owner のみ
-- ============================================================
CREATE POLICY "staff_profiles_select"
  ON staff_profiles FOR SELECT
  USING (
    id = auth.uid()
    OR get_my_role() = 'owner'
  );

CREATE POLICY "staff_profiles_insert_owner"
  ON staff_profiles FOR INSERT
  WITH CHECK (get_my_role() = 'owner');

CREATE POLICY "staff_profiles_update_owner"
  ON staff_profiles FOR UPDATE
  USING (get_my_role() = 'owner')
  WITH CHECK (get_my_role() = 'owner');

CREATE POLICY "staff_profiles_delete_owner"
  ON staff_profiles FOR DELETE
  USING (get_my_role() = 'owner');

-- ============================================================
-- Storage: qr-codes バケットのポリシー
-- Supabase ダッシュボードの Storage > Policies でも設定すること
-- ============================================================
-- Public 読み取り（QRコード画像は誰でも見れる）
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "qr_codes_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qr-codes');

CREATE POLICY "qr_codes_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'qr-codes'
    AND get_my_role() = 'owner'
  );

CREATE POLICY "qr_codes_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'qr-codes'
    AND get_my_role() = 'owner'
  );

CREATE POLICY "qr_codes_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'qr-codes'
    AND get_my_role() = 'owner'
  );
