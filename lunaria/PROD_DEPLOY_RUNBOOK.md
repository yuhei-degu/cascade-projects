# Lunaria 本番デプロイ・動作確認 Runbook

作成：2026-04-28
位置付け：候補 D（本番動作確認 + Vercel/Supabase 環境整備）の作業手順書
対象：Phase G〜G++ + 月箱コンテンツ v1 + ガチャ UI コピー v2 までを本番に反映する

リポジトリ：`github.com/yuhei-degu/cascade-projects`（CascadeProjects monorepo）
本番 URL：`cascade-projects-lvq1.vercel.app`（lunaria-app は同 URL 配下）

前提：
- master に Phase G/G+/G++、012 content v1、UI コピー v2 がマージ済み
- ローカル / dev 環境では migrations 009〜012 を適用済み・動作確認済み

---

## 1. Vercel 本番環境 env vars チェックリスト

### 1.1 必須環境変数（5 つ）

| 名前 | 用途 | 公開可否 | 設定先 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | 公開可（クライアント参照） | Production / Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（ブラウザ用） | 公開可 | Production / Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key（サーバ専用） | **非公開・絶対漏洩 NG** | Production / Preview |
| `GEMINI_API_KEY` | Gemini 2.5 Flash API key | 非公開 | Production / Preview |
| `ANTHROPIC_API_KEY` | Claude Sonnet API key（claude_serious 用、未使用なら任意） | 非公開 | Production（オプショナル）|

### 1.2 設定確認手順（Vercel ダッシュボード）

1. `https://vercel.com/<account>/cascade-projects/settings/environment-variables` にアクセス
2. 各変数について以下を確認：
   - [ ] **値が設定されている**（空ではない）
   - [ ] **Production スコープにチェック**が入っている
   - [ ] **Sensitive** フラグが付いている（`SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY`）
   - [ ] **Preview** スコープも別キーで設定されている（推奨：dev と prod を分離）

### 1.3 セキュリティ確認

| 項目 | チェック |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` がブラウザバンドルに含まれていない | DevTools の Network タブで JS バンドルを検索、ヒット 0 |
| `NEXT_PUBLIC_*` 以外の変数が `process.env.NEXT_PUBLIC_*` 経由で参照されていない | grep `process.env\.[A-Z_]+` でコードを検査 |
| `.env.local` が git に含まれていない | `git ls-files .env.local` で空 |

### 1.4 dev / prod キー分離（推奨）

- **理想**：dev / prod で**別の Supabase プロジェクト**を使う
- **次善**：同じプロジェクトでも、service_role_key だけは別環境で同一でもよい（ただし dev 事故が prod に波及するリスクあり）
- 現状確認：`NEXT_PUBLIC_SUPABASE_URL` の値が dev / prod で同じか異なるか

→ もし**同じ Supabase プロジェクト**を使っているなら、本番と開発のテストデータが混ざる可能性。要判断。

---

## 2. Supabase 本番側 確認項目

### 2.1 migration 適用状態（必須 12 本）

dev で適用済みの順序通りに、本番にも適用されている必要がある。

| # | ファイル | 内容 | 確認 SQL |
|---|---|---|---|
| 001 | `001_lunaria_init.sql` | 基礎テーブル | `select count(*) from public.lunaria_users;` |
| 002 | `002_routing_review.sql` | ルーティングレビュー | `select count(*) from public.lunaria_routing_review;` |
| 003 | `003_seed_dev_user.sql` | **デフォルトユーザー投入** | `select id from public.lunaria_users where id = '00000000-0000-0000-0000-000000000001';` |
| 004 | `004_lunaria_diary.sql` | 日記機能 | テーブル `lunaria_diary` 存在確認 |
| 005 | `005_lunaria_state.sql` | 感情状態 | `lunaria_state` 存在 |
| 006 | `006_user_profile.sql` | プロフィール EAV | `lunaria_user_profile` 存在 |
| 007 | `007_core_memory_normalize.sql` | コアメモリ正規化 | `lunaria_core_memory` のスキーマ確認 |
| 008 | `008_subscription_and_memory_surface.sql` | サブスク + 記憶 surface | `lunaria_users.plan` カラム存在 |
| **009** | `009_gacha.sql` | **ガチャ DB 一式 + RPC + RLS** | `lunaria_gacha_pool` 等 7 テーブル存在 |
| **010** | `010_gacha_seed.sql` | **プレースホルダー 25 アイテム** | `select count(*) from lunaria_gacha_pool;` >= 25 |
| **011** | `011_lock_gacha_rpc.sql` | **RPC 権限制限** | RPC 権限確認（後述） |
| **012** | `012_gacha_content_v1.sql` | **月箱コンテンツ v1** | リネーム後のアイテム名で確認 |

### 2.2 重要：デフォルトユーザーの存在確認

コード内では `USER_ID = '00000000-0000-0000-0000-000000000001'` がハードコードされている。
**本番にこのユーザーが居ないと全機能が動かない**。

```sql
select id, plan from public.lunaria_users
 where id = '00000000-0000-0000-0000-000000000001';
