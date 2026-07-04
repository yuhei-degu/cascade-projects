# ⚡ X RSS Tracker

> Xの重要人物アカウント投稿をRSS経由で取得・保存・表示するMVPシステム

## 🏗️ アーキテクチャ

```

## Planning docs (XRSS-AUTO-014)

- `docs/MVP_SLICES.md`
- `docs/ESTIMATE.md`
- `docs/VERIFICATION.md`
- `TASKS.md`
- `PROGRESS.md`
- `HANDOFF.md`
RSSブリッジ (nitter.net / rsshub.app)
        ↓
RSS取得API (rss-parser)
        ↓
データ保存 (Prisma + SQLite)
        ↓
投稿一覧表示 (Next.js 14 + Tailwind)
```

## 🛠 技術スタック

| 領域 | 技術 |
|-----|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| DB | SQLite (MVP) → PostgreSQL対応可 |
| ORM | Prisma |
| RSS解析 | rss-parser |
| スケジューラ | node-cron (5分ごと) |
| UI | Tailwind CSS |
| Test | Jest + ts-jest |

## ⚡ セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. 環境変数設定

```bash
cp .env.example .env
# .env を編集（デフォルトのままでも動作します）
```

### 3. DB初期化

```bash
# Prismaマイグレーション実行 (SQLite dev.db を作成)
npm run db:migrate

# 初期アカウントデータ投入 (elonmusk, sama, demishassabis)
npm run db:seed
```

### 4. 開発サーバー起動

```bash
npm run dev
```

→ http://localhost:3000 でアクセス

---

## 📖 主な機能

### 画面

| URL | 説明 |
|-----|------|
| `/` | 投稿一覧（アカウントフィルター・ページネーション付き） |
| `/accounts` | 監視アカウント管理（追加・一覧） |

### API

| メソッド | エンドポイント | 説明 |
|--------|--------------|------|
| GET | `/api/posts` | 投稿一覧（?page=&per=&username=） |
| GET | `/api/accounts` | 監視アカウント一覧 |
| POST | `/api/accounts` | 監視アカウント追加 |
| POST | `/api/cron` | RSS手動取得トリガー |

### CLI

```bash
# RSS取得を1回手動実行
npm run cron:run

# Prisma Studio でDB確認
npm run db:studio
```

---

## ⚙️ 設定（.env）

```env
# DB (SQLite)
DATABASE_URL="file:./dev.db"

# RSSブリッジ URL
# Nitter: https://nitter.net
# rsshub: https://rsshub.app/twitter/user
RSS_BRIDGE_BASE_URL="https://nitter.net"

# RSS取得間隔（分）
CRON_INTERVAL_MINUTES="5"
```

---

## 🧪 テスト

```bash
# 全テスト実行
npm test

# テスト内容:
# 1. RSS URL組み立てテスト (buildRssUrl)
# 2. DB重複保存テスト (skipDuplicates)
# 3. APIレスポンス形式テスト
# 4. usernameバリデーションテスト
```

---

## 📐 DBスキーマ

```
tracked_accounts
  id, username, displayName, isActive,
  createdAt, updatedAt, lastFetchAt, fetchError

posts
  id, accountId, title, content, url(unique),
  publishedAt, createdAt

  # 将来拡張用 (コメントアウト済み)
  # ai_score Float?
  # ai_summary String?

fetch_logs
  id, accountId, username, status,
  newPosts, totalPosts, errorMsg, durationMs, createdAt
```

---

## 🔮 将来の拡張

- **AI重要度判定**: `posts.ai_score` / `posts.ai_summary` フィールド追加済み設計
- **PostgreSQL移行**: `DATABASE_URL` を変更するだけでOK
- **複数RSSブリッジ**: フォールバック機能の追加
- **通知機能**: 重要投稿のSlack/LINE通知

---

## 📁 ディレクトリ構造

```
x-rss-tracker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── posts/route.ts       # GET /api/posts
│   │   │   ├── accounts/route.ts    # GET/POST /api/accounts
│   │   │   └── cron/route.ts        # POST /api/cron (手動実行)
│   │   ├── accounts/page.tsx        # アカウント管理UI
│   │   ├── page.tsx                 # 投稿一覧UI
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── PostCard.tsx             # 投稿カード
│   │   ├── AddAccountForm.tsx       # アカウント追加フォーム
│   │   └── RefreshButton.tsx        # RSS手動取得ボタン
│   ├── lib/
│   │   ├── db/client.ts             # Prismaシングルトン
│   │   └── rss/
│   │       ├── fetcher.ts           # RSS取得・パース
│   │       └── processor.ts         # DB保存ロジック
│   ├── cron/
│   │   ├── scheduler.ts             # node-cronスケジューラ
│   │   └── runOnce.ts               # 手動実行スクリプト
│   └── instrumentation.ts           # サーバー起動時Cron初期化
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── rss-fetcher.test.ts
│   ├── duplicate-check.test.ts
│   └── api.test.ts
└── README.md
```
