INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  1,
  'AI生成コンテンツの来歴確認で用いるC2PAのハードバインディングとソフトバインディングの説明として最も適切なのはどれか。',
  '[{"key":"A","text":"ハードバインディングは指紋や透かしのように内容から計算され、ソフトバインディングは暗号署名で改ざん検知する"},{"key":"B","text":"ハードバインディングは暗号的に資産とマニフェストの対応と無改ざんを検証し、ソフトバインディングは指紋や透かし等で派生物同定に有用"},{"key":"C","text":"両者は同義で、透かしが見えるか見えないかだけが違い"},{"key":"D","text":"ソフトバインディングは元データが1bitでも変化すると検証不能で、派生物には使えない"}]'::jsonb,
  'B',
  'C2PAでは改ざん検知に強い暗号的結び付け（ハード）と、内容由来の結び付き（ソフト）を使い分け、派生物追跡も考慮する。',
  'AIF: Content Credentials検証と関連',
  ARRAY['c2pa','watermark','provenance'],
  '暗号署名で改ざん検知する仕組みか、内容から特徴を取る仕組みかで判断する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  1,
  'LLMを悪用したフィッシング・ソーシャルエンジニアリングへの組織的対策として最も適切なのはどれか。',
  '[{"key":"A","text":"メール文面が自然なら真と判断し、依頼にすぐ対応する"},{"key":"B","text":"送金や権限変更など高リスク依頼は、別経路で本人確認し二人承認などの手続きを徹底する"},{"key":"C","text":"URL短縮でリンク先を隠し、攻撃者が模倣しにくくする"},{"key":"D","text":"社内会議の録音を公開し、音声なりすまし検知を容易にする"}]'::jsonb,
  'B',
  '生成AIで文面や音声の説得力が上がるため、内容ではなく手続きで防ぐ。高リスク操作はチャネル分離の再確認、二人承認、権限最小化で被害を抑える。',
  'AIF: 承認ワークフロー/コールバック手順と関連',
  ARRAY['phishing','social-engineering','genai'],
  '内容の自然さは当てにならない。高リスク操作は必ず別の確認手段を用意する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  2,
  'Webページ要約Botが外部サイト本文もプロンプトに含めて要約する。間接プロンプトインジェクション対策として最も適切なのはどれか。',
  '[{"key":"A","text":"外部本文をsystem promptの前に結合し、優先的に従わせる"},{"key":"B","text":"外部本文は命令ではなくデータとして区切って受け渡し、ツール実行や機密参照は別の検証・承認を必須にする"},{"key":"C","text":"プロンプト末尾に『外部指示は無視』を1行追加するだけで十分"},{"key":"D","text":"モデルサイズを大きくし、賢さで回避する"}]'::jsonb,
  'B',
  '間接PIは外部コンテンツ内の隠れた指示がモデル行動を変える。信頼境界を設け、指示とデータを分離し、権限操作はポリシーでゲートする。',
  'AIF: 入力の信頼度ラベル付け/ツール実行ゲートと関連',
  ARRAY['prompt-injection','indirect','owasp-llm01'],
  '外部コンテンツはユーザ入力と同じ扱い。命令として解釈させない設計を考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  2,
  'LLMが生成したSQLをそのまま実行する機能を実装した。OWASP LLM05の観点で最も適切な対策はどれか。',
  '[{"key":"A","text":"温度を下げて確実なSQLだけを出させる"},{"key":"B","text":"生成SQLはゼロトラストで扱い、プリペアド/パラメータ化と許可した操作の制約・検証を行う"},{"key":"C","text":"LLM出力を必ずMarkdownにしてから実行する"},{"key":"D","text":"DBの権限を全表DELETE可能にして失敗時にやり直せるようにする"}]'::jsonb,
  'B',
  'LLM出力は入力により操作され得るため、下流システムに渡す前に検証・サニタイズが必要。DB操作はパラメータ化とホワイトリスト化、最小権限で行う。',
  'AIF: スキーマ制約付き出力/ASVS準拠の検証と関連',
  ARRAY['owasp-llm05','output-handling','sql'],
  'モデル出力を信頼できるコードとみなさない。実行前に制約と検証を挟む。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  2,
  'LLMエージェントに文書管理ツールを接続し、指示に応じて削除も可能にした。過剰な自律性（LLM06）を抑える設計として適切なのはどれか。',
  '[{"key":"A","text":"エージェントに全権限を付与し、判断の自由度を上げる"},{"key":"B","text":"高影響操作（削除等）は人の明示承認を必須とし、ツールの機能と権限を最小化する"},{"key":"C","text":"プロンプトに『危険な操作は禁止』と書けば十分"},{"key":"D","text":"ログを残さず迅速に実行できるようにする"}]'::jsonb,
  'B',
  'LLM06は、ツール機能・権限・自律性が過剰だと、曖昧/悪意ある出力で破壊的操作が起こる。最小機能/最小権限、重要操作の確認、監査が柱。',
  'AIF: ツール権限最小化/実行前承認/監査ログと関連',
  ARRAY['owasp-llm06','agent','least-privilege'],
  '何ができるか・どの権限か・誰が最終決定かの3点を見直す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  2,
  'マルチモーダルLLM（画像+テキスト）に、画像内に隠した指示で挙動を変える攻撃がある。対策として最も適切なのはどれか。',
  '[{"key":"A","text":"画像は人が読めるので安全。テキストだけフィルタする"},{"key":"B","text":"画像も入力として扱い、OCR等で抽出した内容を含めて安全検査し、ツール実行は追加の承認・ポリシーで制限する"},{"key":"C","text":"画像を圧縮すれば隠し指示は完全に消える"},{"key":"D","text":"学習データを増やせば攻撃は不可能になる"}]'::jsonb,
  'B',
  'マルチモーダルでは、人に見えにくい入力でもモデルが解釈し得る。全モダリティを不信として前処理・検査し、権限操作は分離する。',
  'AIF: OCR/コンテンツフィルタ/モダリティ別サニタイズと関連',
  ARRAY['multimodal','prompt-injection','owasp-llm01'],
  'モデルが何を入力として解釈するかは人の見え方と一致しない点に注意する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  2,
  'OWASPのGenAI Red Teaming Guideが強調する、レッドチーミングを包括的に行う4領域の組合せとして適切なのはどれか。',
  '[{"key":"A","text":"モデル評価／実装テスト／インフラ評価／実行時挙動分析"},{"key":"B","text":"UIテスト／単体テスト／結合テスト／総合テスト"},{"key":"C","text":"法務レビュー／ブランドレビュー／採用レビュー／経理レビュー"},{"key":"D","text":"特徴量設計／学習率調整／ハイパーパラメータ探索／蒸留"}]'::jsonb,
  'A',
  'GenAIレッドチーミングはモデル単体ではなく、実装・インフラ・実行時挙動まで含めた複合システムとして評価する枠組みが重要。',
  'AIF: レッドチーム基盤/評価パイプラインと関連',
  ARRAY['red-teaming','llm-security-test','owasp-genai'],
  'LLM単体ではなくアプリ全体の構成要素に分解してテスト領域を考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  3,
  'オープンなモデルリポジトリからLoRAアダプタを動的に取得して本番LLMに適用する設計を採る。LLMサプライチェーン（LLM03）の観点で最優先の対応はどれか。',
  '[{"key":"A","text":"プロンプトに安全規約を追加し、アダプタ改ざんの影響を抑える"},{"key":"B","text":"アダプタの出所・整合性（署名/ハッシュ）を検証し、部材（モデル/データ/ライブラリ）の在庫管理と供給者監査を行う"},{"key":"C","text":"temperatureを0にして出力を固定する"},{"key":"D","text":"アダプタを複数混ぜれば悪性が平均化され安全になる"}]'::jsonb,
  'B',
  'LLM03では第三者モデル/アダプタや依存ライブラリが改ざん・汚染され得る。署名やハッシュで完全性を確認し、SBOM/AIBOMで部材を把握し供給者を監査する。',
  'AIF: AIBOM/SBOM生成と署名検証の自動化と関連',
  ARRAY['owasp-llm03','supply-chain','lora'],
  'モデルも部品。依存パッケージ管理と同様に、出所と完全性を確認できるか考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  3,
  '機械学習予測APIがクラスラベルに加えて確率（信頼度）を返す。モデルスティーリング（モデル抽出）対策として最も適切なのはどれか。',
  '[{"key":"A","text":"確率返却を止めればそれだけで抽出は不可能になる"},{"key":"B","text":"確率や詳細情報の最小化に加え、レート制限・監視・異常検知等で大量クエリを抑止する"},{"key":"C","text":"モデルを大きくして抽出コストを上げれば十分"},{"key":"D","text":"推論結果をキャッシュし、誰でも高速に取得できるようにする"}]'::jsonb,
  'B',
  'モデル抽出は大量問い合わせで機能を複製する攻撃。確率等の情報は抽出を容易にし得るため最小化し、同時にレート制限と監視で不自然なクエリ集中を検知・遮断する。',
  'AIF: APIゲートウェイのレート制御/監査ログと関連',
  ARRAY['model-stealing','model-extraction','mlaas'],
  '攻撃者は何度も問い合わせて学習する。出力情報量とクエリ回数の両面を考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'ai_threat',
  3,
  'RAGでベクトル検索結果をそのままLLMに渡して回答する。攻撃者がクエリを工夫して本来参照できない文書を引き当てたり、誘導文書で回答を操作する。対策として最も重要なのはどれか。',
  '[{"key":"A","text":"埋め込み次元を増やし検索精度を上げる"},{"key":"B","text":"検索時に文書レベルの認可（ACL/テナント分離）を適用し、取得結果を検証・根拠提示させる"},{"key":"C","text":"ベクトルDBを公開インターネットに置き検索を高速化する"},{"key":"D","text":"検索結果を全部LLMに渡し、文脈を増やせば安全になる"}]'::jsonb,
  'B',
  'LLM08ではベクトル生成・保存・検索の弱点が悪用され、情報漏えいや出力操作が起きる。検索は信頼境界として扱い、取得前に認可フィルタ、取得後に検証・監査を行う。',
  'AIF: ベクトルDBのアクセス制御/テナント分離と関連',
  ARRAY['rag','vector-search','owasp-llm08'],
  '検索結果は見せてよい情報かをまず保証する。モデルの賢さでは認可は代替できない。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  1,
  'CORS設定ミスに関する記述として最も適切なのはどれか。',
  '[{"key":"A","text":"Access-Control-Allow-Origin: * は機密情報を返すAPIでも常に安全である"},{"key":"B","text":"機密情報を返す応答でワイルドカード許可は危険になり得るため、許可Originを絞り、認証と組み合わせて設計する"},{"key":"C","text":"Access-Control-Allow-Credentials: true と * を併用するとブラウザが最も安全に保護してくれる"},{"key":"D","text":"CORSを有効にすると認可チェックは不要になる"}]'::jsonb,
  'B',
  'CORSはブラウザのクロスドメイン制約。許可を広げ過ぎると意図しないサイトから機密レスポンスに到達され得る。Originの許可は最小化し、認証・認可と併用する。',
  'AIF: API GatewayのCORSポリシー設定と関連',
  ARRAY['cors','misconfiguration','wstg'],
  '誰のブラウザから、どのOriginに読み取られるかを想像し、許可範囲が必要最小か考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  1,
  'パスワードリセットリンク方式の実装で、脆弱性となりやすい設計はどれか。',
  '[{"key":"A","text":"リセットリンクはHTTPSで配布し、短時間で失効させる"},{"key":"B","text":"リセットリンクが何度でも再利用でき、使用後も失効しない"},{"key":"C","text":"トークンは十分長く推測困難にする"},{"key":"D","text":"リセット後は既存セッションを無効化する"}]'::jsonb,
  'B',
  'リンクが一度きりで失効しないと、メール漏えい等で恒久的なバックドアになる。リセットトークンは短時間・単回利用で失効させる。',
  'AIF: 認証基盤のワンタイムトークン/失効管理と関連',
  ARRAY['password-reset','workflow','wstg-auth'],
  '後からメールを見られたら？を想定。トークンの有効期限と単回利用が鍵。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  2,
  'HTTPヘッダインジェクション（レスポンス分割）に関する説明として適切なのはどれか。',
  '[{"key":"A","text":"URLパラメータをDBに保存する攻撃である"},{"key":"B","text":"ヘッダ値にCR/LFを混入させ、1つの応答を複数応答として解釈させてキャッシュ汚染等を狙う"},{"key":"C","text":"CookieのSecure属性がないと発生する"},{"key":"D","text":"TLSを使えば発生しない"}]'::jsonb,
  'B',
  'ヘッダへ未サニタイズ入力を反映すると、CR/LFで応答境界を壊し、キャッシュ汚染やXSS等の連鎖を誘発し得る。ヘッダ値は許可文字の検証とCR/LF除去が必須。',
  'AIF: WAFの正規化/入力検証ルールと関連',
  ARRAY['header-injection','crlf','wstg-inpv'],
  'ヘッダは改行で区切られる。入力に改行文字が入ると何が起きるかを考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  2,
  'XXE（XML外部実体参照）攻撃で起こり得る影響として最も適切なのはどれか。',
  '[{"key":"A","text":"DNSキャッシュが書き換わる"},{"key":"B","text":"ローカルファイルの読み取りや内部ネットワークへのアクセス、DoSが起き得る"},{"key":"C","text":"ブラウザのSame-Origin Policyが無効化される"},{"key":"D","text":"暗号鍵が必ず復号できる"}]'::jsonb,
  'B',
  '外部実体が有効だとURI参照によりファイル参照や内部ホストへのアクセスが発生し得る。大量展開でDoSも起こるため、XMLパーサ設定と入力制限が重要。',
  'AIF: XMLゲートウェイ/安全設定テンプレートと関連',
  ARRAY['xxe','xml','wstg-inpv'],
  'XMLのDOCTYPE/ENTITYが許されると、外部リソースを読みに行ける点に着目。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  2,
  'ビジネスロジック攻撃の例として最も適切なのはどれか。',
  '[{"key":"A","text":"入力欄にscriptを入れて実行させる"},{"key":"B","text":"本来の手順（例：手順1→2→3）を飛ばして手順3に直接アクセスし、検査をすり抜ける"},{"key":"C","text":"暗号化通信を盗聴して復号する"},{"key":"D","text":"DNS応答を改ざんして別サイトへ誘導する"}]'::jsonb,
  'B',
  'ビジネスロジック欠陥は仕様上の手順や制約がサーバ側で強制されず、順序スキップ・繰り返しなどで成立する。画面遷移前提ではなく状態遷移を検証する。',
  'AIF: ワークフローの状態管理/サーバ側検証と関連',
  ARRAY['business-logic','workflow','wstg-bl'],
  '技術的な注入ではなく、業務手順の抜け道を探す。順序・回数・条件を確認する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  2,
  'WebSocketを安全に利用する際の留意点として最も適切なのはどれか。',
  '[{"key":"A","text":"WebSocketは同一生成元制約の対象外なのでOrigin確認は不要"},{"key":"B","text":"機密データを扱うならwssを用い、ハンドシェイクのOrigin確認や認証、入力サニタイズを行う"},{"key":"C","text":"wsを使う方が暗号化され安全である"},{"key":"D","text":"WebSocketではXSSは発生しないので入力検証は不要"}]'::jsonb,
  'B',
  'WebSocketはHTTPでアップグレードして双方向通信する。TLS（wss）やOriginの検証、認証、メッセージの入力検証はHTTP同様に必要。',
  'AIF: リバースプロキシでOrigin/認証チェックと関連',
  ARRAY['websocket','origin','wstg-clnt'],
  '最初の握手はHTTP。HTTPで必要な安全対策がWebSocketでも消えるわけではない。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  2,
  'サブドメインテイクオーバーが発生する主因として最も適切なのはどれか。',
  '[{"key":"A","text":"サブドメインにSPFを設定していない"},{"key":"B","text":"DNSレコードが解約済みの外部サービス資源を指し続ける（dangling）状態を放置する"},{"key":"C","text":"TLS証明書の有効期限が短い"},{"key":"D","text":"WebサーバにHTTP/2を導入した"}]'::jsonb,
  'B',
  '外部サービスを削除・解約してもDNSが残ると、第三者が同名資源を再作成してサブドメインを乗っ取れる。DNS棚卸しと不要レコードの削除が基本。',
  'AIF: DNS資産管理/自動スキャンと関連',
  ARRAY['subdomain-takeover','dns','wstg-conf'],
  '外部サービスは消したのにDNSは残っている状態が危険。CNAME等の行先を点検する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  3,
  'LDAPインジェクション対策として最も適切なのはどれか。',
  '[{"key":"A","text":"フィルタ文字列を手で連結し、特殊文字をそのまま許可する"},{"key":"B","text":"RFCに従いLDAPフィルタの特殊文字をエスケープし、入力の許可リスト化と最小権限で検索する"},{"key":"C","text":"正規表現で< と > を除去するだけで十分"},{"key":"D","text":"TLSを使えば注入は防げる"}]'::jsonb,
  'B',
  'LDAPは検索フィルタにメタ文字を持ち、未エスケープ入力で検索条件が改変される。専用API/エスケープ、許可リスト検証、最小権限が必要。',
  'AIF: 入力エスケープライブラリ/SASTルールと関連',
  ARRAY['ldap-injection','filter','wstg-inpv'],
  'SQLと同様にクエリ文字列を連結しない発想。LDAPのメタ文字を思い出す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  3,
  '1回限りのクーポン適用APIで、同一ユーザが同時に複数リクエストを送ると複数回割引できた。原因と対策の組合せとして適切なのはどれか。',
  '[{"key":"A","text":"原因: CORS設定ミス／対策: Access-Control-Allow-Originを絞る"},{"key":"B","text":"原因: 排他・原子性不足／対策: DBトランザクションや一意制約でチェックと更新を原子的にする"},{"key":"C","text":"原因: DNSキャッシュポイズニング／対策: DNSSEC導入"},{"key":"D","text":"原因: XSS／対策: CSPのみ導入"}]'::jsonb,
  'B',
  '並行処理で未使用確認→使用済更新が分離すると競合で多重適用が起こる。データ層で原子性を担保（トランザクション、条件付き更新、一意制約、idempotency）する。',
  'AIF: DBトランザクション/Idempotency-Keyと関連',
  ARRAY['race-condition','atomicity','cwe-362'],
  'チェックと更新が別々だと隙ができる。同時に来たら？を前提に原子操作にする。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'threat',
  3,
  'GraphQL APIでイントロスペクションが公開され、深いネストのクエリで負荷が急増した。対策として最も適切なのはどれか。',
  '[{"key":"A","text":"イントロスペクションを常に全ユーザに許可し、開発者体験を優先する"},{"key":"B","text":"本番ではイントロスペクションのアクセスを制御するほか、深さ/複雑度/実行時間の上限やレート制限を設ける"},{"key":"C","text":"GraphQLはSQLを使わないため、DoSは起きない"},{"key":"D","text":"HTTP/2にするとネストDoSが防げる"}]'::jsonb,
  'B',
  'GraphQLはスキーマ取得（イントロスペクション）や深いネスト/大量取得でDoSが起こり得る。アクセス制御と、深さ・複雑度・タイムアウト等の制限を実装する。',
  'AIF: GraphQLゲートウェイでdepth/complexity制限と関連',
  ARRAY['graphql','introspection','dos'],
  'GraphQLは1リクエストで重い処理ができる。深さ・量・時間の制限を考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  1,
  'バッファオーバーフローの説明として最も適切なのはどれか。',
  '[{"key":"A","text":"整数計算がオーバーフローし、値が0になる現象"},{"key":"B","text":"確保した領域より多くのデータを書き込み、メモリ破壊やコード実行につながる現象"},{"key":"C","text":"XML外部実体参照でファイルを読み取る現象"},{"key":"D","text":"ログに改行を混入して監査を誤らせる現象"}]'::jsonb,
  'B',
  'バッファ境界を越えて書き込むとデータ破壊・クラッシュ・任意コード実行につながる。入力長検証、境界チェック、メモリ安全機構の活用が基本。',
  'AIF: メモリ安全言語/保護機構の導入と関連',
  ARRAY['buffer-overflow','memory-safety','owasp'],
  'ポイントは境界外アクセス。確保サイズと書き込みサイズが一致するかを考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  1,
  '依存ライブラリの脆弱性管理（SCA）で、OWASP Dependency-Checkの説明としてよく当てはまるのはどれか。',
  '[{"key":"A","text":"実行時にSQLインジェクションをブロックするWAFである"},{"key":"B","text":"依存関係を解析し、既知の脆弱性（CVE）と対応付けたレポートを生成するSCAツールである"},{"key":"C","text":"機密情報を暗号化して保存する鍵管理システムである"},{"key":"D","text":"WebSocketのOriginを検証するブラウザ機能である"}]'::jsonb,
  'B',
  'SCAは利用部品の既知脆弱性を把握して修正優先度を決める。Dependency-Checkのようなツールで依存関係をスキャンし、CVEに紐づけて管理する。',
  'AIF: CIでのSCA自動実行/レポート連携と関連',
  ARRAY['sca','dependency-check','supply-chain'],
  'コードの欠陥ではなく使っている部品を調べるツールかどうかで判断する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  2,
  'Java等でXMLを解析する際、XXE対策として適切な実装はどれか。',
  '[{"key":"A","text":"DOCTYPE/外部実体を許可し、機能性を優先する"},{"key":"B","text":"外部実体参照やDTD処理を無効化し、必要なら安全な許可リストベースで解析する"},{"key":"C","text":"エラー時にstack traceを利用者へ返す"},{"key":"D","text":"XMLをGZIP圧縮してから解析する"}]'::jsonb,
  'B',
  '外部実体が有効だとファイル参照やSSRF/DoSにつながる。パーサ設定で外部実体・DTDを無効化し、入力を最小権限で扱う。',
  'AIF: セキュアXMLパーサ設定テンプレートと関連',
  ARRAY['xxe','secure-parser','xml'],
  '脅威の入口はDOCTYPE/ENTITY。パーサが外部参照を解決しない設定を探す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  2,
  'ログ出力でユーザ入力をそのまま連結して記録している（例：login failed: <user>）。ログインジェクション対策として最も適切なのはどれか。',
  '[{"key":"A","text":"改行など制御文字を無害化/エンコードし、構造化ログを使ってフィールドとして記録する"},{"key":"B","text":"ログは不要なので全て無効化する"},{"key":"C","text":"ログを平文のままSNSに公開し監視を簡単にする"},{"key":"D","text":"ユーザ入力をBase64で保存し、画面表示時に復元する"}]'::jsonb,
  'A',
  'ログに改行等を混入させると偽のログ行を生成できる。信頼できない入力は制御文字を無害化し、構造化ログで分離記録し、ログの完全性も守る。',
  'AIF: セキュリティログ標準化/サニタイズと関連',
  ARRAY['log-injection','cwe-117','logging'],
  '攻撃者はログの書式を壊したい。ログ行を分割する文字（CRLF等）に注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  2,
  'ログイン後にnextパラメータへリダイレクトする実装で、安全なリダイレクトにする方法として適切なのはどれか。',
  '[{"key":"A","text":"nextに完全URLを受け入れ、利便性を上げる"},{"key":"B","text":"nextは相対パスのみ許可し、許可リストにない外部URLやスキームを拒否する"},{"key":"C","text":"nextを暗号化せずにそのまま送る"},{"key":"D","text":"リダイレクト前にCookie Secureを付ければ外部遷移は安全になる"}]'::jsonb,
  'B',
  '未検証のリダイレクトは正規ドメインを踏み台にフィッシング等に悪用される。遷移先は相対パス/許可リストに限定し、正規化して検証する。',
  'AIF: 認可済みリダイレクトURI管理と関連',
  ARRAY['open-redirect','redirect','owasp-cheatsheet'],
  '遷移先はユーザ入力。同一ドメイン内の決めた場所にだけ飛ばすのが基本。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  2,
  'CSP（Content-Security-Policy）設定に関する記述として最も適切なのはどれか。',
  '[{"key":"A","text":"script-src * unsafe-inline のように広く許可するとXSS検知が強化される"},{"key":"B","text":"CSPは許可リスト方式で読み込み元を制限し、XSS等に対する多層防御として有効"},{"key":"C","text":"CSPを入れるとサーバ側入力検証は不要になる"},{"key":"D","text":"CSPはDNSの設定でありHTTPヘッダではない"}]'::jsonb,
  'B',
  'CSPはHTTP応答ヘッダでリソース読み込み元を制限する許可リスト。脆弱性をゼロにしないが、XSSやクリックジャッキングの悪用を難しくする。',
  'AIF: CDN/EdgeでCSPヘッダ付与と関連',
  ARRAY['csp','defense-in-depth','wstg-conf-12'],
  'どこから読み込んでよいかを宣言する発想。過剰許可（ワイルドカード等）を疑う。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  2,
  'セキュアなAPIキー管理の実装パターンとして最も適切なのはどれか。',
  '[{"key":"A","text":"APIキーをソースにハードコードし、レビューで守る"},{"key":"B","text":"リポジトリ外のSecrets管理基盤で保管し、最小権限で配布・監査・ローテーションする"},{"key":"C","text":"APIキーをURLクエリに埋め込み、ログで追跡しやすくする"},{"key":"D","text":"全環境で同一キーを使い回し、運用を簡単にする"}]'::jsonb,
  'B',
  '秘密情報は集中管理し、配布・監査・ローテーションを行う。コードや設定ファイルへの埋め込みは漏えいリスクが高く、環境分離と最小権限が必須。',
  'AIF: Secrets Manager/KMSと関連',
  ARRAY['api-key','secrets-management','owasp'],
  'キーのライフサイクル（保管・配布・監査・失効/更新）を一つの仕組みで回せるか考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  3,
  '正規表現^(a+)+$でユーザ入力を検証している。ReDoS対策として最も適切なのはどれか。',
  '[{"key":"A","text":"入力長に上限を設けず、拒否時は再試行させる"},{"key":"B","text":"危険な正規表現構造（ネスト量指定等）を避け、入力長制限やタイムアウトを設ける"},{"key":"C","text":"正規表現をより複雑にして精度を上げる"},{"key":"D","text":"正規表現を暗号化して攻撃者に見せない"}]'::jsonb,
  'B',
  'ReDoSは特定の正規表現が入力次第で指数的に遅くなるDoS。危険な構造を避け、入力長制限・タイムアウト等で計算量を抑える。',
  'AIF: リクエストサイズ制限/タイムアウト設定と関連',
  ARRAY['redos','regex','dos'],
  '処理時間が入力長に対して急激に伸びる形を疑う。まず入力長の上限と危険構造の有無を確認。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  3,
  '受け取ったデータ長len（32bit）からbuf = malloc(len*4)で配列確保する。lenが大きいと何が問題で、どう防ぐべきか。',
  '[{"key":"A","text":"lenが大きいほど安全で、バッファは自動的に拡張される"},{"key":"B","text":"乗算がオーバーフローし小さな領域を確保してしまい、後続書込みでバッファ破壊になる。範囲検証と安全な乗算（より大きい型/チェック）を行う"},{"key":"C","text":"問題はログが多くなりディスクが圧迫されるだけ"},{"key":"D","text":"TLSを有効にすれば整数オーバーフローは防げる"}]'::jsonb,
  'B',
  '整数オーバーフローで計算結果がラップし、期待より小さいメモリ確保になると境界外書込みが起き得る。入力値の範囲チェックと安全なサイズ計算が必須。',
  'AIF: SASTでCWE-190検出と関連',
  ARRAY['cwe-190','integer-overflow','secure-coding'],
  'サイズ計算（加算・乗算）の前に上限値と型幅を確認。確保量 < 書込量が起点。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'coding',
  3,
  '在庫数stockをメモリ上で管理し、if (stock>0) { stock--; }を複数スレッドから呼び出す。安全な実装として適切なのはどれか。',
  '[{"key":"A","text":"処理順はOSが保証するので何もしない"},{"key":"B","text":"チェックと減算を同一クリティカルセクションにし、ロック/原子操作で排他と原子性を確保する"},{"key":"C","text":"ログにstockの値を出しておけば安全になる"},{"key":"D","text":"UI側でボタンを連打できなくすれば完全に防げる"}]'::jsonb,
  'B',
  '共有資源は排他（exclusivity）と原子性（atomicity）が必要。ロックやCAS等でチェックと更新を一体化しないと、同時実行で矛盾が起きる。',
  'AIF: 分散ロック/DBトランザクション設計と関連',
  ARRAY['cwe-362','concurrency','thread-safety'],
  'チェック→更新が別々だと競合する。二つを分割できない形（ロック/原子操作）にする。'
);
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  1,
  'ハッシュ関数の「衝突耐性」と「第2原像耐性」の説明として最も適切なのはどれか。',
  '[{"key":"A","text":"衝突耐性は、与えられたハッシュ値から元のメッセージを復元できない性質である"},{"key":"B","text":"衝突耐性は任意の異なる2入力で同一ハッシュを見つけにくい性質で、第2原像耐性は与えられた入力と同一ハッシュの別入力を見つけにくい性質である"},{"key":"C","text":"第2原像耐性は任意の異なる2入力で同一ハッシュを見つけにくい性質で、衝突耐性は与えられた入力と同一ハッシュの別入力を見つけにくい性質である"},{"key":"D","text":"衝突耐性と第2原像耐性は同義であり区別する必要はない"}]'::jsonb,
  'B',
  '衝突耐性は「任意2つの衝突探索」の困難さ、第2原像耐性は「与えられた入力に対し別入力で同一ハッシュを作る」困難さを指す。',
  'AIF: 改ざん検知（ハッシュ整合性）と関連',
  ARRAY['hash','collision-resistance','second-preimage'],
  '前提が「任意2つを探す」か「与えられた1つに対して探す」かで区別する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  1,
  'MAC（メッセージ認証コード）とデジタル署名の違いとして最も適切なのはどれか。',
  '[{"key":"A","text":"MACは公開鍵で検証でき、第三者に対する否認防止を提供する"},{"key":"B","text":"MACは送信者と受信者が共有秘密鍵を持つ前提で完全性と送信元確認を行い、デジタル署名は公開鍵で誰でも検証でき、否認防止に使える"},{"key":"C","text":"デジタル署名は共有鍵を使い、MACは公開鍵を使う"},{"key":"D","text":"MACは暗号化であり、デジタル署名は復号である"}]'::jsonb,
  'B',
  'MACは共有秘密鍵に基づくため検証者が鍵を持ち、第三者検証や否認防止に不向き。署名は公開鍵で検証でき、作成者の否認を困難にする。',
  'AIF: HSM/KMSで鍵分離と関連',
  ARRAY['mac','digital-signature','non-repudiation'],
  '検証者が「秘密鍵を共有する必要があるか」「誰でも検証できるか」を軸に考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  2,
  'PKIにおける証明書失効確認（CRL・OCSP）に関する記述として最も適切なのはどれか。',
  '[{"key":"A","text":"CRLは証明書1枚ごとにオンライン照会し、OCSPは失効一覧を定期配布する方式である"},{"key":"B","text":"OCSPは通信が必ず匿名化されるため、クライアントのプライバシー問題は起きない"},{"key":"C","text":"CRLは失効証明書の一覧を配布する方式で、OCSPは特定証明書の状態をオンラインで応答する方式である。OCSPステープリングは照会回数削減に役立つ"},{"key":"D","text":"証明書の有効期限内であれば失効確認は不要である"}]'::jsonb,
  'C',
  'CRLは失効一覧の配布、OCSPは個別証明書の状態照会。ステープリングはサーバ側で応答を添付でき、性能や可用性面の改善に寄与する。',
  'AIF: OCSPステープリング設定と関連',
  ARRAY['pki','crl','ocsp'],
  '「一覧配布」か「個別照会」か。照会の負荷や可用性を誰が吸収するかも見る。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  3,
  '鍵配送問題とDiffie-Hellman（DH）鍵交換に関する記述として最も適切なのはどれか。',
  '[{"key":"A","text":"DHは相手の身元を自動的に保証するため、中間者攻撃は成立しない"},{"key":"B","text":"DHは盗聴者がいても共有鍵合意を可能にするが、相手認証がないと中間者攻撃により別々の鍵を合意させられる"},{"key":"C","text":"DHは事前共有鍵が必須であり、鍵配送問題を解決しない"},{"key":"D","text":"DHはハッシュ関数のみで実現され、公開鍵暗号は使わない"}]'::jsonb,
  'B',
  'DHは受動盗聴に強いが、認証がなければ中間者が介在し別々の共有鍵を成立させ得る。証明書等で相手認証と組み合わせるのが基本。',
  'AIF: 証明書/署名で相手認証を付与と関連',
  ARRAY['diffie-hellman','key-establishment','mitm'],
  '「盗聴に強い」と「相手が本物」は別問題。認証がないと誰が混ざれるか考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  2,
  'ストリーム暗号とブロック暗号の特徴に関する記述として最も適切なのはどれか。',
  '[{"key":"A","text":"ストリーム暗号は必ず固定長ブロックに分割してから暗号化する必要がある"},{"key":"B","text":"ストリーム暗号では同じ鍵と同じノンス（IV）を再利用しても安全性に影響しない"},{"key":"C","text":"ストリーム暗号は鍵流（キーストリーム）と平文をXORする方式が一般的で、同一鍵流の再利用は情報漏えいにつながる"},{"key":"D","text":"ブロック暗号はパディング不要で任意長データをそのまま暗号化できる"}]'::jsonb,
  'C',
  'ストリーム暗号はキーストリームとXORするため、同一鍵・同一ノンス等で鍵流を再利用すると平文同士の関係が露出しやすい。ノンス管理が重要。',
  'AIF: ノンス一意性チェックと関連',
  ARRAY['stream-cipher','block-cipher','nonce'],
  '同じ鍵流を2回使うと「暗号文同士から平文同士が見える」ことがある点に注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  2,
  '暗号利用モード（ECB・CBC・GCM等）に関する記述として最も適切なのはどれか。',
  '[{"key":"A","text":"ECBは同一平文ブロックでも暗号文が毎回変わるため、パターン漏えいに強い"},{"key":"B","text":"CBCはIVを絶対に秘匿しなければならず、送信すると直ちに解読される"},{"key":"C","text":"GCMは同じ鍵でノンスを再利用しても安全であり、実装を単純化できる"},{"key":"D","text":"ECBは平文パターンが暗号文に残り得る。CBCは予測不能なIVとパディング処理が重要。GCMはノンスの一意性が重要である"}]'::jsonb,
  'D',
  'ECBはパターン漏えいの典型。CBCはIVの不備や誤ったパディング処理が事故に直結する。GCMはノンス一意性が破れると安全性が崩れるため管理が要点。',
  'AIF: 暗号ライブラリ安全設定と関連',
  ARRAY['ecb','cbc','gcm'],
  '各モードの「運用上の地雷（IV/ノンス/パディング/パターン）」を思い出す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  3,
  'TLS 1.3とTLS 1.2の違いに関する記述として最も適切なのはどれか。',
  '[{"key":"A","text":"TLS 1.3はRSA鍵交換を必須とし、PFSはオプションである"},{"key":"B","text":"TLS 1.3ではハンドシェイク後にのみ暗号化が開始され、初期メッセージは平文である"},{"key":"C","text":"TLS 1.3は（EC）DHEによる鍵合意を基本とし、旧式の暗号スイート構成を整理してハンドシェイクの往復回数削減を図っている"},{"key":"D","text":"TLS 1.3の0-RTTは再送攻撃の心配がないため、決済処理にも安全に使える"}]'::jsonb,
  'C',
  'TLS 1.3は（EC）DHE基本、暗号スイートの構造を簡素化し、性能と安全性を改善した。一方0-RTTは再送リスクがあるため用途制約がある。',
  'AIF: TLS設定テンプレート（1.3優先）と関連',
  ARRAY['tls1.3','rfc8446','handshake'],
  '「1.3で廃止された古い方式」と「0-RTTの制約」をセットで思い出す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  2,
  'コードサイニング（ソフトウェア署名）に関する説明として最も適切なのはどれか。',
  '[{"key":"A","text":"署名が付いていれば脆弱性やマルウェア混入がないことを保証できる"},{"key":"B","text":"署名は配布物の改ざん検知と発行者の確認に役立つが、安全性保証ではない。証明書チェーン、タイムスタンプ、失効も含めて検証する"},{"key":"C","text":"署名は暗号化であり、第三者は内容を復号して確認できない"},{"key":"D","text":"署名が1回検証できれば、その後の更新パッケージの検証は不要である"}]'::jsonb,
  'B',
  'コードサイニングは「誰が出したか」「途中で変わっていないか」を示すが、無害性保証ではない。検証はチェーンと失効、長期向けにタイムスタンプも重要。',
  'AIF: 署名付きリリース/透明ログ連携と関連',
  ARRAY['code-signing','integrity','software-supply-chain'],
  '署名が保証するのは「作成者と完全性」。中身の安全性保証とは別だと切り分ける。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  3,
  '秘密分散（k-of-nしきい値方式）に関する記述として最も適切なのはどれか。',
  '[{"key":"A","text":"どの1片（share）だけでも秘密を復元できるため、可用性が高い"},{"key":"B","text":"任意のk片があれば秘密を復元でき、k-1片以下では秘密に関する情報が得られない設計が可能である"},{"key":"C","text":"n片のうちn-1片が漏えいすると、残り1片だけで秘密が必ず復元される"},{"key":"D","text":"秘密分散は公開鍵暗号の別名であり、鍵管理には使えない"}]'::jsonb,
  'B',
  'しきい値秘密分散は、可用性（紛失耐性）と秘匿性（単独漏えい耐性）を両立できる。運用では復元手順・保管分離・監査を含めて設計する。',
  'AIF: 重要鍵の分割保管・多者承認と関連',
  ARRAY['secret-sharing','threshold','key-management'],
  'kとnの意味を丁寧に読む。「k未満は何も分からない」が成立する点が核心。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'crypto',
  2,
  '乱数生成の安全性における「エントロピーソース」に関する説明として最も適切なのはどれか。',
  '[{"key":"A","text":"暗号アルゴリズムの種類（AESなど）のことを指す"},{"key":"B","text":"乱数を生成するたびに必ずインターネットから時刻情報を取得する仕組みである"},{"key":"C","text":"秘密鍵そのものがエントロピーソースであり、追加の種（seed）は不要である"},{"key":"D","text":"予測困難な物理的・環境的ゆらぎ等を用いてDRBGの種を供給する部分であり、推定エントロピー評価や健全性テストが重要である"}]'::jsonb,
  'D',
  'CSPRNG/DRBGは良い種（seed）が前提。エントロピーソースは予測困難性を供給し、推定・健全性テスト・適切な再シード等が安全性に直結する。',
  'AIF: TRNG/DRBGと健全性監視の実装と関連',
  ARRAY['entropy','sp800-90b','randomness'],
  '乱数の強さは「アルゴリズム」だけでなく「種の予測困難性」に依存する点を押さえる。'
);
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  1,
  'ペネトレーションテストと脆弱性診断（VA）の違いとして最も適切なのはどれか。',
  '[{"key":"A","text":"ペネトレーションテストは自動スキャンのみで実施し、VAは手動で侵入を試みる"},{"key":"B","text":"VAは脆弱性の洗い出しと優先度付けが中心で、ペネトレーションテストは目的達成（侵入・権限奪取等）を想定して実際の攻撃手法で影響を実証する"},{"key":"C","text":"両者は同義であり、契約書上の呼称が違うだけである"},{"key":"D","text":"VAは本番環境でのみ実施し、ペネトレーションテストはテスト環境でのみ実施する"}]'::jsonb,
  'B',
  'VAは広範な脆弱性の特定・評価が主。ペネトレーションテストはルール（ROE）の下で侵害可能性と影響を実証し、優先度付けや検知改善に使う。',
  'AIF: 診断→手動検証→改善サイクルと関連',
  ARRAY['vulnerability-assessment','penetration-test','nist-800-115'],
  '「一覧化」か「目的を達成できるか実証」かで切り分ける。前提の範囲（ROE）も見る。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  1,
  'クラウドの共有責任モデルにおいて、一般に顧客側の責任となる事項として最も適切なのはどれか（IaaS想定）。',
  '[{"key":"A","text":"データセンターの物理セキュリティ（入退室管理など）"},{"key":"B","text":"ハイパーバイザや基盤ネットワークのパッチ適用"},{"key":"C","text":"ゲストOSやミドルウェアのパッチ適用、IAM設定、データ分類・アクセス制御"},{"key":"D","text":"クラウド事業者の人事管理と従業員教育"}]'::jsonb,
  'C',
  '共有責任では、基盤は事業者、設定・ID・データ保護は利用者側の比重が大きい。IaaSではOS以降の管理（パッチ、IAM、設定）が典型的な顧客責任。',
  'AIF: CSPM/IAMガードレールと関連',
  ARRAY['shared-responsibility','cloud','iam'],
  '「誰が操作できる領域か」で判断する。顧客が変更できる設定は基本的に顧客責任。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  2,
  'SOCとCSIRTの役割の組合せとして最も適切なのはどれか。',
  '[{"key":"A","text":"SOCはインシデントの封じ込め・復旧を主導し、CSIRTは日常監視のみを行う"},{"key":"B","text":"SOCはログ監視・検知・一次分析を担い、CSIRTは対応方針決定、関係者調整、封じ込め・根絶・復旧の統括を担う"},{"key":"C","text":"SOCは法令対応を担当し、CSIRTは脆弱性スキャンのみを担当する"},{"key":"D","text":"SOCとCSIRTは必ず同一組織であり、役割分担は不要である"}]'::jsonb,
  'B',
  'SOCは監視と検知・トリアージの中核。CSIRTは技術対応だけでなく、意思決定・連絡調整・外部連携・証拠保全等を含めた統括機能を担う。',
  'AIF: SIEM/SOARと対応プレイブックと関連',
  ARRAY['soc','csirt','incident-response'],
  '「平時の監視」と「有事の統括」を分けて考える。どちらも必要だが役割が異なる。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  2,
  'セキュリティインシデントのエスカレーション基準として最も適切なのはどれか。',
  '[{"key":"A","text":"技術的に完全に確定した事案だけをエスカレーションする"},{"key":"B","text":"セキュリティ担当者の主観で不安を感じたら必ず最高レベルにする"},{"key":"C","text":"影響度（業務停止・重要資産）、情報種別（個人データ等）、拡大可能性、法令・対外報告要否などの要素で重大度を定義し、閾値を超えたら速やかに段階的に上げる"},{"key":"D","text":"エスカレーションは外部報道が出た後に行う"}]'::jsonb,
  'C',
  'エスカレーションは確定待ちや主観で遅れると被害が拡大する。影響度・データ種別・拡大可能性・法令対応などの客観基準で重大度を定義し運用する。',
  'AIF: チケットのSeverityルーブリックと関連',
  ARRAY['escalation','severity','governance'],
  '「確定してから」では遅いことがある。何を見たら上げるかを事前に決めておく。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  2,
  'フォレンジック調査における証拠保全として最も適切なのはどれか。',
  '[{"key":"A","text":"調査を急ぐため、原本ディスク上で直接解析を行う"},{"key":"B","text":"証拠の改変防止のため、取得時に手順・担当・日時を記録し、原本の保全（書込み防止等）と複製のハッシュ一致確認を行う"},{"key":"C","text":"ログは改ざんされやすいので、取得せずにメモリだけを保存する"},{"key":"D","text":"証拠は技術担当だけが把握すればよく、引渡し記録（チェーン・オブ・カストディ）は不要である"}]'::jsonb,
  'B',
  '証拠は「改ざんしていない」ことを示せる形で確保する。原本保全、複製解析、ハッシュで同一性確認、手順と引渡し記録（チェーン）の保持が基本。',
  'AIF: EDR/収集ツールと証跡管理と関連',
  ARRAY['forensics','evidence','chain-of-custody'],
  '後から「改ざんしていない」と説明できるかが鍵。原本保全と記録の有無を確認する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  2,
  'ランサムウェア対策としてのバックアップ設計で最も適切なのはどれか。',
  '[{"key":"A","text":"バックアップは常時オンライン共有フォルダに置き、全社アカウントから削除可能にする"},{"key":"B","text":"バックアップは暗号化せずに保存し、復旧時の手間を減らす"},{"key":"C","text":"オフライン/イミュータブル等で改ざん・削除されにくいバックアップを持ち、定期的に復元テストを実施し、バックアップ権限を分離する"},{"key":"D","text":"バックアップは月1回で十分で、復元テストは本番障害が起きたときに実施する"}]'::jsonb,
  'C',
  '攻撃者はバックアップの削除・暗号化も狙う。オフラインやイミュータブル化、権限分離、復元テスト（実際に戻せる確認）まで含めて設計する。',
  'AIF: イミュータブルバックアップ/WORMと関連',
  ARRAY['ransomware','backup','recovery'],
  '「作る」だけでなく「消されない・戻せる」ことが要件。攻撃者視点でバックアップを守る。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  2,
  'セキュリティ教育・訓練の効果測定として最も適切なのはどれか。',
  '[{"key":"A","text":"受講完了率だけをKPIにし、内容理解は測定しない"},{"key":"B","text":"定性的な感想のみを集め、実際の行動変容は確認しない"},{"key":"C","text":"フィッシング模擬訓練の結果、理解度テスト、インシデント件数・報告率など複数指標で測定し、職務に応じた訓練へ改善する"},{"key":"D","text":"教育は一度実施すれば十分で、継続改善は不要である"}]'::jsonb,
  'C',
  '教育は実施自体より有効性が重要。理解度・行動（訓練結果）・実被害/報告傾向などで測り、役割別訓練や内容の見直しに反映する。',
  'AIF: フィッシング演習とKPIダッシュボードと関連',
  ARRAY['security-awareness','training','metrics'],
  '「受講した」ではなく「行動が変わったか」を測る。複数指標で見るのが基本。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  3,
  '個人データの漏えい等が発生し、個人の権利利益を害するおそれが大きい場合の対応として最も適切なのはどれか。',
  '[{"key":"A","text":"再発防止を社内で実施すれば足り、当局への報告や本人通知は不要である"},{"key":"B","text":"原則として個人情報保護委員会への報告と本人への通知が必要となるため、判断基準を手順化し、期限内に実施できる体制を整える"},{"key":"C","text":"本人通知のみ行い、当局報告は任意とする"},{"key":"D","text":"報道が出るまで公表や通知は控え、状況が落ち着いてから対応する"}]'::jsonb,
  'B',
  '個人データ漏えい等で権利利益侵害のおそれが大きい場合、報告・本人通知が求められる。手順・判断基準・連絡系統を整備し、遅延なく実行できる体制が重要。',
  'AIF: DLP/漏えい検知と通報ワークフローと関連',
  ARRAY['appi','breach-reporting','compliance'],
  '「誰に」「いつまでに」対応が必要かは法令・ガイドラインで決まる。遅れのリスクを考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  3,
  'サードパーティリスク管理（TPRM）として最も適切なのはどれか。',
  '[{"key":"A","text":"契約締結時にセキュリティ条項を入れれば十分で、運用中の確認は不要"},{"key":"B","text":"重要委託先は口頭で信頼を確認し、証跡や評価記録は残さない"},{"key":"C","text":"委託先の棚卸しと重要度分類、事前評価（デューデリジェンス）、要求事項、継続モニタリング、インシデント連絡・終了時のデータ返却/消去まで含めて管理する"},{"key":"D","text":"委託先の事故は全て委託先責任なので、委託元の対策は不要"}]'::jsonb,
  'C',
  'TPRMは契約だけでなくライフサイクル管理。重要度に応じた評価・要求・継続監視、連絡体制、終了時の取り扱いを含めて、供給網リスクを統制する。',
  'AIF: ベンダー台帳/継続評価ワークフローと関連',
  ARRAY['tprm','third-party-risk','supply-chain'],
  '外部委託は「始める前」「運用中」「終わる時」にそれぞれリスクがある。どれを管理するか考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'SC',
  'management',
  3,
  '脅威インテリジェンスの活用として最も適切なのはどれか。',
  '[{"key":"A","text":"IoCを収集して保管するだけで、検知ルールや優先順位付けには反映しない"},{"key":"B","text":"入手した情報は機密度を考えずSNSに即時公開し、拡散を最優先する"},{"key":"C","text":"資産と脅威の文脈に結び付けて、検知・ハンティング・パッチ優先度に反映し、共有時は機密度ルール（例：TLP）も考慮する"},{"key":"D","text":"誤検知があり得るため、脅威インテリジェンスは運用に使わない"}]'::jsonb,
  'C',
  '脅威情報は文脈化して初めて価値が出る。自組織の重要資産・攻撃手口（TTP）・検知に落とし込み、共有時は取り扱いルールを守って活用する。',
  'AIF: TIP/SIEM連携と検知ルール更新と関連',
  ARRAY['threat-intelligence','ttp','mitre-attack'],
  '「集める」より「運用に落とす」。自組織の資産・検知・優先度にどう結び付くかで判断する。'
);
