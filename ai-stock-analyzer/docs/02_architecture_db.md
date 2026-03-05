# ② システムアーキテクチャ図 / ③ データフロー設計 / ④ DB設計

---

## ② システムアーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│   ┌─────────────────────────────────────────────────────┐      │
│   │  Next.js (TypeScript + Tailwind)                     │      │
│   │  - Ranking Page  - Company Detail  - Score Charts    │      │
│   └──────────────────────┬──────────────────────────────┘      │
└─────────────────────────-│──────────────────────────────────────┘
                           │ HTTP/JSON (REST)
┌──────────────────────────▼──────────────────────────────────────┐
│                        API LAYER                                │
│   ┌──────────────────────────────────────────────────────┐     │
│   │  FastAPI (Python 3.11)                                │     │
│   │  - /api/v1/companies  - /api/v1/companies/{ticker}   │     │
│   │  - /api/v1/analyze    - /api/v1/health               │     │
│   │  Middleware: CORS, Auth(future), Rate Limit          │     │
│   └──┬──────────────────┬──────────────────┬────────────┘     │
└──────│──────────────────│──────────────────│─────────────────── ┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼────────────────────┐
│  SCORING    │  │  DATA SERVICES  │  │  NLP/AI ENGINE           │
│  SERVICE    │  │                 │  │                          │
│ ┌─────────┐ │  │ ┌─────────────┐ │  │ ┌──────────────────────┐ │
│ │Composite│ │  │ │FinancialSvc │ │  │ │ FinBERT/SciBERT      │ │
│ │ Score   │ │  │ │yfinance     │ │  │ │ (HuggingFace)        │ │
│ │Calculator│ │  │ │SEC EDGAR   │ │  │ │ - SEC 10-K Analyzer  │ │
│ └─────────┘ │  │ └─────────────┘ │  │ │ - Patent NLP         │ │
│ ┌─────────┐ │  │ ┌─────────────┐ │  │ │ - arXiv Relevance    │ │
│ │Valuation│ │  │ │PatentSvc    │ │  │ └──────────────────────┘ │
│ │ Engine  │ │  │ │USPTO API    │ │  └──────────────────────────┘
│ └─────────┘ │  │ └─────────────┘ │
└─────────────┘  │ ┌─────────────┐ │
                 │ │PaperSvc     │ │
                 │ │arXiv API    │ │
                 │ └─────────────┘ │
                 └────────┬────────┘
┌────────────────────────-│──────────────────────────────────────┐
│                   PERSISTENCE LAYER                            │
│  ┌──────────────────────▼──────────┐  ┌──────────────────────┐│
│  │  PostgreSQL 15                  │  │  Redis (Cache)       ││
│  │  - companies                    │  │  - ranking cache     ││
│  │  - financial_metrics            │  │  - score cache       ││
│  │  - patents                      │  │  TTL: 1h             ││
│  │  - research_papers              │  └──────────────────────┘│
│  │  - ai_scores                    │                          │
│  │  - score_history                │                          │
│  └─────────────────────────────────┘                          │
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│                   BATCH / SCHEDULER                            │
│  APScheduler (daily UTC 06:00)                                 │
│  1. Fetch financial data → 2. Fetch patents → 3. NLP scoring  │
│  4. Compute composite scores → 5. Update DB → 6. Invalidate   │
└────────────────────────────────────────────────────────────────┘
```

---

## ③ データフロー設計

```
[外部データソース]
  Yahoo Finance API ──► FinancialDataFetcher ──► financial_metrics テーブル
  SEC EDGAR API     ──► SECFilingFetcher     ──► companies テーブル (10-K text)
  USPTO API         ──► PatentFetcher        ──► patents テーブル
  arXiv API         ──► PaperFetcher         ──► research_papers テーブル
                              │
                              ▼ (全データ揃ったら)
                    [NLP Processing Pipeline]
                    ┌─────────────────────────────┐
                    │ 1. SEC 10-K テキスト解析     │
                    │    FinBERT → センチメント     │
                    │    KeywordMatcher → AI頻度   │
                    ├─────────────────────────────┤
                    │ 2. 特許テキスト解析          │
                    │    SciBERT → CPC分類スコア   │
                    │    CitationAnalyzer → 影響度 │
                    ├─────────────────────────────┤
                    │ 3. 論文関連性スコア          │
                    │    TF-IDF + cosine similarity│
                    └──────────────┬──────────────┘
                                   ▼
                    [Score Computation Engine]
                    技術力(0.4) + 成長性(0.3) + 収益性(0.3)
                    = AI総合スコア
                    → 割安判定 = AIスコア / (PER × PEG)
                                   ▼
                    ai_scores テーブル & score_history テーブル
                                   ▼
                    [API Layer] → Redis Cache → Frontend
