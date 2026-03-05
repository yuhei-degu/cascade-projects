# ① 要件定義書 — AI Stock Analyzer

**プロジェクト名**: AI Stock Analyzer MVP  
**バージョン**: 1.0.0  
**作成日**: 2026-03-06  
**対象**: 米国上場AI関連企業の割安株スクリーニングWebアプリ

---

## 1. 背景・目的

AI技術の急速な普及により、技術力を持つ企業の中長期的成長ポテンシャルと
現在の株価バリュエーションに乖離が生じている。
本システムは財務データ・特許・研究レポートをAIで解析し、
「技術力が高く市場に割安放置されている企業」をスコアリングしてランキング表示する。

---

## 2. 機能要件

### 2-1. データ収集

| ID | 機能 | 優先度 |
|----|------|--------|
| F-01 | Yahoo Finance APIから財務データ取得（PER/PEG/EV/EBITDA/R&D費） | High |
| F-02 | USPTO APIから特許データ取得（件数・分類・引用数） | High |
| F-03 | arXiv APIから研究論文データ取得（著者所属・キーワード） | Medium |
| F-04 | SEC EDGAR APIから10-K/10-Qテキスト取得 | High |
| F-05 | データは日次バッチで自動更新 | Medium |

### 2-2. AI/NLPスコアリング

| ID | 機能 | 優先度 |
|----|------|--------|
| F-06 | FinBERT/SciBERTによる決算テキスト解析 | High |
| F-07 | AI関連キーワード出現頻度スコア算出 | High |
| F-08 | 特許分類コード（CPC）によるAI関連度判定 | High |
| F-09 | R&D比率から技術投資スコア算出 | High |
| F-10 | 総合AIスコア算出（技術0.4 + 成長0.3 + 収益0.3） | High |
| F-11 | 割安判定スコア算出（AIスコア / (PER × PEG)） | High |

### 2-3. フロントエンド

| ID | 機能 | 優先度 |
|----|------|--------|
| F-12 | 企業ランキング画面（上位20社・ソート可） | High |
| F-13 | 企業詳細ページ（スコア内訳・財務指標） | High |
| F-14 | 割安度インジケーター（色分け：割安/適正/割高） | High |
| F-15 | スコア構成レーダーチャート | Medium |
| F-16 | 株価・財務指標の時系列グラフ | Medium |
| F-17 | セクター/スコアフィルタリング | Medium |

### 2-4. API

| ID | 機能 | 優先度 |
|----|------|--------|
| F-18 | GET /api/v1/companies — ランキング取得 | High |
| F-19 | GET /api/v1/companies/{ticker} — 企業詳細取得 | High |
| F-20 | POST /api/v1/analyze/{ticker} — 手動再解析トリガー | Medium |
| F-21 | GET /api/v1/health — ヘルスチェック | High |

---

## 3. 非機能要件

| 項目 | 要件 |
|------|------|
| パフォーマンス | ランキング取得 < 500ms（キャッシュ有） |
| スケーラビリティ | Docker → AWS ECS 移行前提 |
| データ更新 | 日次バッチ（UTC 6:00） |
| セキュリティ | APIキーは環境変数管理、CORS設定 |
| 可用性 | MVP段階: 単一インスタンス |
| モニタリング | ログ出力（structlog）、将来Datadog対応 |
| テスト | ユニットテスト カバレッジ > 70% |
| ドキュメント | OpenAPI (Swagger UI) 自動生成 |

---

## 4. 対象企業（初期スクリーニング条件）

- 米国上場（NYSE/NASDAQ）
- 時価総額 > $1B（流動性確保）
- セクター: Technology / Communication Services / Health Care（AI医療）
- AI関連キーワードスコア > 閾値（初期値: 0.3）

---

## 5. スコア定義

```
AI総合スコア = 0.4 × 技術力スコア + 0.3 × 成長性スコア + 0.3 × 収益性スコア

技術力スコア =
  0.3 × AI_keyword_score      # 決算書・特許テキストのキーワード密度
+ 0.3 × patent_score          # 特許件数・引用数・CPC分類
+ 0.2 × rd_ratio_score        # R&D費 / 売上高
+ 0.2 × paper_relevance_score # arXiv論文関連性

成長性スコア =
  0.5 × revenue_growth_yoy    # 売上高前年比成長率
+ 0.3 × earnings_growth       # EPS成長率
+ 0.2 × market_expansion      # 対象市場成長率

収益性スコア =
  0.4 × gross_margin          # 売上総利益率
+ 0.3 × operating_margin      # 営業利益率
+ 0.3 × free_cashflow_margin  # FCFマージン

割安判定スコア = AI総合スコア / (normalized_PER × normalized_PEG)
```