-- 1 行返ってくる必要あり
```

存在しない場合：003_seed_dev_user.sql を本番で実行（または該当 INSERT を抽出して実行）。

### 2.3 ガチャテーブル 7 つの存在確認

```sql
select table_name from information_schema.tables
 where table_schema = 'public' and table_name like 'lunaria_gacha%'
 order by table_name;
-- 期待 7 行：
-- lunaria_gacha_coins
-- lunaria_gacha_daily_bonus
-- lunaria_gacha_daily_quota
-- lunaria_gacha_history
-- lunaria_gacha_inventory
-- lunaria_gacha_pool
-- lunaria_gacha_tickets
```

### 2.4 RPC 関数の存在確認

```sql
select proname, pg_get_function_arguments(p.oid) as args
  from pg_proc p
  join pg_namespace n on p.pronamespace = n.oid
 where n.nspname = 'public' and proname in ('draw_gacha', 'grant_gacha_ticket')
 order by proname;
-- 期待 2 行
```

### 2.5 RPC 権限の確認（011 適用済みかの確証）

```sql
-- public/anon/authenticated から EXECUTE 権限が剥奪されている
select grantee, privilege_type
  from information_schema.routine_privileges
 where routine_name in ('draw_gacha', 'grant_gacha_ticket')
   and routine_schema = 'public'
 order by routine_name, grantee;
-- 期待：grantee = 'service_role' のみ
-- 'public' / 'anon' / 'authenticated' は出ないこと
```

もし `anon` / `authenticated` が表示されたら、**011_lock_gacha_rpc.sql の本番適用が漏れている**。即適用。

### 2.6 RLS 状態の確認

```sql
select schemaname, tablename, rowsecurity
  from pg_tables
 where schemaname = 'public' and tablename like 'lunaria_gacha%'
 order by tablename;
-- 期待：すべて rowsecurity = true
```

### 2.7 プール内容の確認

```sql
-- レアリティ別の件数（v1 適用後の期待値）
select rarity, count(*) from public.lunaria_gacha_pool
 where is_active group by rarity order by rarity;

-- 期待値（012 適用後・現状）：
-- common_a:     5
-- common_b:     5
-- rare_a:       3
-- rare_b:       3
-- epic:         2
-- legendary:    2
-- urban_legend: 10  ← v1 で 5 → 10 に増えた状態
```

### 2.8 リネーム後のアイテム名サンプリング

```sql
-- v1 でリネームされたアイテムが本番でも反映されているか
select name from public.lunaria_gacha_pool
 where name in (
   '三日月のろうそく', '月相の振り子時計', '三日月のステンドグラス',
   'うた箱', 'どこかで見たコート', '逆さの砂時計', '瞬きの猫'
 ) order by name;
-- 期待：7 行返る（旧名「ろうそく」「アンティーク時計」等は 0 行）
```

---

## 3. 本番デプロイ前後の動作確認手順

### 3.1 デプロイ前チェック（ローカル）

```bash
# 1. master が最新で、ローカルで型チェック通過
git checkout master
git pull origin master
cd lunaria-app
npx tsc --noEmit

# 2. 念のため lint（あれば）
npm run lint

