# ② システムアーキテクチャ図 & ③ データフロー設計

---

## ② システムアーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL DATA SOURCES                      │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ┌─────────────┐ │
│  │  yfinance   │ │ SEC EDGAR   │ │ USPTO API │ │Semantic     │ │
│  │ Yahoo Fin.  │ │  (10-K/10-Q)│ │ (Patents) │ │Scholar API  │ │
│  └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ └──────┬──────┘ │
└─────────┼───────────────┼──────────────┼───────────────┼────────┘
          │               │              │               │
          ▼               ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FastAPI Backend (Python 3.11)                │   │
│  │                                                           │   │
│  │  ┌───────────┐  ┌───────────┐  ┌──────────────────────┐  │   │
│  │  │FinancialSvc│ │PatentSvc  │  │  NLP Pipeline        │  │   │
│  │  │(yfinance) │  │(USPTO)    │  │  SciBERT/FinBERT     │  │   │
│  │  └─────┬─────┘  └─────┬─────┘  └──────────┬───────────┘  │   │
│  │        │               │                   │               │   │
│  │        ▼               ▼                   ▼               │   │
│  │  ┌──────────────────────────────────────────────────┐      │   │
│  │  │              Scoring Engine                       │      │   │
│  │  │  TechScore × 0.4 + GrowthScore × 0.3             │      │   │
│  │  │  + ProfitScore × 0.3 → AIScore                   │      │   │
│  │  │  UndervalueScore = AIScore / (PER × PEG)         │      │   │
│  │  └──────────────────────┬───────────────────────────┘      │   │
│  │                          │                                   │   │
│  │  ┌───────────────────────▼──────────────────────────┐      │   │
│  │  │              API Router (FastAPI)                  │      │   │
│  │  │  GET /api/v1/ranking                               │      │   │
│  │  │  GET /api/v1/companies/{ticker}                    │      │   │
│  │  │  POST /api/v1/analyze/{ticker}                     │      │   │
│  │  └──────────────────────────────────────────────────┘      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                         │
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────┐
│   PostgreSQL 15   │     │      Redis Cache      │
│                  │     │  (ranking: TTL 1h)    │
│  companies       │     │  (scores: TTL 24h)    │
│  financial_data  │     └──────────────────────┘
│  patent_data     │
│  scores          │
│  score_history   │
└──────────────────┘
          ▲
          │ REST API (JSON)
          ▼
┌─────────────────────────────────────┐
│        Next.js 14 Frontend          │
│                                     │
│  /                → RankingPage     │
│  /company/[ticker]→ DetailPage      │
│                                     │
│  Components:                        │
│  - RankingTable                     │
│  - ScoreRadarChart (Recharts)       │
│  - ValuationIndicator               │
│  - FinancialMetrics                 │
└─────────────────────────────────────┘
```

---

## ③ データフロー設計

```
[日次バッチ処理フロー]

1. データ収集フェーズ (毎日 AM 3:00 JST)
   ┌─────────────────────────────────────────────┐
   │ Scheduler (APScheduler)                     │
   │   → collect_financial_data(tickers)         │
   │       → yfinance.Ticker(ticker).info        │
   │       → 保存: financial_data テーブル       │
   └─────────────────────────────────────────────┘

2. NLPスコア算出フェーズ (週次 日曜 AM 2:00)
   ┌─────────────────────────────────────────────┐
   │ PatentCollector.fetch(ticker)               │
   │   → USPTO API → raw_patent_texts[]         │
   │   → SciBERT.encode(texts)                  │
   │   → cosine_similarity(AI_ref_embedding)    │
   │   → patent_relevance_score (0-100)         │
   │   → 保存: patent_data テーブル             │
   └─────────────────────────────────────────────┘

3. スコア統合フェーズ
   ┌─────────────────────────────────────────────┐
   │ ScoringEngine.calculate(ticker)             │
   │                                             │
   │  tech_score = (                             │
   │    keyword_score * 0.25 +                   │
   │    patent_score  * 0.30 +                   │
   │    rnd_score     * 0.25 +                   │
   │    paper_score   * 0.20                     │
   │  ) → normalize(0-100)                      │
   │                                             │
   │  growth_score = (                           │
   │    revenue_growth * 0.4 +                   │
   │    eps_growth     * 0.4 +                   │
   │    market_growth  * 0.2                     │
   │  ) → normalize(0-100)                      │
   │                                             │
   │  profit_score = (                           │
   │    roe          * 0.4 +                     │
   │    ebitda_margin * 0.4 +                    │
   │    gross_margin  * 0.2                      │
   │  ) → normalize(0-100)                      │
   │                                             │
   │  ai_score = 0.4*tech + 0.3*growth + 0.3*profit │
   │  undervalue = ai_score / (per * peg)       │
   │  → 保存: scores テーブル                   │
   └─────────────────────────────────────────────┘

4. キャッシュ更新フェーズ
   ┌─────────────────────────────────────────────┐
   │ Redis.set("ranking:top20", json, TTL=3600)  │
   └─────────────────────────────────────────────┘
```
