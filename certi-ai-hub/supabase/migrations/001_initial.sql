-- ============================================================
-- 001_initial.sql — Certi-AI Hub 初期スキーマ + シード
-- Agent: CLAUDE-ARCHITECT | Date: 2026-03-08
-- ============================================================

create extension if not exists "pgcrypto";

-- ── question_bank ─────────────────────────────────────────
create table public.question_bank (
  id           uuid primary key default gen_random_uuid(),
  module       text not null check (module in ('SC','AIF')),
  category     text not null,
  difficulty   int  not null check (difficulty between 1 and 3),
  question     text not null,
  options      jsonb,
  answer       text not null,
  explanation  text not null,
  code_snippet text,
  synergy_hint text,
  tags         text[] default '{}',
  created_at   timestamptz default now()
);

-- ── exam_sessions ─────────────────────────────────────────
create table public.exam_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  module       text not null check (module in ('SC','AIF','MIXED')),
  status       text not null default 'active'
    check (status in ('active','completed','abandoned')),
  started_at   timestamptz default now(),
  finished_at  timestamptz,
  time_limit   int  not null default 9000,
  question_ids uuid[] not null default '{}',
  answers      jsonb not null default '{}',
  score        int  not null default 0,
  total        int  not null default 0
);

-- ── user_answers ──────────────────────────────────────────
create table public.user_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.question_bank(id),
  session_id  uuid references public.exam_sessions(id) on delete set null,
  is_correct  boolean not null,
  answered_at timestamptz default now(),
  time_spent  int default 0
);

-- ── synergy_links ─────────────────────────────────────────
create table public.synergy_links (
  id              uuid primary key default gen_random_uuid(),
  sc_question_id  uuid not null references public.question_bank(id),
  aws_question_id uuid not null references public.question_bank(id),
  link_type       text not null
    check (link_type in ('concept','implementation','threat_countermeasure')),
  description     text not null,
  unique(sc_question_id, aws_question_id)
);

-- ── user_progress ─────────────────────────────────────────
create table public.user_progress (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  sc_accuracy     float not null default 0,
  aws_accuracy    float not null default 0,
  weak_categories text[] default '{}',
  study_streak    int   not null default 0,
  last_studied_at timestamptz,
  exam_date_sc    date,
  exam_date_aws   date,
  updated_at      timestamptz default now()
);

-- ── インデックス ──────────────────────────────────────────
create index on public.question_bank (module, category);
create index on public.question_bank (difficulty);
create index on public.question_bank using gin(tags);
create index on public.user_answers (user_id, question_id);
create index on public.exam_sessions (user_id, status);

-- ── RLS ──────────────────────────────────────────────────
alter table public.question_bank  enable row level security;
alter table public.exam_sessions  enable row level security;
alter table public.user_answers   enable row level security;
alter table public.synergy_links  enable row level security;
alter table public.user_progress  enable row level security;

create policy "anyone_read_questions" on public.question_bank for select using (true);
create policy "anyone_read_synergy"   on public.synergy_links  for select using (true);
create policy "own_sessions"  on public.exam_sessions for all using (auth.uid()=user_id);
create policy "own_answers"   on public.user_answers  for all using (auth.uid()=user_id);
create policy "own_progress"  on public.user_progress for all using (auth.uid()=user_id);

-- ── 進捗自動更新トリガー ──────────────────────────────────
create or replace function public.update_user_progress()
returns trigger language plpgsql security definer as $$
declare v_sc float; v_aws float; v_weak text[];
begin
  select coalesce(avg(case when ua.is_correct then 1.0 else 0.0 end),0) into v_sc
  from public.user_answers ua join public.question_bank qb on ua.question_id=qb.id
  where ua.user_id=new.user_id and qb.module='SC';

  select coalesce(avg(case when ua.is_correct then 1.0 else 0.0 end),0) into v_aws
  from public.user_answers ua join public.question_bank qb on ua.question_id=qb.id
  where ua.user_id=new.user_id and qb.module='AIF';

  select array_agg(t.category) into v_weak from (
    select qb.category,
           avg(case when ua.is_correct then 1.0 else 0.0 end) as acc
    from public.user_answers ua
    join public.question_bank qb on ua.question_id=qb.id
    where ua.user_id=new.user_id
    group by qb.category having avg(case when ua.is_correct then 1.0 else 0.0 end)<0.5
  ) t;

  insert into public.user_progress(user_id,sc_accuracy,aws_accuracy,weak_categories,last_studied_at,updated_at)
  values(new.user_id,v_sc,v_aws,coalesce(v_weak,'{}'),now(),now())
  on conflict(user_id) do update set
    sc_accuracy=excluded.sc_accuracy, aws_accuracy=excluded.aws_accuracy,
    weak_categories=excluded.weak_categories, last_studied_at=excluded.last_studied_at,
    updated_at=excluded.updated_at;
  return new;
