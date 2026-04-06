# シン — パーソナルAIコンパニオン

## セットアップ

```bash
cd shin-companion
npm install
cp .env.local.example .env.local
# .env.local に ANTHROPIC_API_KEY と Supabase の値を記入
npm run dev
```

## 環境変数

| 変数 | 説明 |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API キー |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（API routes 専用） |

## Supabase マイグレーション

```bash
# Supabase CLI を使う場合
supabase db push

# または Supabase ダッシュボードの SQL Editor に
# supabase/migrations/001_init.sql を直接貼り付けて実行
```

## ファイル構成

```
shin-companion/
├── app/
│   ├── layout.tsx              # ルートレイアウト
│   ├── globals.css             # アニメーション定義
│   ├── page.tsx                # ホーム画面 (TASK-002)
│   ├── chat/page.tsx           # チャット画面 (TASK-004)
│   ├── memories/page.tsx       # 記憶レビュー画面 (TASK-003)
│   └── api/
│       ├── trigger/route.ts    # トリガー生成 (TASK-001)
│       ├── chat/route.ts       # チャット処理 + 記憶抽出
│       └── state/route.ts      # 状態 GET / PUT
├── components/
│   ├── TriggerBubble.tsx       # 朝/夜の一言バブル
│   ├── ChatMessage.tsx         # メッセージ + タイピング
│   ├── StatusBar.tsx           # affinity/trust バー + スコアドット
│   └── MemoryCard.tsx          # 記憶カード（近似バッジ・削除）
├── lib/
│   ├── types.ts                # 全型定義
│   ├── constants.ts            # SLOT_CONFIG / MOOD_CONFIG / STATE_LIMITS
│   ├── supabase.ts             # browser + admin クライアント
│   ├── ai.ts                   # Claude API 呼び出し + プロンプトビルダー
│   ├── trigger.ts              # getSlot / キャッシュキー (TASK-001)
│   ├── state.ts                # applyStateDelta — 平滑化ロジック (TASK-005)
│   └── memory.ts               # 3層記憶操作 + ハイライト (TASK-003)
└── supabase/migrations/
    └── 001_init.sql            # 全テーブル + RLS + トリガー
```

## 実装済みタスク

| TASK | 内容 |
|---|---|
| 001 | 朝/昼/夜スロット別トリガー（時刻判定 + Supabase キャッシュ） |
| 002 | ホーム画面（一言・mood・記憶ハイライト3件・チャット導線） |
| 003 | 記憶レビュー（フィルター・スコア・日時・近似検出・削除） |
| 004 | 会話品質改善（60文字制限・共感→深掘り→提案フロー・人格強化） |
| 005 | 状態更新平滑化（mood多数決5件・delta上限・trust深相談ロック） |

## TODO（本番化）

- [ ] `const USER_ID = 'local-user'` → Supabase Auth (`useUser()`) に差し替え
- [ ] `localStorage` → Supabase テーブルに完全移行
- [ ] Vercel 環境変数設定 → `vercel env pull`
- [ ] 記憶の定期圧縮バッチ（古い `mid` を要約して `long` に統合）
