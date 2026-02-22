# 🏗️ システム設計書 — プログラミング学習ハブ

**バージョン**: 1.0.0 | **作成日**: 2026-02-22

---

## 1. アーキテクチャ概要

シングルページアプリケーション（SPA）。HTMLファイル1本で完結。サーバー不要。

```
index.html（Single File App）
├── <head>  スタイル・外部CDN（highlight.js）
├── <nav>   固定ナビゲーションバー
├── #hero   ヒーローセクション
├── #learn  学習コンテンツ（タブ切替）
├── #portfolio ポートフォリオ展示
├── #resources リソースリンク集
└── <script> タブ切替・コードコピー・進捗保存
```

---

## 2. UI設計

### カラーパレット
| 役割 | 変数名 | 値 |
|------|--------|-----|
| 背景（メイン） | `--bg` | `#0F0E17` |
| 背景（カード） | `--card` | `#232136` |
| プライマリ | `--primary` | `#6C63FF` |
| アクセント | `--accent` | `#A7FF83` |
| テキスト | `--text` | `#FFFFFE` |

### レスポンシブ戦略
- CSS `clamp()` でフォントサイズを流動的に
- `grid-template-columns: repeat(auto-fit, minmax(320px,1fr))` でカードの自動折り返し
- ナビは `position: sticky` で常に表示

---

## 3. 状態管理（localStorage）

```javascript
// 保存する学習進捗データ構造
{
  "progress": {
    "html": ["h-01", "h-02"],   // 完了済みトピックID
    "css": ["c-01"],
    "javascript": []
  },
  "lastVisit": "2026-02-22"
}
```

---

## 4. 外部依存関係

| ライブラリ | バージョン | 用途 | CDN URL |
|-----------|----------|------|---------|
| highlight.js | 11.9.0 | コードシンタックスハイライト | cdnjs.cloudflare.com |

---

## 5. ファイル構成

```
coding-learning-hub/
├── src/
│   └── index.html      # 全機能含む単一ファイル（約400行）
└── docs/
    ├── 01_requirements/requirements.md
    ├── 02_design/system-design.md  ← このファイル
    ├── 03_implementation/notes.md
    └── 04_testing/test-spec.md
```
