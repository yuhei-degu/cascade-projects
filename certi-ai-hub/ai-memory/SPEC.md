<!--
@@AGENT_HANDOFF_METADATA@@
project: certi-ai-hub
version: 1.0.0
last_agent: CLAUDE-ARCHITECT
next_agent: CURSOR
phase: DESIGN_COMPLETE → IMPL_READY
read_priority: [SPEC.md, ARCHITECTURE.md, TASKS.md, PROGRESS.md, BUGS.md]
critical_files:
  - supabase/migrations/001_initial.sql
  - src/types/index.ts
  - src/lib/supabase/client.ts
handoff_note: >
  設計フェーズ完了。TASKS.mdのPENDINGタスクを上から実装すること。
  SC/AWSモジュールは独立しているが、synergyテーブルで相互リンクされる。
@@END_METADATA@@
-->

# SPEC.md — Certi-AI Hub 仕様書

## プロダクト名
Certi-AI Hub — 2026年度版 資格学習統合プラットフォーム

## 作成日
2026-03-08

## 概要
情報処理安全確保支援士（SC）とAWS Certified AI Practitioner（AIF）の学習を統合した
CBT対応Webアプリ。AIによる進捗分析・弱点特定・シナジー学習機能を搭載。

## ターゲットユーザー
- SC試験を目指すエンジニア（経験2〜5年）
- AIF認定を目指すAWS実務者
- SC/AIF両方の取得を効率化したい個人開発者

## 解決する課題
1. SC科目B長文読解の練習環境が少ない
2. SC理論（ISMS/暗号/脅威）とAWS実装（Bedrock/GuardDuty）の知識が分断されている
3. CBT本番環境に近い練習ができない
4. 学習進捗の可視化・弱点分析が手動で面倒

## 主要機能

### /sc-module（支援士モジュール）
- 科目B長文問題（25問/セット）CBTシミュレーター
- セキュアコーディング問題（SQL注入・XSS・CSRF対策コード修正）
- AI脅威対策問題（プロンプトインジェクション・モデル汚染・敵対的サンプル）
- 解説付き採点 + AIによる弱点コメント

### /aws-module（AIF認定モジュール）
- Bedrock/SageMakerアーキテクチャ択一問題
- 責任あるAI（Responsible AI）シナリオ問題
- AWS SDK疑似コード穴埋め問題
- GenAIユースケース分類問題

### /common（共通モジュール）
- CBT模擬試験エンジン（時間制限・ランダム出題・採点）
- AI進捗分析（弱点領域グラフ・正答率推移・合格予測）
- 学習カレンダー（ストリーク・日別進捗・試験日カウントダウン）
- **シナジー学習**：SC理論 ↔ AWS実装の相互リンクビュー

### Interactive Lab（セキュリティ演習）
- SQLインジェクション攻撃/防御デモ（Next.js上でブラウザ完結）
- プロンプトインジェクション体験コンソール
- CSP/CORS設定ミスシミュレーター

## 技術スタック
- Language: TypeScript (strict)
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS + shadcn/ui
- Database/Auth: Supabase (PostgreSQL + Auth + Storage)
- AI: Anthropic claude-haiku-4-5（ヒント生成・弱点分析・解説）
- Deploy: Vercel
- Testing: Vitest + Playwright

## 非機能要件
- パフォーマンス: 問題表示 < 200ms, AI応答 < 3s
- セキュリティ: Supabase RLS全テーブル適用, APIキーはサーバーサイドのみ
- スケーラビリティ: 問題数1000問対応, 同時100ユーザー

## 成功指標（KPI）
- 月間アクティブユーザー 100人
- 模擬試験完走率 80%以上
- AI機能満足度 4/5以上

---
_Last updated by: CLAUDE-ARCHITECT at 2026-03-08 00:00:00_
