# Lunaria 変更履歴 + 仕様見直し + 問題点整理
## 作成日：2026-04-05

---

## 帰宅後にやること（優先順）

1. Gemini API に課金する
   → https://aistudio.google.com/app/apikey で課金設定
   → .env.local の GEMINI_API_KEY はすでに入っている

2. 起動コマンド
   ```
   cd C:\Users\yuuve\CascadeProjects\lunaria-app
   npm run dev
   ```
   → localhost:3000 で起動（port 3001/3002/3003 になる場合もある）

3. 話しかけて Gemini が返答するか確認する

---

## 直近の変更まとめ

### AI エンジン変更履歴
| 時期 | 軽量AI | 問題 |
|---|---|---|
| 初期 | Claude Haiku | 丁寧すぎ・軽さ死ぬ |
| v2 | Groq Llama 3.1 8b | 日本語が壊れる |
| v3 | Groq Llama 3.3 70b | 日本語改善・スラングに限界 |
| 現在 | Gemini Flash（OpenAI互換エンドポイント） | 課金後に確認 |

### Gemini 接続方法の変更（重要）
- 旧：`@google/generative-ai` パッケージ → 404/quota エラーが多発
- 新：`openai` パッケージ + GeminiのOpenAI互換エンドポイント
  ```
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
  model: 'gemini-2.0-flash'
  ```
- もし gemini-2.0-flash でエラーなら以下を試す順番：
  1. `gemini-2.0-flash-lite`
  2. `gemini-1.5-flash`
  3. `gemini-2.0-flash-exp`

### キャラプロンプト変遷
| version | スコア | 主な変更 |
|---|---|---|
| v1 | 4/9 | 初版 |
| v2 | 6/9 | probe過剰・思考ワード2個・4文超過・勝手な前提を修正 |
| v3 | 7/9 | 明るさの出し方を追加（感嘆詞・語尾） |
| v4 | 9/9 | probe基準明示・質問1個ルール・知らないことの返し方 |
| v5 | 未テスト | キャラを「落ち着いた相棒」に変更・うーんを追加 |
| v6 | 未テスト | うーん削除・元気さ復活・春日部つむぎ音声最適化 |

→ **v4が唯一テスト合格済み（9/9）**
→ v5/v6 は Gemini 接続後に Phase 0 テストを再実施する必要あり

### アーキテクチャ変更
| 追加ファイル | 内容 |
|---|---|
| lib/enricher.ts | Prompt Enrichment Layer（文脈補完） |
| lib/humanizer.ts | Response Humanization Layer（AI臭い表現の除去） |
| lib/review.ts | ルーティング自動評価ロジック |
| app/api/report/route.ts | 24時間集計レポートAPI |

### DB 変更
| migration | 内容 |
|---|---|
| 001_lunaria_init.sql | 基本テーブル（実行済み） |
| 002_routing_review.sql | routing_log拡張 + routing_review + route_master（実行済み） |
| 003_seed_dev_user.sql | 開発用UUIDユーザー（実行済み） |

---

## 現在の問題点

### 問題1：enricher の enrichedPrompt をモデルに渡すと壊れる【重要】
- 原因：【現在の会話テーマ】等のメタ情報をLlamaが会話として読んでしまう
- 現状：userMessage をそのままモデルに渡す形に戻した（enricherはログ用のみ）
- 本来の使い方：enrichedPrompt をシステムプロンプトに動的に追記する形にすべき
- 対処方針：Gemini 接続後に `callGemini` の systemPrompt に enriched.summary を追記する

### 問題2：v6プロンプト未テスト
- Gemini 接続後に Phase 0 テスト（10発言）を再実施すること
- テストシナリオは phase0_test.md に記載済み

### 問題3：ルーティングスコアのチューニング未完了
- 現状のキーワードリストは日本語の網羅性が低い
- 「しんどい」「つらい」「きつい」等の同義語が部分的にしか入っていない
- 帰宅後：routing_log が溜まったら実際のユーザー発言でキーワードを補完する

