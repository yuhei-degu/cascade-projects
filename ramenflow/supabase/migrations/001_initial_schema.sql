-- supabase/migrations/001_initial_schema.sql
-- RamenFlow 初期スキーマ
-- 実行順: このファイル → 002_rls.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. store_settings（シングルトン設計）
-- ============================================================
CREATE TABLE store_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  store_name text NOT NULL DEFAULT 'ラーメン店',
  description text,
  is_open boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'closed'
    CONSTRAINT store_settings_status_check
    CHECK (status IN ('open', 'preparing', 'closed')),
  staff_count integer NOT NULL DEFAULT 1
    CONSTRAINT store_settings_staff_count_check CHECK (staff_count >= 1),
  parallel_cooking_capacity integer NOT NULL DEFAULT 3
    CONSTRAINT parallel_capacity_check CHECK (parallel_cooking_capacity >= 1),
  estimated_wait_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- シングルトンレコードを挿入
INSERT INTO store_settings (id, store_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'ラーメン店')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. tables（席）
-- ============================================================
CREATE TABLE tables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number text NOT NULL,
  table_type text NOT NULL DEFAULT 'counter'
    CONSTRAINT tables_type_check
    CHECK (table_type IN ('counter', 'table', 'booth')),
  capacity integer NOT NULL DEFAULT 2
    CONSTRAINT tables_capacity_check CHECK (capacity >= 1),
  status text NOT NULL DEFAULT 'empty'
    CONSTRAINT tables_status_check
    CHECK (status IN ('empty', 'occupied', 'billing')),
  qr_code_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tables_table_number_unique UNIQUE (table_number)
);

-- ============================================================
-- 3. menu_categories（メニューカテゴリ）
-- ============================================================
CREATE TABLE menu_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

-- デフォルトカテゴリを挿入
INSERT INTO menu_categories (name, display_order) VALUES
  ('ラーメン', 0),
  ('サイドメニュー', 1),
  ('ドリンク', 2),
  ('トッピング', 3);

-- ============================================================
-- 4. menu_items（メニュー商品）
-- ============================================================
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL
    CONSTRAINT menu_items_price_check CHECK (price >= 0),
  image_url text,
  cooking_time_minutes integer NOT NULL DEFAULT 5
    CONSTRAINT cooking_time_check CHECK (cooking_time_minutes >= 1 AND cooking_time_minutes <= 120),
  is_active boolean NOT NULL DEFAULT true,
  is_sold_out boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. menu_option_groups（オプショングループ）
-- ============================================================
CREATE TABLE menu_option_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0
);

-- ============================================================
-- 6. menu_options（オプション選択肢）
-- ============================================================
CREATE TABLE menu_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES menu_option_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_delta integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0
);

-- ============================================================
-- 7. orders（注文）
-- ============================================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id uuid NOT NULL REFERENCES tables(id),
  status text NOT NULL DEFAULT 'active'
    CONSTRAINT orders_status_check
    CHECK (status IN ('active', 'completed', 'cancelled')),
  total_amount integer NOT NULL DEFAULT 0
    CONSTRAINT orders_total_check CHECK (total_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- パフォーマンス用インデックス
CREATE INDEX orders_table_id_idx ON orders(table_id);
CREATE INDEX orders_status_idx ON orders(status);

-- ============================================================
-- 8. order_items（注文商品）
-- ============================================================
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id),
  quantity integer NOT NULL DEFAULT 1
    CONSTRAINT order_items_quantity_check CHECK (quantity >= 1),
  unit_price integer NOT NULL
    CONSTRAINT order_items_price_check CHECK (unit_price >= 0),
  status text NOT NULL DEFAULT 'new'
    CONSTRAINT order_items_status_check
    CHECK (status IN ('new', 'cooking', 'ready', 'delivered')),
  selected_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- パフォーマンス用インデックス
CREATE INDEX order_items_order_id_idx ON order_items(order_id);
CREATE INDEX order_items_status_idx ON order_items(status);
CREATE INDEX order_items_menu_item_id_idx ON order_items(menu_item_id);

-- ============================================================
-- 9. staff_profiles（スタッフ）
-- ============================================================
CREATE TABLE staff_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff'
    CONSTRAINT staff_profiles_role_check
    CHECK (role IN ('owner', 'staff')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Realtime 有効化（Supabase ダッシュボードでも設定すること）
-- ============================================================
ALTER TABLE store_settings REPLICA IDENTITY FULL;
ALTER TABLE tables REPLICA IDENTITY FULL;
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER TABLE order_items REPLICA IDENTITY FULL;

-- Realtime publication に追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE
      store_settings, tables, orders, order_items;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE
      store_settings, tables, orders, order_items;
  END IF;
END $$;
