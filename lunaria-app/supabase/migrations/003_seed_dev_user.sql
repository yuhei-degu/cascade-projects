-- ローカル開発用シードユーザー（Auth なしで DB 保存できるようにする）
-- auth.users に開発用ユーザーを直接挿入（service roleのみ可能）

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role
) values (
  '00000000-0000-0000-0000-000000000001',
  'dev@lunaria.local',
  '',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
) on conflict (id) do nothing;

-- lunaria_users にも挿入
insert into public.lunaria_users (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict do nothing;
