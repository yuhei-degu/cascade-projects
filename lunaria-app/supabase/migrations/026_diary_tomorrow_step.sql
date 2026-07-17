-- migration 026: tomorrow step (pivot Phase 2)
-- Apply after 025_work_items.sql.
--
-- 日記生成時に work_items(直近7日) + unresolved_issues から「明日の一手」を1件生成し、
-- 翌朝の第一声で LLM 呼び出しなしに即返すための保存先。
-- 列がない環境では生成をスキップするだけで日記自体は壊れない。

alter table public.lunaria_diary_logs
  add column if not exists tomorrow_step text;
