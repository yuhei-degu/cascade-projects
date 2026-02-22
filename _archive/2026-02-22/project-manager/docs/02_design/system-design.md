# 🏗️ システム設計書 — プロジェクト管理アプリ

**バージョン**: 1.0.0 | **作成日**: 2026-02-22

---

## 1. アーキテクチャ概要

2カラムレイアウトのSPA。左サイドバー＋メインエリア構成。

```
index.html
├── <style>  全CSS（CSS変数・グリッド・Flexbox）
├── .sidebar   ナビ・プロジェクト一覧
├── .main
│   ├── #view-dashboard   ダッシュボード（統計・カード一覧）
│   └── #view-project     カンバンボード
├── #modal-project  新規プロジェクトモーダル
├── #modal-task     新規タスクモーダル
└── <script>  全ロジック（約200行）
```

---

## 2. データ設計

```javascript
// localStorage キー: "pm-state"
{
  "projects": [
    {
      "id": "p1740000000000",
      "name": "酔い止め照準器アプリ",
      "desc": "説明文",
      "status": "active",  // active / planning / done / pause
      "tasks": [
        {
          "id": "t1740000000000",
          "name": "要件定義を書く",
          "desc": "",
          "priority": "high",   // high / medium / low
          "col": "done"         // todo / doing / done
        }
      ]
    }
  ]
}
```

---

## 3. 状態遷移図

```
[ダッシュボード]
    ↓ クリック
[プロジェクト詳細: カンバン]
    ├── タスク: todo → doing → done
    └── ← 戻るボタン → [ダッシュボード]
```

---

## 4. UI設計

### カラーテーマ（GitHub Dark風）
| 役割 | 値 |
|------|-----|
| 背景 | `#0d1117` |
| カード | `#21262d` |
| ボーダー | `#30363d` |
| プライマリ | `#58a6ff` |
| 成功 | `#3fb950` |
| 警告 | `#d29922` |
| 危険 | `#f85149` |

### カンバンボード設計
- 3カラム固定: `grid-template-columns: repeat(3, 1fr)`
- タスクカードはドラッグ予定（将来の拡張）
- 優先度は色付きドット（🔴🟡🟢）で視覚化

---

## 5. 進捗計算ロジック

```javascript
function getProgress(project) {
  const total = project.tasks.length;
  if (!total) return 0;
  const done = project.tasks.filter(t => t.col === 'done').length;
  return Math.round(done / total * 100);
}
```