# 3. ビルドが通るか確認
npm run build
```

すべて通過したら次へ。

### 3.2 Supabase 本番への migration 適用

Supabase Studio の SQL Editor で**順番に**：

1. §2.1 の 12 本を未適用分だけ実行
2. 適用後、§2.3〜2.8 の確認 SQL をすべて流す
3. 期待値と一致しない箇所があれば**デプロイ前に解消**

### 3.3 Vercel デプロイ実行

```bash
# master を push（Vercel が自動デプロイ）
git push origin master
```

Vercel ダッシュボードで：
- [ ] Build Status: Ready
- [ ] Build Logs に error / warn がないか確認
- [ ] Deployment URL が払い出されている

### 3.4 本番スモークテスト（ブラウザ）

順序通りに実施。途中でつまずいたら該当ステップで停止し、§4 の切り分けへ。

| # | 操作 | 期待動作 | NG 時に見る場所 |
|---|---|---|---|
| 1 | 本番 URL を開く | ホーム画面（チャット）が表示 | Vercel build logs |
| 2 | ルナにメッセージ送信 | 応答がストリーミング表示 | `[chat-stream]` ログ |
| 3 | 右上の 🎟 をクリック | `/gacha` に遷移、チケット/コイン表示 | `[gacha/state]` ログ |
| 4 | デイリーボーナス受取（初回のみ） | チケット +1、ボタン消える | `[gacha/daily]` ログ |
| 5 | 「引く」ボタンを押す | 5 秒演出 → 結果モーダル表示 | `[gacha/draw]` `[gacha-reaction]` ログ |
| 6 | 結果モーダル下部にルナのリアクション表示 | 1〜2 文の千束テンポ文 | `[gacha-reaction] LLM failed` 出てないか |
| 7 | 同じアイテムを再度引く（複数回） | かぶり時にコイン加算メッセージ | `was_duplicate=true` か |
| 8 | `/gacha/inventory` に遷移 | 取得済みアイテムがグリッド表示 | `[gacha/inventory]` ログ |
| 9 | カテゴリフィルター切替 | 該当カテゴリのみ表示 | フロント JS エラー（DevTools） |
| 10 | チケット 0 にして「引く」 | 「チケットが足りないよ」系メッセージ | `error: 'no_ticket'` 返却 |

### 3.5 モバイル / 異環境チェック

- [ ] iPhone Safari（実機 or Chrome DevTools のデバイスエミュレーション）
- [ ] Android Chrome（同上）
- [ ] PC Chrome / Firefox / Edge
- [ ] 低帯域シミュレーション（Slow 3G）でストリーミング表示が崩れないか

### 3.6 30 分後の確認（遅延的問題のキャッチ）

デプロイ後 30 分ほど経ってから：
- Vercel の Function Logs で 5xx エラーが 0 件か
- Supabase の DB Logs にエラーがないか
- Gemini API ダッシュボードでレート制限エラーが出ていないか

問題なければ本番反映完了。

---

## 4. 失敗時に見るログと切り分け順

### 4.1 ログレイヤーマップ

```
┌──────────────────────────────────┐
│ ① ブラウザ DevTools              │  クライアント表示・ネットワーク・JS エラー
│   - Console                      │
│   - Network                      │
│   - Application（localStorage）  │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│ ② Vercel Function Logs           │  サーバ側 API 実行ログ
│   - Real-time Logs               │
│   - Build Logs                   │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│ ③ Supabase Logs / SQL Editor     │  DB 実行・データ状態
│   - Logs                         │
│   - SQL Editor で直接照会        │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│ ④ Gemini API Console（外部）     │  LLM 呼び出しエラー・レート制限
└──────────────────────────────────┘
```

### 4.2 症状別 切り分けフロー

| 症状 | 1 番目 | 2 番目 | 3 番目 |
|---|---|---|---|
| **/gacha が 404** | Vercel Build Logs | git の master 状態 | `app/gacha/page.tsx` 存在確認 |
| **/gacha が 500** | Vercel Function Logs（`[gacha/state]`） | Supabase 接続性 | env vars 設定 |
| **チケット 0 でないのに「足りない」と出る** | Vercel Logs（`[gacha/draw]`） | Supabase で `select * from lunaria_gacha_tickets` | RPC 権限（§2.5） |
| **「引く」が動作しない** | DevTools Network タブ | Vercel Function Logs | RPC 関数の存在（§2.4） |
| **演出は出るがリアクションが出ない** | `[gacha-reaction] LLM failed` ログ | `GEMINI_API_KEY` 設定 | Gemini API quota |
| **演出も出ない** | DevTools Console JS エラー | `production_seed` レスポンス | `app/gacha/page.tsx` の演出ロジック |
| **インベントリが空** | `[gacha/inventory]` ログ | Supabase で `select * from lunaria_gacha_inventory where user_id = '00000000-...'` | デフォルトユーザー存在 |
| **モーダルが閉じない・連打可能** | DevTools Console | `app/gacha/page.tsx` の state 管理 | – |
| **応答が遅い・タイムアウト** | Vercel Function Duration メトリック | Gemini API レイテンシ | Supabase クエリ時間 |

### 4.3 grep するべきログパターン

Vercel Function Logs で以下の prefix を見ると初動が早い：

```
[chat-stream]      チャット ストリーミングの停止理由
[gacha/draw]       ガチャ実行のエラー
[gacha/state]      状態取得のエラー
[gacha/inventory]  インベントリ取得のエラー
[gacha/daily]      デイリーボーナス
[gacha-reaction]   ルナのリアクション生成（特に LLM failed）
[memory]           コアメモリ保存
[extract]          会話抽出
finish_reason=length  Gemini が thinking budget で打ち切られたサイン
finish_reason=safety  Gemini の安全フィルター発火
```

### 4.4 「全部動かない」級の障害ファースト・チェック

優先度高い順に：

1. **env vars 確認**：`SUPABASE_SERVICE_ROLE_KEY` が空 or 間違ってる → 即症状全滅
2. **デフォルトユーザー存在**：`select * from lunaria_users where id = '00000000-...'` で 0 行 → 即症状全滅
3. **Supabase URL のミス**：dev URL を prod に設定など → 接続自体できない
4. **migration 未適用**：プロダクション DB に 009〜012 がない → ガチャだけ動かない
5. **RPC 権限の問題**：011 が未適用 or 上書きされた → セキュリティリスク + チケット消費系で失敗

---

## 5. Codex に実装させるべき小タスク（運用補強）

本番運用を堅実にするため、Codex に切り出して実装させたい補助機能。**手順書本体とは独立**に進めて良い。

### 5.1 小タスク群

| # | タスク | 工数 | 優先度 | 説明 |
|---|---|---|---|---|
| 1 | `/api/health` エンドポイント | 半日 | 高 | DB 接続性 / Gemini 接続性 / migration version を返す簡易ヘルスチェック |
| 2 | 本番セルフチェックスクリプト（CLI） | 1 日 | 中 | §2 の確認 SQL を一気に流して結果を出す Node スクリプト |
| 3 | `/api/admin/pool-stats`（保護必須） | 半日 | 中 | レアリティ別件数・最終更新時刻を返す管理エンドポイント |
| 4 | `[gacha-reaction] LLM failed` カウンタ | 半日 | 中 | fallback 発火率を console.log 経由で集計可能にする（Vercel 側で grep しやすく） |
| 5 | デフォルトユーザー存在チェッカー | 1 時間 | 中 | アプリ起動時に user_id 存在を確認、無ければサイレント insert（リカバリー用） |
| 6 | Vercel Function 設定の最適化 | 1 時間 | 低 | `app/api/chat/route.ts` の `maxDuration` を明示（ストリーミングで切れないよう 60s） |
| 7 | エラーモニタリング雛形 | 1 日 | 低 | Sentry 等への error イベント送信フック（今は console.error のみ） |

### 5.2 各小タスクの詳細

#### 5.2.1 `/api/health`（高優先）

```ts
// 期待レスポンス例
{
  "status": "ok",
  "timestamp": "2026-04-28T10:00:00Z",
  "checks": {
    "supabase": { "ok": true, "latency_ms": 42 },
    "gemini": { "ok": true, "latency_ms": 380 },
    "default_user": { "ok": true, "id": "00000000-..." },
    "gacha_pool": { "ok": true, "total": 30, "by_rarity": {...} }
  }
}
```

利点：本番デプロイ後の 30 分後チェックが 1 リクエストで済む。継続的監視（UptimeRobot 等）にも転用可能。

#### 5.2.2 本番セルフチェックスクリプト

```bash
node scripts/prod-selfcheck.js
# 期待出力例：
# ✓ Default user exists
# ✓ Gacha tables: 7/7 present
# ✓ RPC functions: 2/2 present
# ✓ RLS enabled: 7/7 tables
# ✓ Pool count: 30 (expected ≥ 25)
# ⚠ RPC permission: 'authenticated' has EXECUTE on draw_gacha (should be revoked!)
```

`npm run prod:check` で実行できると、デプロイ後の確認が機械化できる。

#### 5.2.3 デフォルトユーザー存在チェッカー

`lib/lunaria/bootstrap.ts` のような新規ファイルで、`/api/chat` や `/api/gacha/state` の冒頭で 1 回だけチェック → 居なければ insert。本番セットアップ漏れの自動修復。

#### 5.2.4 maxDuration 明示

`app/api/chat/route.ts` の先頭に：

```ts
export const maxDuration = 60  // ストリーミングがタイムアウトしないよう明示
```

Vercel Hobby/Pro で挙動が違うので、明示しておく方が安全。

### 5.3 Codex 引き渡し用 TODO リスト

Codex に渡す際の作業項目（コピペ用）：

```markdown
## 本番運用補強 タスク

