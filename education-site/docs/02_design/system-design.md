# 🏗️ システム設計書 — AI Dev Start 教育サイト

**バージョン**: 1.0.0 | **作成日**: 2026-02-22

---

## 1. 技術構成

**ゼロ依存の単一HTMLファイル**。CDN・フレームワーク・バックエンド一切なし。

```
index.html（全コード約700行）
├── <head>
│   ├── meta（SEO・OGP）
│   └── <style>（インラインCSS、CSS変数ベース）
├── <body>
│   ├── <nav>     スティッキーナビ
│   ├── .hero     ヒーロー（グリッド2カラム）
│   ├── #steps    4ステップ（auto-fitグリッド）
│   ├── #tools    ツール紹介（auto-fitグリッド）
│   ├── #setup    環境構築（2カラム）
│   ├── AI使い方  プロンプトガイド（2カラム）
│   ├── #roadmap  ロードマップ＋FAQ（2カラム）
│   └── footer    リンク集（3カラムグリッド）
└── <script>
    ├── toggleFaq()   アコーディオン
    ├── cmdCopy()     コマンドコピー
    └── IntersectionObserver  スクロールアニメ
```

---

## 2. デザインシステム

### カラーパレット（宇宙系ダーク）
| 変数 | 値 | 用途 |
|------|----|------|
| `--bg` | `#08080f` | メイン背景 |
| `--card` | `#14141f` | カード背景 |
| `--p1` | `#7c6aff` | プライマリ（紫） |
| `--p2` | `#ff6aac` | セカンダリ（ピンク） |
| `--p3` | `#4adebb` | ターシャリ（ミント） |
| `--gold` | `#fbbf24` | 強調・必須バッジ |
| `--green` | `#4ade80` | 成功・無料バッジ |

### タイポグラフィ
- 見出し: `font-weight:800-900`, `clamp()` でレスポンシブ
- グラデーションテキスト: `linear-gradient` + `-webkit-background-clip:text`

---

## 3. レスポンシブ戦略

```css
/* 768px以下でグリッドを1カラムに崩す */
@media (max-width:768px) {
  .hero-inner { grid-template-columns:1fr; }
  .hero-visual { display:none; }
  .footer-inner { grid-template-columns:1fr; }
}
/* カードは auto-fit で自動折り返し */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
```

---

## 4. GitHub Pages 公開フロー

```
education-site/
└── src/
    └── index.html  ← このファイルをGitHubリポジトリの直下に置く

GitHubリポジトリ直下:
ai-dev-start/
├── index.html   ← ここに置く
└── README.md

Settings → Pages → Source: main / root
→ https://yuuve.github.io/ai-dev-start/
```

---

## 5. SEO・シェア最適化

```html
<meta name="description" content="AIとモダンエディタを使って...">
<!-- 将来追加: OGPタグ（SNSシェア時のプレビュー） -->
<meta property="og:title" content="AI×コード入門">
<meta property="og:image" content="og-image.png">
```
