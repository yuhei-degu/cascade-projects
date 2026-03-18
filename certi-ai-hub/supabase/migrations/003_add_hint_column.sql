-- ============================================================
-- 003_add_hint_column.sql — question_bank に hint カラム追加
-- ============================================================

-- カラム追加（既存データはNULL、後からUPDATEで埋める）
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS hint text;

-- ── 既存105問にヒントを追加 ─────────────────────────────────
-- 001_initial.sql の5問
UPDATE public.question_bank SET hint = 'LLMへの入力は「指示」として解釈されます。攻撃者はこれを悪用し、開発者の意図した動作を上書きしようとします。どの選択肢が「入力による指示の上書き」を説明しているか考えましょう。'
WHERE question LIKE '%プロンプトインジェクション%' AND module = 'SC' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ファインチューニングやRAGでは「外部データ」をモデルに与えます。攻撃者がそのデータ自体を汚染したら何が起きるでしょうか？'
WHERE question LIKE '%データポイズニング%' AND module = 'SC' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'SQLインジェクションの本質は「入力がSQL文の一部として解釈される」ことです。入力をSQL構造から切り離す方法を考えましょう。'
WHERE question LIKE '%SQLインジェクション%' AND module = 'SC' AND hint IS NULL;

UPDATE public.question_bank SET hint = '公開鍵暗号では「暗号化に使う鍵」と「復号に使う鍵」が異なります。受信者がデータを受け取って復号できるのは誰の鍵を持っているからでしょうか？'
WHERE question LIKE '%公開鍵暗号方式%' AND module = 'SC' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Amazon Bedrockの「Guardrails」という名前から機能を想像してみましょう。ガードレールは何を防ぐためにあるのでしょうか？'
WHERE question LIKE '%プロンプトインジェクション対策%' AND module = 'AIF' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'AWSのResponsible AIの柱を覚える際は「ビジネス目標」と「社会的責任」を分けて考えましょう。どれが純粋にビジネス指標でしょうか？'
WHERE question LIKE '%責任あるAI%' AND module = 'AIF' AND hint IS NULL;

-- SC: ai_threat カテゴリ（002_questions.sql 分）
UPDATE public.question_bank SET hint = '入力で「指示階層を上書き」する攻撃を選びましょう。他の選択肢はデータ汚染・物理攻撃・可用性攻撃です。'
WHERE question LIKE '%プロンプトインジェクションの説明%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '学習・ファインチューニング・埋め込みデータへの「混入」が鍵ワードです。どれが学習データに直接手を加えているでしょうか？'
WHERE question LIKE '%データポイズニング%に該当%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '「含まれていたか否か」を当てるだけの攻撃です。モデルの出力から推測するより軽い攻撃と言えます。'
WHERE question LIKE '%メンバーシップ推測%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'インバージョン＝逆算。モデルの出力から何を「逆算」しようとしているのかを考えましょう。'
WHERE question LIKE '%モデルインバージョン%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '人間の目には同じに見えるのに、モデルは騙される。「微小な摂動」がキーワードです。'
WHERE question LIKE '%敵対的サンプル%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'System Promptのリークを防ぐには「秘密をプロンプトに書かない」が基本です。秘密はどこで管理すべきでしょうか？'
WHERE question LIKE '%System Prompt Leakage%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'RAGのベクトルDB汚染問題です。OWASP LLM Top 10の番号を覚えるより「RAG・埋め込み・ベクトル」という単語に注目しましょう。'
WHERE question LIKE '%ベクトルDB%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'エージェントが「送金API」を持つ場合、最悪のシナリオは何でしょうか？それを防ぐには承認と権限の最小化が重要です。'
WHERE question LIKE '%送金API%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '無制限にリソースを消費させる攻撃です。「上限を設ける」という発想で解けます。'
WHERE question LIKE '%推論コストを膨らませる%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'なりすまし電話での緊急送金指示は典型的なBEC（ビジネスメール詐欺）の音声版です。手順を守ることが最重要です。'
WHERE question LIKE '%ディープフェイク音声%' AND hint IS NULL;

