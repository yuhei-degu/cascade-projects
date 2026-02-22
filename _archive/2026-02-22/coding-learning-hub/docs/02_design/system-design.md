# 🏗️ システム設計書 — プログラミング学習ハブ

## 画面遷移図
```
トップ (index.html)
├── 学習ページ (#learn)
│   ├── HTMLタブ
│   ├── CSSタブ
│   └── JavaScriptタブ
├── ポートフォリオ (#portfolio)
└── リソース (#resources)
```

## コンポーネント設計
| ファイル | 役割 |
|---------|------|
| src/index.html | メインHTML（全ページ含む単一ファイル） |
| src/assets/css/style.css | グローバルスタイル |
| src/assets/js/app.js | タブ切替・進捗管理・コードコピー |

## カラーパレット
- プライマリ: #6C63FF（紫）
- セカンダリ: #FF6584（ピンク）
- 背景: #0F0E17（ダーク）
- テキスト: #FFFFFE（白）
- アクセント: #A7FF83（グリーン）

## データ設計（localStorage）
```json
{
  "progress": {
    "html": ["タスクID1", "タスクID2"],
    "css": [],
    "javascript": []
  }
}
```
