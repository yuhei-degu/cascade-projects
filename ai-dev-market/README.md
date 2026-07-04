# AI Dev Market 🤖⚡

> AIで作る小規模開発依頼サービス — 副業収益化のための個人開発プロジェクト

## サービス概要

スクリプト・Webツール・API連携など「¥10,000〜¥30,000」の小規模開発依頼を受け付けるサービス。
Gemini + GPT-4oでAI自動審査 → Claudeで試作生成 → Stripe決済まで全自動フロー。

## フロー

```
依頼投稿 → AI審査(GPT-4o+Gemini) → A/B/C判定
  └─ C判定: 自動お断りメール
  └─ A/B判定: Claude で試作生成 → 依頼者確認 → Stripe決済 → 開発 → 納品
```

## 技術スタック

| 領域 | 技術 |
|------|------|
| Frontend / API | Next.js 14 (App Router) |
| Database / Auth | Supabase (PostgreSQL) |
| AI審査 | GPT-4o + Gemini-1.5-pro (並列) |
| 試作生成 | Claude-3.5-sonnet |
| 決済 | Stripe Checkout |
| メール | Resend API |
| デプロイ | Vercel |

## セットアップ

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env.local
# .env.local を編集して各APIキーを設定

# 3. データベース初期化（Supabase）
# Supabase ダッシュボードの SQL Editor で
# supabase/migrations/001_initial.sql を実行

# 4. 開発サーバー起動
npm run dev

# 5. Stripe Webhook（別ターミナル）
npm run stripe:listen
```

## ディレクトリ構成

```
src/
├── app/
│   ├── (public)/         # 公開ページ
│   │   ├── request/new/  # 依頼投稿フォーム
│   │   ├── preview/[token]/ # 試作確認ページ（チャット付き）
│   │   └── payment/success/ # 決済完了
│   ├── admin/            # 管理画面（要認証）
│   └── api/              # API Routes
│       ├── requests/     # 依頼CRUD
│       ├── ai/evaluate/  # AI審査実行
│       ├── chat/         # チャット
│       ├── preview/      # 承認・修正
│       └── payment/webhook/ # Stripe Webhook
├── lib/
│   ├── ai/               # GPT/Gemini/Claude連携
│   ├── email/            # Resendメールテンプレート
│   ├── payment/          # Stripe処理
│   └── supabase/         # DBクライアント
└── types/                # TypeScript型定義

docs/
├── 01_service_design.md  # サービス設計
├── 02_requirements.md    # 要件定義
├── 03_system_architecture.md # システム構成
├── 04_mvp_slices.md      # MVPスライス（縦切り・プロトタイプフロー）
├── 05_estimate.md        # 見積もり（MVP）
└── 08_improvement.md     # 改善案

supabase/
└── migrations/001_initial.sql # DB初期化SQL

tests/
├── unit/                 # ユニットテスト
└── integration/          # 統合テスト
```

## 目標収益

| 期間 | 件数/月 | 月収目標 |
|------|---------|---------|
| 1ヶ月目 | 1〜3件 | ¥15,000〜45,000 |
| 3ヶ月目 | 4〜7件 | ¥72,000〜126,000 |
| 6ヶ月目 | 8〜12件 | ¥160,000〜240,000 |
