-- ルナリア 育成ログ設計 migration 002 (v2)
-- チャッピー案ベース + ルナリア固有フラグを追加

-- ── 1. route_master（ルート定義マスタ）────────────────────────
create table if not exists public.lunaria_route_master (
  route_key   varchar(50) primary key,
  route_name  varchar(100) not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.lunaria_route_master (route_key, route_name, description) values
  ('light_normal',   '通常会話',   'Groq Llamaによる雑談・日常会話'),
  ('light_probe',    '軽い聞き返し', 'テンプレート固定の軽いprobe'),
  ('claude_serious', '深い会話',   'Claude Sonnetによる真剣モード')
on conflict do nothing;

-- ── 2. routing_log 拡張（チャッピー案 + 現行案の融合）──────────
alter table public.lunaria_routing_log
  add column if not exists conversation_id      uuid,
  add column if not exists turn_index           int,
  add column if not exists user_message         text,
  add column if not exists normalized_input     text,
  add column if not exists window_score         int  not null default 0,
  add column if not exists heavy_signal_count   int  not null default 0,
  add column if not exists candidate_routes     jsonb,
  add column if not exists confidence           numeric(5,4),
  add column if not exists selected_template_id text,
  add column if not exists model_used           text,
  add column if not exists prompt_version       varchar(20),
  add column if not exists rules_version        varchar(20),
  add column if not exists reason_summary       text,
  add column if not exists reason_json          jsonb,
  add column if not exists assistant_response   text,
  add column if not exists execution_result     varchar(20) default 'success',
  add column if not exists response_latency_ms  int;

create index if not exists lunaria_log_route_idx
  on public.lunaria_routing_log(route_type);
create index if not exists lunaria_log_created_idx
  on public.lunaria_routing_log(created_at desc);

-- ── 3. routing_review（チャッピー案 + ルナリア固有フラグ）───────
create table if not exists public.lunaria_routing_review (
  id              uuid primary key default gen_random_uuid(),
  routing_log_id  uuid not null references public.lunaria_routing_log(id) on delete cascade,

  -- レビュー主体
  review_source   varchar(20) not null default 'auto'
                  check (review_source in ('human','llm','auto')),
  reviewer_id     varchar(100),

  -- 正誤判定（手動・LLM評価時に埋める）
  is_correct      boolean,
  expected_route  varchar(50) references public.lunaria_route_master(route_key),

  -- エラー分類（チャッピー案の8種）
  error_type      varchar(30) check (error_type in (
                    'false_positive','false_negative',
                    'over_confident','low_confidence',
                    'bad_fallback','unclear_input',
                    'policy_miss','tool_miss'
                  )),
  severity        varchar(20) check (severity in ('low','medium','high','critical')),

  -- ルナリア固有フラグ（現行案から引き継ぎ）
  manual_flag_reason        varchar(20) check (manual_flag_reason in (
                              'too_light','too_heavy','off_topic',
                              'too_long','not_lunaria','good'
                            )),
  user_followup_sentiment   varchar(20) check (user_followup_sentiment in (
                              'escalated','neutral','resolved','dropped'
                            )),
  route_mismatch_suspected  boolean not null default false,
  character_break_suspected boolean not null default false,

  -- 詳細メモ
  review_comment            text,
  improvement_suggestion    text,
  review_payload            jsonb,

  created_at timestamptz not null default now()
);

create index if not exists lunaria_review_log_idx
  on public.lunaria_routing_review(routing_log_id);
create index if not exists lunaria_review_correct_idx
  on public.lunaria_routing_review(is_correct);
create index if not exists lunaria_review_error_idx
  on public.lunaria_routing_review(error_type);
create index if not exists lunaria_review_flag_idx
  on public.lunaria_routing_review(route_mismatch_suspected, character_break_suspected);

-- ── 4. RLS ─────────────────────────────────────────────────────
alter table public.lunaria_route_master    enable row level security;
alter table public.lunaria_routing_review  enable row level security;

create policy "lunaria_route_master_read"
  on public.lunaria_route_master for select using (true);

create policy "lunaria_own_review"
  on public.lunaria_routing_review for all using (
    exists (
      select 1 from public.lunaria_routing_log l
      where l.id = routing_log_id and l.user_id = auth.uid()
    )
  );

-- ── 5. 改善分析クエリ例（コメント）──────────────────────────────
-- ルートごとの正確率
-- select rl.route_type, count(*) total,
--   round(avg(case when rr.is_correct then 1.0 else 0.0 end)*100,2) accuracy_pct
-- from lunaria_routing_log rl
-- join lunaria_routing_review rr on rr.routing_log_id = rl.id
-- group by rl.route_type;

-- 高confidence なのに外したケース
-- select rl.user_message, rl.confidence, rr.expected_route, rr.error_type
-- from lunaria_routing_log rl
-- join lunaria_routing_review rr on rr.routing_log_id = rl.id
-- where rr.is_correct = false and rl.confidence >= 0.8
-- order by rl.confidence desc;

-- rules_versionごとの精度推移
-- select rl.rules_version, count(*) total,
--   round(avg(case when rr.is_correct then 1.0 else 0.0 end)*100,2) accuracy_pct
-- from lunaria_routing_log rl
-- join lunaria_routing_review rr on rr.routing_log_id = rl.id
-- group by rl.rules_version order by rl.rules_version;
