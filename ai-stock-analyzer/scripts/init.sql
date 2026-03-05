-- DB初期化 / インデックス追加
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_fm_company_date ON financial_metrics(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_patents_ai_relevance ON patents(ai_relevance DESC);
CREATE INDEX IF NOT EXISTS idx_scores_date_val ON ai_scores(score_date, valuation_score DESC);
