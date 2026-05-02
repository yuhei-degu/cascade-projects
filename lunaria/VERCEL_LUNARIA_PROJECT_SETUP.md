# Lunaria 専用 Vercel Project 作成チェックリスト

作成：2026-05-02
位置付け：`PROD_DEPLOY_STATUS.md` で判明したブロッカー解消用の作業手順
出典：`PROD_DEPLOY_STATUS.md`（既存 Vercel プロジェクトは Certi-AI Hub をビルドしており、Lunaria は未デプロイ状態）

## 0. 前提・絶対遵守事項

- **既存 Vercel プロジェクトに触れない**：`cascade-projects` / `cascade-projects-lvq1` は Certi-AI Hub の本番。Root Directory やビルド設定の変更禁止
- **新規プロジェクト**を作成する（既存プロジェクトの再利用ではない）
- リポジトリは同じ `github.com/yuhei-degu/cascade-projects` を使い、Root Directory で分離する
- アプリコードは一切編集しない（本作業は Vercel 設定のみ）

---

## 1. 事前準備（プロジェクト作成前）

### 1.1 値の手元準備

新規プロジェクトに投入する環境変数の値を、コピペ可能な形で手元に揃える：

- [ ] `NEXT_PUBLIC_SUPABASE_URL`（Supabase Dashboard → Project Settings → API → Project URL）
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`（同上 → anon public key）
- [ ] `SUPABASE_SERVICE_ROLE_KEY`（同上 → service_role key、**コピー後は画面を閉じる**）
- [ ] `GEMINI_API_KEY`（Google AI Studio → API keys）
- [ ] `ANTHROPIC_API_KEY`（claude_serious 経路を本番で使う予定があれば。未使用なら省略可）

### 1.2 既存 Vercel プロジェクトの状態を控える

ロールバック時の対比のため、現状をスクショ or メモ：

- [ ] `cascade-projects` の Root Directory（おそらく空 or `certi-ai-hub`）
- [ ] `cascade-projects-lvq1` の Root Directory
- [ ] それぞれの本番 URL とカスタムドメイン

### 1.3 ローカル状態の確認

- [ ] `git checkout master && git pull origin master` で最新化
- [ ] `cd lunaria-app && npm run build` がローカルで通る
- [ ] `lunaria-app/scripts/prod-selfcheck.js` が存在する（`PROD_DEPLOY_STATUS.md` 記載）

---

## 2. Vercel 新規プロジェクト作成

### 2.1 プロジェクト Import

1. Vercel Dashboard → 右上「Add New」→「Project」
2. **Import Git Repository** で `yuhei-degu/cascade-projects` を選択
   - 同じリポジトリを既存 2 プロジェクトでも使っているが、新規 import で並列作成可能
3. プロジェクト名を入力：
   - 推奨：**`lunaria`**（短く明示的）
   - 代替：`lunaria-app`、`lunaria-prod`
   - **`cascade-projects-*` と被らない名前**にする

### 2.2 Build & Development Settings

| 項目 | 値 |
|---|---|
| Framework Preset | **Next.js** |
| **Root Directory** | **`lunaria-app`** ← これが最重要、デフォルトの空 / `./` ではない |
| Build Command | `npm run build`（または空でデフォルト） |
| Output Directory | `.next`（または空でデフォルト） |
| Install Command | `npm install`（または空でデフォルト） |
| Node.js Version | 20.x（推奨） |

- [ ] **Root Directory を `lunaria-app` に明示設定**したことを画面で確認
- [ ] 「Override」スイッチで Build Command / Output が変な値になっていないことを確認

### 2.3 Environment Variables（先に登録してから初回 Deploy）

「Environment Variables」セクションで 5 個（+1 任意）登録：

| 変数名 | スコープ | Sensitive | 値 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production / Preview | No | §1.1 で控えた値 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production / Preview | No | §1.1 で控えた値 |
| `SUPABASE_SERVICE_ROLE_KEY` | Production / Preview | **Yes** | §1.1 で控えた値 |
| `GEMINI_API_KEY` | Production / Preview | **Yes** | §1.1 で控えた値 |
| `ANTHROPIC_API_KEY` | Production（任意） | **Yes** | claude_serious 用、省略可 |

- [ ] **Production スコープに 5 個すべて**登録（Preview は Production と同じで構わないが分離推奨）
- [ ] Sensitive フラグが付くべき 3 個（`SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`）に**鍵アイコン**が出ている
- [ ] `NEXT_PUBLIC_*` の 2 個は鍵アイコン無しで OK（クライアント露出するため）

### 2.4 Deploy 実行

1. 「Deploy」ボタン押下
2. ビルドログを監視：
   - [ ] `Building lunaria@<version>` などで Lunaria としてビルドされている（`certi-ai-hub` ではない）
   - [ ] エラー / 警告が無い
3. 「Visit」ボタンで本番 URL（例：`https://lunaria.vercel.app`）が払い出される

### 2.5 デプロイ後すぐの基本確認

- [ ] Deployments タブで Status: `READY`
- [ ] 払い出された URL を控える（**`<lunaria-production-url>`** と呼ぶ）
- [ ] Functions タブで `/api/chat`, `/api/gacha/*`, `/api/health` が一覧に出ている

---

## 3. Smoke Test URL リスト

`<lunaria-production-url>` を実際の URL に置換して各エンドポイントを叩く。

### 3.1 ブラウザで開いて目視確認

| # | URL | 期待動作 |
|---|---|---|
| 1 | `https://<lunaria-production-url>/` | チャット画面が表示（Certi-AI Hub のページが出ないこと） |
| 2 | `https://<lunaria-production-url>/gacha` | ガチャ画面 + チケット/コイン状態表示 |
| 3 | `https://<lunaria-production-url>/gacha/inventory` | 「月箱の棚」インベントリ画面 |

