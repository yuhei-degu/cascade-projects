-- ============================================================
-- 002_questions.sql — 追加問題シード（100問）
-- SC: ai_threat×10, threat×10, coding×10, crypto×10, management×10
-- AIF: bedrock×10, responsible_ai×10, ml_basics×10, generative_ai×10, sdk×10
-- ============================================================

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','ai_threat',1,'大規模言語モデル（LLM）に対するプロンプトインジェクションの説明として適切なものはどれか。','[{"key":"A","text":"学習データに誤情報を混入させ、特定入力で誤動作するよう仕込む"},{"key":"B","text":"入力文で指示階層を上書きし、想定外の応答やツール実行を誘発する"},{"key":"C","text":"GPUの電力解析により秘密鍵を推定する"},{"key":"D","text":"推論APIに大量アクセスしてサービス停止を狙う"}]'::jsonb,'B','Bが正解。入力で開発者意図を上書きし不正動作させる。Aはデータポイズニング、Cはサイドチャネル、DはDoSで目的が異なる。','AIF: bedrockのAmazon Bedrock Guardrails（Prompt Attackフィルター/入力タグ付け）で一次防御を設計できる。',ARRAY['prompt_injection','llm_security','owasp_llm01']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','ai_threat',1,'LLMのデータポイズニング（学習/埋め込みデータ汚染）に該当するものはどれか。','[{"key":"A","text":"ファインチューニング用データに特定トリガ文字列を混入し、条件付きで誤応答させる"},{"key":"B","text":"ユーザ入力によりシステムプロンプト漏えいを誘発する"},{"key":"C","text":"推論APIへ大量トークン入力を繰り返し課金を膨らませる"},{"key":"D","text":"出力をHTMLにそのまま埋め込みXSSを起こす"}]'::jsonb,'A','Aが正解。学習/埋め込みデータの汚染で挙動を歪める。Bは漏えい、Cはコスト攻撃、Dは不適切な出力処理で論点が違う。','AIF: generative_aiでRAGのデータソース管理、bedrockでKnowledge Basesの取り込み統制・引用表示を学ぶと対策に直結。',ARRAY['data_poisoning','llm_security','owasp_llm04']);

INSERT INTO question_bank(module, category,difficulty,question,options,answer,explanation,synergy_hint,tags)
VALUES ('SC','ai_threat',2,'メンバーシップ推測攻撃に該当するものはどれか。','[{"key":"A","text":"モデル出力から学習データの特徴量を再構成する"},{"key":"B","text":"特定の個人データが学習データに含まれていたかを推測する"},{"key":"C","text":"微小な摂動で画像分類を誤らせる"},{"key":"D","text":"RAGの検索結果に悪性文書を混ぜて誘導する"}]'::jsonb,'B','Bが正解。学習集合への「含有有無」を当てる。Aはモデルインバージョン、Cは敵対的サンプル、Dはベクトル/埋め込みの弱点で目的が異なる。','AIF: responsible_aiでプライバシー/安全性を扱い、bedrockで入力・出力の機密情報フィルタを設計する。',ARRAY['membership_inference','privacy','ai_threat']);

INSERT INTO question_bank(module, category,difficulty,question,options,answer,explanation,synergy_hint,tags)
VALUES ('SC','ai_threat',2,'モデルインバージョン攻撃の説明として適切なものはどれか。','[{"key":"A","text":"モデル出力などから学習データの特徴や内容を推定・再構成する"},{"key":"B","text":"学習データの含有有無だけを当てる"},{"key":"C","text":"システムプロンプトを抜き取る"},{"key":"D","text":"推論APIをDDoSする"}]'::jsonb,'A','Aが正解。出力から訓練情報の特徴を逆推定する。Bはメンバーシップ推測、Cはプロンプト漏えい、Dは可用性攻撃で論点が違う。','AIF: responsible_ai（プライバシー）＋sdk（Macie/Secrets Manager等）で「漏えい面」を具体化すると理解が深まる。',ARRAY['model_inversion','privacy','ai_threat']);

INSERT INTO question_bank(module, category,difficulty,question,options,answer,explanation,synergy_hint,tags)
VALUES ('SC','ai_threat',2,'敵対的サンプル（Adversarial Examples）の特徴として適切なものはどれか。','[{"key":"A","text":"攻撃者が学習データを改ざんしてバックドアを仕込む"},{"key":"B","text":"人間には同じに見える微小な摂動でモデルを誤判断させる"},{"key":"C","text":"モデルのシステムプロンプトを漏えいさせる"},{"key":"D","text":"LLMへの入力を長文化してコストを増やす"}]'::jsonb,'B','Bが正解。知覚的に近い入力でも誤分類を誘発する。Aはポイズニング、Cは漏えい、Dはコスト攻撃でカテゴリが異なる。','AIF: ml_basicsで頑健性の概念、bedrockで評価（robustness/semantic robustness）を学ぶと対策検討がしやすい。',ARRAY['adversarial_examples','robustness','ai_threat']);

INSERT INTO question_bank(module, category,difficulty,question,options,answer,explanation,synergy_hint,tags)
VALUES ('SC','ai_threat',2,'OWASP Top 10 for LLM Applications 2025の「System Prompt Leakage」に最も関係する対策はどれか。','[{"key":"A","text":"システムプロンプト内にAPIキーを埋め込む"},{"key":"B","text":"秘密情報はプロンプトに置かず、ツール権限と秘密管理で制御する"},{"key":"C","text":"温度（temperature）を上げて多様な出力にする"},{"key":"D","text":"学習データを公開して透明性を高める"}]'::jsonb,'B','Bが正解。秘密をプロンプトに入れず権限/秘密管理で守る。Aは漏えいリスク増、Cは品質制御で無関係、Dは逆に露出が増える。','AIF: sdk（Secrets Manager/KMS）とbedrock（Guardrails）を組み合わせた設計が実務解に近い。',ARRAY['system_prompt_leakage','secret_management','owasp_llm07']);

INSERT INTO question_bank(module, category,difficulty,question,options,answer,explanation,synergy_hint,tags)
VALUES ('SC','ai_threat',2,'RAGで利用するベクトルDBに攻撃者が文書を混入し、検索結果経由で出力を誘導するリスクに最も近いOWASP分類はどれか。','[{"key":"A","text":"LLM08:2025 Vector and Embedding Weaknesses"},{"key":"B","text":"LLM05:2025 Improper Output Handling"},{"key":"C","text":"LLM03:2025 Supply Chain"},{"key":"D","text":"LLM10:2025 Unbounded Consumption"}]'::jsonb,'A','Aが正解。RAGのベクトル/埋め込みや検索周辺の弱点が主題。Bは出力の利用方法、Cは依存/供給網、Dはコスト暴走で論点が違う。','AIF: bedrockのKnowledge Bases（RAG）と評価（引用/根拠確認）を理解すると防御設計が具体化する。',ARRAY['rag_security','embeddings','owasp_llm08']);

INSERT INTO question_bank(module, category,difficulty,question,options,answer,explanation,synergy_hint,tags)
VALUES ('SC','ai_threat',3,'経理業務エージェントが「送金API」をツールとして実行可能である。プロンプトインジェクション等を考慮した対策として最も適切なものはどれか。','[{"key":"A","text":"エージェントの自律性を高めるため送金APIを常に自動承認にする"},{"key":"B","text":"送金は最小権限・上限・二重承認を必須とし、ツール呼出しを監査ログ化する"},{"key":"C","text":"エージェントの応答を保存しないようログを無効化する"},{"key":"D","text":"モデルサイズを大きくして誤動作を減らす"}]'::jsonb,'B','Bが正解。高リスク操作は最小権限＋承認＋上限＋監査で止める。Aは被害拡大、Cは追跡不能、Dは統制でなく品質論。','AIF: bedrockのAgents/Guardrails＋Domain5（セキュリティ/ガバナンス）で承認・監査の考え方が頻出。',ARRAY['excessive_agency','approvals','least_privilege']);

INSERT INTO question_bank(module, category,difficulty,question,options,answer,explanation,synergy_hint,tags)
VALUES ('SC','ai_threat',3,'LLMを用いたチャットボットに対し、長大入力を繰り返して推論コストを膨らませる攻撃への対策として適切なものはどれか。','[{"key":"A","text":"レート制限、入出力長の上限、予算（Budgets）やタイムアウトを設定する"},{"key":"B","text":"温度（temperature）を0に固定する"},{"key":"C","text":"TLSを無効化してCPU負荷を下げる"},{"key":"D","text":"エラーメッセージを詳細に返す"}]'::jsonb,'A','Aが正解。無制限消費（LLM10）には上限・レート・予算・タイムアウトが有効。Bは品質、Cは危険、Dは情報漏えいを助長。','AIF: sdk（AWS Budgets/Cost Explorer）やgenerative_aiのトークン課金の理解がシナジーになる。',ARRAY['unbounded_consumption','cost_security','owasp_llm10']);