-- SC: threat カテゴリ
UPDATE public.question_bank SET hint = 'XSSの本質は「出力にスクリプトが混入すること」です。防ぐには入力ではなく出力の時点で対処します。'
WHERE question LIKE '%XSS%防ぐ%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'メール認証の仕組みを選びます。HSTS/SameSite/CSPはすべてWeb・ブラウザ側の技術です。メール専用の認証技術はどれでしょうか？'
WHERE question LIKE '%なりすまし抑止%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'CSRFは「正規ユーザのブラウザを使って」リクエストを偽造します。サーバーが「本当に本人が意図したか」を確認する仕組みを選びましょう。'
WHERE question LIKE '%CSRF%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'SQLインジェクションの根本対策は「SQLの構造と入力データを分離する」ことです。文字を削除するだけでは不十分な理由を考えましょう。'
WHERE question LIKE '%SQLインジェクション攻撃%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'クリックジャッキングは透明なiframeで操作を盗みます。「ページを埋め込まれないようにする」仕組みを選びましょう。'
WHERE question LIKE '%クリックジャッキング%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'DNSの応答が偽造されるのを防ぐには、応答に「署名」をつけて検証します。'
WHERE question LIKE '%DNSキャッシュポイズニング%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '攻撃者が事前に知っているセッションIDを使い続けさせる攻撃です。認証の「前後」でIDを変えることが鍵です。'
WHERE question LIKE '%セッション固定化%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '「反射増幅」がキーワードです。自分でなく第三者のサーバーを踏み台にして、少ない送信量で大きなトラフィックを生成します。'
WHERE question LIKE '%DRDoS%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'プッシュ通知を大量に送りつけて誤タップを狙います。「疲れさせる」対策ではなく、技術的に無差別承認を防ぐ方法を選びましょう。'
WHERE question LIKE '%MFA fatigue%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '内部レジストリより高いバージョン番号のパッケージをパブリックに公開する攻撃です。「どこから取得するか」の制御が重要です。'
WHERE question LIKE '%dependency confusion%' AND hint IS NULL;

-- SC: coding カテゴリ
UPDATE public.question_bank SET hint = 'ソースコードに秘密情報を直接書くと、リポジトリ共有・デプロイ・退職者など様々な経路で漏洩します。'
WHERE question LIKE '%ハードコード%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'パスワードは「後から元に戻せない」形で保存が基本です。MD5は速すぎて危険、暗号化は鍵が漏れると終わりです。'
WHERE question LIKE '%パスワードを安全に保存%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'セッションIDは「推測できないこと」が必須です。時刻やユーザIDは予測可能なため不適切です。'
WHERE question LIKE '%推測困難なトークン%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '../ を使ってディレクトリを遡る攻撃です。受け取ったパスを正規化して許可ディレクトリ内に閉じ込めましょう。'
WHERE question LIKE '%パストラバーサル%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'シェル経由でコマンドを実行すると入力が「コマンドの一部」として解釈されます。シェルを介さない実行方法を選びましょう。'
WHERE question LIKE '%OSコマンドインジェクション%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'サーバーが任意のURLにリクエストを送ってしまう脆弱性です。AWSのメタデータエンドポイント（169.254.169.254）へのアクセスが典型的な危険です。'
WHERE question LIKE '%SSRF%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'HTMLに出力する場面では、< > & " などをエスケープしてブラウザに「タグ」として解釈させないことが重要です。'
WHERE question LIKE '%テンプレートにユーザ入力%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ファイルの「存在確認→作成」の間に別プロセスが割り込めます。確認と作成を分離しない方法を選びましょう。'
WHERE question LIKE '%TOCTOU%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'JWTは「署名の検証」が命です。検証をスキップすると、誰でも任意の内容のトークンを偽造できます。'
WHERE question LIKE '%JWT%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '任意のクラスを復元できると、そのクラスのコンストラクタや特殊メソッドが実行されます。型を制限して安全なフォーマットに移行しましょう。'
WHERE question LIKE '%デシリアライゼーション%' AND hint IS NULL;

