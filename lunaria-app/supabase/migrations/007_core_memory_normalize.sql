-- lunaria_core_memory に memory_key / memory_category を追加
alter table public.lunaria_core_memory
  add column if not exists memory_key      text,
  add column if not exists memory_category text,
  add column if not exists updated_at      timestamptz not null default now();

-- memory_key がある場合はユニーク制約（user_id + memory_key で1件に絞る）
create unique index if not exists lunaria_core_memory_key_idx
  on public.lunaria_core_memory(user_id, memory_key)
  where memory_key is not null;

-- 既存データの正規化
-- 1. 断片語「男性」を削除
delete from public.lunaria_core_memory
  where content = '男性' and type = 'value';

-- 2. 「ユーザーの性別: 男性」に memory_key を付与
update public.lunaria_core_memory
  set memory_key = 'user_gender', memory_category = 'profile'
  where content = 'ユーザーの性別: 男性';

-- 3. name タイプに memory_key を付与
update public.lunaria_core_memory
  set memory_key = 'user_name', memory_category = 'profile'
  where type = 'name';
