# ④ DB設計（テーブル定義） & ⑥ API設計

---

## ④ DB設計

### companies テーブル（企業マスタ）
```sql
CREATE TABLE companies (
    id              SERIAL PRIMARY KEY,
    ticker          VARCHAR(10)  NOT NULL UNIQUE,  -- "NVDA", "MSFT"
    name            VARCHAR(255) NOT NULL,
    sector          VARCHAR(100),                  -- "Technology"
    industry        VARCHAR(100),                  -- "Semiconductors"
    description     TEXT,
    employee_count  INTEGER,
    founded_year    INTEGER,
    headquarters    VARCHAR(255),
    website         VARCHAR(255),
    is_active       BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX idx_companies_ticker ON companies(ticker);
```

### financial_data テーブル（財務データ）
```sql
CREATE TABLE financial_data (
    id              SERIAL PRIMARY KEY,
    company_id      INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    date            DATE         NOT NULL,
    -- バリュエーション
    per             FLOAT,        -- Price/Earnings Ratio
    peg             FLOAT,        -- Price/Earnings-to-Growth
    ev_ebitda       FLOAT,        -- Enterprise Value / EBITDA
    pb_ratio        FLOAT,        -- Price/Book
    ps_ratio        FLOAT,        -- Price/Sales
    -- 収益性
    revenue         BIGINT,       -- 売上高（USD）
    ebitda          BIGINT,       -- EBITDA
    net_income      BIGINT,       -- 純利益
    gross_margin    FLOAT,        -- 粗利益率
    ebitda_margin   FLOAT,        -- EBITDA利益率
    roe             FLOAT,        -- 自己資本利益率
    -- 成長性
    revenue_growth  FLOAT,        -- 売上成長率（YoY）
    eps_growth      FLOAT,        -- EPS成長率（YoY）
    -- 技術投資
    rnd_expense     BIGINT,       -- R&D費用
    rnd_ratio       FLOAT,        -- R&D比率 (R&D/Revenue)
    -- 株価
    market_cap      BIGINT,       -- 時価総額
    current_price   FLOAT,        -- 現在株価
    created_at      TIMESTAMP    DEFAULT NOW(),
    UNIQUE(company_id, date)
);
CREATE INDEX idx_financial_company_date ON financial_data(company_id, date DESC);
```

### patent_data テーブル（特許データ）
```sql
CREATE TABLE patent_data (
    id              SERIAL PRIMARY KEY,
    company_id      INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    analyzed_at     DATE         NOT NULL,
    patent_count    INTEGER      DEFAULT 0,   -- AI関連特許件数
    ai_patent_count INTEGER      DEFAULT 0,   -- AI特化特許
    patent_growth   FLOAT,                    -- 特許増加率(YoY)
    avg_relevance   FLOAT,                    -- 平均AI関連性スコア(0-1)
    top_patent_title VARCHAR(500),            -- 最高スコア特許タイトル
    raw_data        JSONB,                    -- USPTO生データ
    created_at      TIMESTAMP    DEFAULT NOW(),
    UNIQUE(company_id, analyzed_at)
);
```

### scores テーブル（統合スコア）
```sql
CREATE TABLE scores (
    id                  SERIAL PRIMARY KEY,
    company_id          INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    scored_at           DATE         NOT NULL,
    -- 個別スコア (0-100)
    tech_score          FLOAT        NOT NULL,
    growth_score        FLOAT        NOT NULL,
    profit_score        FLOAT        NOT NULL,
    -- サブスコア
    keyword_score       FLOAT,
    patent_score        FLOAT,
    rnd_score           FLOAT,
    paper_score         FLOAT,
    -- 統合スコア
    ai_total_score      FLOAT        NOT NULL,  -- 0.4*tech+0.3*growth+0.3*profit
    undervalue_score    FLOAT        NOT NULL,  -- ai_score/(per*peg)
    -- ランキング
    rank_position       INTEGER,
    created_at          TIMESTAMP    DEFAULT NOW(),
    UNIQUE(company_id, scored_at)
);
CREATE INDEX idx_scores_undervalue ON scores(undervalue_score DESC);
CREATE INDEX idx_scores_date ON scores(scored_at DESC);
```

---

## ⑥ API設計

### GET /api/v1/ranking
上位20社のランキングを返す。

**Response 200**
```json
{
  "updated_at": "2026-03-06T10:00:00Z",
  "total": 20,
  "companies": [
    {
      "rank": 1,
      "ticker": "NVDA",
      "name": "NVIDIA Corporation",
      "sector": "Technology",
      "current_price": 850.50,
      "market_cap": 2100000000000,
      "ai_total_score": 94.2,
      "undervalue_score": 3.85,
      "tech_score": 98.1,
      "growth_score": 92.5,
      "profit_score": 88.3,
      "per": 55.2,
      "peg": 0.45,
      "ev_ebitda": 48.3,
      "valuation_tag": "undervalued"
    }
  ]
}
```

### GET /api/v1/companies/{ticker}
企業詳細 + スコア内訳。

**Response 200**
```json
{
  "company": { "ticker": "NVDA", "name": "...", "description": "..." },
  "financial": { "per": 55.2, "peg": 0.45, "revenue_growth": 0.122, "rnd_ratio": 0.19 },
  "scores": {
    "ai_total_score": 94.2,
    "undervalue_score": 3.85,
    "breakdown": {
      "tech": { "total": 98.1, "keyword": 95, "patent": 99, "rnd": 98, "paper": 100 },
      "growth": { "total": 92.5, "revenue_growth": 90, "eps_growth": 95 },
      "profit": { "total": 88.3, "roe": 85, "ebitda_margin": 90, "gross_margin": 90 }
    }
  },
  "patents": { "count": 1250, "ai_count": 430, "avg_relevance": 0.87 }
}
```

### POST /api/v1/analyze/{ticker}
指定銘柄の即時再解析（管理用）。

### GET /api/v1/health
ヘルスチェック。
