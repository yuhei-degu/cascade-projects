# Lunaria TASKS — リリース阻害要因の除去(2026-07-04 監査に基づく)

監査結果: ガチャ/日記/キャラ/記憶の製品機能はほぼ実装済み(migration 022まで)。
リリースを妨げているのは認証と課金の不在のみ。

- [x] Supabase Auth を導入する: @supabase/ssr を使い lib/supabase/server.ts と lib/supabase/client.ts のヘルパーを作成し、app/login/page.tsx (メールマジックリンク方式・日本語UI) と app/auth/callback/route.ts と middleware.ts (未認証を /login へリダイレクト、/login と /api/health は除外) を追加する。既存機能は壊さない
- [x] app/api 配下の全route.tsで、ハードコードされた開発用UUID 00000000-0000-0000-0000-000000000001 を supabase.auth.getUser() のユーザーIDに置換する。未認証は401を返す。lib配下は関数引数でuserIdを受ける形に統一する
- [x] 全テーブルのRLSを監査し、user_id = auth.uid() ベースのポリシーを付与する migration 023_rls_hardening.sql を作成する(ファイル作成のみ、DB適用はしない)
- [x] Stripe サブスクリプション課金の骨組みを実装する: 環境変数が未設定でも動作するフィーチャーフラグ付きで、/api/stripe/checkout と /api/stripe/webhook と料金ページを作成する(実際の課金は有効化しない。傷病手当金との兼ね合いで人間が有効化時期を判断する)

- [x] スモークテストスクリプト scripts/smoke.js を作成する: .env.local の SUPABASE_SERVICE_ROLE_KEY で管理者としてテストユーザー(smoke-test@lunaria.local)を作成しアクセストークンを取得、そのトークンで /api の主要エンドポイント(会話送信・ガチャ実行・日記取得を含む5つ以上)を実際に叩き、全て2xxなら SMOKE OK と表示して exit 0、失敗時はどのAPIが何を返したか表示して exit 1 とする。最後にテストユーザーを削除する
- [x] 利用テレメトリを実装する: migration 024_usage_events.sql (usage_events テーブル: id, user_id, event text, created_at、RLSは本人insertのみ・selectはservice roleのみ) を作成し、lib/track.ts の trackEvent(supabase, userId, event) ヘルパーを作り、チャット送信・ガチャ実行・日記閲覧・ログインの4箇所に計測を入れる。計測失敗は本体機能に影響させない(fire-and-forget)
- [x] ログインにメール+パスワード方式を追加する: app/login/page.tsx にパスワードでの新規登録とログインのタブまたは切替を追加し(マジックリンクも残す)、supabase.auth.signUp / signInWithPassword を使う。日本語UI。パスワードは8文字以上のバリデーション

- [x] 公開ランディングページを作成する: middleware.ts の PUBLIC_PATHS に / と /terms と /privacy を追加し、app/page.tsx を未ログインでも見られる製品紹介LPに置き換える(ログイン済みなら従来のホームへ)。内容: Lunariaの価値提案(AIコンパニオン・記憶・ガチャで会話のきっかけ)、スクリーンショット枠、/login へのCTA。日本語、ダーク基調、Tailwindのみ。既存のログイン後ホームの機能は壊さない
- [x] 利用規約 app/terms/page.tsx とプライバシーポリシー app/privacy/page.tsx を作成する: 日本語の標準的な雛形で、AI生成コンテンツの免責(応答は人工的に生成され正確性を保証しない・医療/法律助言ではない)、18歳以上の利用制限、取得データ(メール・会話ログ・利用イベント)とSupabase/Google Gemini APIへの委託、退会時削除、運営者名と連絡先はプレースホルダ【運営者情報】とする。フッターまたはLPとログイン画面から両ページへリンクを張る
- [x] OGP/メタデータを整備する: app/layout.tsx の metadata に title/description(日本語)、OpenGraph(og:title, og:description, og:type)、Twitterカード(summary)を設定し、public/og.png が無ければシンプルなプレースホルダ画像生成はせずmetadataのみで完結させる。viewport とテーマカラーも設定

- [x] 【実利用FB】会話トーンを修正する: lib/prompt.ts のルナの人格定義に次の絶対規則を追加する。(1)ユーザーが疲労・無気力・落ち込み(疲れた/やる気が出ない/しんどい/眠い/はぁ/沈黙など)を示したら、必ず共感と受容を最初に返し、からかい・煽り・詰問(「は？」「何それ笑」「〜なの？」の連発)を禁止する。(2)冗談やツッコミはユーザーが明らかに楽しんでいる文脈のみ。(3)ネガティブ感情の検出時はやさしい相槌→気持ちの言語化の手伝い→無理に解決策を出さない、の順。既存のclaude_serious/感情ルーティングがあれば低エネルギー信号での発火閾値を下げる。人格の魅力(明るさ・親しみ)は保つ
- [x] 【実利用FB】ガチャを王道ソシャゲ演出に刷新する: /gacha の抽選UIを (a)ボタン押下→期待感の溜め演出→レアリティ別の色フラッシュ(N=白/R=青/SR=金/等、既存rarity値に合わせる)→カード反転で結果表示、のアニメーション(CSSのみ、2秒以内、スキップタップ可) (b)コレクション図鑑ビューを追加: 全アイテムをグリッド表示し未所持はシルエット+「???」、所持率パーセント表示、レアリティバッジ付き (c)UI文言から「会話のきっかけ」「トリガー」系の説明コピーを排除し、収集と演出中心の文言へ。既存API・DBスキーマは変更しない
- [x] 【実利用FB】UI表示を完全日本語化する: app配下とcomponents配下の全ユーザー向け文字列を走査し、英語のボタン・ラベル・プレースホルダ・エラーメッセージ・空状態表示・日付表示(曜日/月名含む)を自然な日本語に置換する。ブランド名Lunariaとルナの名前は除く。aria-labelも日本語化
- [ ] 【実利用FB】UI全体の品質を引き上げる: ランディングページで使ったダーク+ゴールドの世界観(背景#080706系、アクセント#f1c77f系)をデザイントークンとして統一し、チャットホーム・ガチャ・日記・ログインへ適用する。具体的に: メッセージバブルの形状と余白の洗練、行間と文字サイズの階層整理、ボタンの統一スタイル(hover/active込み)、モバイル幅(375px)での崩れ解消、過剰なボーダーや素のHTML感の除去。機能変更はしない

## 人間タスク(自動化対象外)
- Vercel/本番Supabase プロジェクト作成と環境変数設定
- migration 008〜023 の本番適用
- Stripe 有効化タイミングの判断(給付金コンプライアンス)
