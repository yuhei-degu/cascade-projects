-- 011_add_ai_dev_usage.sql
-- question_bank に ai_dev_usage カラムを追加
-- 「AI開発でどう役立つか」を解説下に表示するための実践ヒント

ALTER TABLE public.question_bank
  ADD COLUMN IF NOT EXISTS ai_dev_usage text;

COMMENT ON COLUMN public.question_bank.ai_dev_usage IS
  'AI開発・実務での活用例。解説の下に「💡 AI開発での実践」として表示する。';