-- SC: crypto カテゴリ
UPDATE public.question_bank SET hint = '「共通」という名前から、何が共通なのかを考えましょう。暗号化する人と復号する人の間で何を共有しているでしょうか？'
WHERE question LIKE '%共通鍵暗号方式%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '電子署名は「誰が署名したか」の証明と「改ざんされていないか」の確認が目的です。機密性（他者に見せない）とは違います。'
WHERE question LIKE '%電子署名が主に提供%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'TLSで暗号化されていても「相手が本物か」を確認しないとMITMに遭います。ホスト名が証明書と一致するかが重要です。'
WHERE question LIKE '%サーバ証明書検証%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '「前方秘匿」＝過去のセッションが将来の鍵漏洩で解読されない性質です。そのためにはセッションごとに使い捨ての鍵が必要です。'
WHERE question LIKE '%前方秘匿性%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'AEADは「Authenticated Encryption with Associated Data」の略です。「認証付き」が示す機能は何でしょうか？'
WHERE question LIKE '%AEAD%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'CAは「第三者機関」として公開鍵の持ち主を保証します。秘密鍵を配布してしまったら安全性が崩れます。'
WHERE question LIKE '%認証局%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '暗号の強度は「鍵が推測できないこと」に依存しています。乱数が弱いと鍵空間を絞り込んで攻撃できます。'
WHERE question LIKE '%弱い乱数のリスク%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ダウングレード攻撃は「古い弱いバージョンで話させる」攻撃です。対策は弱いバージョンを無効化することです。'
WHERE question LIKE '%ダウングレード攻撃%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '大きなデータをKMSのマスター鍵で直接暗号化するのは非効率です。「データ鍵」を使って二段階で保護する方式を選びましょう。'
WHERE question LIKE '%エンベロープ暗号%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '量子コンピュータは今の公開鍵暗号（RSA・ECDSAなど）を脅かします。PQCはそれに備えた新世代の暗号方式群です。'
WHERE question LIKE '%耐量子暗号%' AND hint IS NULL;

-- SC: management カテゴリ
UPDATE public.question_bank SET hint = 'ISMSは「ファイアウォールを入れる」ような特定の対策ではなく、継続的に管理・改善する「仕組み」です。'
WHERE question LIKE '%ISMS%の目的%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'インシデント対応で最初にすべきは「被害の拡大を止めること」と「証拠を残すこと」です。原因究明は後回しで構いません。'
WHERE question LIKE '%インシデント対応の初動%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'リスク特定は「何が脅威になりうるか」の洗い出しです。まず資産・脅威・脆弱性を列挙して関連付けます。'
WHERE question LIKE '%リスク特定%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'BCP（事業継続）は会社全体、DR（災害復旧）はITシステムの復旧に特化しています。DRはBCPの一部です。'
WHERE question LIKE '%BCP%DR%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ログは「不正を防ぐ」ためではなく「不正を後から検知・調査できるようにする」ためにあります。ログを取らない理由は何もありません。'
WHERE question LIKE '%監査ログ設計%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'セキュリティポリシーは一度作ったら終わりではありません。法令・技術・脅威の変化に合わせて定期的に見直しが必要です。'
WHERE question LIKE '%ポリシーの改定%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '個人情報は「必要最小限の収集」と「適切なアクセス制御」が基本です。ログへの全文保存は後から問題になります。'
WHERE question LIKE '%個人情報を取り扱う%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '委託先に任せても「責任」は発注側に残ります。契約で何をどこまで要求するかが重要です。'
WHERE question LIKE '%委託先%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ゼロトラストは「内部ネットワークも信頼しない」という考え方です。必要な権限だけを与え、常に検証します。'
WHERE question LIKE '%ゼロトラスト%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '監査証拠は「後で第三者が確認できる」客観的な記録である必要があります。口頭説明や推測は証拠になりません。'
WHERE question LIKE '%監査証拠%' AND hint IS NULL;

-- AIF: bedrock カテゴリ
UPDATE public.question_bank SET hint = 'Guardrails＝ガードレール。何から守るためのガードレールでしょうか？有害コンテンツや機密情報の漏洩を防ぐイメージです。'
WHERE question LIKE '%Guardrailsの主な目的%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Knowledge Bases＝知識ベース。自社の文書をAIに参照させる仕組みです。RAG（検索拡張生成）の実装サービスです。'
WHERE question LIKE '%Knowledge Basesの説明%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Content filtersのカテゴリ名を覚えるより「有害コンテンツ・プロンプト攻撃に関するもの」を選ぶと判断しやすいです。'
WHERE question LIKE '%Content filters%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ユーザの入力とシステムプロンプト（開発者の指示）を区別することで、ユーザ入力部分だけを攻撃検出の対象にできます。'
WHERE question LIKE '%プロンプト攻撃検出%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'アクショングループ＝エージェントが「できること（アクション）」をグループにまとめたものです。Lambda関数などのAPIをここで定義します。'
WHERE question LIKE '%アクショングループ%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ReActは「Reasoning（推論）→Action（行動）→Observation（観察）」のループです。Bedrockエージェントの基本戦略です。'
WHERE question LIKE '%オーケストレーション戦略%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ApplyGuardrailはモデルを呼ばずにGuardrailsだけ使えるAPIです。パイプラインの任意の箇所でテキスト検査ができます。'
WHERE question LIKE '%ApplyGuardrail%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'AgentsにGuardrailsを設定しても、ツール（Lambda等）の入出力はデフォルトでは対象外です。この「盲点」が間接プロンプト注入の入口になります。'
WHERE question LIKE '%Guardrailsを関連付け%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'コンテキストグラウンディングは「根拠のある回答か」を確認する機能です。対話型チャットでは参照文書が明確でないため対象外です。'
WHERE question LIKE '%コンテキストグラウンディング%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Bedrock evaluationsはモデルやRAGの品質を「数値で測る」機能です。主観でなく指標で評価することが重要です。'
WHERE question LIKE '%Bedrock evaluations%' AND hint IS NULL;

