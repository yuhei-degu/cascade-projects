<!--
@@AGENT_HANDOFF_METADATA@@
project: certi-ai-hub
last_agent: CLAUDE-ARCHITECT
phase: DESIGN_COMPLETE
key_decisions:
  - Supabase RLS: 全テーブルにuser_id制約
  - 問題データ: question_bank テーブルで SC/AIF を type で分離
  - シナジー: synergy_links テーブルで sc_question_id ↔ aws_question_id を多対多
  - AI呼び出し: サーバーサイドAPIルート経由のみ（クライアントから直接叩かない）
  - セッション: exam_sessions テーブルで中断再開対応
@@END_METADATA@@
-->

# ARCHITECTURE.md — Certi-AI Hub システムアーキテクチャ

## システム構成図

```
[Browser]
    │
    ├── Next.js 15 (Vercel)
    │   ├── App Router (RSC + Client Components)
    │   ├── /sc-module     ← 支援士問題
    │   ├── /aws-module    ← AIF問題
    │   ├── /common/exam   ← CBT模擬試験エンジン
    │   ├── /common/calendar
    │   └── /api/*         ← API Routes (サーバーサイド)
    │         ├── /api/questions
    │         ├── /api/exam
    │         └── /api/ai/*  → Anthropic API
    │
    ├── Supabase
    │   ├── PostgreSQL     ← 問題DB・進捗・セッション
    │   ├── Auth           ← Google/GitHub OAuth
    │   └── Storage        ← 解説画像
    │
    └── Anthropic API (claude-haiku) ← サーバーサイドのみ
```

## ディレクトリ構造

```
certi-ai-hub/
├── ai-memory/              ← 🧠 AIエージェント共有メモリ
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx           ← LP
│   │   │   ├── sc-module/page.tsx
│   │   │   ├── aws-module/page.tsx
│   │   │   └── common/
│   │   │       ├── exam/page.tsx
│   │   │       └── calendar/page.tsx
│   │   ├── (auth)/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── progress/page.tsx
│   │   └── api/
│   │       ├── questions/route.ts
│   │       ├── exam/route.ts
│   │       ├── exam/[sessionId]/route.ts
│   │       └── ai/
│   │           ├── hint/route.ts
│   │           └── analysis/route.ts
│   ├── components/
│   │   ├── exam/
│   │   │   ├── QuestionCard.tsx    ← 問題表示（SC/AIF共通）
│   │   │   ├── ExamTimer.tsx       ← 残り時間
│   │   │   ├── AnswerForm.tsx      ← 択一/記述フォーム
│   │   │   └── ResultPanel.tsx     ← 採点・解説
│   │   ├── lab/
│   │   │   ├── SqlInjectionLab.tsx
│   │   │   ├── PromptInjectionLab.tsx
│   │   │   └── CspSimulator.tsx
│   │   ├── synergy/
│   │   │   └── SynergyLink.tsx     ← SC↔AWS相互リンク
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Sidebar.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           ← ブラウザ用
│   │   │   └── server.ts           ← サーバー用
│   │   ├── ai/
│   │   │   ├── hint.ts             ← ヒント生成
│   │   │   └── analysis.ts         ← 弱点分析
│   │   └── exam/
│   │       └── engine.ts           ← 採点・セッション管理
│   └── types/
│       └── index.ts
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
└── tests/
```

## データベース設計（全テーブル）

### question_bank — 問題マスター
```sql
id          uuid PK
module      text  -- 'SC' | 'AIF'
category    text  -- SC: 'crypto'|'threat'|'coding'|'ai_threat'
                  -- AIF: 'bedrock'|'sagemaker'|'responsible_ai'|'sdk'
difficulty  int   -- 1(易)〜3(難)
question    text  -- 問題文（長文含む）
options     jsonb -- [{"key":"A","text":"..."},...]（択一）or null（記述）
answer      text  -- 正解キーまたは正解テキスト
explanation text  -- 解説
code_snippet text -- コードスニペット（セキュアコーディング問題用）
synergy_hint text -- SC↔AIF相互学習ヒント
tags        text[]
created_at  timestamptz
```

### exam_sessions — 模擬試験セッション
```sql
id           uuid PK
user_id      uuid FK → auth.users
module       text  -- 'SC'|'AIF'|'MIXED'
status       text  -- 'active'|'completed'|'abandoned'
started_at   timestamptz
finished_at  timestamptz
time_limit   int   -- 秒
question_ids uuid[]
answers      jsonb -- {question_id: answered_key}
score        int
total        int
```

### user_answers — 個別回答履歴
```sql
id           uuid PK
user_id      uuid FK
question_id  uuid FK → question_bank
session_id   uuid FK → exam_sessions
is_correct   boolean
answered_at  timestamptz
time_spent   int  -- 秒
```

### synergy_links — SC↔AIS相互リンク
```sql
id              uuid PK
sc_question_id  uuid FK → question_bank
aws_question_id uuid FK → question_bank
link_type       text -- 'concept'|'implementation'|'threat_countermeasure'
description     text -- なぜ関連するか
```

### user_progress — 学習進捗サマリー
```sql
user_id           uuid PK
sc_accuracy       float  -- 正答率
aws_accuracy      float
weak_categories   text[] -- 弱い分野
study_streak      int
last_studied_at   timestamptz
exam_date_sc      date   -- 試験予定日
exam_date_aws     date
```

## 状態管理設計

```
Server State (Supabase)         Client State (React)
────────────────────            ──────────────────────
question_bank    ────────────→  useQuestions() hook
exam_sessions    ←──────────    useExamStore() (Zustand)
user_answers     ←──────────    useAnswerStore()
user_progress    ────────────→  useProgress() hook
```

## API設計

| Method | Path | 説明 |
|--------|------|------|
| GET | /api/questions | 問題一覧（module/category/limit） |
| POST | /api/exam | 新規セッション作成 |
| PATCH | /api/exam/[id] | 回答送信・採点 |
| GET | /api/exam/[id] | セッション取得（中断再開） |
| POST | /api/ai/hint | AIヒント生成 |
| POST | /api/ai/analysis | 弱点分析レポート生成 |

## セキュリティ設計
- 全テーブルにRLS: `auth.uid() = user_id`
- APIキー: サーバーサイドAPIルートのみ（ANTHROPIC_API_KEYはCLIENT_に付けない）
- 入力サニタイズ: zodで全APIリクエストをバリデーション

---
_Last updated by: CLAUDE-ARCHITECT at 2026-03-08 00:00:00_
