-- 008_daily_usage_rpc.sql — 日次使用数のインクリメント関数

create or replace function public.increment_daily_usage(
  p_user_id uuid,
  p_date    date,
  p_count   int
)
returns void language plpgsql security definer as $$
begin
  insert into public.daily_usage(user_id, date, count)
  values (p_user_id, p_date, p_count)
  on conflict (user_id, date)
  do update set count = public.daily_usage.count + p_count;
end;
$$;
