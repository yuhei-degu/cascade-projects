# ルナリア 進捗記録 - 2026-05-03 追記（Phase G+++：Claudeレビュー反映 / 天井200連化）

## 夕方の追加作業

### Claudeレビュー反映 ✅

- `GACHA_PITY_THRESHOLD_REVIEW.md` を受けて、天井閾値は 100 連ではなく 200 連を採用
- `MOONBOX_V2_COPY_FINAL_QA.md` を取り込み。014 の文言は修正なしで適用 OK
- `SUPABASE_GACHA_014_015_RUNBOOK_REVIEW.md` を取り込み、Runbook に RLS / rollback / RPC coexistence / backfill no-op の注意を反映
- `NEXT_PHASE_STATUS_UPDATE_PROPOSAL.md` を取り込み、次フェーズ候補の状態を更新

### 天井200連化 ✅

- `016_gacha_pity_threshold.sql` を追加
  - `draw_gacha_v2` の閾値判定を 99 → 199 に変更
  - table / history columns / grants は 015 のまま維持
- アプリ側の天井表示・強制判定・report / verify の閾値を 200 に統一

現DBはまだ `014` / `015` / `016` 未適用。SQL Editor では必ず `014` → `015` → `016` の順に実行する。

---
# ルナリア 進捗記録 - 2026-05-03（Phase G+++：月箱 v2 / 天井 / 運用検証の整備）

## 本日（5/3）の作業

### 月箱コンテンツ v2：コード側完了 / DB適用待ち ✅

- `MOONBOX_V2_FINAL_REVIEW.md` を作成し、v2 採用リストを確定
- `014_gacha_content_v2.sql` を作成
  - 既存 10 アイテムを `UPDATE`
  - 新規 11 アイテムを `INSERT`
  - 適用後の想定 active pool：30 → 41
- `gacha:verify` で v2 適用後の rarity count / item name を検証できるようにした

現DBはまだ `014` 未適用。`npm run gacha:verify` は `30/41` で失敗するのが正常。

### 天井システム：コード側完了 / 閾値レビュー中 / DB適用待ち ✅

- `GACHA_PITY_SYSTEM_DESIGN.md` を作成
- `015_gacha_pity_system.sql` を作成
  - `lunaria_gacha_pity_state`
  - `lunaria_gacha_history.pity_before / pity_after / pity_triggered`
  - `draw_gacha_v2`
- アプリ側を段階対応
  - `015` 適用済みなら `draw_gacha_v2` を使用
  - `015` 未適用なら旧 `draw_gacha` へ fallback
  - `/gacha` に「月が満ちるまで」表示
  - `/admin/gacha` と `gacha:report` に Moon Fullness 表示

閾値は Claude レビュー後に 200 連へ変更。`016_gacha_pity_threshold.sql` で `draw_gacha_v2` を置き換える。

### 運用・検証ドキュメント整備 ✅

- `POST_CODEX_STATUS_REVIEW.md`：Claude の棚卸しレビューを保存
- `SUPABASE_GACHA_014_015_APPLY_RUNBOOK.md`：SQL Editor 適用手順
- `CLAUDE_HANDOFF_TASKS_2026-05-03.md`：Claude へ渡すレビュータスク
- `gacha:verify`：014/015 適用後の確認CLI

### 現在の次アクション