INSERT INTO question_bank(module, category,difficulty,question,options,answer,explanation,synergy_hint,tags)
VALUES ('SC','ai_threat',3,'生成AIによるディープフェイク音声で上司になりすまし、緊急送金を指示された。組織の初動対応として適切なものはどれか。','[{"key":"A","text":"緊急のため検証せず送金を実施する"},{"key":"B","text":"別経路で本人確認し、既定の承認手順とインシデント連絡網に従う"},{"key":"C","text":"SNSに注意喚起を投稿してから対応を検討する"},{"key":"D","text":"ログを削除して外部流出を防ぐ"}]'::jsonb,'B','Bが正解。なりすましは手続き外の緊急指示が典型で、別経路確認と手順遵守が重要。A/Dは事故拡大、Cは順序が不適切。','AIF: responsible_ai（安全性）＋Domain5（ガバナンス）で「人手承認/検証」の重要性が関連。',ARRAY['deepfake','bec','incident_response']);

-- SC: threat (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',1,'クロスサイトスクリプティング（XSS）攻撃を防ぐために最も効果的な対策はどれか。','[{"key":"A","text":"入力値の長さ制限のみを行う"},{"key":"B","text":"出力時にHTMLエスケープ（コンテキストに応じたエンコード）を行う"},{"key":"C","text":"HTTPSを強制する"},{"key":"D","text":"セッションIDを定期的に変更する"}]'::jsonb,'B','Bが正解。XSSは出力へ混入したスクリプト実行が本質で、出力エスケープが根本対策。Aは補助、Cは盗聴対策、Dは別の対策。','AIF: sdkでAWS WAFのXSS対策ルールや、generative_aiでLLM出力をHTMLに埋め込む危険（OWASP LLM05）を関連付け。',ARRAY['xss','output_encoding','web_security']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',1,'ビジネスメール詐欺（BEC）やフィッシング対策として、送信ドメインのなりすまし抑止に有効な仕組みはどれか。','[{"key":"A","text":"DMARC（SPF/DKIMの結果に基づくポリシー適用）"},{"key":"B","text":"HTTP Strict Transport Security（HSTS）"},{"key":"C","text":"SameSite Cookie属性"},{"key":"D","text":"Content-Security-Policy（CSP）"}]'::jsonb,'A','Aが正解。DMARCはSPF/DKIMを用いてなりすまし対策の適用方針を示す。B/C/DはWeb通信・Cookie・ブラウザ制御でメール認証ではない。','AIF: Domain5でセキュリティ統制、sdkでSES等のメール運用設計と関連づけ可能。',ARRAY['phishing','dmarc','email_security']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',2,'クロスサイトリクエストフォージェリ（CSRF）対策として適切なものはどれか。','[{"key":"A","text":"SQL文をプリペアドステートメントにする"},{"key":"B","text":"状態変更リクエストにCSRFトークンを付与し検証する"},{"key":"C","text":"TLSの証明書ピンニングを行う"},{"key":"D","text":"パスワードをハッシュ化して保存する"}]'::jsonb,'B','Bが正解。CSRFは正規ユーザのブラウザを悪用して意図しない操作を実行させるため、トークン検証が有効。A/C/Dは別脅威への対策。','AIF: generative_aiでエージェントがWeb操作を行う場合も「状態変更の承認/トークン」が重要と説明できる。',ARRAY['csrf','session_security','web_security']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',2,'SQLインジェクション攻撃の主たる対策として適切なものはどれか。','[{"key":"A","text":"ユーザ入力中の記号をすべて削除する"},{"key":"B","text":"SQLを文字列連結せず、プレースホルダ付きのパラメータ化クエリを使う"},{"key":"C","text":"ページにCSPヘッダを付与する"},{"key":"D","text":"cookieにSecure属性を付ける"}]'::jsonb,'B','Bが正解。入力をSQL構造として解釈させないのが本筋で、パラメータ化が有効。Aは不完全、C/Dは別領域の対策。','AIF: sdkでRDS/Aurora等を使う場合も同様。生成AIがSQLを生成する時は検証/権限制限（SC:coding）とセット。',ARRAY['sql_injection','parameterized_query','database_security']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',2,'クリックジャッキング対策として適切なものはどれか。','[{"key":"A","text":"X-Frame-OptionsまたはCSPのframe-ancestorsで埋め込みを制御する"},{"key":"B","text":"DKIM署名を付与する"},{"key":"C","text":"DNSSECを導入する"},{"key":"D","text":"WPA3を有効化する"}]'::jsonb,'A','Aが正解。透明iframeなどでユーザ操作を誘導するため、フレーミング制御が有効。B/C/Dはメール・DNS・無線の対策で無関係。','AIF: generative_aiで生成したUI断片をWebに組み込む際もブラウザ防御（CSP）が重要と関連付け。',ARRAY['clickjacking','csp','web_headers']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',2,'DNSキャッシュポイズニングへの対策として適切なものはどれか。','[{"key":"A","text":"DNSSECにより応答の真正性を検証する"},{"key":"B","text":"HTTP/2を採用する"},{"key":"C","text":"SameSite=Laxを設定する"},{"key":"D","text":"S/MIMEでメールを暗号化する"}]'::jsonb,'A','Aが正解。DNSSECは署名検証で改ざん/偽応答を抑止する。B/C/Dは別プロトコル領域でDNS改ざん対策にならない。','AIF: Domain5でIAM等だけでなく、名前解決やネットワークの信頼性も含めた設計と説明できる。',ARRAY['dns_poisoning','dnssec','network_security']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',2,'セッション固定化（Session Fixation）攻撃への対策として適切なものはどれか。','[{"key":"A","text":"ログイン成功後にセッションIDを再生成する"},{"key":"B","text":"TLSの暗号スイートを強化する"},{"key":"C","text":"WAFでXSSを遮断する"},{"key":"D","text":"DBを暗号化する"}]'::jsonb,'A','Aが正解。攻撃者が事前に知るIDの継続利用を防ぐには、認証後のID再発行が有効。B/C/Dは別の脅威対策。','AIF: sdkでCognito等を使う場合も同じ設計原則（認証境界）を説明できる。',ARRAY['session_fixation','authentication','web_security']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',3,'DRDoS攻撃（反射増幅型DDoS）の説明として適切なものはどれか。','[{"key":"A","text":"侵入後に権限昇格して管理者権限を奪う攻撃"},{"key":"B","text":"第三者サーバを踏み台にし、応答を増幅して標的へ集中させる攻撃"},{"key":"C","text":"Webページにスクリプトを埋め込み実行させる攻撃"},{"key":"D","text":"学習データを改ざんしモデルを誤動作させる攻撃"}]'::jsonb,'B','Bが正解。反射/増幅を利用して大量トラフィックを標的へ向ける。Aは権限昇格、CはXSS、DはAIのポイズニングで別。','AIF: Domain5の可用性設計として、Shield等のDDoS対策サービス（sdk）を関連付けると理解が深まる。',ARRAY['ddos','drdos','availability']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',3,'多要素認証疲労攻撃（MFA fatigue）の対策として適切なものはどれか。','[{"key":"A","text":"プッシュ通知の無制限承認を許可する"},{"key":"B","text":"番号一致や回数制限、異常検知により無差別プッシュを抑止する"},{"key":"C","text":"HTTPをHTTPSに変更する"},{"key":"D","text":"SQLをパラメータ化する"}]'::jsonb,'B','Bが正解。連続プッシュで誤承認を狙うため、番号一致・回数制限・監視が有効。Aは危険、C/Dは別の対策。','AIF: sdkでIAM MFA運用や不正ログイン検知（CloudTrail等）と結び付けて説明できる。',ARRAY['mfa_fatigue','authentication','iam_security']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','threat',3,'依存関係の供給網攻撃（例：dependency confusion）への対策として適切なものはどれか。','[{"key":"A","text":"依存ライブラリは常に最新版を自動で取得する"},{"key":"B","text":"内部レジストリやスコープ/優先順位を統制し、バージョン固定と検証を行う"},{"key":"C","text":"cookieにHttpOnly属性を付与する"},{"key":"D","text":"WPA3を導入する"}]'::jsonb,'B','Bが正解。名前衝突や改ざんを避けるには取得元統制とバージョン固定・検証が重要。Aは危険、C/Dは別領域。','AIF: Domain5のガバナンス/コンプライアンス、sdkでSBOM/脆弱性スキャン運用と関連付け可能。',ARRAY['supply_chain','dependency_confusion','secure_build']);

