# ⑭ AI Stock Analyzer

> AI関連企業の技術力・成長性・収益性を統合スコアリングし、  
> 市場に割安放置されている企業をランキング表示するWebアプリ

---

## ⚡ クイックスタート

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourname/ai-stock-analyzer.git
cd ai-stock-analyzer

# 2. 環境変数を設定
cp .env.example .env
# .env を編集して各APIキーを設定

# 3. Docker で全サービス起動
docker compose up --build

# 4. ブラウザでアクセス
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

---

## ⑧ ディレクトリ構成

```
ai-stock-analyzer/
├── backend/
│   ├── app/
│   │   ├── main.py                          # FastAPI エントリーポイント
│   │   ├── core/
│   │   │   └── config.py                    # 環境変数・設定管理
│   │   ├── db/
│   │   │   └── session.py                   # DB接続・セッション管理
│   │   ├── models/
│   │   │   └── models.py                    # SQLAlchemy ORM モデル
│   │   ├── schemas/
│   │   │   └── schemas.py                   # Pydantic リクエスト/レスポンス型
│   │   ├── routers/
│   │   │   ├── companies.py                 # 企業ランキング・詳細 API
│   │   │   └── health.py                    # ヘルスチェック・再解析 API
│   │   └── services/
│   │       ├── financial/
│   │       │   └── fetcher.py               # ⑪ 財務データ取得 (yfinance)
│   │       ├── nlp/
│   │       │   └── patent_analyzer.py       # ⑩ 特許NLP解析 (SciBERT/FinBERT)
│   │       └── scoring/
│   │           └── composite_scorer.py      # ⑤⑫ スコア算出・割安判定
│   ├── tests/                               # ユニットテスト
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx                   # グローバルレイアウト
│       │   ├── page.tsx                     # ランキングページ (SSR/ISR)
│       │   └── company/[ticker]/page.tsx    # 企業詳細ページ
│       ├── components/
│       │   └── RankingTable.tsx             # ランキングテーブル (クライアント)
│       ├── lib/
│       │   └── api.ts                       # APIクライアント
│       └── types/
│           └── index.ts                     # TypeScript 型定義・ユーティリティ
├── docs/
│   ├── 01_requirements.md                   # ① 要件定義書
│   └── 02_architecture_db.md               # ②③④ アーキテクチャ・DB設計
├── scripts/
│   └── init.sql                             # DB初期化SQL
├── docker-compose.yml                       # ⑬ Docker構成
├── .env.example                             # 環境変数テンプレート
└── README.md                                # ⑭ このファイル
```

---

## 🧠 スコア設計

```
AI総合スコア (0-100) =
  0.4 × 技術力スコア
+ 0.3 × 成長性スコア
+ 0.3 × 収益性スコア

技術力スコア =
  0.30 × AIキーワード密度 (SEC 10-K FinBERT解析)
+ 0.30 × 特許スコア       (USPTO + SciBERT + 引用数)
+ 0.20 × R&D比率スコア    (R&D費/売上高)
+ 0.20 × 論文関連性スコア (arXiv コサイン類似度)

割安判定スコア = AI総合スコア / (norm_PER × norm_PEG × 100)
  norm_PER = PER / 30    (業界基準30倍)
  norm_PEG = PEG / 1.5   (業界基準1.5)

割安度判定:
  >= 5.0 → 激安 (very_cheap) 🟢
  2.5-5.0 → 割安 (cheap)     🟡
  1.0-2.5 → 適正 (fair)      🟠
  < 1.0   → 割高 (expensive) 🔴
```

---

## 🔌 API エンドポイント

| メソッド | パス | 説明 |
|--------|------|------|
| GET | `/api/v1/companies` | ランキング取得（クエリ: page, per_page, sector, min_score） |
| GET | `/api/v1/companies/{ticker}` | 企業詳細取得 |
| POST | `/api/v1/analyze/{ticker}` | 手動再解析トリガー |
| GET | `/api/v1/health` | ヘルスチェック |

詳細は `http://localhost:8000/docs`（Swagger UI）を参照。

---

## 🛠 技術スタック

| 層 | 技術 |
|---|------|
| Backend | Python 3.11 + FastAPI + SQLAlchemy (async) |
| Database | PostgreSQL 15 + Redis 7 |
| NLP/AI | HuggingFace Transformers (FinBERT / SciBERT) |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Infra | Docker Compose (開発) → AWS ECS (本番予定) |

---

## 🚀 AWS 移行ガイド（将来対応）

```
ECS Fargate (backend)  ← ECR (Docker Image)
ECS Fargate (frontend) ← ECR (Docker Image)
RDS PostgreSQL         ← 現在の PostgreSQL
ElastiCache Redis      ← 現在の Redis
EventBridge + Lambda   ← 現在の APScheduler
ALB                    ← ルーティング
```

---

## ⚠️ 免責事項

本アプリケーションは情報提供のみを目的としています。  
投資判断の根拠として使用する場合は、自己責任のもと追加調査を行ってください。  
本アプリが提供するスコアは投資助言ではありません。