end;$$;

create trigger trg_update_progress
  after insert on public.user_answers
  for each row execute function public.update_user_progress();

-- ── シードデータ ──────────────────────────────────────────
insert into public.question_bank(module,category,difficulty,question,options,answer,explanation,synergy_hint,tags) values
('SC','ai_threat',2,
 '攻撃者がLLMへの入力に悪意ある指示を埋め込み、本来の制約を無視させる攻撃手法はどれか。',
 '[{"key":"A","text":"プロンプトインジェクション"},{"key":"B","text":"モデル反転攻撃"},{"key":"C","text":"データポイズニング"},{"key":"D","text":"メンバーシップ推論攻撃"}]',
 'A','プロンプトインジェクションは、LLMへの入力テキストに悪意ある命令を混入させ、システムプロンプトや安全制約を迂回させる攻撃です。',
 'AWSではBedrock GuardrailsのコンテンツフィルタリングでInput/Outputを検査し対策できます（AIF: bedrock）',
 ARRAY['ai_threat','llm','injection']),

('SC','threat',2,
 'SQLインジェクション攻撃を防ぐために最も効果的な対策はどれか。',
 '[{"key":"A","text":"入力値の文字数制限"},{"key":"B","text":"プリペアドステートメントの使用"},{"key":"C","text":"エラーメッセージの非表示"},{"key":"D","text":"WAFの導入"}]',
 'B','プリペアドステートメント（パラメータ化クエリ）はSQLの構造と入力データを分離するため、最も根本的な対策です。',
 'AWS RDS Proxyと最小権限IAMロールで被害を限定化できます（AIF: sdk）',
 ARRAY['sql_injection','secure_coding']),

('SC','crypto',1,
 '公開鍵暗号方式において、送信者が受信者のデータを暗号化するために使用する鍵はどれか。',
 '[{"key":"A","text":"送信者の秘密鍵"},{"key":"B","text":"送信者の公開鍵"},{"key":"C","text":"受信者の秘密鍵"},{"key":"D","text":"受信者の公開鍵"}]',
 'D','公開鍵暗号方式では暗号化に受信者の公開鍵を使い、復号に受信者の秘密鍵を使います。',
 null, ARRAY['crypto','pki']),

('AIF','bedrock',2,
 'Amazon BedrockでLLMアプリケーションのプロンプトインジェクション対策を実装する機能はどれか。',
 '[{"key":"A","text":"Amazon Bedrock Agents"},{"key":"B","text":"Amazon Bedrock Guardrails"},{"key":"C","text":"Amazon Bedrock Knowledge Bases"},{"key":"D","text":"Amazon Bedrock Model Evaluation"}]',
 'B','Amazon Bedrock Guardrailsは有害コンテンツフィルタ・機密情報マスキング・プロンプト攻撃検知などを設定できます。',
 'SC科目のAI脅威（プロンプトインジェクション）のAWS実装版です（SC: ai_threat）',
 ARRAY['bedrock','guardrails']),

('AIF','responsible_ai',1,
 'AWSが定義する責任あるAI（Responsible AI）の柱に含まれないものはどれか。',
 '[{"key":"A","text":"公平性（Fairness）"},{"key":"B","text":"透明性（Transparency）"},{"key":"C","text":"収益性（Profitability）"},{"key":"D","text":"プライバシー（Privacy）"}]',
 'C','AWSのResponsible AIの柱は公平性・説明可能性・プライバシー・安全性・透明性・堅牢性の6つです。収益性は含まれません。',
 'SC管理系（情報セキュリティポリシー）とPrivacyの柱は直結します（SC: management）',
 ARRAY['responsible_ai','ethics']);

-- シナジーリンク（プロンプトインジェクション ↔ Bedrock Guardrails）
insert into public.synergy_links(sc_question_id, aws_question_id, link_type, description)
select sc.id, aws.id, 'threat_countermeasure',
  'SC: プロンプトインジェクション攻撃の理論 ↔ AWS: Bedrock Guardrailsによる実装防御'
from public.question_bank sc, public.question_bank aws
where sc.category='ai_threat' and aws.category='bedrock'
limit 1;
