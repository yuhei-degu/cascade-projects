# ⑱ README — Market Discovery AI

> **個人が勝てる市場を発見するAI** — Q&A投稿から「需要高・低競合・収益化可能」なテーマを自動発掘

---

## ⚡ クイックスタート

```bash
git clone https://github.com/yourname/market-discovery-ai.git
cd market-discovery-ai
cp .env.example .env
docker compose up --build
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

## ⑪ ディレクトリ構成

```
market-discovery-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                              # FastAPI エントリーポイント
│   │   ├── core/config.py                       # 設定管理
│   │   ├── db/session.py                        # DB接続
│   │   ├── models/models.py                     # ⑨ DB設計 (ORM)
│   │   ├── schemas/schemas.py                   # ⑩ API設計 (Pydantic)
│   │   ├── routers/themes.py                    # ⑮ ランキングAPI
│   │   └── services/
│   │       ├── collector/crawler.py             # ③ データ収集 (クローラー)
│   │       ├── nlp/text_analyzer.py             # ④⑬ NLP解析エンジン
│   │       └── scoring/business_scorer.py       # ⑧ ビジネス指数算出
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx                       # グローバルレイアウト
│       │   ├── page.tsx                         # ランキングページ (SSR)
│       │   └── theme/[id]/page.tsx              # テーマ詳細ページ
│       ├── components/RankingBoard.tsx           # ランキングボード (Client)
│       ├── lib/api.ts                           # APIクライアント
│       └── types/index.ts                       # TypeScript型定義
├── docs/
│   ├── 01_requirements.md                       # ① 要件定義
│   └── 02_design.md                             # ②③④⑤⑥⑦ 設計ドキュメント
├── docker-compose.yml                           # ⑰ Docker構成
├── .env.example
└── README.md                                    # ⑱ このファイル
```

---

## 🧠 スコア設計

```
ビジネス指数 (0-100) =
  0.40 × 需要スコア
+ 0.30 × 収益化可能性スコア
+ 0.20 × (100 - 競合強度スコア) / 100 × 100
+ 0.10 × (100 - 開発難易度スコア) / 100 × 100

需要スコア = 0.4×投稿数スコア + 0.4×コメントスコア + 0.2×投稿増加率スコア

収益化スコア =
  0.35×お金ワード頻度 + 0.25×課金意欲 + 0.25×緊急度 + 0.15×深刻度

競合強度 = 0.5×検索量推定 + 0.3×既存アプリ推定 + 0.2×広告出稿推定

開発難易度 = 0.3×API依存 + 0.25×法規制リスク + 0.25×AI必要性 + 0.2×データ依存
```

### 割安フィルター（低競合のみ）

```
GET /api/v1/themes?max_competition=50
→ 競合強度≤50のテーマのみ表示（個人開発で勝てる市場）
```

---

## 🌐 API エンドポイント

| メソッド | パス | 説明 |
|--------|------|------|
| GET | `/api/v1/themes` | ランキング（フィルター: category, max_competition, min_business_index） |
| GET | `/api/v1/themes/{id}` | テーマ詳細（スコア内訳・キーワード） |
| GET | `/api/v1/categories` | カテゴリ一覧 |
| POST | `/api/v1/ingest` | テキスト手動インポート |
| POST | `/api/v1/analyze` | 全テーマ再解析トリガー |
| GET | `/api/v1/health` | ヘルスチェック |

詳細は `http://localhost:8000/docs` (Swagger UI)

---

## ⚠️ 倫理・利用規約対応

本アプリは以下の原則に従って設計されています:

- `robots.txt` を必ずチェックして遵守
- クロール間隔は最低3秒（過負荷防止）
- **個人情報（投稿者名・ID・IP・メール・電話番号）は一切保存しない**
- PII（個人特定情報）は収集前にマスキング処理
- データはキーワード頻度・集計値のみ保存
- User-Agent を明示（bot識別可能な形式）

---

## 🚀 将来の拡張

- SerpAPI 連携で競合強度を実測値に改善
- 日本語 BERT fine-tuning でカテゴリ分類精度向上  
- SBERT クラスタリングでより精緻なテーマ集約
- Fly.io / Railway へのワンクリックデプロイ対応