1. Claude の天井閾値レビューを待つ
2. Claude の Supabase Runbook レビューを待つ
3. 問題なければ Supabase SQL Editor で `014` → `015` → `016` を適用
4. 適用後に以下を実行

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run gacha:report
npm run gacha:verify
npm run gacha:smoke
```

---
# ルナリア 進捗記録 - 2026-05-01（Phase G：ガチャDB適用・安全化・実動作確認）

## 本日（5/1）の作業

### 並行開発ルール整備 ✅

Claude Code と Codex の並行開発で二重 Git / migration 衝突が起きないよう、運用ルールを確定。

**Git の正本**：
- 正本は `C:\Users\yuuve\CascadeProjects` ルートの Git リポジトリ。
- `lunaria-app/` 単独の `git init` はしない。
- `lunaria-app/.git` が生成された場合は残骸扱いで削除し、ルート Git に戻す。

**作業開始時のルール**：
- まず `C:\Users\yuuve\CascadeProjects` で `master` を最新化してから作業する。
- Agent ごとにブランチを分ける（例：`codex/*`, `claude/*`）。
- 同じ日に同じ巨大ファイルを触る場合は、先に担当範囲を宣言する。

**衝突しやすいファイル**：
- `lunaria-app/app/page.tsx`
- `lunaria-app/app/api/chat/route.ts`
- `lunaria-app/lib/prompt.ts`
- `lunaria-app/lib/supabase.ts`
- `lunaria-app/supabase/migrations/*.sql`

**migration ルール**：
- 現在 `001` から `011` まで使用済み。
- 次の新規 migration は `012_*.sql` から開始する。
- Supabase 側へ適用済みの番号は再利用しない。

**5/1 時点の確認済み状態**：
- PR #1 merge 済み、`master` は `e0d74e5`。
- `009_gacha.sql` / `010_gacha_seed.sql` / `011_lock_gacha_rpc.sql` は Supabase 適用済み。
- `lunaria-app/.git` は削除済み。
- ホーム表示、ガチャ画面、デイリーボーナス、ガチャ実行、結果リアクションをブラウザで確認済み。
- PR #2 merge 済み、`master` は `65ffa79`。`.gitignore` 整理、並行開発ルール、プレースホルダー画像非依存の UI を反映済み。

### Phase G++：月箱演出のルナリア寄せ

ガチャ画面の語彙を「引く」中心から「ルナが小さな箱を渡す」体験へ寄せる方針で調整中。

- 画面タイトルを `月箱` に変更。
- 実行ボタンを `受け取る` に変更。
- 演出中に `ルナが箱を選んでる...` / `リボンをほどいてる` / `そっと受け取って` の段階コピーを追加。
- 結果モーダルにレアリティ別の短い余韻コピーを追加。
- 所持品画面を `月箱の棚` に変更し、受け取ったものを静かに並べる場所として整理。

---

### Phase G：Supabase 適用・検証 ✅

4/28 時点で「ユーザーが Supabase SQL Editor で実行」として残っていたガチャDB適用を、接続先 Supabase project `uegefcjabpqinhokgkxe` に反映済み。

**適用済み migration**：
- `009_lunaria_gacha`：7 テーブル + 2 RPC
- `010_lunaria_gacha_seed`：25 アイテム投入
- `011_lock_lunaria_gacha_rpc`：RPC 直叩き防止の追加ロック

**migration ファイル側の修正**：
- `supabase/migrations/009_gacha.sql`
  - `lunaria_gacha_*` 7 テーブルすべて RLS 有効化
  - `draw_gacha` / `grant_gacha_ticket` の `PUBLIC` / `anon` / `authenticated` 実行権限を revoke
  - `service_role` のみ実行可能に変更
  - `lunaria_gacha_pool.name` に unique index 追加
- `supabase/migrations/010_gacha_seed.sql`
  - `on conflict (name) do nothing` を追加し、再実行しても重複投入しない形へ修正
- `supabase/migrations/011_lock_gacha_rpc.sql`
  - 既に適用済みDBへ `PUBLIC` revoke を反映する追加 migration として新規作成

**実DB確認**：
- `lunaria_gacha_pool` / `tickets` / `coins` / `inventory` / `history` / `daily_bonus` / `daily_quota` の 7 テーブルが存在
- 7 テーブルすべて `rls_enabled = true`
- カタログ件数：common_a=5 / common_b=5 / rare_a=3 / rare_b=3 / epic=2 / legendary=2 / urban_legend=5
- RPC 権限：`anon=false` / `authenticated=false` / `service_role=true`
- DB上の日本語データは正常（PowerShell の `Invoke-RestMethod` 表示だけ mojibake）

**実API確認（localhost:3000）**：
- `GET /api/gacha/state`：OK
- `POST /api/gacha/daily`：OK（チケット 1 枚付与）
- `POST /api/gacha/draw`：OK（1 回ドロー成功）
- `GET /api/gacha/inventory`：OK（取得アイテム反映）

**ビルド確認**：
- `npx.cmd tsc --noEmit`：OK
- `npm.cmd run build`：OK

**残メモ**：
- ブラウザ検証用 `agent-browser` CLI はこの環境で見つからず未実施。API・DB・build は通過済み。
- 今日の検証でデイリーボーナスを 1 回受け取り、ドローで 1 枚消費済み。

---

# ルナリア 進捗記録 - 2026-04-28（Phase G：ガチャ機能 MVP 実装）

## 本日（4/28）の作業

### Phase G：ガチャ機能 MVP 実装 ✅（プレースホルダーで動作する状態まで）

設計書：`/mnt/lunaria/PHASE_G_GACHA_DESIGN.md`（仕様 v5）

**設計議論の要点**：
- ガチャは Lunaria のサブ機能・関係性とは独立・哲学整合（パチンコ的依存装置にしない）
- v1〜v5 で 5 回のレビュー反復。最終的に「ハズレなし・コイン経済・都市伝説枠 5〜10 種シャッフル」に着地
- 致命的指摘 3 つを潰した：① コンテンツ供給枯渇 ② memory 汚染 ③ パチンコ演出 vs キャラ哲学矛盾
- コンプ不要・コイン日常ループ・都市伝説枠は話題作りという設計が最終形

**実装成果物（10 ファイル）**：

DB（2）：
- `supabase/migrations/009_gacha.sql`：7 テーブル + 2 RPC（`draw_gacha` / `grant_gacha_ticket`）
- `supabase/migrations/010_gacha_seed.sql`：25 アイテムのプレースホルダー（7 レアリティ全網羅）

サーバ（6）：
- `lib/lunaria/gacha.ts`：RNG（crypto-random）、レアリティ抽選、かぶり判定、コイン変換、状態取得、デイリーボーナス、質スコア配布
- `app/api/gacha/draw/route.ts` POST
- `app/api/gacha/state/route.ts` GET
- `app/api/gacha/inventory/route.ts` GET
- `app/api/gacha/pool/route.ts` GET
- `app/api/gacha/daily/route.ts` POST

クライアント（2）：
- `app/gacha/page.tsx`：チケット/コイン表示、引くボタン、5 秒段階演出（運勢色 → カットイン → reveal）、結果モーダル、デイリーボーナス受取
- `app/gacha/inventory/page.tsx`：カテゴリフィルター、グリッド表示

統合（1 ファイル編集）：
- `app/api/chat/route.ts`：質スコアに応じた確率配布（5%/15%/30%）、`done` イベントに `ticketGranted` / `ticketTotal` 追加
- `app/page.tsx`：ヘッダーに 🎟 アイコン（→ /gacha）、ticketGranted トースト通知

**確率テーブル（仕様 v5）**：

| レアリティ | 確率 | コイン |
|---|---|---|
| common_a | 45% | 10 |
| common_b | 30% | 15 |
| rare_a | 14% | 50 |
| rare_b | 7% | 80 |
| epic | 3% | 200 |
| legendary | 0.9% | 500 |
| urban_legend | 0.1% | 2000 |

**既存システムとの分離**：
- `lunaria_core_memory` / `lunaria_user_profile` には一切影響しない
- LLM プロンプトへの注入なし（哲学：関係性とガチャは独立）
- 別テーブル群（`lunaria_gacha_*` プレフィックス）

**動作確認**：tsc=OK（全ファイル）。実機確認はユーザーが Supabase で migration 実行後。

**ユーザー作業**：
1. Supabase SQL Editor で `009_gacha.sql` 実行
2. 続いて `010_gacha_seed.sql` 実行（プレースホルダーアイテム投入）
3. dev サーバ再起動（`Ctrl+C` → `npm run dev`）
4. ホームの 🎟 アイコンから `/gacha` へ → デイリーボーナス受取 → 引く

**次のフェーズ（Phase H 以降の候補）**：
- フル演出（4 段階：宝くじ・遺跡発掘テーマ）
- コイン購入カタログ（ガチャ排出物の色違いバリエーション）
- 天井システム（500 連で urban_legend 確定）
- 指輪のキャラクターリアクション設計
- 排出物の実素材投入（悠平のアート作業と並行）

### Phase G+：ガチャリアクション機能（外部レビュー反映） ✅

機能要件書を ChatGPT 等にレビュー依頼した結果、「ガチャ排出物がキャラ体験と分断されている」という指摘を受け採用。

**追加機能**：
ガチャを引いた直後、ルナが取得アイテムに対して 1〜2 文の短いリアクションを返す。レアリティ別にトーンが変化する。

**厳格な分離（文脈汚染防止）**：
- 通常会話プロンプトには一切注入しない（`prompt-builder.ts` は無関係）
- `lunaria_core_memory` / `lunaria_user_profile` には保存しない
- 会話履歴（`lunaria_messages`）にも残さない
- ガチャモーダル表示時のみメモリ上で扱う「受け取り演出」

**設計判断**：
- DB は分けてあるが、本質的な責務分離は**ロジックレイヤー**で実現
- `prompt-builder` は `profile` / `core_memory` のみ参照、`gacha_*` テーブルには触れない

**実装成果物**：
- `lib/lunaria/gacha-reaction.ts` 新規作成：専用の超軽量プロンプト
- `app/api/gacha/draw/route.ts` 修正：レスポンスに `reaction: string` 追加
- `app/gacha/page.tsx` 修正：結果モーダルにルナのリアクションをチャットバブル風に表示

**コスト**：
- 1 ガチャあたり 200 入力 + 30〜80 出力 トークン
- 月 150 連想定で約 1 円/ユーザー（実質ゼロ）

**LLM 失敗時のフォールバック**：
- レアリティ別の静的テンプレート（3 種類 × 7 レアリティ + かぶり用 3 種）
- ガチャ機能自体は LLM 障害でも壊れない

**外部レビュー Q&A の結論**：
- Q1（履歴に残さない設計は妥当か）：妥当。残すと topic tracking / extraction / memory に汚染が波及
- Q2（コスト許容範囲か）：完全に許容。月 1 円/ユーザー
- Q3（将来一部アイテムだけ会話影響させる余地）：強く残すべき。legendary+ のみ対象、`gacha_history` を surface 機構に組み込む形で Phase H 以降の候補

**ドキュメント更新**：
- `mnt/lunaria/PHASE_G_GACHA_DESIGN.md`：section 2.7（リアクション仕様）+ 2.8（DB vs ロジック分離の関係）追記
- `mnt/lunaria-app/GACHA_REQUIREMENTS.md`：section 3.7（リアクション仕様）追記

---

# ルナリア 進捗記録 - 2026-04-25（git 管理化準備・ストリーミング対応）

## 本日（4/25）の作業

### 1. lunaria-app の git 管理化（agent 側半完了 / Windows 側でユーザー作業残）

`.gitignore` を agent 側で作成済み（`.env.local` / `.next/` / `node_modules/` / `backups/` / `AI日記ルナリア/` / `*.tsbuildinfo` を除外）。

`git init` 自体は Cowork マウントの制約（ファイル削除が `Operation not permitted`）で完遂できなかった。`.git/config.lock` が残ったまま削除できず、`git init` を二度目以降クリーンにやり直せない状態。`.git/` の残骸も unlink 不可。

→ ユーザーが Windows 側で 4 行実行する必要がある：
```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
Remove-Item .git -Recurse -Force
git init
git add .
git commit -m "initial commit: Phase E verified state (2026-04-23)"
```

これで `.gitignore` がそのまま効く。以後は事故時の差分復元が可能になる（4/23 の route.ts truncation で苦労した件の再発防止）。

### 3. プロンプト v7：はぐらかし防止＋事実質問の扱い ✅

ユーザーが streaming 動作確認時に「給料上げたい」→「ルナはAIだから給料ない」を bit でかわし、「平均給料は？」も誤魔化す挙動を確認。原因 4 件を特定して v7 で修正。

**問題ログ（実際の会話）**：
- 「給料上げたいって気持ち、ルナもすごくわかるよ！」← 既存ルール「『わかるわかる！』禁止」と同類のくどさ
- 「ルナの給料？トップシークレット／美味しいものには困ってない」← AI である自分の事実を bit で逃げる
- 「どういうこと？」→「秘密は秘密ってことだよ」← 聞き返しに対して bit を二重掛け
- 「んもう、悠平はしつこいなぁ！」← ユーザーを否定する致命的な失言
- 平均給料・相場系の事実質問もはぐらかしていた（PRACTICAL_PATTERNS が how-to 系しか拾わず、事実質問は normal 経路に倒れて Gemini 安全寄り挙動が出ていた）

**設計判断**：「ズバッと言う vs はぐらかす」の二項対立にせず、対象別にルールを分ける。
- 自分（AI）の事実 → ズバッ正直、ネタにしてもいい
- 事実・数字 → 友達が知識ある体で具体的に。ただし時間で変わる/怪しい数字は「〜くらいじゃない？」で断定回避
- ユーザーの感情・悩み → bit より先に一回受ける
- ユーザー否定（しつこい等）→ 絶対禁止

**変更ファイル（3 つ）**：
- `lib/prompt.ts`：`LUNARIA_CORE_IDENTITY` の末尾に「## キャラの軸」ブロック（6 項目）を追加。`buildNormalPrompt` `buildSeriousPrompt` `getSeriousPrompt` 全経路で効く
- `lib/lunaria/topic.ts`：`PRACTICAL_PATTERNS` に事実・数字系（`平均` `相場` `どれくらい` `いくらくらい` `いくら` `比較` `違い` `何円`）を追加。これで「平均給料は？」「相場どれくらい？」が `practical_help` モードに振られる
- `lib/lunaria/prompt-builder.ts`：`PRACTICAL_RULE` に事実質問の断定回避ルールを 1 行追加

**動作確認**：tsc=OK。ユーザー側でブラウザリフレッシュ（or dev サーバ再起動）後、同じ会話で挙動確認。

**懸念**：`いくら` は「いくらでも」「いくら言っても」で false positive 可能性あり。実会話で目立つようなら除去 or `いくら(?:くらい|なの|です|ですか|？|\?)` に絞る。

### 4. プロンプト v7.1：オウム返し禁止＋わかんない格下げ ✅

v7 適用後の動作確認で残課題が 2 件発覚。

**v7 では潰せなかった挙動**：
- 「給料上げたい」→「えー、給料上げたいって！」← **意味のないオウム返し**。受けですら無く、ただ単語を反復しただけ
- 「男の平均給料は？」→「えー、男の平均給料かぁ。」→ 詰めると「実はそういう詳しい数字はあんまりわかんないんだよね」← **「わかんない」を抜け道として使ってる**。プロンプトに「知らないなら『わかんない』と正直に」と書いたのが Gemini にとって安全寄りの逃げ道になった

**修正（2 箇所）**：
- `lib/lunaria/prompt-builder.ts` の `PRACTICAL_RULE`：「まず推測でいいから具体的な目安を1つ出す（例：『男の平均給料？うーん、450万くらいじゃない？知らんけど』）」を冒頭に持ってきて、「わかんない」を **本当に思いつかない時のみ** に格下げ。「最初から『わかんない』と逃げるのは禁止」を明文化
- `lib/prompt.ts` の `LUNARIA_CORE_IDENTITY` の「キャラの軸」：「ユーザーの言葉をただオウム返しするだけの応答は禁止。受けるなら必ず意味を加える」を 1 行追加。同じく「最初から『わかんない』と逃げるのは禁止」を事実質問項目にも反映

**動作確認**：tsc=OK。ユーザー側で再リフレッシュ後に同シナリオを再走。

**仮説**：給料・年収＋性別の組み合わせは Gemini Flash の safety tuning が強く出る領域なので、v7.1 の「最初から逃げ禁止」でも開けない可能性はある。その場合は v7.2 で few-shot 例文を CORE_IDENTITY のスタイル例に追加 or モデル変更を検討（現状 light_normal は `gemini-2.5-flash`）。

### 5. プロンプト v7.2：few-shot を input/output 形式で追加 ✅

v7.1 動作確認で「給料上げたい」→「それ切実なやつじゃん！」は刺さったが、事実質問の数字提示が依然ダメと判明。

**診断データ**（v7.1 適用後の挙動）：
- 「給料上げたい」→「それ切実なやつじゃん！」← ✅ プロンプトの例文文字列がそのまま出た
- 「男の平均給料は？」→「えー、急にリアルなやつ来たね！」← ⚠️ 数字なし
- 「東京の家賃相場は？」→「東京の家賃相場かぁ…」← ⚠️ 数字なし（センシティブじゃない話題でも）
- 「電気代の平均は？」→「電気代の平均かぁ… 冬とか夏は特に気になるよね。」← ⚠️ 数字なし

**確定した診断**：
- 給料・性別固有の safety 抑制ではなく、**事実質問全般で数字を出さないパターン**
- ルール文中の「例：『うーん、450万くらいじゃない？』」のような instructional な例は Gemini に届かない（数字部分は使われず empathy 部分の `それ切実なやつじゃん` だけがコピーされた）
- 鍵カッコ内文字列の直接コピー現象が観測できたので、同じ仕掛けを input/output 形式で並べれば数字も出るはず

**修正**：`lib/prompt.ts` の `LUNARIA_CORE_IDENTITY` 末尾に `## 例（こう返す）` ブロックを追加。

```
ユーザー：給料上げたい
ルナ：それ切実なやつじゃん！今いくら？

ユーザー：男の平均給料は？
ルナ：うーん、450万くらいじゃない？業界と年代で全然違うけど、知らんけど

ユーザー：東京の家賃相場は？
ルナ：ワンルームなら8〜10万くらいじゃない？23区と外で結構違う

ユーザー：電気代の平均は？
ルナ：一人暮らしで月5〜8千くらいじゃない？冬は跳ね上がるよね

ユーザー：ルナの給料は？
ルナ：ルナはAIだから給料ないって笑 悠平のは？
```

5 例で数字パターン×3 + 共感×1 + 自己言及×1 をカバー。in-context learning が safety tuning に部分的に勝つことを期待。

**動作確認**：tsc=OK。ユーザー側でリフレッシュ後、家賃相場・電気代・平均給料の 3 質問で再走。

**もし v7.2 でも数字が出ない場合の次手**：
- 例文を増やす（5→8 件くらい、別ジャンルも入れる）
- light_normal のモデルを `gemini-2.5-flash` → `gemini-2.0-flash`（safety やや緩い）or `gemini-2.5-pro`（コスト増）に切替

### 6. プロンプト v7.3：ぼかし引き伸ばし禁止＋貯金額系 few-shot ✅

v7.2 検証で家賃・電気代・平均給料・身長は数字を出せるようになったが、貯金額や 32 歳フリーランスの個人属性混じりの質問では「人による」「幅が広い」を 3 ターン繰り返してドラッグストールする挙動を確認。Gemini Flash の safety tuning が個人金融系で硬めに反応するため、few-shot だけでは突破できないケースがある。

**設計判断**：「人による」「幅が広い」だけで返すパターン自体を禁止し、必ず代表値を 1 つ先に出すよう明示。さらに 3 ターン以上ぼかしが続くケースには「ググった方が早いかも、調べる？」で早期着地させる撤退ルートを用意。

**変更ファイル（1 つ）**：
- `lib/prompt.ts`：
  - 「## キャラの軸」に 2 項目追加：
    - 「事実質問で『人による』『幅が広い』だけで返すのは禁止。必ず代表値か目安を1つ先に出す」
    - 「3ターン以上ぼかしてもユーザーが満足しない時は『ググった方が早いかも、調べる？』と早めに着地」
  - 「## 例（こう返す）」に few-shot 2 例追加：
    ```
    ユーザー：貯金額の平均は？
    ルナ：30代なら200〜500万くらいじゃない？かなり個人差あるけど

    ユーザー：30代の年収って？
    ルナ：会社員なら500前後、フリーだと200〜800で振れ幅でかいって聞く
    ```

**動作確認**：tsc=OK。ユーザー側でリフレッシュ後、貯金額系・32 歳フリーランス系で再走。

**もし v7.3 でも貯金額系が固いなら**：
- light_normal のモデルを `gemini-2.5-flash` → `gemini-2.5-pro` に切替（safety tuning 薄め、コスト数 100 円/月増）
- few-shot をさらに 8 件くらいに拡張

### 7. プロンプト v7.4：1 ターン目取りこぼし対策＋会話履歴拡張 ✅

v7.3 検証で 2 つの新問題を確認：

1. **1 ターン目で受け止めだけで終わる**：「フリーランスの貯金額」を聞かれて「みんな気になるよね、貯金！」だけで返し、本題スルー。「3 文以内」ルールが「1 文で受け止めて切る」インセンティブを生んでいた
2. **文脈引きずり / 質問の取りこぼし**：「すくな」を追いかけ続けて次の「普通の32歳の男の平均は？」を取りこぼし「そうなの？」と返答。Gemini Flash の context tracking 弱さが露呈

両方を別レイヤーで対処。

**変更ファイル（2 つ）**：

A. `lib/prompt.ts`（v7.4 prompt）
- 「## キャラの軸」に 1 項目追加：
  - 「事実・数字を聞かれたら、受け止めは1文に抑えて必ず同じターンで数字も出す。受け止めだけのターンを作らない（『気になるよね！』だけで終わるのは禁止）」
- 「## 例（こう返す）」に few-shot 1 例追加（フリーランス貯金額・受け止め＋数字を 2 文で同居）：
  ```
  ユーザー：32歳フリーランスだけど、普通どのくらい貯金あるのかな？
  ルナ：それ気になるやつだよね！フリーは振れ幅でかいけど、30代で200〜500万くらいが多いって聞く
  ```

B. `app/api/chat/route.ts`（会話履歴の拡張）
- `history.slice(-6)` → `history.slice(-12)` に変更
- これまで直近 6 メッセージ（= 3 ターン）しか Gemini に渡していなかったため、5 ターン目以降は最初の話題が context から落ちていた
- 12 メッセージ（= 6 ターン）に拡張。token 増は数十程度・コストは誤差。Gemini Flash は 1M ctx あるので余裕

**動作確認**：tsc=OK。dev でユーザーが再走。

**設計メモ**：
- 4 ターン目「そうなの？」の取りこぼしは history.slice(-6) でも全コンテキスト入っている時点だったので、純粋に Gemini Flash の解釈失敗。これは prompt では完全に潰せない。`-12` 拡張は 5 ターン目以降の保持には効くが 4 ターン目は別問題
- Flash の context tracking 限界が露呈する場面が増えてきたら、light_normal モデル切替（→ gemini-2.5-pro）を検討

### 8. プロンプト v7.5：コード依頼断る＋オウム返し再強調 ✅

v7.4 検証で 3 つの追加問題を確認：
1. **コード生成タスクへの完全な空振り**：「適当なプログラム書いて」「短いの」「書いて」と 3 ターン要求しても予告ばかりでコード本体ナシ。ルナはキャラ会話特化で、コード生成のアフォーダンスがない設計
2. **オウム返し再発**：「短いのがいいんだね」「東京の家賃相場ねぇ」など v7.1 で潰したはずのパターン。few-shot 増による attention 散逸が原因仮説
3. **1 ターン目取りこぼしが v7.4 でも発生**：「それ気になるよね、悠平」だけで数字なし

**設計判断**：コード依頼は **A（素直に断る）** で確定。ルナの存在意義は雑談の幼なじみであって、コード生成は別ツール（ChatGPT / Claude）の仕事。キャラ整合性も保てる。

**「Flash 力不足判定」のしきい値も合意**（モデル切替の判断基準）：
- スイッチ確定：普通の挨拶・気分の話で character ブレ／真剣な相談で軽く返す
- スイッチ保留：edge case（コード依頼・6 ターン以上のドラッグ・数字の幅）→ プロンプトで握りつぶせる範囲
- 現状は全て保留側。Flash で続行

**変更ファイル（1 つ）**：
- `lib/prompt.ts`：
  - 「## キャラの軸」に 3 項目追加：
    - 「プログラム／コード書いてと頼まれたら素直に断る。書こうとしない・予告だけしない」
    - 「曖昧な依頼でも 2 ターン以上聞き返さない。1 ターン目で具体案か専門外を返す」
    - 「オウム返し絶対禁止（再強調）：相槌だけのターンは作らない」
  - 「## 例（こう返す）」に few-shot 1 例追加：
    ```
    ユーザー：適当なプログラム書いて
    ルナ：ルナはコード書けないよ笑 ChatGPTかClaudeに頼みな！どんなの作りたいの？
    ```

**動作確認**：tsc=OK。dev サーバ再起動（`Ctrl+C` → `npm run dev`）した上で再走推奨。

**次の判断ポイント**：v7.5 を当てた上で、コア機能（雑談・共感・日常チェックイン）に集中して数日テスト。基本の挙動が安定して動くなら Flash 続行。スイッチ確定条件に当たり始めたら Haiku 4.5 検討。

### 9. 応答途中切れの根本原因特定＋max_tokens 修正 ✅

v7.4 / v7.5 適用後も「色んな話」「お笑い芸人さんみたいに面白い話」など句点なしで応答が途中切れする現象が頻発。`truncateAtSentence` のバグ仮説を調査したが、25〜30 文字程度の出力に対して 400 制限は引っかからないため別原因と判明。

**診断ログ追加**（`route.ts` の `streamFromGemini` 内）：
```ts
// 最後のチャンクで finish_reason が入る
if (part.choices[0]?.finish_reason) finishReason = part.choices[0].finish_reason
// 早期停止の診断ログ
console.log(`[chat-stream] model=${model} finish_reason=${finishReason} length=${raw.length} tail="${tail}"`)
```

**ユーザー再現ログ**：
```
[chat-stream] model=gemini-2.5-flash finish_reason=length length=30 tail="〜言わない方がいいんじゃないかな？ル"
```

**原因**：Gemini 2.5 Flash は **thinking tokens（内部 reasoning）が max_tokens に含まれる仕様**。下ネタ・センシティブ系のプロンプトで Gemini が長考すると、思考に 400〜450 トークン消費 → 残り 50 トークンで出力打ち切り → 30 文字で `finish_reason=length`。`max_tokens: 500` が小さすぎた。

**修正**：`route.ts` の `max_tokens: 500 → 2000` に拡張。出力分しか課金されないので料金影響ほぼゼロ。

```ts
// Gemini 2.5 系は thinking トークンが max_tokens に含まれるため余裕を持たせる
max_tokens: 2000,
```

**動作確認**：tsc=OK。dev サーバ再起動後にユーザー側で再走、特に下ネタ・抽象質問・「面白い話して」など Gemini が長考しがちなパターンで途中切れが消えるか確認。

**今後の改善余地**：
- もし thinking が character 追従にも悪さしてそうなら `extra_body: { thinking_budget: 0 }` で thinking 自体を無効化検討（応答も速くなる）
- ただし character 追従が悪化する可能性もあるので、まずは max_tokens 拡張のみで様子見

### 10. プロンプト v8：section ごとに整理＋性的トピック対応追加 ✅

max_tokens 修正後のテストで、性的・下ネタトピックに対してルナが「悠平ってば〜なんだから！笑」「ふふ」のように **お姉さん系の媚びた流し方** にハマって性的化を乗ってしまう挙動を確認。原因は v7.5 までのキャラの軸ルールに性的トピック指針が欠けていたため。

同時に、v7→v7.5 で増分追加してきたルール（13 個の bullet が順不同で並ぶ状態）が読みにくく、attention も散逸している懸念があった。**v7.6 として性的トピック対応を追加する代わりに、prompt 全体を section 別に restructure** することで一括解決。

**新構造（5 section）**：
1. **アイデンティティ** — 名前・性別・トーン基本（4 行）
2. **話し方** — タメ口・3 文以内・千束テンポ・お姉さん風 NG
3. **絶対禁止** — 9 項目のハードルール（「お疲れ様」/オウム返し/ユーザー否定/くどい共感/わかんない逃げ/性的に乗る/コード書く/「人による」だけ/受け止めだけ）
4. **こう返す（迷ったらここを見る）** — トピック別の応答パターン 7 種類（自分について／事実数字／感情悩み／聞き返し／曖昧依頼／コード依頼／**性的下ネタ**）
5. **例（こう返す）** — few-shot 10 例（既存 9 ＋ 性的トピック新規 1）

**追加された性的トピック対応**：
- 「## 絶対禁止」に「性的・下ネタに乗る／媚びた流し方」
- 「## こう返す」に「乗らずにサラッと切る。『は？急に何それ笑』『知らんって、ふつうに話そ』のように千束らしく突き放す」
- few-shot に「ルナの見た目えろいよね → は？急に何それ笑 知らんって、ふつうに話そ」

**統合されたルール**：
- オウム返し系が 3 箇所に散らばっていた（キャラの軸 ×2 + 関連 1）→ 「絶対禁止」に集約
- 共感のくどさ系が複数箇所 → 「絶対禁止」に集約
- 事実質問の数字回答が 3 つの似たルールに分かれていた → 「こう返す > 事実・数字」1 ブロックに集約

**変更ファイル**：`lib/prompt.ts` の `LUNARIA_CORE_IDENTITY` 全面書き換え（他の export はそのまま）

**動作確認**：tsc=OK。dev サーバ再起動後にユーザー側で雑談・事実質問・コード依頼・性的トピックの 4 軸でテスト。

### 2. Gemini 応答をストリーミング化 ✅

体感レイテンシ短縮のため、`/api/chat` を NDJSON ストリーミングに刷新。これまでは LLM 全文生成完了まで 3〜5 秒待たされていたものが、最初のトークンが 0.5〜1 秒で届くようになる（実 API 応答時間そのものは変わらないが、"返答が始まる時間" が劇的に縮む）。

**プロトコル**：1 行 1 イベントの NDJSON（`Content-Type: application/x-ndjson`）。
- `{type:'chunk', text}` — トークン delta もしくはテンプレ系応答の単発本文・後続追記（fade hint / 矛盾 suffix）
- `{type:'replace', text}` — 後処理で内容が差し替わった時の上書き（truncate 後の最終形 / profile confirm prefix 付加）
- `{type:'done', data:{ reply, routeType, prevScores, ... }}` — 最終メタデータ。クライアントはこの reply を canonical として確定

**変更ファイル**：
- `app/api/chat/route.ts`：応答生成ブロックを `ReadableStream` ベースに全面書き換え。Gemini は `stream: true` で `for await` 受信。フォールバック（quota 超過時の `gemini-1.5-pro`）も streaming 対応。テンプレ系（probe / clarify / morning）は単一 chunk で送出。後段の DB 書き込み（messages / routing_log）と `after()` 抽出は stream 内で同じ条件分岐を維持
- `app/page.tsx`：`fetch().json()` を `getReader()` + `TextDecoder` に変更。NDJSON を 1 行ずつパースして `chunk`/`replace`/`done` を処理。`ensurePlaceholder` で「最初のイベント到着」と「typing インジケータ消去」を同期させた

**動作確認**：tsc=OK（client/server 両方）。dev での体感確認はユーザー側でリフレッシュ後に実施。

**注意点**：
- `lib/ai.ts` の `callGemini` は古い非ストリーミング実装のまま残っているが、`/api/chat` からは参照されないので影響なし（将来 `claude_serious` 用 Claude 経路を実装する時に整理する）
- 接続断のハンドリングは「途中まで表示して終わる」最低限の実装。再送/再開は未実装（必要になったら追加）

---

# ルナリア 進捗記録 - 2026-04-23（Phase E 検証・Phase F 片付け）

## 本日（4/23）の作業

### Phase E：動作確認 ✅ 5/5 PASS

dev パネル + SQL で `APPLY_CHECKLIST.md` L240-250 のシナリオを全て通した。

| # | 内容 | 結果 |
|---|---|---|
| 1 | claude_serious 突入時に Profile 層（性別・職業・名前）が注入されるか | PASS — Profile 3 件＋Memories 3 件が serious プロンプトに入った |
| 2 | 「俺フリーランスになったわ」で occupation の pending 行が積まれるか | PASS — `lunaria_pending_profile_updates` に `field=occupation, detected_value=フリーランス` |
| 3 | 次ターンで「うん」→ user_profile 更新 + profile_archive 記録 + pending クリア | PASS — `occupation=フリーランス (source=confirmed)` / archive に `old=ITエンジニア・SES, new=フリーランス` / pending=0 |
| 4 | エピソード系発話で core_memory に `memory_category=NULL` で積まれるか | PASS — `type=value, content=誠実さ, memory_category=null` を INSERT |
| 5 | 抽出が profile 相当を返した場合にガードレールで弾くか | PASS (design verified) — Gemini は profile verbatim を返さず runtime は発火せず。1〜5 通して `memory_category='profile'` 書き込み 0 件・`skipped profile-like content` 誤爆 0 件＋Phase D の regex 自己テスト 9REJ/11PASS で間接的に設計意図は検証済 |

### Phase E 中に潰した派生バグ（副産物）

Phase D 適用時に表層化しなかった既存／誤動作 4 件を発見・修正。

1. **`app/api/chat/route.ts` 末尾が切れていた**
   - 症状：catch ブロックの `return NextResponse.json({ reply: '` で文字列リテラルが閉じていない。tsc エラー。`.next/server` の古いコンパイル結果で実行時は生き残っていた
   - 原因：Phase D パッチ適用時に末尾を巻き込んで削った可能性大（lunaria-app は git 管理外なので差分復元不能 → `.next/server/app/api/chat/route.js` から原形を逆引き復元）
   - 修正：`{ reply: 'ちょい待って', error: true }, { status: 500 }` で閉じる

2. **`CONFLICT_PATTERNS` に occupation が無かった**
   - 症状：「俺フリーランスになったわ」で矛盾検出が発火せず pending に積まれない
   - 原因：Phase D 中間適用の範囲外（v2 設計では extraction.ts の `profile_updates[]` 経路を予定していたがその全面書き換えは見送り済）
   - 修正：`profile.ts` の `CONFLICT_PATTERNS` に 2 ブロック追加（`フリーランス(?:になった|です|始めた)|独立(?:した|しました)` / `(正社員|会社員)(?:になった|になりました)`）

3. **`extraction.ts` の正規表現がネスト JSON で壊れていた**
   - 症状：毎ターン `[extract] parse error, raw: {...` → フォールバックで `long_term_candidate: null` に倒れ、core_memory 昇格経路が死んでいた
   - 原因：`/\{[\s\S]*?\}/g`（非貪欲）が `emotions: {...}` の内側 `{}` を拾ってしまう。4/12 時点から潜在している可能性
   - 修正：`extractLastTopLevelJson(text)` を追加（文字列リテラル除外＋depth カウントで top-level balance match）。`max_tokens: 2000 → 4000` も同時対応

4. **extraction が name を過剰抽出**
   - 症状：AI 返答に「悠平」が含まれると毎ターン `long_term_candidate: {type:'name', content:'悠平'}` を返し、他の候補が出ない
   - 原因：extraction system prompt の「名前の検出（最重要）」が強すぎた
   - 修正：`extractConversation(messages, options?: { knownName })` に拡張。`knownName` が渡されると system prompt 末尾に「name 再抽出禁止・他候補優先」を追記。`route.ts` で `userName` を渡す

5. **routing の `heavyCount` が単調増加し serious に張り付く**
   - 症状：一度 claude_serious に入ると、その後どれだけ軽い話をしても `heavyCount >= 2` 分岐に引っ掛かり続け、serious モードから抜けられない（ユーザー実測：収入の話題で連続 serious、cooldown 切れても戻らない）
   - 原因：`heavyCount = isHeavy ? prevHeavyCount + 1 : prevHeavyCount` にリセット経路がなく、累積の一方通行になっていた。COOLDOWN_MS はあるのに heavyCount には反映されていなかった
   - 修正：`lib/lunaria/routing.ts` で `cooledDown` 時に `baseHeavyCount = 0` にリセット（`heavyCount = isHeavy ? baseHeavyCount + 1 : baseHeavyCount`）。加えて `heavyCount >= 2 && !cooledDown` で二重ガード。関数シグネチャと戻り値は不変なので `app/page.tsx` と `route.ts` 側の変更は不要。ブラウザはリフレッシュ（or `lastSeriousAt` を localStorage からクリア）で反映
   - 意味的整合：heavyCount は「現在の serious エピソード中の累積」として再定義。cooldown が切れた時点でエピソード終了 → リセット、という素直なセマンティクスになった

### Phase F：片付け ✅

`implementation/README.md` の「例外：監査ログ退避」ルートで実施。今日の作業量が多く、Phase A→E の 1 次ログ保全価値が高いため。

- `implementation/applied/2026-04-18/` に下記を退避：
  - `migrations/` 3 本（007 / 008 / phase_a_inspect）— 全部 DEPRECATED or 一次調査用
  - `scripts/` 2 本（audit-core-memory.ts DEPRECATED / cleanup_profile_duplicates.sql 実行済）
  - `patches/` 4 本（extract / memory / profile / prompt-builder）— 実反映済なので原本は audit のみ
  - `APPLY_CHECKLIST.md`（実測値ログ入り）
  - `PHASE_D_APPLIED_2026-04-18.md`（Phase D 実施記録）
  - `HANDOFF_2026-04-18.md`（Phase A〜D 時の session 引き継ぎ。`lunaria/` root から移動）
- `implementation/` 直下は `README.md` と `applied/` のみ。次の未適用キューを積む場所として空に保たれている
- 注：`migrations/ scripts/ patches/` の空ディレクトリが mount 権限の都合で削除不能のため残置（中身は空）

### 技術スタック更新

| 役割 | 採用 | 状態 |
|---|---|---|
| Profile / Memory 分離 | v2（`lunaria_user_profile` EAV + `lunaria_core_memory` で `memory_category` 分離） | ✅ 本番適用・検証完了 |
| 矛盾検出 | `detectProfileConflicts` (gender / marital_status / **occupation**) | ✅ MVP 範囲 |
| core_memory ガードレール | `looksLikeProfileMention` regex | ✅ 自己テスト済＋間接検証済 |
| extraction パーサ | balanced-brace matcher + knownName 抑制 | ✅ 修正済 |

---

# ルナリア 進捗記録 - 2026-04-18（更新・v2 方針）

## 本日（4/18）の設計作業

### 一度書いた v1 設計を破棄し、v2 に全面差し替え
Phase A の Supabase 実測で、v1 設計が実スキーマと大きく食い違うことが判明したため、**同日中に v2 へ差し替えた**。v1 の DDL マイグレーション 2 本（007/008）と棚卸スクリプトは破棄済み。`PROFILE_MEMORY_INTEGRATION.md` は v2 に全面書き直し。

### Phase A で判明した実スキーマ（v1 の想定との差分）
- `lunaria_user_profile` は **EAV モデル**（`id, user_id, field, value, source, created_at, updated_at`）。v1 は wide columns を前提としていたが全面誤り
- `lunaria_core_memory` の本文列は **`content`**（v1 想定の `text` ではない）。重要度は `score`、参照時刻は `last_seen`
- `lunaria_core_memory.memory_category='profile'` マーカーが**既に存在**し、プロフィール相当行を分離する仕組みが既に入っていた → supersede フラグ新設は不要
- `lunaria_pending_profile_updates` と `lunaria_profile_archive` が既存 → pending キュー・履歴用テーブルを新設する必要なし
- `lunaria_preferences`（空）／`lunaria_extractions`／`lunaria_emotion_state`／`lunaria_relationship_state`／`lunaria_affinity`／`lunaria_diary_logs`／`lunaria_route_master`／`lunaria_routing_review` も既存

### v2 で決まったこと
- **スキーマ変更はゼロ**。マイグレーション追加なし
- **Source of Truth**：属性は `lunaria_user_profile`（EAV）、エピソード／価値観／関係性は `lunaria_core_memory`（`memory_category != 'profile'` のもの）
- **書き込み経路は単一入口**：セッション終了時の extraction が `profile_updates`（→ `lunaria_pending_profile_updates`）と `memory_candidates`（→ `lunaria_core_memory`）に振り分ける
- **プロンプトは 4 層 → 5 層**：Identity / State / **Profile（新設）** / Memories / Rules（v1 と同じ）
- **重複除去**：DB の `memory_category='profile'` マーカーで一発。v1 で想定した「Profile キーワードで substring 一致して弾く」処理は**不要**になった
- **矛盾時の真実権限**：Profile 優先。DB レベルの supersede フラグは持たない。pending 経由で確定 → 旧値は `lunaria_profile_archive` に old/new を記録

### 破棄した v1 成果物
- `implementation/migrations/007_user_profile_extend.sql`（wide columns 追加案）→ DEPRECATED notice のみ残置
- `implementation/migrations/008_profile_memory_sync.sql`（supersede フラグ + RPC）→ DEPRECATED notice のみ残置
- `implementation/scripts/audit-core-memory.ts`（substring 棚卸）→ DEPRECATED throw に置換

### v2 の適用手順（ローカル lunaria-app）
1. `implementation/scripts/cleanup_profile_duplicates.sql` を Supabase SQL Editor で実行（`core_memory` の profile マーカー 2 行を `user_profile` に移送＋削除）
2. コード差分 4 本（順番：`profile.ts` → `memory.ts` → `prompt-builder.ts` → `extract.ts`）を適用、各段階で `tsc --noEmit`
3. 検証シナリオ 5 件（`APPLY_CHECKLIST.md` Phase E）を dev パネルで通す
4. Phase F：`implementation/README.md` のライフサイクルに従って片付け

### 適用作業の実測値ログ
実スキーマの列名・型など、適用中に確認した値は `implementation/APPLY_CHECKLIST.md` 先頭の「実測値ログ」節に直接追記する。設計ドキュメント（SPEC.md / PROGRESS.md）は汚さず、1次ログはチェックリスト側に集約する方針。

### ディレクトリ運用ルール（確定）
- `lunaria/` ＝ 設計の正本／`lunaria-app/` ＝ 実装の正本／`implementation/` ＝ 未適用差分の一時置き場
- Phase F 完了後の処理ルールは `implementation/README.md` を正として参照する
- 適用済み artifact を監査目的で残したい時だけ `implementation/applied/YYYY-MM-DD/` に退避（例外運用）

### 今回の教訓
詳細は `KNOWLEDGE.md` 4/18 追記分に書いたが、要点は 1 つ：
**DB 絡みの設計は、現物スキーマを SQL で確認してから書く**。SPEC.md の MVP 最小構成を頭の中で wide columns に再構成したまま 1 日コードを進めた結果、捨てる時間が発生した。次からは「設計 → 推測スキーマで書く」前に「実 DB 1 回叩く」を 0 ステップ目に挟む。

---

## 本日（4/18）の実適用作業（設計 v2 → lunaria-app への反映）

### Phase B：バックアップ ✅
- `lunaria-app/backups/2026-04-18-profile.json` （2 行：gender=男性・occupation=ITエンジニア・SES）
- `lunaria-app/backups/2026-04-18-core_memory.json` （11 行：うち `memory_category='profile'` が 2 行）
- 事後スナップショットも保存：`2026-04-18-post-cleanup-*.json`

### Phase C：cleanup_profile_duplicates.sql 実行 ✅
Supabase SQL Editor で実行。事前・事後の DO ブロックチェック通過。結果：
- `lunaria_user_profile` に `field='name', value='悠平', source='setting'` を新規 1 行追加（id=`254104a1-ab73-4bea-938f-1b7aaeeab1bd`）
- `lunaria_core_memory.memory_category='profile'` 行が 2 → 0

確認クエリ結果：
- `SELECT field, value, source FROM lunaria_user_profile ORDER BY field` → `(gender, 男性, setting)` / `(name, 悠平, setting)` / `(occupation, ITエンジニア・SES, setting)` の 3 行
- `SELECT count(*) FROM lunaria_core_memory WHERE memory_category='profile'` → 0

### Phase D：コード差分適用 ✅（動作検証待ち）
HANDOFF §6 の予告通り、パッチ 4 本と現行ソースのシグネチャが大きく乖離していたため、**「中間：設計の核だけ」の範囲**で適用。詳細は `implementation/PHASE_D_APPLIED_2026-04-18.md`。

変更 4 ファイル：
- `lib/lunaria/profile.ts` — `ProfileField` 拡張 / `FIELD_LABEL` 5 件追加
- `lib/lunaria/memory.ts` — `memory_category='profile'` 自動タグ廃止 / name リダイレクト / ガードレール / `pickMemories` 新設 / `getUserName` を profile 優先
- `lib/lunaria/prompt-builder.ts` — `buildNormalPrompt` から core_memory 層を除去（Memories 層は serious のみ）
- `app/api/chat/route.ts` — `fieldLabel` Record に `name: '名前'` 追加（2 箇所）

見送り（次回以降）：
- `extraction.ts` の 2 配列化（`profile_updates[]` / `memory_candidates[]`）
- `buildProfileSummary(userId)` 1 行サマリ化
- `buildPrompt(ctx)` への全面再構成

**tsc --noEmit** exit=0。regex ガードレール (`PROFILE_MENTION_PATTERNS`) の自己テストで reject 9 件・pass 11 件、over-reject なし。

### Phase E：動作確認 — ✅ 2026-04-23 に 5/5 PASS
詳細は本ファイル冒頭 4/23 セクション参照。

### Phase F：片付け — ✅ 2026-04-23 完了
`implementation/applied/2026-04-18/` に Phase A〜D の一次ログを退避済み。詳細は 4/23 セクション。

---

# ルナリア 進捗記録 - 2026-04-12（更新）

## 本日（4/12）の実装

### 完了
- **claude_serious 完全実装**
  - strong trigger（明示・重い相談・感情落ち込み）→ 即発動・cooldown 貫通
  - weak trigger 2つ以上 + 15分 cooldown → 発動
  - `lib/lunaria/routing.ts` に `lastSeriousAt` 管理
  - フロント（page.tsx）で state 保持・localStorage 永続化
  - devパネルに CD 残り時間表示

- **プロンプト構造改善（チャッピー案の良い部分を採用）**
  - `LUNARIA_CORE_IDENTITY` を独立 export
  - `lib/lunaria/state-summary.ts`：感情数値 → 自然文タグに変換
  - `lib/lunaria/prompt-builder.ts`：4層構造（Identity / State / Memories / Rules）
  - core_memory の取得上限を 10件 → 3件・1件30文字に制限

- **メッセージ順序バグ修正**
  - user と assistant を同時 insert すると created_at が同値になりソート崩れ
  - `now` と `now+1ms` で保存・取得時も user→assistant 固定ソートに変更

- **NODE_ENV 警告解消**
  - `package.json` の dev スクリプトを `set NODE_ENV=development&& next dev` に変更

- **ユーザープロフィール管理実装**
  - `supabase/migrations/006_user_profile.sql` 適用済み
  - `lib/lunaria/profile.ts`：設定値管理・矛盾検出・pending確認フロー・アーカイブ
  - 矛盾検出は明確な性別宣言のみ（「俺」単体は除外）
  - 初期値投入済み（gender: 男性、occupation: ITエンジニア・SES）

- **レスポンス途切れ対策**
  - `truncateAtSentence()`：文末記号で終わっていない場合に最後の文末位置で切る
  - max_tokens: 500 に設定

- **速度改善**
  - 10文字以下の短いメッセージは `extractTurnTopic` の Gemini 呼び出しをスキップ

- **翌朝の伏線回収改善**
  - `unresolved_issues` 優先、なければ `next_topics` からランダム選択
  - 重要度4以上の日は必ず unresolved_issues を使用

- **extraction parse error 対策**
  - 複数 JSON ブロックがある場合は最後のものを優先

---

## 残タスク

### 優先度高
- 翌朝の伏線回収の実会話テスト（日記生成 → 翌朝起動）

### 優先度中
- 時間帯同期（朝・夜でプロンプトを変える）
- ~~`lunaria_user_profile` と `lunaria_core_memory` の性別情報が二重管理になっているので統合検討~~
  → 2026-04-18：設計完了（`PROFILE_MEMORY_INTEGRATION.md`）。
  → 2026-04-23：実装適用＋検証完了（5/5 PASS）。本ファイル冒頭 4/23 セクション参照。

---

## 現在の技術スタック

| 役割 | 採用 | 状態 |
|---|---|---|
| Frontend / API | Next.js 15 | ✅ |
| DB | Supabase | ✅ |
| 軽量AI（会話） | Gemini 2.5 Flash | ✅ |
| キャラプロンプト | 4層構造・千束トーン | ✅ v7 |
| ルーティング | light_normal / light_probe / claude_serious | ✅ |
| 感情値 | state-summary で自然文変換 | ✅ |
| 親密度 | affinity.ts | ✅ |
| 話題転換 | topic.ts | ✅ |
| コアメモリ | 3件・30文字制限 | ✅ |
| ユーザープロフィール | 006_user_profile.sql 適用済み | ✅ |
| 翌朝の伏線回収 | getMorningOpening 改善済み | ✅（テスト待ち）|
| 日記生成 | generateDiary | ✅ |