### 問題4：NODE_ENV 警告
- `.env.local` に `NODE_ENV=development` 等が設定されている可能性
- 非標準の NODE_ENV 値が入っているとビルドに影響する可能性あり
- 確認コマンド：`cat C:\Users\yuuve\CascadeProjects\lunaria-app\.env.local`

---

## 仕様見直し：現状の設計で懸念があるもの

### 懸念1：enricher と systemPrompt の役割が重複している
現状：
- systemPrompt（prompt.ts）にキャラと会話ルールが全部入っている
- enricher.ts は文脈を補完した enrichedPrompt を作るが、使われていない

理想の設計：
```
systemPrompt = キャラ定義（固定）
+ enriched.summary = 現在の文脈（動的）
```

修正方針（Gemini接続後に実施）：
```ts
// callGemini の system を動的に構築
const dynamicSystem = LUNARIA_SYSTEM_PROMPT + '\n\n## 現在の文脈\n' + enriched.summary
```

### 懸念2：humanizer が強すぎる可能性
- humanizer.ts が「4文以上 → カット」「AI臭い表現 → 削除」を行っている
- Gemini の返答が humanizer で切られて不自然になる可能性
- 対処：Gemini 接続後に humanizer の動作をログで確認し、
  `wasModified: true` の件数が多すぎる場合は制約を緩める

### 懸念3：light_probe がテンプレ固定すぎる
- 現状：10パターン固定、48時間再利用禁止
- 問題：会話の文脈を無視した probe が出る可能性がある
- 改善案：文脈（topic）を加味した probe テンプレートを用意する
  例：仕事の話 → 「それ仕事の話？」/ 恋愛の話 → 「それ誰かのこと？」

### 懸念4：claude_serious の Claude Sonnet が Anthropic クレジット切れ
- 現状：claude_serious に入ると Groq フォールバックになる（品質低下）
- 対処：Anthropic クレジットを追加するか、
  claude_serious の代替として Gemini 1.5 Pro を使う（コスト低い）

---

## 次に実装すべき機能（優先順）

1. Gemini 接続確認 → v6プロンプトの Phase 0 テスト再実施
2. enricher の systemPrompt 動的追記（懸念1の解消）
3. claude_serious のモデルを Gemini Pro に変更（クレジット問題の回避）
4. humanizer の動作確認（懸念2の検証）
5. routing_log が20件溜まったら /api/report で改善候補を確認
6. 春日部つむぎとの音声連携設計（別フェーズ）

---

## ファイル構成（現時点の完全版）

```
lunaria-app/
├── app/
│   ├── page.tsx              チャット画面
│   ├── layout.tsx / globals.css
│   └── api/
│       ├── chat/route.ts     メインAPI（ルーティング・AI・DB保存）
│       └── report/route.ts   育成レポートAPI（GET /api/report）
├── lib/
│   ├── types.ts              全型定義
│   ├── routing.ts            スコア計算・3分類・confidence
│   ├── prompt.ts             キャラプロンプト v6・probeテンプレート
│   ├── ai.ts                 Gemini(OpenAI互換) / Claude API
│   ├── enricher.ts           Prompt Enrichment Layer
│   ├── humanizer.ts          Response Humanization Layer
│   ├── review.ts             ルーティング自動評価ロジック
│   └── supabase.ts           DB接続（lunaria_prefix）
├── supabase/migrations/
│   ├── 001_lunaria_init.sql  ✅ 実行済み
│   ├── 002_routing_review.sql ✅ 実行済み
│   └── 003_seed_dev_user.sql  ✅ 実行済み
└── .env.local                APIキー（GEMINI課金後に動く）
```

lunaria/（設計ドキュメント）
├── SPEC.md           設計仕様書
├── PROGRESS.md       進捗履歴
├── KNOWLEDGE.md      抽象化された知恵
├── prompt_phase0.md  キャラプロンプト v4 確定版（テスト合格済み）
├── phase0_test.md    テストシナリオ
├── phase0_log_analysis.md テスト結果
├── MIGRATION_PLAN.md 技術スタック・移行計画
└── RETURN_CHECKLIST.md このファイル（帰宅後の手順）
