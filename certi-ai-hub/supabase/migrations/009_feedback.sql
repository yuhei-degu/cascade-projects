-- 009_feedback.sql
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  email      text,
  category   text not null default 'general',
  message    text not null,
  page_url   text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- 誰でも投稿可能（匿名含む）
create policy "anyone_insert_feedback"
  on public.feedback for insert
  with check (true);

-- 管理者のみ閲覧（service roleで確認）
create policy "service_role_read_feedback"
  on public.feedback for select
  using (false); -- フロントからは読めない。Supabase Tableで直接確認
