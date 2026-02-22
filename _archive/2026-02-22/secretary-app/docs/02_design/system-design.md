# 🏗️ システム設計書 — 秘書アプリ

**バージョン**: 1.0.0 | **作成日**: 2026-02-22

---

## 1. アーキテクチャ概要

3カラムダッシュボード。常時全情報が見えるレイアウト。

```
index.html
├── .topbar        時計・日付・一言表示
└── .content（3カラムグリッド）
    ├── 左: 習慣トラッカー + 今日の予定
    ├── 中: クイックメモ + TODOリスト
    └── 右: タイマー + 統計
```

---

## 2. データ設計

```javascript
// localStorage キー: "secretary-state"
{
  "todos": [
    { "id": 1740000000, "text": "タスク名", "done": false, "priority": "high" }
  ],
  "habits": [
    { "id": 1740000001, "name": "習慣名", "doneToday": false, "streak": 5 }
  ],
  "schedules": [
    { "id": 1740000002, "time": "10:00", "text": "予定名" }
  ],
  "memo": "メモテキスト",
  "timerTotal": 1500,
  "timerLeft": 1500,
  "timerRunning": false,
  "lastDate": "2026-02-22"
}
```

---

## 2. 日付リセット機能

毎日最初にアプリを開いた時、`lastDate !== today` を検出して自動リセット。

```javascript
if (state.lastDate !== today) {
  state.habits.forEach(h => h.doneToday = false);
  // TODOは keepDone フラグがない場合リセット
  state.todos.forEach(t => { if (!t.keepDone) t.done = false; });
  state.lastDate = today;
}
```

---

## 3. タイマー設計

- カウントダウン方式（25分・15分・5分・1分プリセット）
- SVG円形プログレスバーで残り時間を視覚化
- `stroke-dashoffset` をJSで動的変更
- 残り時間に応じて色が変化: 青(余裕) → 黄(注意) → 赤(まもなく)

```
円周 = 2π × r = 2 × 3.14159 × 66 ≈ 414.69px
stroke-dashoffset = 414.69 × (1 - 残り割合)
```

---

## 4. カラーテーマ（深夜作業向けダーク）

| 役割 | 値 |
|------|-----|
| 背景 | `#0a0a0f`（かなり暗め） |
| カード | `#1a1a26` |
| プライマリ | `#7c6aff` |
| アクセント | `#ff6aac` |
| 成功 | `#4ade80` |

---

## 5. コンポーネント責務分割

| 機能 | JS関数群 |
|------|---------|
| TODO管理 | `addTodo / toggleTodo / deleteTodo / renderTodos` |
| 習慣管理 | `addHabit / toggleHabit / renderHabits` |
| スケジュール | `addSchedule / deleteSchedule / renderSchedules` |
| メモ | `saveMemo`（debounce付き自動保存） |
| タイマー | `setTimer / toggleTimer / resetTimer / renderTimer` |
| 統計 | `renderStats`（他の状態変更後に呼び出し） |