-- AIF: responsible_ai カテゴリ
UPDATE public.question_bank SET hint = '責任あるAIは「精度だけを追求する」ではなく、社会的影響を含めて設計・運用する考え方です。'
WHERE question LIKE '%責任あるAI（Responsible AI）の特徴%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Clarifyという名前から「明確化・解明」をイメージしましょう。モデルの判断根拠やバイアスを「明らかにする」サービスです。'
WHERE question LIKE '%バイアス検出%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Explainable AI＝説明できるAI。なぜその判断をしたのかを人間が理解できることが目的です。'
WHERE question LIKE '%説明可能なAI%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'バイアスはデータの偏りから生まれます。多様なデータで学習し、偏りを定量評価することが根本対策です。'
WHERE question LIKE '%データセットの偏り%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ハルシネーション対策は「根拠を持たせる」ことが基本です。RAGで参照元を明示し、Guardrailsで制約をかけます。'
WHERE question LIKE '%ハルシネーション%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'PIIをAIに入力した段階でリスクが生まれます。入力前に最小化・マスキングし、出力でも同様に扱いましょう。'
WHERE question LIKE '%プライバシー保護%生成AI%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Human-in-the-loop＝人間をループに入れる。AIの判断に人間の確認を挟む仕組みです。A2I＝Augmented AI（人間拡張）です。'
WHERE question LIKE '%Human-in-the-loop%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ブラックボックスモデルは高精度だが説明が難しい。リスクに応じて「どこまで説明が必要か」を判断しましょう。'
WHERE question LIKE '%説明可能性%モデル性能%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'バイアスは学習後も変化します（データの分布が変わるため）。初回だけでなく継続的な監視が必要です。'
WHERE question LIKE '%bias drift%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '生成AIのIPリスク：学習データの著作権、偏った出力による差別、不正確な情報による信用失墜などが法的問題になりえます。'
WHERE question LIKE '%法的リスク%' AND hint IS NULL;

-- AIF: ml_basics カテゴリ
UPDATE public.question_bank SET hint = '「教師あり」＝正解（ラベル）を教えながら学習します。ラベルなしで学習するのが教師なし学習です。'
WHERE question LIKE '%教師あり学習%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '訓練データは完璧でも、テストデータで失敗する状態です。「暗記したが応用できない」状態をイメージしましょう。'
WHERE question LIKE '%過学習%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '「陽性の取りこぼし」＝FN（False Negative）を減らしたい。Recallは「実際の陽性をどれだけ検出できたか」の指標です。'
WHERE question LIKE '%取りこぼし%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Precision＝精度。「陽性と予測したもの」のうち実際に陽性だった割合です。誤検知を減らしたい場合に重視します。'
WHERE question LIKE '%適合率%Precision%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'テストデータは「未知データを模擬する」ためのものです。学習に使ってしまうと本来の性能評価ができなくなります。'
WHERE question LIKE '%学習データ・検証データ・テストデータ%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'テストデータの情報が学習に混入すると、見かけ上は高精度でも実際には使えないモデルになります。「カンニング」のイメージです。'
WHERE question LIKE '%データリーク%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'ML開発はデプロイで終わりではありません。本番環境での挙動を「監視」し続けることが重要です。'
WHERE question LIKE '%ML開発ライフサイクル%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '本番データの分布が学習時と変わる（ドリフト）と精度が落ちます。監視して検知し、必要なら再学習します。'
WHERE question LIKE '%入力分布が変化%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'バイアスドリフトは時間とともにデータの分布が変化し、偏りが増大する現象です。初期設定だけでは対応できません。'
WHERE question LIKE '%バイアスが時間とともに%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '頑健性＝ロバスト性。少し入力が変わっても出力が大きく崩れない性質です。敵対的サンプルへの耐性に直結します。'
WHERE question LIKE '%頑健性%' AND hint IS NULL;