PROD_DEPLOY_RUNBOOK.md §5 を参照。優先度順に：

- [ ] /api/health 実装（lib/health.ts + app/api/health/route.ts）
- [ ] 本番セルフチェックスクリプト（scripts/prod-selfcheck.js）
- [ ] /api/chat の maxDuration 明示
- [ ] デフォルトユーザー存在チェッカー（lib/lunaria/bootstrap.ts）
- [ ] /api/admin/pool-stats（要認証付き）

触らないファイル：app/page.tsx, lib/prompt.ts, lib/lunaria/gacha.ts のロジック本体
```

---

## 6. デプロイ承認チェックリスト（最終）

本番反映の前に、以下すべてに ✓ を付けられる状態にする：

### 環境
- [ ] Vercel に 5 つの env vars がすべて設定されている（§1.1）
- [ ] `SUPABASE_SERVICE_ROLE_KEY` がブラウザバンドルに含まれていない（§1.3）
- [ ] dev / prod キー分離方針が決まっている（§1.4）

### Supabase
- [ ] migrations 001〜012 が本番 Supabase に適用済み（§2.1）
- [ ] デフォルトユーザー（`00000000-...`）が本番に存在（§2.2）
- [ ] ガチャテーブル 7 つすべて存在（§2.3）
- [ ] RPC 関数 2 つ存在（§2.4）
- [ ] RPC 権限が `service_role` のみに制限（§2.5）
- [ ] RLS が 7 テーブルすべて enabled（§2.6）
- [ ] プール件数が期待値（30 件以上）（§2.7）
- [ ] v1 リネーム後のアイテム名が反映（§2.8）

### コード
- [ ] master が最新（`git pull` 済み）
- [ ] ローカルで `tsc --noEmit` 通過
- [ ] ローカルで `npm run build` 通過
- [ ] 触らないはずの `app/page.tsx` `app/api/chat/route.ts` `lib/lunaria/gacha.ts` `lib/prompt.ts` が想定通り変更ナシ

### スモークテスト準備
- [ ] §3.4 の 10 ステップを実施できる時間を確保（30 分）
- [ ] 本番 URL（cascade-projects-lvq1.vercel.app）にアクセスできる端末
- [ ] DevTools / Vercel Logs / Supabase Dashboard を切り替えられる作業環境

すべてチェック付いたら **Vercel に push → §3 のスモークテスト実行**。

---

## 7. 関連ドキュメント

- `MOONBOX_CONTENT_PROPOSAL.md` / `MOONBOX_IMPLEMENTATION_PLAN.md`：v1 設計
- `MOONBOX_V2_PROPOSAL.md`：v2 提案（次フェーズ）
- `MOONBOX_UI_COPY_V2.md`：UI コピー集
- `MOONBOX_ITEM_GUIDELINES.md`：アイテム追加運用ルール
- `GACHA_REACTION_REVIEW.md`：fallback 文言の人格監修
- `PHASE_G_GACHA_DESIGN.md`：システム全体設計
- `lunaria-app/GACHA_REQUIREMENTS.md`：機能要件書
- **本ドキュメント**：本番デプロイ手順
- `NEXT_PHASE_CANDIDATES.md`：候補 D の概要

---

## 8. 改訂ログ

| 日付 | 改訂 | 改訂者 |
|---|---|---|
| 2026-04-28 | 初版 | Claude |

本番デプロイ実施後、§3 / §4 の実体験を踏まえて改訂する想定。特に「§4.2 症状別切り分けフロー」は実際の障害から学んだパターンを追記していく。
