# DB 復旧手順（Supabase プロジェクト消失時）

## 何が起きたか

2026-07-25 時点で、`.env.local` が指す Supabase プロジェクトのホストが DNS で解決できない状態を確認した。

- ローカル DNS・Google Public DNS(8.8.8.8) の両方で NXDOMAIN
- `supabase.com` 自体は正常に解決するため、ネットワーク側の問題ではない
- 一時停止(pause)では DNS レコードは残るため、**プロジェクトが削除された**可能性が高い

### 厄介だった点

アプリは各 API がフォールバックを持つため、DB が死んでいても画面は動いてしまう。
実際 `/api/health` は DB 全滅の状態で `{"status":"ok"}` を返していた。
**偽データの上で使い続けて気づかない**のが最大のリスクだったため、以下を対策済み。

- `/api/health` が実際に DB を叩き、到達不能なら 503 `{"status":"degraded"}` を返す
- DB 到達不能時は全ページ上部に赤い警告バナーを常時表示（`components/DbStatusBanner.tsx`）

## 復旧手順

### 1. 現状確認

```
npx tsx scripts/pivot-metrics.mts     # fetch failed なら DB 到達不能
curl http://localhost:3000/api/health # 503 なら DB 到達不能
```

Supabase ダッシュボードでプロジェクトが実在するか確認する。
- 存在する → プロジェクト参照(ref)が変わっただけ。手順 3 へ
- 存在しない → 新規作成が必要。手順 2 へ

### 2. 新規プロジェクトにスキーマを流す

```
npm run sql:pack-all   # supabase/full-schema.sql を再生成（001〜027 を結合）
```

生成された `supabase/full-schema.sql` を Supabase の SQL Editor に貼り付けて上から実行する。
27 ファイル・欠番なし・約 99KB。個別に流す必要はない。

### 3. 環境変数を更新

更新対象は 3 つ。**ローカルと Vercel の両方**を忘れずに。

| 変数 | 取得場所 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | 同上 → service_role（秘匿。クライアントに出さない） |

- ローカル: `.env.local`
- 本番: Vercel → Settings → Environment Variables → 更新後に再デプロイ

### 4. 検証

```
npm run env:check          # 必須env が揃っているか
node scripts/supabase-verify.js   # テーブル・カラムが正しく作られたか
curl http://localhost:3000/api/health   # 200 {"status":"ok"} になれば復旧
npm run pivot:metrics      # ドッグフーディング計測が動くか
```

`/api/health` が 200 を返し、画面上部の赤いバナーが消えれば完了。

## 再発防止

- 無料枠のプロジェクトは長期間未使用で停止・削除される。定期的に `npm run pivot:metrics` を回すこと自体が生存確認になる
- 本番は Vercel の環境変数を正とし、`.env.local` とズレたら気づけるよう `npm run env:check` を習慣化する