-- SC: coding (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',1,'セキュアコーディングの観点で最も問題となる実装はどれか。','[{"key":"A","text":"パスワードをソースコードにハードコードする"},{"key":"B","text":"パスワードはSecrets Managerなど外部秘密管理から取得する"},{"key":"C","text":"パスワードは入力時にマスク表示する"},{"key":"D","text":"ログには成功/失敗のみを記録する"}]'::jsonb,'A','Aが正解。ハードコードは漏えい・再利用・ローテ不能の典型。Bは適切、CはUI、Dは方針次第だがハードコードほど致命的ではない。','AIF: sdkでAWS Secrets Manager/KMSを学ぶと、ハードコード回避の実装方針が固まる。',ARRAY['hardcoded_secret','secret_management','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',1,'パスワードを安全に保存する方法として適切なものはどれか。','[{"key":"A","text":"平文のままDBに保存する"},{"key":"B","text":"ソルト付きで反復可能な適応型ハッシュ（例：bcrypt等）で保存する"},{"key":"C","text":"暗号化して同じ鍵をコード内に保存する"},{"key":"D","text":"MD5でハッシュして保存する"}]'::jsonb,'B','Bが正解。ソルト＋強い適応型ハッシュで総当たり耐性を高める。Aは論外、Cは鍵漏えいで破綻、Dは衝突や高速で不適切。','AIF: Domain5（セキュリティ）で認証情報保護、sdkでKMS/Secrets Managerの役割分担を説明できる。',ARRAY['password_hashing','authentication','secure_storage']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',2,'セッションIDなど推測困難なトークン生成に適切な乱数の使い方はどれか。','[{"key":"A","text":"一般的な擬似乱数（線形合同法など）を用いる"},{"key":"B","text":"暗号学的に安全な乱数生成器（CSPRNG）を用いる"},{"key":"C","text":"現在時刻（ミリ秒）をそのまま用いる"},{"key":"D","text":"ユーザIDをBase64にする"}]'::jsonb,'B','Bが正解。トークンは推測耐性が重要でCSPRNGが必要。A/C/Dは予測されやすくセッション乗っ取り等の原因となる。','AIF: Domain5のセキュリティ設計（鍵/トークン管理）と、sdkのKMS/Secretsで乱数・鍵管理の概念がつながる。',ARRAY['csprng','session_security','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',2,'パストラバーサル脆弱性への対策として適切なものはどれか。','[{"key":"A","text":"リクエストされたパスをそのままファイルAPIへ渡す"},{"key":"B","text":"許可ディレクトリ配下に正規化して閉じ込め、許可リスト方式で検証する"},{"key":"C","text":"SQLをパラメータ化する"},{"key":"D","text":"メールにDKIM署名を付与する"}]'::jsonb,'B','Bが正解。../等で意図しないファイル参照を防ぐには正規化とディレクトリ制限が必要。Aは危険、C/Dは別問題。','AIF: generative_aiでエージェントにファイル操作をさせる場合も「許可範囲の閉じ込め」が基本。',ARRAY['path_traversal','allowlist','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',2,'OSコマンドインジェクション対策として適切なものはどれか。','[{"key":"A","text":"ユーザ入力を文字列連結してシェルに渡す"},{"key":"B","text":"シェルを介さず引数配列で実行し、入力は許可リストで検証する"},{"key":"C","text":"HTMLエスケープを行う"},{"key":"D","text":"TLSを無効化して高速化する"}]'::jsonb,'B','Bが正解。シェル解釈を避け、引数分離と許可リストで注入を防ぐ。Aは典型的脆弱、CはXSS向け、Dは危険で無関係。','AIF: bedrockのAgentsでアクショングループ（Lambda）に入力が渡る設計では、同様に許可リストが重要。',ARRAY['command_injection','input_validation','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',2,'SSRF（Server-Side Request Forgery）対策として適切なものはどれか。','[{"key":"A","text":"任意URLをそのままサーバ側で取得できるようにする"},{"key":"B","text":"アクセス先を許可リスト化し、内部アドレス/メタデータ宛の通信を遮断する"},{"key":"C","text":"SQLをパラメータ化する"},{"key":"D","text":"クッキーにSameSite=Noneを設定する"}]'::jsonb,'B','Bが正解。SSRFは内部資源やメタデータへのアクセスが危険で、宛先制限が本質。Aは危険、C/Dは別対策。','AIF: Domain5（ネットワーク/アクセス制御）と、bedrockで外部ツール呼び出しを制限する考え方が一致する。',ARRAY['ssrf','network_allowlist','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',2,'テンプレートにユーザ入力を埋め込む際にXSSを防ぐ実装として適切なものはどれか。','[{"key":"A","text":"出力時にコンテキストに応じて自動エスケープするテンプレート機構を使う"},{"key":"B","text":"入力の長さだけ制限する"},{"key":"C","text":"HTTPをHTTPSに変更する"},{"key":"D","text":"セッションIDを固定する"}]'::jsonb,'A','Aが正解。出力エスケープ/自動エスケープが本筋。Bは不十分、Cは盗聴対策、Dは逆に危険で無関係。','AIF: generative_aiでLLM出力をUIに表示する際は、OWASP LLM05（Improper Output Handling）として説明できる。',ARRAY['xss','template_escaping','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',3,'一時ファイルを扱う処理でTOCTOU（競合）による改ざんを防ぐ実装として適切なものはどれか。','[{"key":"A","text":"存在確認してから同名ファイルを作成する"},{"key":"B","text":"排他作成（O_EXCL）や安全なmkstemp等で一意に作成する"},{"key":"C","text":"ログを取らない"},{"key":"D","text":"TLSを無効化する"}]'::jsonb,'B','Bが正解。存在確認→作成は競合で差し替えられる。排他作成や安全APIで防ぐ。Cは追跡不能、Dは危険で無関係。','AIF: Domain5で監査/統制を学ぶと、ローカルでも「安全な実行環境」が重要と説明できる。',ARRAY['toctou','file_security','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',3,'JWTを用いた認可で重大な脆弱性となり得る実装はどれか。','[{"key":"A","text":"署名アルゴリズムを固定し検証し、鍵も適切に管理する"},{"key":"B","text":"署名検証を省略し、ペイロードだけを信頼する"},{"key":"C","text":"署名検証に失敗したら拒否する"},{"key":"D","text":"トークンの有効期限を検査する"}]'::jsonb,'B','Bが正解。署名検証なしは改ざんトークンを受理し認可破綻する。A/C/Dは基本的な検証であり脆弱性そのものではない。','AIF: sdkでIAM/JWT系（Cognito等）を扱う際も、署名検証と鍵管理（crypto）が前提になる。',ARRAY['jwt','authorization','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','coding',3,'不信な入力に対するデシリアライゼーション（復元）でRCEが起き得る。対策として適切なものはどれか。','[{"key":"A","text":"任意オブジェクトの復元を許可し、例外処理で握りつぶす"},{"key":"B","text":"安全なフォーマット（JSON等）を使い、型/フィールドを許可リストで制限する"},{"key":"C","text":"TLSを無効化する"},{"key":"D","text":"DMARCを導入する"}]'::jsonb,'B','Bが正解。任意オブジェクト復元は危険で、型制限・安全フォーマットへ移行が有効。Aは危険、C/Dは無関係。','AIF: generative_aiでツール入力（構造化データ）を扱う場合も、型の許可リストが実務上重要。',ARRAY['deserialization','rce','secure_coding']);

-- SC: crypto (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',1,'共通鍵暗号方式の主な特徴として適切なものはどれか。','[{"key":"A","text":"暗号化と復号で別々の鍵を使う"},{"key":"B","text":"暗号化と復号で同一の鍵を使う"},{"key":"C","text":"公開鍵でしか復号できない"},{"key":"D","text":"電子署名を生成する方式である"}]'::jsonb,'B','Bが正解。共通鍵は同一鍵で暗号化/復号する。A/Cは公開鍵暗号の説明、Dは用途が署名で暗号方式とは別概念。','AIF: sdkでKMSのデータ暗号化やエンベロープ暗号を理解すると共通鍵の使い所が整理できる。',ARRAY['symmetric_crypto','crypto_basics','key_management']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',1,'電子署名が主に提供するセキュリティ特性はどれか。','[{"key":"A","text":"機密性"},{"key":"B","text":"完全性と否認防止"},{"key":"C","text":"可用性"},{"key":"D","text":"通信の低遅延化"}]'::jsonb,'B','Bが正解。署名は改ざん検知（完全性）と署名者否認の抑止に寄与する。機密性は暗号化、可用性/遅延は別問題。','AIF: Domain5で認証/監査の基礎としてPKIや証明書の役割（acm/kms）と関連付けできる。',ARRAY['digital_signature','pki','non_repudiation']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',2,'TLS利用時にサーバ証明書検証として適切なものはどれか。','[{"key":"A","text":"証明書のCN/SANと接続先ホスト名の一致を確認する"},{"key":"B","text":"証明書の拡張領域は無視する"},{"key":"C","text":"暗号化されていれば検証は不要である"},{"key":"D","text":"自己署名証明書でも常に信頼する"}]'::jsonb,'A','Aが正解。真正な相手確認にはホスト名検証と信頼連鎖が必要。B/C/DはMITMを許しやすく不適切。','AIF: Domain5でIAMだけでなく通信の信頼（TLS）も範囲。Bedrock等のAPI利用でも同様。',ARRAY['tls','certificate_validation','mitm']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',2,'前方秘匿性（PFS）を実現する鍵交換として適切なものはどれか。','[{"key":"A","text":"RSA鍵交換（固定鍵）"},{"key":"B","text":"（EC）DHEなど一時鍵を用いる方式"},{"key":"C","text":"平文で鍵を送付する方式"},{"key":"D","text":"同一パスワードを共有する方式"}]'::jsonb,'B','Bが正解。一時鍵（DHE/ECDHE）により長期鍵漏えい後も過去セッションが守られる。A/C/DはPFSを満たさない。','AIF: sdkでKMS等の鍵管理を学ぶ際、長期鍵と一時鍵の役割分担として理解が深まる。',ARRAY['pfs','key_exchange','tls']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',2,'AEAD（認証付き暗号）の利点として適切なものはどれか。','[{"key":"A","text":"暗号化だけで改ざん検知が不要になる"},{"key":"B","text":"機密性と完全性（認証）を同時に提供できる"},{"key":"C","text":"公開鍵暗号より必ず安全である"},{"key":"D","text":"暗号鍵が不要になる"}]'::jsonb,'B','Bが正解。AEADは暗号化と認証（改ざん検知）を一体で扱える。Aは誤り、Cは比較対象不適切、Dはあり得ない。','AIF: Domain5でデータ保護を扱う際、暗号化だけでなく改ざん検知も必要と説明できる。',ARRAY['aead','integrity','crypto']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',2,'PKIにおける認証局（CA）の役割として適切なものはどれか。','[{"key":"A","text":"利用者の秘密鍵を生成して配布する"},{"key":"B","text":"公開鍵と主体情報を結び付けた証明書を発行し、信頼連鎖を提供する"},{"key":"C","text":"通信内容を必ず暗号化する"},{"key":"D","text":"DDoSを防ぐ"}]'::jsonb,'B','Bが正解。CAは証明書発行で公開鍵の真正性を担保する。Aは秘密鍵共有で危険、CはTLS等の用途、Dは可用性対策。','AIF: sdkのACM（証明書管理）やDomain5のアイデンティティ管理と関連する。',ARRAY['pki','certificate_authority','trust_chain']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',2,'暗号鍵生成における弱い乱数のリスクとして適切なものはどれか。','[{"key":"A","text":"暗号化が高速になる"},{"key":"B","text":"鍵が推測され、暗号や署名が破られる可能性が高まる"},{"key":"C","text":"証明書の有効期限が延びる"},{"key":"D","text":"TLSが自動的に強化される"}]'::jsonb,'B','Bが正解。乱数が弱いと鍵が推測され暗号強度が崩れる。A/C/Dは因果が逆または無関係。','AIF: sdkでKMS等を使う場合も、鍵生成はサービス側で安全に行う設計が基本。',ARRAY['randomness','key_generation','crypto_risk']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',3,'TLSのダウングレード攻撃への対策として適切なものはどれか。','[{"key":"A","text":"古いTLS/暗号スイートも互換性のため常に許可する"},{"key":"B","text":"安全でないプロトコル/暗号を無効化し、必要に応じHSTS等を用いる"},{"key":"C","text":"平文HTTPへ戻す"},{"key":"D","text":"証明書検証を省略する"}]'::jsonb,'B','Bが正解。弱いバージョンへの誘導を防ぐには脆弱設定を切り捨てる。A/C/Dは攻撃成功を助長する。','AIF: Domain5でのセキュリティベースライン（暗号設定）として頻出。',ARRAY['tls_downgrade','crypto_policy','secure_transport']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',3,'エンベロープ暗号（KMS等）に関する説明として適切なものはどれか。','[{"key":"A","text":"データは常にKMSのマスター鍵で直接暗号化する"},{"key":"B","text":"データ鍵で暗号化し、データ鍵はマスター鍵で暗号化して保護する"},{"key":"C","text":"秘密鍵を利用者へ配布してから暗号化する"},{"key":"D","text":"暗号化は不要で署名だけでよい"}]'::jsonb,'B','Bが正解。大容量データはデータ鍵、鍵はKMS等で保護する。Aは非効率、Cは鍵漏えい面が増える、Dは機密性を満たさない。','AIF: sdk（AWS KMS）で実装として学ぶと、SCの暗号/鍵管理問題が解きやすくなる。',ARRAY['envelope_encryption','aws_kms','key_management']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','crypto',3,'耐量子暗号（PQC）に関する説明として適切なものはどれか。','[{"key":"A","text":"量子計算機により安全性が必ず低下する暗号である"},{"key":"B","text":"量子計算機による既存公開鍵暗号への脅威を考慮し設計された暗号方式群である"},{"key":"C","text":"共通鍵暗号はすべて無効になる"},{"key":"D","text":"ハッシュ関数は不要になる"}]'::jsonb,'B','Bが正解。PQCは量子計算機の影響を考慮した方式群。A/C/Dは極端で誤り。共通鍵も鍵長設計などが論点になる。','AIF: Domain5の暗号/コンプライアンス議論で"長期機密"をどう守るかの話題として関連付け可能。',ARRAY['pqc','cryptography','future_security']);

-- SC: management (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',1,'ISMS（情報セキュリティマネジメントシステム）の目的として適切なものはどれか。','[{"key":"A","text":"ファイアウォールを導入すること"},{"key":"B","text":"リスクに基づきPDCAで継続的に情報セキュリティを改善すること"},{"key":"C","text":"暗号鍵を公開すること"},{"key":"D","text":"システム停止をゼロにすること"}]'::jsonb,'B','Bが正解。ISMSは管理策を継続改善する仕組み。Aは手段の一つ、Cは危険、Dは目標設定として現実的でない。','AIF: Domain5（ガバナンス/コンプライアンス）でAIソリューションにも同様の管理サイクルが必要と説明できる。',ARRAY['isms','risk_management','governance']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',1,'インシデント対応の初動として最も適切な行動はどれか。','[{"key":"A","text":"原因究明より先に全ログを削除する"},{"key":"B","text":"影響範囲を把握し封じ込め（隔離/停止）と証跡保全を行う"},{"key":"C","text":"SNSで詳細を公開する"},{"key":"D","text":"再発防止策だけを先に作成する"}]'::jsonb,'B','Bが正解。初動は封じ込めと証跡保全が重要。A/Cは被害拡大や調査不能、Dは順序が逆。','AIF: Domain5でも監査/記録（CloudTrail等）とインシデント対応の基本が問われうる。',ARRAY['incident_response','forensics','security_ops']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',2,'リスクアセスメントで行う「リスク特定」に最も近い作業はどれか。','[{"key":"A","text":"資産・脅威・脆弱性の洗い出しと関係付けを行う"},{"key":"B","text":"暗号方式を選定する"},{"key":"C","text":"ログを削除する"},{"key":"D","text":"モデル精度を改善する"}]'::jsonb,'A','Aが正解。特定は資産・脅威・脆弱性の列挙と関連付け。Bは対策設計、Cは不適切、Dはセキュリティ管理の作業ではない。','AIF: responsible_ai/Domain5でもAIリスク（データ/モデル/運用）を整理する枠組みとして転用できる。',ARRAY['risk_assessment','threat_modeling','management']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',2,'BCPとDR（災害復旧）の関係として適切なものはどれか。','[{"key":"A","text":"BCPは主にIT復旧だけを対象とする"},{"key":"B","text":"DRはBCPの一部としてITシステムの復旧に焦点を当てる"},{"key":"C","text":"DRは暗号方式の一種である"},{"key":"D","text":"BCPはログ削除手順である"}]'::jsonb,'B','Bが正解。BCPは事業継続全体、DRはIT復旧の要素。Aは狭すぎ、C/Dは誤り。','AIF: Domain5で可用性と災害対策（マルチAZ/バックアップ等）を扱う際に整合する。',ARRAY['bcp','disaster_recovery','availability']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',2,'監査ログ設計として不適切なものはどれか。','[{"key":"A","text":"アクセス権を最小化し、改ざん検知/防止を考慮する"},{"key":"B","text":"保持期間や目的を定め、機密情報はマスキング方針を持つ"},{"key":"C","text":"不正が困るのでログを一切取得しない"},{"key":"D","text":"重要操作は誰がいつ実行したか追跡可能にする"}]'::jsonb,'C','Cが不適切。ログがなければ検知/調査/説明責任が成立しない。A/B/Dは監査可能性を高める適切な設計。','AIF: sdkのCloudTrailやDomain5のガバナンスで監査証跡は重要。',ARRAY['logging','audit','governance']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',2,'情報セキュリティポリシーの改定に際して考慮すべき事項として適切なものはどれか。','[{"key":"A","text":"技術動向や法令・規制、契約要求の変化を反映する"},{"key":"B","text":"暗号鍵を全社員へ配布する"},{"key":"C","text":"例外を増やして運用を楽にする"},{"key":"D","text":"記録を残さず口頭で周知する"}]'::jsonb,'A','Aが正解。外部環境や要求事項の変化を反映してレビューする。Bは危険、Cは統制低下、Dは証跡が残らず不適切。','AIF: Domain5でAIのセキュリティ/コンプライアンスは更新が速く、ポリシー改定の重要性が共通。',ARRAY['policy','compliance','security_management']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',2,'個人情報を取り扱うシステムでの基本的な対策として適切なものはどれか。','[{"key":"A","text":"目的外利用を許可し利便性を優先する"},{"key":"B","text":"アクセス制御・暗号化・ログ・マスキング等で最小化し、取扱いを記録する"},{"key":"C","text":"PIIをログに全文保存しておく"},{"key":"D","text":"権限管理は不要である"}]'::jsonb,'B','Bが正解。最小化と統制（アクセス/暗号/ログ/マスキング）が基本。A/C/Dは漏えい・不正利用リスクを増やす。','AIF: bedrockのGuardrails（PIIフィルター）やsdkのMacie等とプライバシー対策を関連付けできる。',ARRAY['privacy','dlp','access_control']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',3,'委託先に開発・運用を委ねる場合の契約上のセキュリティ要求として適切なものはどれか。','[{"key":"A","text":"委託先のログは取得しないことを要求する"},{"key":"B","text":"責任分界、監査権、インシデント報告SLA、再委託管理、データ取扱いを明確化する"},{"key":"C","text":"暗号鍵を委託先へ平文で送る"},{"key":"D","text":"対策は委託先任せで条項にしない"}]'::jsonb,'B','Bが正解。供給網リスクに備え、責任分界と監査・報告・再委託・データ取扱いを契約で縛る。A/C/Dは統制不十分。','AIF: Domain5でガバナンス/コンプライアンス、bedrock利用でも責任分界（Shared Responsibility）が重要。',ARRAY['third_party_risk','contract','governance']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',3,'ゼロトラスト/最小特権の考え方として適切なものはどれか。','[{"key":"A","text":"内部ネットワークは常に信頼する"},{"key":"B","text":"必要最小限の権限を付与し、継続的に検証・監視する"},{"key":"C","text":"全員に管理者権限を付与する"},{"key":"D","text":"ログは取得しない"}]'::jsonb,'B','Bが正解。常時検証と最小権限が核。A/C/Dは過剰信頼や統制放棄で不適切。','AIF: Domain5やbedrock（Agentsのアクショングループ/IAM最小権限）に直結する。',ARRAY['least_privilege','zero_trust','iam']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('SC','management',3,'システム監査で監査証拠として適切なものはどれか。','[{"key":"A","text":"担当者の口頭説明のみ"},{"key":"B","text":"アクセスログや変更履歴、設定エビデンスなど検証可能な記録"},{"key":"C","text":"推測に基づくメモ"},{"key":"D","text":"匿名の噂話"}]'::jsonb,'B','Bが正解。監査証拠は客観的に検証可能な記録が必要。A/C/Dは再現性や信頼性がなく証拠になりにくい。','AIF: sdkのCloudTrailやbedrockの評価/監査メトリクスなど、証跡の考え方が共通。',ARRAY['audit','evidence','logging']);

-- AIF: bedrock (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',1,'Amazon Bedrock Guardrailsの主な目的として適切なものはどれか。','[{"key":"A","text":"GPUの物理攻撃を防ぐ"},{"key":"B","text":"有害コンテンツやPIIなどをフィルタ/マスクして生成AIアプリを保護する"},{"key":"C","text":"学習データを自動生成する"},{"key":"D","text":"DDoSを完全に防ぐ"}]'::jsonb,'B','Bが正解。Guardrailsは有害/拒否トピック/単語/機密情報などのフィルタで安全性を高める。A/Dは別対策、Cは目的が違う。','SC: ai_threatのprompt injection/漏えい対策で、入力・出力の統制（ガードレール/承認）が頻出。',ARRAY['bedrock','guardrails','responsible_ai']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',1,'Amazon Bedrock Knowledge Basesの説明として適切なものはどれか。','[{"key":"A","text":"ファインチューニングだけを提供する機能である"},{"key":"B","text":"自社データを用いたRAGを構築し、検索結果を基に応答生成を支援する"},{"key":"C","text":"画像認識だけを行うサービスである"},{"key":"D","text":"OSの脆弱性スキャンを行う"}]'::jsonb,'B','Bが正解。Knowledge BasesはRAGで独自データを検索し応答生成に活用する。Aは別概念、C/Dは用途が異なる。','SC: ai_threatの「ベクトル/埋め込み弱点」や、managementのデータ管理（投入データ統制）と相互に学べる。',ARRAY['knowledge_bases','rag','bedrock']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',2,'Amazon Bedrock GuardrailsのContent filtersで扱うカテゴリに含まれるものはどれか。','[{"key":"A","text":"Hate/Insults/Sexual/Violence/Misconduct/Prompt Attack"},{"key":"B","text":"SQLi/XSS/CSRF/SSRF"},{"key":"C","text":"RSA/ECDSA/AES/SHA-256"},{"key":"D","text":"EC2/S3/VPC/Route 53"}]'::jsonb,'A','Aが正解。Guardrailsは有害カテゴリとPrompt Attack等をフィルタできる。BはWeb脆弱性分類、Cは暗号、Dは基盤サービスで別。','SC: ai_threat（Prompt Injection）と直結。Guardrailsを"入力/出力境界"として説明すると効果的。',ARRAY['guardrails','content_filters','prompt_attack']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',2,'Bedrock Guardrailsでプロンプト攻撃検出を行う際、開発者指示とユーザ入力を区別するために用いる仕組みはどれか。','[{"key":"A","text":"ユーザ入力に入力タグを付与して評価対象を限定する"},{"key":"B","text":"システムプロンプトをユーザへ公開する"},{"key":"C","text":"温度（temperature）を上げる"},{"key":"D","text":"HTTPを平文化する"}]'::jsonb,'A','Aが正解。入力タグでユーザ入力のみを評価し、開発者指示を誤検知から守る。B/Dは危険、Cは品質調整で無関係。','SC: ai_threat（prompt injection）で「指示階層」を説明し、技術対策としてタグ付け/承認を提示できる。',ARRAY['prompt_injection','guardrails','bedrock']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',2,'Amazon Bedrock Agentsのアクショングループ（action group）の説明として適切なものはどれか。','[{"key":"A","text":"モデルの学習データを格納する領域である"},{"key":"B","text":"エージェントが実行できるAPI/アクションを定義する単位である"},{"key":"C","text":"暗号鍵を保管する仕組みである"},{"key":"D","text":"画像のみを生成する機能である"}]'::jsonb,'B','Bが正解。アクショングループはエージェントが呼べるアクション（API）を定義する。A/C/Dは別機能。','SC: management（最小権限/承認）やai_threat（過剰な自律）と関連し、ツール許可範囲が事故半径を決める。',ARRAY['bedrock_agents','action_groups','tool_use']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',2,'Amazon Bedrock Agentsの既定のオーケストレーション戦略として説明されているものはどれか。','[{"key":"A","text":"ReAct（Reason and Action）"},{"key":"B","text":"単一プロンプトのみで完結する方式"},{"key":"C","text":"常に検索（RAG）を先に実行する方式"},{"key":"D","text":"暗号処理のみを行う方式"}]'::jsonb,'A','Aが正解。既定はReAct（Reason and Action）として説明される。B/C/Dは固定的で誤り。','SC: ai_threatでReAct型エージェントはツール誤実行が危険と説明し、承認・隔離の必要性を示せる。',ARRAY['react','bedrock_agents','orchestration']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',2,'ApplyGuardrail APIの説明として適切なものはどれか。','[{"key":"A","text":"基盤モデルを必ず呼び出して結果を生成するAPIである"},{"key":"B","text":"基盤モデルを呼ばずに、設定済みGuardrailsで任意テキストを評価できる"},{"key":"C","text":"S3の暗号化設定を変更するAPIである"},{"key":"D","text":"RDSのバックアップを取得するAPIである"}]'::jsonb,'B','Bが正解。ApplyGuardrailはモデル推論なしでテキストを評価できる。A/C/Dは別機能。','SC: coding（入力/出力検証）と同型。ツール入出力の検査ポイントとして説明できる。',ARRAY['apply_guardrail','guardrails','api']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',3,'Bedrock AgentsにGuardrailsを関連付けた場合の適用範囲として最も適切なものはどれか。','[{"key":"A","text":"ユーザ入力と最終回答に適用され、ツール入出力は既定では通らない"},{"key":"B","text":"ツール入出力にのみ適用される"},{"key":"C","text":"学習データにのみ適用される"},{"key":"D","text":"ネットワーク通信の暗号化を自動設定する"}]'::jsonb,'A','Aが正解。エージェント実装ではツール入出力が既定でGuardrails対象外となり得る。B/C/Dは誤り。','SC: ai_threat（間接プロンプト注入）で「ツール出力が注入面」になり得る点と結び付け、追加検査（ApplyGuardrail等）を提案。',ARRAY['agents','guardrails','tool_security']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',3,'Bedrock Guardrailsのコンテキストグラウンディングチェックについて正しいものはどれか。','[{"key":"A","text":"会話型チャットボット用途（Conversational QA）も常にサポートする"},{"key":"B","text":"要約・言い換え・質問応答が主な対象で、会話型QAはサポート外とされる"},{"key":"C","text":"暗号鍵のローテーションを行う"},{"key":"D","text":"EC2のオートスケールを設定する"}]'::jsonb,'B','Bが正解。対象ユースケースが限定されるため設計時に注意が必要。Aは誤り、C/Dは別機能。','SC: managementで"対策の適用範囲/制限"を押さえる姿勢が重要。生成AIでは誤用が事故原因。',ARRAY['contextual_grounding','hallucination','guardrails']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','bedrock',3,'Amazon Bedrock evaluationsの説明として適切なものはどれか。','[{"key":"A","text":"Bedrockの評価はコスト最適化だけを行う"},{"key":"B","text":"モデルやKnowledge Baseの有効性を評価し、semantic robustnessや検索/生成の正しさ等を測れる"},{"key":"C","text":"WAFルールを生成する"},{"key":"D","text":"IAMユーザを自動作成する"}]'::jsonb,'B','Bが正解。評価でモデルやRAGの品質（頑健性/検索の正しさ等）を測る。A/C/Dは誤り。','SC: ai_threat（頑健性）やmanagement（監査/継続改善）とつなげ、評価→改善のサイクルで教える。',ARRAY['model_evaluation','robustness','bedrock']);

-- AIF: responsible_ai (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',1,'責任あるAI（Responsible AI）の特徴として適切なものはどれか。','[{"key":"A","text":"公平性・安全性・プライバシーなどのリスクを考慮して設計/運用する"},{"key":"B","text":"モデル精度だけを最大化し他の要件は無視する"},{"key":"C","text":"ログを残さず説明責任を回避する"},{"key":"D","text":"個人情報を学習データに無制限に投入する"}]'::jsonb,'A','Aが正解。責任あるAIは公平性・安全性・プライバシー等を含む。B/C/Dは社会的・法的リスクを増やし不適切。','SC: managementでリスク管理/法令・プライバシーを扱うため、責任あるAIの統制（規程・監査）と相互補完。',ARRAY['responsible_ai','fairness','privacy']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',1,'バイアス検出や説明可能性（Explainability）の把握に用いられるAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon SageMaker Clarify"},{"key":"B","text":"Amazon Route 53"},{"key":"C","text":"Amazon CloudFront"},{"key":"D","text":"Amazon SQS"}]'::jsonb,'A','Aが正解。Clarifyはバイアス検出や説明可能性の分析に用いられる。B/C/Dはネットワーク/配信/キューで用途が違う。','SC: management（監査・説明責任）で、AIの透明性確保の具体例としてClarify/Model Cardsを紹介できる。',ARRAY['sagemaker_clarify','bias','explainability']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',2,'説明可能なAI（Explainable AI）の目的として最も適切なものはどれか。','[{"key":"A","text":"モデルの推論根拠を理解・評価できるようにする"},{"key":"B","text":"暗号鍵を短くして高速化する"},{"key":"C","text":"DDoSを防ぐ"},{"key":"D","text":"学習データを削除する"}]'::jsonb,'A','Aが正解。説明可能性は判断理由の理解・監査・改善に役立つ。B/C/Dは目的が異なる。','SC: management（監査/説明責任）と直結。モデルの説明はインシデント調査にも有効。',ARRAY['explainability','auditability','responsible_ai']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',2,'データセットの偏りが不公平な出力を招く際の対策として適切なものはどれか。','[{"key":"A","text":"代表性・多様性を考慮したデータ収集と評価を行う"},{"key":"B","text":"偏りを隠すためログを取得しない"},{"key":"C","text":"モデルの温度を上げる"},{"key":"D","text":"秘密鍵をソースに埋め込む"}]'::jsonb,'A','Aが正解。偏りはデータから生じるため代表性と評価が重要。B/Dは危険、Cは生成多様性で根本対策ではない。','SC: managementでリスク評価（影響×可能性）としてバイアスを扱い、是正計画を立てる点がシナジー。',ARRAY['dataset_bias','fairness','ml_governance']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',2,'GenAIのハルシネーション（誤情報）リスクを抑える設計として適切なものはどれか。','[{"key":"A","text":"根拠を示さず断定的に回答させる"},{"key":"B","text":"RAGや引用（citations）、ガードレール等で根拠と制約を設ける"},{"key":"C","text":"ログを削除して追跡不能にする"},{"key":"D","text":"証明書検証を省略する"}]'::jsonb,'B','Bが正解。根拠提示や制約（RAG/引用/ガードレール）で誤情報を減らす。A/C/Dは品質低下・統制欠如を招く。','SC: ai_threatのmisinformation（OWASP LLM09）やmanagementの監査・品質管理と結び付く。',ARRAY['hallucination','citations','responsible_ai']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',2,'プライバシー保護の観点で、生成AIアプリに対して適切な対策はどれか。','[{"key":"A","text":"PIIをそのまま入力し、出力もログに全文保存する"},{"key":"B","text":"PII最小化、マスキング/赤塗り、アクセス制御を行う（例：GuardrailsのPIIフィルタ）"},{"key":"C","text":"パスワードをハードコードする"},{"key":"D","text":"HTTPを平文化する"}]'::jsonb,'B','Bが正解。PII最小化と統制（フィルタ/マスキング/権限）が基本。A/C/Dは漏えい・不正アクセスを助長。','SC: management（個人情報保護/ログ方針）と直結し、対策を制度・技術の両面で説明できる。',ARRAY['privacy','pii_redaction','guardrails']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',2,'人間参加型のレビュー（Human-in-the-loop）を支援するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon Augmented AI（Amazon A2I）"},{"key":"B","text":"Amazon SNS"},{"key":"C","text":"Amazon EBS"},{"key":"D","text":"Amazon VPC"}]'::jsonb,'A','Aが正解。A2Iは人間レビューを組み込むためのサービス。B/C/Dは通知/ストレージ/ネットワークで用途が違う。','SC: managementの承認ワークフロー（人手確認）と同型で、AIの過剰自律（OWASP LLM06）対策として説明できる。',ARRAY['human_in_the_loop','a2i','governance']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',3,'説明可能性（解釈容易性）とモデル性能のトレードオフに対する実務的な対応として適切なものはどれか。','[{"key":"A","text":"説明可能性が不要なのでブラックボックスに統一する"},{"key":"B","text":"用途に応じて説明可能なモデル/手法や説明ツールを併用し、影響の大きい判断は追加レビューする"},{"key":"C","text":"ログを削除する"},{"key":"D","text":"秘密鍵を共有する"}]'::jsonb,'B','Bが正解。用途・リスクに応じ説明可能性を確保し、重要判断は追加統制する。A/C/Dは統制不足や危険行為。','SC: management（リスクに応じた統制）と一致。重要業務ほど承認・監査を厚くする。',ARRAY['explainability','risk_based','governance']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',3,'本番運用でバイアスや品質のドリフトを継続監視する仕組みとして適切なものはどれか。','[{"key":"A","text":"SageMaker Model MonitorやClarifyのモニタリングで定期評価する"},{"key":"B","text":"学習後は一切監視しない"},{"key":"C","text":"暗号鍵を短くする"},{"key":"D","text":"HTTPを平文化する"}]'::jsonb,'A','Aが正解。本番は分布変化が起きるため継続監視が重要。Bは事故を見逃す。C/Dは無関係で危険。','SC: managementの継続的改善（PDCA）と同じ発想。監査ログと合わせ運用統制を説明できる。',ARRAY['model_monitor','drift','responsible_ai']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','responsible_ai',3,'生成AI利用で想定される法的リスクとして適切なものはどれか。','[{"key":"A","text":"知的財産権侵害の申し立て、偏った出力、顧客の信頼喪失などのリスク"},{"key":"B","text":"DNSSECが不要になるリスク"},{"key":"C","text":"TLSが自動的に無効化されるリスク"},{"key":"D","text":"暗号化が不要になるリスク"}]'::jsonb,'A','Aが正解。GenAIではIPや偏り、誤情報等の法的・社会的リスクがある。B/C/Dは誤りで因果関係がない。','SC: managementで契約/法令/コンプライアンス、ai_threatで誤情報（OWASP LLM09）と併せて説明できる。',ARRAY['legal_risk','ip','responsible_ai']);

-- AIF: ml_basics (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',1,'教師あり学習の説明として適切なものはどれか。','[{"key":"A","text":"正解ラベル付きデータで学習し、分類や回帰を行う"},{"key":"B","text":"ラベルなしデータでクラスタリングのみを行う"},{"key":"C","text":"学習なしで常に最適解を返す"},{"key":"D","text":"暗号鍵を生成する方法である"}]'::jsonb,'A','Aが正解。教師ありはラベルあり。Bは教師なし、Cは誤り、Dは暗号で無関係。','SC: managementで"学習データの品質"がリスクになる点、ai_threatでデータポイズニングと接続できる。',ARRAY['supervised_learning','ml_basics','classification']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',1,'過学習（overfitting）の説明として適切なものはどれか。','[{"key":"A","text":"訓練データには高精度だが未知データで性能が落ちる状態"},{"key":"B","text":"データ数が増えるほど必ず起きる現象"},{"key":"C","text":"暗号化により性能が上がる状態"},{"key":"D","text":"推論時間が短い状態"}]'::jsonb,'A','Aが正解。過学習は汎化性能の低下。Bは誤り、C/Dは別概念。','SC: managementでリスク（誤判定の影響）を評価し、運用監視（監査）と結び付けると効果的。',ARRAY['overfitting','generalization','ml_basics']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',2,'不均衡データの二値分類で「陽性の取りこぼし」を減らしたい。重視すべき指標はどれか。','[{"key":"A","text":"再現率（Recall）"},{"key":"B","text":"適合率（Precision）"},{"key":"C","text":"単純正解率（Accuracy）"},{"key":"D","text":"推論レイテンシ"}]'::jsonb,'A','Aが正解。取りこぼし（FN）を減らすにはRecall重視。Precisionは誤検知寄り、Accuracyは不均衡で誤解しやすい、Dは品質指標でない。','SC: managementで誤検知/取りこぼしの業務影響（リスク）を評価する話につながる。',ARRAY['recall','metrics','imbalanced_data']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',2,'適合率（Precision）の説明として適切なものはどれか。','[{"key":"A","text":"実際の陽性のうち正しく陽性と判定した割合"},{"key":"B","text":"陽性と判定したもののうち実際に陽性だった割合"},{"key":"C","text":"全サンプルのうち誤分類した割合"},{"key":"D","text":"学習データに含まれる割合"}]'::jsonb,'B','Bが正解。PrecisionはTP/(TP+FP)。AはRecall、C/Dは別。','SC: threat検知（IDS/WAF等）でも誤検知とPrecisionの考え方が共通。',ARRAY['precision','metrics','ml_basics']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',2,'学習データ・検証データ・テストデータの分割の目的として適切なものはどれか。','[{"key":"A","text":"未知データでの汎化性能を評価し、過学習を検知する"},{"key":"B","text":"暗号鍵を更新する"},{"key":"C","text":"WAFルールを生成する"},{"key":"D","text":"メール認証を強化する"}]'::jsonb,'A','Aが正解。分割で汎化性能評価と過学習検知を行う。B/C/Dは無関係。','SC: managementで「検証できないものは運用できない（監査）」という考え方と一致。',ARRAY['train_test_split','validation','ml_basics']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',2,'データリーク（data leakage）の例として適切なものはどれか。','[{"key":"A","text":"テストデータの情報が特徴量として学習に混入し、見かけ上高精度になる"},{"key":"B","text":"温度を上げて多様な出力にする"},{"key":"C","text":"CloudTrailを有効化する"},{"key":"D","text":"TLSを有効化する"}]'::jsonb,'A','Aが正解。未来情報やテスト情報の混入で評価が歪む。B/C/Dは別。','SC: managementで不正確な評価はリスク（誤導入）につながると説明できる。',ARRAY['data_leakage','evaluation','ml_basics']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',2,'ML開発ライフサイクルに含まれる工程として適切なものはどれか。','[{"key":"A","text":"データ収集→前処理→学習→評価→デプロイ→監視"},{"key":"B","text":"暗号鍵配布→鍵削除→終了"},{"key":"C","text":"DNSSEC導入→DMARC導入→終了"},{"key":"D","text":"WAF導入→IPS導入→終了"}]'::jsonb,'A','Aが正解。MLはデプロイ後の監視まで含む。B/C/Dはセキュリティ運用の一部でライフサイクル全体ではない。','SC: managementの運用監視・継続改善（PDCA）と対応づけると理解しやすい。',ARRAY['ml_lifecycle','monitoring','ml_basics']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',3,'本番環境で入力分布が変化し精度が低下している可能性がある。対策として適切なものはどれか。','[{"key":"A","text":"モデルの入力/出力を監視してドリフト検知し、必要に応じ再学習・再評価する"},{"key":"B","text":"監視は不要で放置する"},{"key":"C","text":"ログを削除する"},{"key":"D","text":"HTTPを平文化する"}]'::jsonb,'A','Aが正解。ドリフト監視と再評価が必要。Bは事故放置、Cは調査不能、Dは危険。','SC: managementの監査・インシデント対応（原因究明）と強く関連。',ARRAY['drift','monitoring','ml_operations']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',3,'バイアスが時間とともに変化（bias drift）する可能性がある。継続監視の考え方として適切なものはどれか。','[{"key":"A","text":"初回だけ評価し、その後は固定でよい"},{"key":"B","text":"ベースライン作成後、定期モニタリングと閾値超過時の通知/対応を行う"},{"key":"C","text":"秘密鍵を共有する"},{"key":"D","text":"TLSを無効化する"}]'::jsonb,'B','Bが正解。ベースライン→定期監視→アラートが運用の基本。A/C/Dは不適切。','SC: managementのリスク対応計画（残留リスク含む）として説明できる。',ARRAY['bias_drift','monitoring','responsible_ai']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','ml_basics',3,'次のうち、モデル評価で「頑健性（robustness）」を説明する内容として最も適切なものはどれか。','[{"key":"A","text":"入力を少し変えても意味が変わらない範囲で出力が大きく崩れない性質"},{"key":"B","text":"暗号化方式の強度のこと"},{"key":"C","text":"DDoS耐性のこと"},{"key":"D","text":"メール認証のこと"}]'::jsonb,'A','Aが正解。小さな摂動に対する出力安定性が頑健性。B/C/Dは別領域。','SC: ai_threat（敵対的サンプル）と直結し、評価→対策（訓練/制限）を説明できる。',ARRAY['robustness','adversarial','ml_evaluation']);

-- AIF: generative_ai (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',1,'トークン（token）に関する説明として適切なものはどれか。','[{"key":"A","text":"入出力の単位であり、コストやレイテンシに影響し得る"},{"key":"B","text":"暗号鍵の種類である"},{"key":"C","text":"OSI参照モデルの層である"},{"key":"D","text":"DNSレコードの種別である"}]'::jsonb,'A','Aが正解。トークンはLLMの入出力単位で、課金/遅延に影響する。B/C/Dは無関係。','SC: ai_threatのコスト攻撃（Unbounded Consumption）を説明する基礎になる。',ARRAY['tokens','llm_basics','cost']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',1,'埋め込み（embeddings）の主な用途として適切なものはどれか。','[{"key":"A","text":"意味に基づく類似検索やRAGの検索段階で用いる"},{"key":"B","text":"TLSの鍵交換で用いる"},{"key":"C","text":"DDoSを防ぐ"},{"key":"D","text":"メールの送信元認証に用いる"}]'::jsonb,'A','Aが正解。埋め込みは意味的近さの検索に使われRAGの基礎。B/C/Dは別分野。','SC: ai_threatのベクトル/埋め込み弱点（OWASP LLM08）と直接つながる。',ARRAY['embeddings','semantic_search','rag']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',2,'RAGとファインチューニングの違いとして適切なものはどれか。','[{"key":"A","text":"RAGは外部データを検索して応答に反映し、ファインチューニングはモデル重みを更新する"},{"key":"B","text":"RAGはモデル重みを更新し、ファインチューニングは検索だけを行う"},{"key":"C","text":"両者は同義である"},{"key":"D","text":"RAGは暗号化方式の一種である"}]'::jsonb,'A','Aが正解。RAGは検索で文脈付与、FTは学習で重み更新。B/C/Dは誤り。','SC: managementでデータ統制（投入データ/学習データ）を分けて考える説明ができる。',ARRAY['rag','fine_tuning','generative_ai']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',2,'温度（temperature）を高く設定した場合の一般的な影響として適切なものはどれか。','[{"key":"A","text":"出力がより決定的になり、同じ応答になりやすい"},{"key":"B","text":"出力の多様性が増え、ランダム性が高まりやすい"},{"key":"C","text":"TLSが自動的に有効化される"},{"key":"D","text":"CSRFが防止される"}]'::jsonb,'B','Bが正解。temperatureを上げると多様性が増えがち。Aは低温側、C/Dは無関係。','SC: codingで生成物の検証（テスト/レビュー）が必要な理由として、非決定性を説明できる。',ARRAY['temperature','inference_parameters','prompting']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',2,'プロンプトエンジニアリングの手法として適切なものはどれか。','[{"key":"A","text":"例示（few-shot）や制約条件を明示して期待する形式を指定する"},{"key":"B","text":"秘密鍵をプロンプトに埋め込む"},{"key":"C","text":"ログを取得しない"},{"key":"D","text":"HTTPを平文化する"}]'::jsonb,'A','Aが正解。例示と制約で意図に沿いやすくする。B/C/Dは危険または無関係。','SC: ai_threatで"指示階層/漏えい"を説明し、秘密を入れない・検証するという統制につなげる。',ARRAY['prompt_engineering','few_shot','generative_ai']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',2,'コンテキスト長（入力/出力長の上限）を超えそうな長文資料を扱う設計として適切なものはどれか。','[{"key":"A","text":"全文を毎回そのまま投入する"},{"key":"B","text":"チャンク化し検索（RAG）で必要部分だけを投入する"},{"key":"C","text":"TLSを無効化する"},{"key":"D","text":"パスワードをハードコードする"}]'::jsonb,'B','Bが正解。長文は分割し検索で必要箇所のみ提示するのが一般的。Aは上限超過やコスト増、C/Dは危険。','SC: ai_threat（Unbounded Consumption）やmanagement（データ取り扱い）と関連。',ARRAY['context_length','chunking','rag']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',2,'LLMが誤情報をそれらしく生成するリスクに関するOWASP LLM Top 10:2025の項目として適切なものはどれか。','[{"key":"A","text":"LLM09:2025 Misinformation"},{"key":"B","text":"LLM03:2025 Supply Chain"},{"key":"C","text":"LLM06:2025 Excessive Agency"},{"key":"D","text":"LLM01:2025 Prompt Injection"}]'::jsonb,'A','Aが正解。誤情報生成はMisinformation。Bは供給網、Cは自律過剰、Dは注入で別。','SC: ai_threat/managementで誤情報をインシデントとして扱い、監査・根拠提示（RAG/引用）を徹底する。',ARRAY['owasp_llm09','misinformation','generative_ai']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',3,'RAGで参照するデータストアに悪意ある文書（指示文）を混入されるリスクへの対策として最も適切なものはどれか。','[{"key":"A","text":"データ投入元の検証、アクセス制御、監査、引用表示を行う"},{"key":"B","text":"誰でも自由に文書を登録できるようにする"},{"key":"C","text":"ログを削除する"},{"key":"D","text":"温度を上げる"}]'::jsonb,'A','Aが正解。投入元統制・権限・監査・引用で汚染を抑える。Bは危険、Cは調査不能、Dは無関係。','SC: ai_threat（Vector/Embedding Weaknesses）と直結し、データガバナンスを具体化できる。',ARRAY['rag_security','data_provenance','owasp_llm08']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',3,'生成AIの出力をそのままHTML/SQL/シェル等に埋め込む設計上のリスクとして最も近いOWASP LLM Top 10:2025はどれか。','[{"key":"A","text":"LLM05:2025 Improper Output Handling"},{"key":"B","text":"LLM10:2025 Unbounded Consumption"},{"key":"C","text":"LLM02:2025 Sensitive Information Disclosure"},{"key":"D","text":"LLM04:2025 Data and Model Poisoning"}]'::jsonb,'A','Aが正解。出力の検証/サニタイズ不足による二次被害が主題。B/C/Dは別リスク。','SC: coding（出力エスケープ/パラメータ化/コマンド実行対策）に直結し、両試験で相互強化できる。',ARRAY['owasp_llm05','output_handling','secure_coding']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','generative_ai',3,'基盤モデルの利用形態の評価として適切なものはどれか。','[{"key":"A","text":"評価は不要で、導入後に問題が出たら対応すればよい"},{"key":"B","text":"目的に応じて評価データを用意し、品質・頑健性・RAGの検索正しさ等を測定する"},{"key":"C","text":"ログを削除する"},{"key":"D","text":"HTTPを平文化する"}]'::jsonb,'B','Bが正解。導入前後で評価し、指標で改善する。A/C/Dは品質・統制を損なう。','SC: management（監査/継続改善）と同型。評価→是正のループを説明すると説得力が増す。',ARRAY['evaluation','robustness','model_quality']);

-- AIF: sdk (10問)
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',1,'画像やスキャン文書から文字情報を抽出（OCR）するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon Textract"},{"key":"B","text":"Amazon Polly"},{"key":"C","text":"Amazon Transcribe"},{"key":"D","text":"Amazon Kendra"}]'::jsonb,'A','Aが正解。Textractは文書からテキスト/構造を抽出する。Bは音声合成、Cは音声→文字、Dは検索で用途が違う。','SC: threatで取り扱う文書漏えい/改ざん対策や、managementの情報資産管理と結び付け可能。',ARRAY['textract','ocr','aws_ai_services']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',1,'文章の感情分析や固有表現抽出などNLPを提供するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon Comprehend"},{"key":"B","text":"Amazon Rekognition"},{"key":"C","text":"Amazon EC2"},{"key":"D","text":"Amazon S3"}]'::jsonb,'A','Aが正解。ComprehendはNLP（感情/エンティティ等）。Bは画像、C/Dは基盤で直接NLPではない。','SC: managementで個人情報（固有表現）を扱う際、DLP視点でNLP活用の注意点を議論できる。',ARRAY['comprehend','nlp','aws_ai_services']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',2,'音声をテキストに変換するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon Transcribe"},{"key":"B","text":"Amazon Translate"},{"key":"C","text":"Amazon Polly"},{"key":"D","text":"Amazon Macie"}]'::jsonb,'A','Aが正解。Transcribeは音声→文字。Bは翻訳、Cは音声合成、DはS3の機密データ検出で別。','SC: managementで通話記録のPII対策（ログ/マスキング）を扱う際、AIFのGuardrailsやDLPと接続できる。',ARRAY['transcribe','speech_to_text','aws_ai_services']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',2,'多言語翻訳を提供するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon Translate"},{"key":"B","text":"Amazon Lex"},{"key":"C","text":"Amazon Rekognition"},{"key":"D","text":"Amazon KMS"}]'::jsonb,'A','Aが正解。Translateは翻訳。Bは対話、Cは画像、Dは鍵管理で用途が違う。','SC: threatで多言語フィッシング文面が増える背景として「翻訳の容易化」を説明できる。',ARRAY['translate','language','aws_ai_services']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',2,'画像や動画のラベル検出などコンピュータビジョンを提供するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon Rekognition"},{"key":"B","text":"Amazon Comprehend"},{"key":"C","text":"Amazon RDS"},{"key":"D","text":"AWS IAM"}]'::jsonb,'A','Aが正解。Rekognitionは画像/動画分析。BはNLP、CはDB、Dは認証認可で別。','SC: ai_threatのディープフェイク対策議論で、検知/運用の限界と組織プロセス（management）を合わせて説明できる。',ARRAY['rekognition','computer_vision','aws_ai_services']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',2,'対話型ボット（意図/発話に基づく対話）を構築するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon Lex"},{"key":"B","text":"Amazon Polly"},{"key":"C","text":"Amazon Textract"},{"key":"D","text":"Amazon Kendra"}]'::jsonb,'A','Aが正解。Lexは対話（意図・スロット）。Bは音声合成、CはOCR、Dは検索。','SC: threatでチャットボットの認証/認可、入力検証、ログ方針（management）を議論する際に関連付け。',ARRAY['lex','chatbot','aws_ai_services']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',2,'暗号鍵の管理と暗号化/復号APIを提供するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"AWS Key Management Service（AWS KMS）"},{"key":"B","text":"Amazon Polly"},{"key":"C","text":"Amazon Comprehend"},{"key":"D","text":"Amazon CloudFront"}]'::jsonb,'A','Aが正解。KMSは鍵管理と暗号API。B/C/Dは別用途。','SC: crypto（鍵管理/エンベロープ暗号）と直結し、試験横断で得点源になる。',ARRAY['aws_kms','encryption','key_management']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',3,'S3内の機密情報（PIIなど）を検出するAWSサービスとして適切なものはどれか。','[{"key":"A","text":"Amazon Macie"},{"key":"B","text":"Amazon EFS"},{"key":"C","text":"Amazon ECS"},{"key":"D","text":"AWS Direct Connect"}]'::jsonb,'A','Aが正解。MacieはS3の機密データ検出に用いる。B/C/Dはストレージ/コンテナ/回線で別。','SC: management（DLP/個人情報）やai_threat（漏えい）と結び付けると理解が定着する。',ARRAY['macie','dlp','privacy']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',3,'AWS API呼び出しの監査ログを収集する代表的サービスとして適切なものはどれか。','[{"key":"A","text":"AWS CloudTrail"},{"key":"B","text":"Amazon Route 53"},{"key":"C","text":"Amazon Kendra"},{"key":"D","text":"Amazon Polly"}]'::jsonb,'A','Aが正解。CloudTrailはAPI監査ログ。BはDNS、Cは検索、Dは音声合成。','SC: management（監査証跡/改ざん防止）と直結。インシデント対応で必須。',ARRAY['cloudtrail','audit','governance']);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags)
VALUES ('AIF','sdk',3,'生成AIやML利用でコスト管理（予算超過抑止）を行う仕組みとして適切なものはどれか。','[{"key":"A","text":"AWS BudgetsやAWS Cost Explorerを用いて監視/アラートする"},{"key":"B","text":"HTTPを平文化する"},{"key":"C","text":"パスワードをハードコードする"},{"key":"D","text":"ログを削除する"}]'::jsonb,'A','Aが正解。予算・使用量の監視と通知でコスト事故を抑止する。B/C/Dは無関係で危険。','SC: ai_threat（Unbounded Consumption）やmanagement（運用監視）とシナジーが高い。',ARRAY['budgets','cost_management','governance']);