-- AIF: generative_ai カテゴリ
UPDATE public.question_bank SET hint = 'トークンはLLMが処理する最小単位です。日本語1文字≒1〜3トークン程度です。多いほど遅く・高くなります。'
WHERE question LIKE '%トークン%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '埋め込みは「意味をベクトルで表現する」技術です。意味が近い言葉はベクトルが近くなり、類似検索に使えます。'
WHERE question LIKE '%埋め込み%embeddings%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'RAGは「検索して文脈に追加する」、ファインチューニングは「モデル自体を書き換える」。どちらがモデルの重みを変えるか考えましょう。'
WHERE question LIKE '%RAGとファインチューニングの違い%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '温度が高い＝サイコロの目がバラつく。低い＝いつも同じ目が出る。創造性と一貫性のトレードオフです。'
WHERE question LIKE '%温度%temperature%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Few-shot＝例をいくつか示す。モデルに「こういう形式で答えてほしい」と例で教えることが効果的です。'
WHERE question LIKE '%プロンプトエンジニアリング%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '長文を全部入れると上限を超えてエラーになります。RAGで「必要な部分だけ」検索して渡すのが効率的です。'
WHERE question LIKE '%コンテキスト長%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Misinformation＝誤情報。LLMが自信満々に間違いを言うことをハルシネーションとも呼びます。OWASP LLM09です。'
WHERE question LIKE '%誤情報%Misinformation%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'RAGデータストアへの悪意ある文書混入は間接プロンプト注入の一形態です。データの「出所」を管理することが重要です。'
WHERE question LIKE '%データストアに悪意ある文書%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '生成AIの出力をそのままHTMLやSQLに使うと、XSSやSQLインジェクションが起きます。出力も「入力と同様に」検証が必要です。'
WHERE question LIKE '%出力をそのまま%' AND hint IS NULL;

UPDATE public.question_bank SET hint = '「評価なし」は品質保証なしと同じです。目的に合った評価指標を決めてから導入しましょう。'
WHERE question LIKE '%基盤モデルの利用形態の評価%' AND hint IS NULL;

-- AIF: sdk カテゴリ
UPDATE public.question_bank SET hint = 'Textract＝テキストを抽出する。PDFや画像から文字を読み取るOCRサービスです。Transcribeは「音声」の文字起こしと区別しましょう。'
WHERE question LIKE '%OCR%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Comprehend＝理解する。テキストの「意味」を理解するNLPサービスです。Rekognitionは「画像」の理解と区別しましょう。'
WHERE question LIKE '%感情分析%NLP%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Transcribe＝書き起こす。音声→テキストの変換です。Translate（翻訳）・Polly（テキスト→音声）と混同しないようにしましょう。'
WHERE question LIKE '%音声をテキストに%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Translate＝翻訳する。多言語テキスト変換です。Lex（対話）・Rekognition（画像）・KMS（暗号化）とは全く別の用途です。'
WHERE question LIKE '%多言語翻訳%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Rekognition＝認識する。画像・動画から物体・顔・テキストなどを「認識」します。Comprehendはテキストの理解です。'
WHERE question LIKE '%コンピュータビジョン%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Lex＝会話を設計する。「意図（インテント）」と「スロット（パラメータ）」を定義して対話フローを作ります。AlexaもLexベースです。'
WHERE question LIKE '%対話型ボット%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'KMS＝鍵を管理する専用サービス。暗号化・復号だけでなくエンベロープ暗号のデータ鍵管理にも使います。'
WHERE question LIKE '%暗号鍵の管理%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'Macie＝機密データを発見する。S3バケット内のPIIや機密情報を自動検出します。EFS・ECS・Direct Connectは別用途です。'
WHERE question LIKE '%機密情報%S3%検出%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'CloudTrail＝AWSのAPIコールをすべて記録する監査ログサービスです。「誰が・いつ・何をしたか」を追跡できます。'
WHERE question LIKE '%監査ログ%収集%' AND hint IS NULL;

UPDATE public.question_bank SET hint = 'コスト管理はBudgets（予算設定）とCost Explorer（分析）が二本柱です。生成AIのAPI使いすぎを事前に検知できます。'
WHERE question LIKE '%コスト管理%予算%' AND hint IS NULL;