```

---

## ④ DB設計（テーブル定義）

### companies テーブル
```sql
CREATE TABLE companies (
    id              SERIAL PRIMARY KEY,
    ticker          VARCHAR(10)  UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    sector          VARCHAR(100),
    industry        VARCHAR(100),
    market_cap      BIGINT,           -- USD
    exchange        VARCHAR(10),      -- NYSE/NASDAQ
    description     TEXT,
    sec_cik         VARCHAR(20),      -- SEC企業コード
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_companies_ticker ON companies(ticker);
CREATE INDEX idx_companies_sector ON companies(sector);
```

### financial_metrics テーブル
```sql
CREATE TABLE financial_metrics (
    id                  SERIAL PRIMARY KEY,
    company_id          INT REFERENCES companies(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    -- バリュエーション
    per                 NUMERIC(10,2),   -- Price/Earnings
    peg                 NUMERIC(10,2),   -- PEG Ratio
    ev_ebitda           NUMERIC(10,2),   -- EV/EBITDA
    pb_ratio            NUMERIC(10,2),   -- Price/Book
    ps_ratio            NUMERIC(10,2),   -- Price/Sales
    -- 成長性
    revenue_yoy         NUMERIC(8,4),    -- 売上高YoY成長率
    eps_growth_yoy      NUMERIC(8,4),    -- EPS YoY成長率
    -- 収益性
    gross_margin        NUMERIC(8,4),    -- 売上総利益率
    operating_margin    NUMERIC(8,4),    -- 営業利益率
    net_margin          NUMERIC(8,4),    -- 純利益率
    fcf_margin          NUMERIC(8,4),    -- FCFマージン
    -- R&D
    rd_expense          BIGINT,          -- R&D費用 (USD)
    revenue             BIGINT,          -- 売上高 (USD)
    rd_ratio            NUMERIC(8,4),    -- R&D費/売上高
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, date)
);
CREATE INDEX idx_fm_company_date ON financial_metrics(company_id, date DESC);
```

### patents テーブル
```sql
CREATE TABLE patents (
    id              SERIAL PRIMARY KEY,
    company_id      INT REFERENCES companies(id) ON DELETE CASCADE,
    patent_number   VARCHAR(20) UNIQUE,
    title           TEXT,
    abstract        TEXT,
    cpc_codes       VARCHAR(50)[],    -- CPC分類コード配列
    filing_date     DATE,
    grant_date      DATE,
    citation_count  INT DEFAULT 0,
    ai_relevance    NUMERIC(5,4),     -- AI関連度スコア (0-1)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_patents_company ON patents(company_id);
CREATE INDEX idx_patents_ai_relevance ON patents(ai_relevance DESC);
```

### research_papers テーブル
```sql
CREATE TABLE research_papers (
    id              SERIAL PRIMARY KEY,
    company_id      INT REFERENCES companies(id),  -- NULLable (著者所属で紐付け)
    arxiv_id        VARCHAR(20) UNIQUE,
    title           TEXT NOT NULL,
    abstract        TEXT,
    authors         JSONB,           -- [{name, affiliation}]
    categories      VARCHAR(50)[],   -- cs.AI, cs.LG 等
    published_date  DATE,
    citation_count  INT DEFAULT 0,
    relevance_score NUMERIC(5,4),    -- 企業AI戦略との関連度
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_scores テーブル
```sql
CREATE TABLE ai_scores (
    id                      SERIAL PRIMARY KEY,
    company_id              INT REFERENCES companies(id) ON DELETE CASCADE,
    score_date              DATE NOT NULL DEFAULT CURRENT_DATE,
    -- コンポーネントスコア (0-100)
    tech_score              NUMERIC(6,2),
    growth_score            NUMERIC(6,2),
    profitability_score     NUMERIC(6,2),
    -- 技術力サブスコア
    keyword_score           NUMERIC(6,2),
    patent_score            NUMERIC(6,2),
    rd_ratio_score          NUMERIC(6,2),
    paper_relevance_score   NUMERIC(6,2),
    -- 総合スコア
    composite_score         NUMERIC(6,2),  -- AI総合スコア
    valuation_score         NUMERIC(8,4),  -- 割安判定スコア
    -- バリュエーション（スコア計算時の参照値）
    per_used                NUMERIC(10,2),
    peg_used                NUMERIC(10,2),
    -- メタ
    model_version           VARCHAR(20) DEFAULT 'v1.0',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, score_date)
);
CREATE INDEX idx_scores_date_val ON ai_scores(score_date, valuation_score DESC);
```