### 3.2 API 単体（curl / DevTools / 直接 URL）

| # | URL | メソッド | 期待レスポンス |
|---|---|---|---|
| 4 | `https://<lunaria-production-url>/api/health` | GET | `{"status":"ok",...}` |
| 5 | `https://<lunaria-production-url>/api/gacha/state` | GET | `{ticket_count, coin_balance, earned_today, daily_bonus_available}` |
| 6 | `https://<lunaria-production-url>/api/gacha/pool` | GET | `{items: [...]}`（30 件以上） |
| 7 | `https://<lunaria-production-url>/api/gacha/inventory` | GET | `{items: [...]}`（初回は空でも OK） |

### 3.3 セルフチェックスクリプト（CLI）

ローカル端末から：

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run prod:check -- https://<lunaria-production-url>
```

- [ ] 全項目で OK が出る
- [ ] `Pool count` が期待値（30 以上）
- [ ] `Default user exists` が OK
- [ ] `Gacha tables` が 7/7
- [ ] `RPC permissions` が `service_role` のみ

### 3.4 対話的シナリオ（既存 Runbook §3.4 を本 URL で実行）

`PROD_DEPLOY_RUNBOOK.md §3.4` の 10 ステップを `<lunaria-production-url>` で順に実施：

- [ ] チャット送信 → ストリーミング表示
- [ ] 🎟 アイコン → /gacha へ
- [ ] デイリーボーナス受取
- [ ] 「引く」→ 5 秒演出 → 結果モーダル
- [ ] ルナのリアクション表示
- [ ] かぶり時のコイン獲得
- [ ] /gacha/inventory でアイテム表示
- [ ] カテゴリフィルター切替
- [ ] チケット 0 状態のメッセージ

---

## 4. Rollback 手順

新規プロジェクトを作る方式なので、**既存 Certi-AI Hub への影響はゼロ**。これが最大の安全性。

### 4.1 軽微な問題（バグ・タイポ等）

- master に修正コミット → 自動再デプロイ
- 旧バージョンに戻したいなら：Vercel Deployments → 該当 deployment → **「Promote to Production」**
  - これは Lunaria 専用プロジェクト内の操作なので、Certi-AI Hub は無関係

### 4.2 致命的な問題（本番が壊れた、データ汚染等）

優先度順に：

1. **デプロイのロールバック**：直前の正常な deployment を Promote
2. **プロジェクトの一時停止**：Settings → 「Pause Deployments」（DNS / URL は維持されるが新ビルドは止まる）
3. **プロジェクトの削除**（最終手段）：Settings → Delete Project
   - **重要**：削除しても `cascade-projects` / `cascade-projects-lvq1`（Certi-AI Hub）は無関係なので影響しない

### 4.3 カスタムドメインを設定した場合の注意

- ドメインを Lunaria プロジェクトに割り当て → Certi-AI Hub のドメイン設定は無変更
- ロールバックでドメイン再割り当てが必要な場合：Settings → Domains で別プロジェクトへ移動
- DNS 反映には数分かかる場合あり

### 4.4 Supabase 側の影響範囲

- 本作業は **Vercel 設定のみ**で、Supabase の構造・データに影響しない
- Supabase migrations は事前適用済み（`PROD_DEPLOY_STATUS.md` で確認済）
- Lunaria プロジェクト削除しても Supabase テーブル/RPC は残る

---

## 5. 「やってはいけないこと」リスト

- ❌ 既存 `cascade-projects` の Root Directory を `lunaria-app` に変更する → **Certi-AI Hub が壊れる**
- ❌ 既存 `cascade-projects-lvq1` を流用する → 同上
- ❌ Lunaria のカスタムドメインを Certi-AI Hub のドメインに割り当てる → 衝突して片方の本番が落ちる
- ❌ `SUPABASE_SERVICE_ROLE_KEY` を Sensitive 無しで登録 → ログ漏洩リスク
- ❌ env vars を Production スコープに入れ忘れて Preview だけに登録 → 本番で undefined になる
- ❌ Build Command を `cd lunaria-app && npm run build` に書き換える → Root Directory 設定と二重で経路がずれる

---

## 6. 完了判定

すべてに ✓ が付いたら本作業完了：

- [ ] §2 の Vercel プロジェクト作成完了、`<lunaria-production-url>` 確定
- [ ] §3.1〜3.3 の Smoke Test がすべて通過
- [ ] §3.4 の対話的シナリオ 10 ステップ通過
- [ ] 既存 `cascade-projects` / `cascade-projects-lvq1` の Certi-AI Hub が**変更なし**で動いている（必ず確認）
- [ ] `<lunaria-production-url>` を `PROD_DEPLOY_STATUS.md` に追記してリポジトリにコミット

完了後、`PROD_DEPLOY_RUNBOOK.md §3.6` に従い 30 分後の遅延的問題チェックを実施。

---

## 7. 関連ドキュメント

- `PROD_DEPLOY_STATUS.md`：現状の本番デプロイ状況・本書の前提
- `PROD_DEPLOY_RUNBOOK.md`：環境変数 / Supabase 確認 / スモークテスト詳細
- `NEXT_PHASE_CANDIDATES.md` 候補 D：本作業が解消するブロッカー
- `lunaria-app/scripts/prod-selfcheck.js`：§3.3 で使う読み取り専用チェックスクリプト

---

## 8. 改訂ログ

| 日付 | 改訂内容 |
|---|---|
| 2026-05-02 | 初版（PROD_DEPLOY_STATUS.md のブロッカー解消手順として作成） |

実施後、実際のプロジェクト名・URL・つまずいた箇所を本書に追記する想定。
