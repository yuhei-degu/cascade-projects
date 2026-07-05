# Lunaria RELEASE PLAN — 出荷駆動への転換(2026-07-05)

## やり方の再定義

旧: オーケストレータを育て、機能を量産する(v1: done 1 / promoted 35 で死亡)
新: **最初の実ユーザーに届けることだけをゴールにする。**

役割分担:
- 開発ループ = v2 (`python run.py --all`)。人間はコマンド1つ打つだけ
- Claude = タスク定義・コミットレビュー・このリリース計画の管理
- タスク追加のルール: **リリース後は実ユーザーの行動と自分の毎日の使用からのみ**。
  空想からのタスク追加を禁止(v1の空想タスク量産の再発防止)

## リリースチェックリスト

### Phase 0: コード確定(v2バッチ完了後)
- [x] タスク2〜4のコミットをレビュー済み(devUUID残存0件 / middleware除外パス正 / Stripe既定OFF+env検証 / 認証はgetAuthenticatedUserIdヘルパーに集約され21ルートで統一)
- [x] GitHubへpush済み(origin/v2-checkpoint-20260704)
- [ ] **masterへのマージはPhase 2スモークテスト後の人間判断** — このリポジトリ(cascade-projects モノレポ)のmasterはCerti-AI Hub本番Vercelに直結しており、チェックポイントにはlunaria-app外の変更65ファイルが含まれるため

- [x] migration正史の確定 → `lunaria-app/supabase/APPLY_ORDER.md` 作成済み(017〜019は欠番ではなく存在。manualバンドルは本番不使用。003はスキップ)

### Phase 1: 本番インフラ(人間、~1時間)
- [ ] 本番Supabaseプロジェクト新規作成(devの `uegefcjabpqinhokgkxe` は開発専用のまま残す)
- [ ] migration適用順序の確定: `migrations/001..023` に **017〜019が欠番**、
      `manual/014_016_gacha_apply_bundle.sql` と `manual/020_021_character_items_apply_bundle.sql`
      が手動適用前提 → どれが正か突き合わせてから本番に流す(ここが最大の地雷)
- [ ] Supabase Auth: Email(マジックリンク)有効化、Site URL / Redirect URL に `/auth/callback` を登録
- [ ] Vercelプロジェクト作成、環境変数設定。**Root Directory を lunaria-app に、Production Branch を v2-checkpoint-20260704 に設定**(masterはCerti-AI Hub用のため)
      (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / GEMINI_API_KEY)

### Phase 2: スモークテスト(30分)
- [ ] 新規登録 → ログイン → 会話 → ガチャ → 日記 の一連を本番で通す
- [ ] 未認証で全ページが /login に飛ぶこと
- [ ] `00000000-0000-0000-0000-000000000001` がコードにもDBにも残っていないこと

### Phase 3: 無料β公開(課金なし)
- [ ] Stripeは**フラグオフのまま**公開(傷病手当金コンプライアンスの判断が済むまで有効化しない)
- [ ] 自分が毎日使う + 知人5人に配る
- [ ] 成功条件: **7日連続で自分以外の誰かが使う** — これを満たすまで新機能タスクを書かない

### Phase 4: 課金判断(人間のみ)
- [ ] 給付金との兼ね合いを整理してからStripeフラグON

## 禁止事項(この計画の外に出ない)
- オーケストレータへの機能追加(v2は現状で完成とみなす)
- Phase 3の成功条件を満たす前の新機能開発
- レア層ガチャ(memory/emotion連動)の実装 — コア安定まで凍結継続
