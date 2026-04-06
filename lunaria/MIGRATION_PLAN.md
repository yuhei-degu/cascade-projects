# ルナリア 技術スタック＆移行計画

## 技術スタック

| 役割 | 採用技術 |
|---|---|
| Frontend / API | Next.js 15 (App Router) |
| スタイル | Tailwind CSS v4 |
| DB | Supabase（Certi-AI Hub プロジェクト相乗り・lunaria_ prefix） |
| 軽量AI（light_normal / light_probe） | Gemini Flash |
| 重いAI（claude_serious） | Claude Sonnet |

---

## シン→ルナリア 移行方針

シンのコードベースをベースに作り変える。ゼロから書かない。

### そのまま使える（流用）
- Next.js プロジェクト構成
- Supabase 接続設定（lib/supabase.ts）
- 型定義の骨格（lib/types.ts）
- ページルーティング構造
- .env.local（APIキーそのまま）

### 作り変える
| ファイル | 変更内容 |
|---|---|
| lib/ai.ts | Gemini Flash API 追加・ルーティングロジック実装 |
| lib/types.ts | ルナリア用の型に更新（RouteType・ScoreState等） |
| lib/constants.ts | シン固有の定数を削除・ルナリア用に置き換え |
| lib/state.ts | mood多数決→スコア累積ロジックに変更 |
| lib/memory.ts | 5層→3層（raw_logs/session/core_memory）に変更 |
| app/page.tsx | ホーム画面をルナリア用UIに |
| app/chat/page.tsx | チャット画面をルナリア用UIに |
| supabase/migrations/ | lunaria_ prefix テーブルのSQL |

### 削除する
- SLOT_CONFIG（朝/昼/夜トリガー）→ ルナリアには不要
- StateBuf（mood多数決バッファ）→ スコアベースに変更
- TriggerBubble コンポーネント

---

## DB テーブル設計（lunaria_ prefix）

```
lunaria_users           ユーザー基本情報
lunaria_messages        全発言（raw_logs兼用）
lunaria_session         直近20発言キャッシュ
lunaria_core_memory     長期記憶
lunaria_routing_log     スコア履歴（デバッグ用）
```

---

## Phase 1 実装タスク

### TASK-L01：プロジェクト複製＋クリーンアップ
- shin-companion を lunaria にコピー
- 不要ファイルを削除
- package.json の name を lunaria に変更

### TASK-L02：Gemini Flash API 接続
- @google/generative-ai パッケージ追加
- lib/gemini.ts 作成
- light_normal のキャラプロンプト（v4確定版）を注入

### TASK-L03：ルーティングロジック実装
- lib/routing.ts 作成
- message_score 計算
- window_score（直近5発言）累積
- light_normal / light_probe / claude_serious の3分類

### TASK-L04：DB テーブル作成
- supabase/migrations/001_lunaria_init.sql 作成
- Supabase SQL Editor で実行

### TASK-L05：チャットループ実装
- app/api/chat/route.ts を書き換え
- Gemini → Claude の切り替えロジック
- raw_logs + session 保存

### TASK-L06：UI 作成
- app/page.tsx（ホーム）
- app/chat/page.tsx（チャット）
- ルナリアキャラに合わせたデザイン

---

## Phase 2 以降（Phase 1 完了後）

- light_probe テンプレート実装
- claude_serious 切り替え演出
- core_memory 昇格ロジック
- guard_memory
- lunaria_curiosity システム
