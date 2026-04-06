// lib/types/database.ts
// RamenFlow — 共通型定義
// このファイルをすべてのコンポーネント・アクション・ユーティリティが参照する

// ============================================================
// Enums（DB の CHECK 制約と完全一致させること）
// ============================================================

export type StoreStatus = 'open' | 'preparing' | 'closed'
export type TableStatus = 'empty' | 'occupied' | 'billing'
export type OrderStatus = 'active' | 'completed' | 'cancelled'
export type OrderItemStatus = 'new' | 'cooking' | 'ready' | 'delivered'
export type StaffRole = 'owner' | 'staff'
export type TableType = 'counter' | 'table' | 'booth'

// ============================================================
// Raw DB rows（Supabase から返ってくる生の型）
// ============================================================

export interface StoreSettings {
  id: string
  store_name: string
  description: string | null
  is_open: boolean
  status: StoreStatus
  staff_count: number
  parallel_cooking_capacity: number
  estimated_wait_minutes: number
  created_at: string
  updated_at: string
}

export interface Table {
  id: string
  table_number: string
  table_type: TableType
  capacity: number
  status: TableStatus
  qr_code_path: string | null
  created_at: string
}

export interface MenuCategory {
  id: string
  name: string
  display_order: number
  is_active: boolean
}

export interface MenuItem {
  id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  cooking_time_minutes: number
  is_active: boolean
  is_sold_out: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface MenuOptionGroup {
  id: string
  menu_item_id: string
  name: string
  is_required: boolean
  display_order: number
}

export interface MenuOption {
  id: string
  group_id: string
  name: string
  price_delta: number
  display_order: number
}

export interface Order {
  id: string
  table_id: string
  status: OrderStatus
  total_amount: number
  created_at: string
  updated_at: string
}

export interface SelectedOption {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_delta: number
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  status: OrderItemStatus
  selected_options: SelectedOption[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StaffProfile {
  id: string
  name: string
  role: StaffRole
  is_active: boolean
  created_at: string
}

// ============================================================
// Joined / Computed types（クエリで JOIN して使う型）
// ============================================================

export interface MenuOptionWithGroup extends MenuOption {
  group: MenuOptionGroup
}

export interface MenuOptionGroupWithOptions extends MenuOptionGroup {
  options: MenuOption[]
}

export interface MenuItemWithOptions extends MenuItem {
  option_groups: MenuOptionGroupWithOptions[]
  category?: Pick<MenuCategory, 'id' | 'name'>
}

export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItemWithOptions[]
}

export interface OrderItemWithMenu extends OrderItem {
  menu_item: Pick<MenuItem, 'id' | 'name' | 'cooking_time_minutes' | 'image_url'>
}

export interface OrderWithItems extends Order {
  order_items: OrderItemWithMenu[]
  table: Pick<Table, 'id' | 'table_number'>
}

/** 厨房ビュー用: 注文アイテムに加えて席番号などを含む */
export interface KitchenItem extends OrderItem {
  menu_item_name: string
  cooking_time_minutes: number
  table_number: string
  order_created_at: string
}

// ============================================================
// Cart（クライアント側のみ・DB に直接対応しない）
// ============================================================

export interface CartItem {
  /** フロント内部の一意ID（menuItemId + オプションの組み合わせで生成） */
  cartItemId: string
  menuItemId: string
  menuItemName: string
  unitPrice: number
  quantity: number
  selectedOptions: SelectedOption[]
  notes?: string
}

export interface CartState {
  tableId: string
  tableNumber: string
  items: CartItem[]
}

export type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; cartItemId: string }
  | { type: 'UPDATE_QUANTITY'; cartItemId: string; quantity: number }
  | { type: 'CLEAR' }

// ============================================================
// Server Action の戻り値パターン（統一）
// ============================================================

export type ActionResult<T = undefined> =
  | (T extends undefined ? { success: true } : { success: true; data: T })
  | { error: string }

// ============================================================
// フォーム入力型
// ============================================================

export interface MenuItemFormInput {
  name: string
  description?: string
  price: number
  cooking_time_minutes: number
  category_id?: string
  image_url?: string
  is_active: boolean
  is_sold_out: boolean
  display_order?: number
}

export interface TableFormInput {
  table_number: string
  table_type: TableType
  capacity: number
}

export interface StoreSettingsFormInput {
  store_name: string
  description?: string
  staff_count: number
  parallel_cooking_capacity: number
}

export interface SubmitOrderInput {
  tableId: string
  items: {
    menuItemId: string
    quantity: number
    unitPrice: number
    selectedOptions: SelectedOption[]
    notes?: string
  }[]
}

// ============================================================
// 待ち時間計算用の入力型
// ============================================================

export interface WaitTimeParams {
  pendingItems: Array<{
    status: 'new' | 'cooking'
    cooking_time_minutes: number
  }>
  staffCount: number
  parallelCapacity: number
}

// ============================================================
// ステータスのラベル・カラーマッピング（UI 表示用）
// ============================================================

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  new:       '受付済み',
  cooking:   '調理中',
  ready:     '提供待ち',
  delivered: '提供済み',
}

export const ORDER_ITEM_STATUS_COLORS: Record<OrderItemStatus, string> = {
  new:       'bg-status-new text-white',
  cooking:   'bg-status-cooking text-white',
  ready:     'bg-status-ready text-brand-dark',
  delivered: 'bg-status-delivered text-white',
}

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  empty:    '空席',
  occupied: '使用中',
  billing:  '会計待ち',
}

export const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
  empty:    'bg-status-delivered/20 border-status-delivered text-status-delivered',
  occupied: 'bg-status-alert/20 border-status-alert text-status-alert',
  billing:  'bg-status-ready/30 border-status-ready text-brand-dark',
}

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  open:      '営業中',
  preparing: '準備中',
  closed:    '本日は閉店しました',
}

// 次のステータスへの遷移マップ（order_items）
export const NEXT_ORDER_ITEM_STATUS: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  new:     'cooking',
  cooking: 'ready',
  ready:   'delivered',
}

export const NEXT_ORDER_ITEM_STATUS_LABEL: Partial<Record<OrderItemStatus, string>> = {
  new:     '調理開始',
  cooking: '調理完了',
  ready:   '提供済み',
}
