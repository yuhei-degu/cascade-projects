INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  1,
  'Amazon Bedrockで基盤モデルを選ぶ際に重視する要素として最も適切なのはどれか。',
  '[{"key":"A","text":"推論速度とユースケースだけを重視すればよい"},{"key":"B","text":"性能（応答品質）・コスト・ユースケースの特性・環境への配慮など複数要素を総合的に考慮する"},{"key":"C","text":"コストだけでモデルを選定すれば最適である"},{"key":"D","text":"自動的に最良モデルが選ばれるため、ユーザーは選択する必要はない"}]'::jsonb,
  'B',
  'モデル選定には品質（推論精度・LLMの得意分野）、利用コスト、特定用途での適性、訓練時の環境負荷（Responsible AI観点）などを総合評価する必要がある。',
  'SC: セキュリティポリシーでモデル評価基準を定める管理とも関連',
  ARRAY['bedrock','model-selection','governance'],
  '「性能だけ」「コストだけ」ではなく複数要素を併せて検討する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  1,
  'プロンプトキャッシュを利用する利点として最も適切なのはどれか。',
  '[{"key":"A","text":"モデルが出力をキャッシュするため、品質が向上する"},{"key":"B","text":"繰り返し使用する同一プロンプト部分をキャッシュし、再計算を省略することでレイテンシとコストを大幅に削減できる"},{"key":"C","text":"キャッシュ機能は性能を低下させるため推奨されない"},{"key":"D","text":"キャッシュは生成トークンではなく外部DBに保存される"}]'::jsonb,
  'B',
  'プロンプトキャッシュでは、頻繁に使う定型部分（例：大規模文書等）を事前処理してキャッシュ化し、次回以降の推論で再計算を省く。これによりレイテンシとトークンコストを90%近く削減できる【7†L12-L16】。',
  'SC: 同様のキャッシュ戦略は大規模データ処理でもコスト削減に使える',
  ARRAY['bedrock','prompt-caching','cost-optimization'],
  '同じ入力を何度もモデルに渡さないのがポイント。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  2,
  'ベースモデルの継続事前学習と指示ファインチューニングの違いとして最も適切なのはどれか。',
  '[{"key":"A","text":"継続事前学習はAI生成コードのみを対象とし、指示ファインチューニングは画像生成用である"},{"key":"B","text":"継続事前学習はドメイン固有のコーパスでモデル全体を再学習させる手法で、指示ファインチューニングは具体的なタスクの入出力ペアでモデルに指示対応能力を学習させる手法である"},{"key":"C","text":"両者は同義であり、用語が異なるだけである"},{"key":"D","text":"指示ファインチューニングはモデルのパラメータを固定したままアウトプットだけ調整する手法である"}]'::jsonb,
  'B',
  '継続事前学習はモデルの予備訓練（pre-training）を続け、業務固有知識を全体に付与する。一方、指示ファインチューニングは入出力例を与えてモデルを特定タスク指示に最適化する手法で、性質が異なる。',
  'SC: MLモデルのライフサイクル管理（チューニング方法選択）とも関連',
  ARRAY['bedrock','finetuning','llm-training'],
  '前者は「再学習」、後者は「タスク適応」を意識する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  2,
  'Amazon Bedrock Studio（SageMaker Unified StudioでのBedrock）は何のために使われるか。',
  '[{"key":"A","text":"AWSのコンソールへアクセスするための認証ツールである"},{"key":"B","text":"Bedrockの機能を利用してジェネレーティブAIアプリケーションをノーコードで設計・開発・運用するためのUI基盤である"},{"key":"C","text":"データベースを構築するためのサービスである"},{"key":"D","text":"AWS Classic EC2インスタンスの管理画面である"}]'::jsonb,
  'B',
  'Amazon Bedrock Studio（SageMaker Unified Studio経由）は、Bedrockのモデルやガードレール、エージェント、フローなどを統合的に開発・デプロイするUI環境で、コードなしでアプリケーション構築を支援するプラットフォームである【28†L53-L60】。',
  'SC: SCでは同様の専用環境（Jupyter Hubなど）を整備し運用することがある',
  ARRAY['bedrock','studio','unified-studio'],
  'BedrockのモデルやガードレールをGUIで扱える点に注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  2,
  'Amazon Bedrock Flowsに関する説明として最も適切なのはどれか。',
  '[{"key":"A","text":"モデルへの単一プロンプト実行を自動化する非公開機能である"},{"key":"B","text":"基盤モデルやツールのノードを接続し、ステップごとの処理フロー（ワークフロー）をビジュアルに設計できる機能である"},{"key":"C","text":"Bedrockのガバナンスレポート機能の別名である"},{"key":"D","text":"プロンプトの生成にReAct手法を用いる新しい言語モデルである"}]'::jsonb,
  'B',
  'Bedrock Flowsは、複数のステップ（ノード）をつないでジェネレーティブAIの処理パイプラインを構築する仕組みである。各ノードがBedrockモデルや外部サービスを呼び出し、データの受け渡しで複雑なワークフローを作成できる【29†L9-L15】。',
  'SC: RPAツールやワークフロー設計と類似',
  ARRAY['bedrock','flows','workflow'],
  '「ノードをつなげてワークフローを作る」というフレーズを探す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  2,
  '基盤モデルの評価指標ROUGEやBERTScoreが主に何を測るものか。',
  '[{"key":"A","text":"モデルの推論速度とコスト効率を評価する指標である"},{"key":"B","text":"自然言語生成（要約や翻訳など）の出力品質を、参照文章との重複度や意味的類似度で定量的に評価する指標である"},{"key":"C","text":"モデルの訓練中の損失関数値である"},{"key":"D","text":"入力データの多様性を評価する指標である"}]'::jsonb,
  'B',
  'ROUGEは機械翻訳・要約の出力と参照テキストの重複（n-gram重複）を評価する。BERTScoreは埋め込みベースで生成文と参照文の意味的類似度を評価する。どちらも生成モデルの品質評価指標である【3†L25-L28】。',
  'SC: テキスト指標の理解はログ/アラート評価にも関連',
  ARRAY['bedrock','evaluation','rouge','bertscore'],
  '要約・翻訳の正確さを測る指標である点に注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  3,
  'Bedrock AgentsのCode Interpreter機能について最も適切なのはどれか。',
  '[{"key":"A","text":"エージェントが生成したコードを隔離環境で安全に実行し、解析結果や可視化を得られる機能である"},{"key":"B","text":"エージェントが提示するコードの構文チェックのみを行うツールである"},{"key":"C","text":"エージェントが実行するコードを自動で暗号化する機能である"},{"key":"D","text":"コードを入力として自然言語説明を生成するための機能である"}]'::jsonb,
  'A',
  'Bedrock AgentCore Code Interpreterは、エージェントが生成したPython/JSコードをサンドボックスで実行し、出力や可視化を得られるサービスである。安全な隔離環境と監視機能により、AI生成コードの実行が可能になる【5†L119-L127】。',
  'SC: AIによる自動化処理で信頼性を上げる技術',
  ARRAY['bedrock','agents','code-interpreter'],
  '「隔離環境で安全にコード実行」という表現を意識する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  3,
  'クロスリージョン推論（Cross-Region inference）の「グローバル」プロファイルの特徴として最も適切なのはどれか。',
  '[{"key":"A","text":"特定の地理的グループ内のみルーティングし、データの居住性を保証する"},{"key":"B","text":"全リージョンで最適なスループットを提供し、最大約10%のコスト削減効果が期待できる（ただし居住性制約は満たされない）"},{"key":"C","text":"専用ハードウェアを用いて単一リージョンでのみ高速推論する"},{"key":"D","text":"最低限の機能セットでレイテンシのみを最優先する"}]'::jsonb,
  'B',
  '「グローバル」プロファイルは全リージョンから最適リージョンを自動選択し、最高のスループットを実現する。ベストプラクティスによれば、地理制限がない場合はこの方法で約10%のコスト削減効果も得られる【9†L51-L58】。',
  'SC: 複数拠点リソースを活用する冗長化設計と関連',
  ARRAY['bedrock','cross-region','performance'],
  '「グローバル」は最高パフォーマンスとコスト最適化を提供することに注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  3,
  'Amazon Bedrock Marketplaceについて最も適切なのはどれか。',
  '[{"key":"A","text":"Bedrockの機能ではなく、Kubernetesのパッケージマネージャである"},{"key":"B","text":"100以上のサードパーティFMを探索・テスト・利用できるカタログで、モデルを選択・サブスクライブしSageMakerエンドポイントにデプロイしてBedrock経由で利用する"},{"key":"C","text":"AWS Marketplaceからのみサブスクライブしたモデルを動かすための仕組みである"},{"key":"D","text":"自前で作成したモデルだけをアップロードするプライベートストアである"}]'::jsonb,
  'B',
  'Bedrock Marketplaceは100以上のサードパーティ製ベースモデルを一覧で探索・評価できる。利用したいモデルをサブスクライブ・デプロイし、Bedrock APIでアクセスしてAgentsやKnowledgeBasesから呼び出せる仕組みである【11†L9-L18】。',
  'SC: ソフトウェアサプライチェーン管理（調達・審査）と関連',
  ARRAY['bedrock','marketplace','sagemaker'],
  '「100以上のモデル」「サブスクライブ・デプロイ」というキーワードに注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'bedrock',
  3,
  'Amazon Bedrockのガバナンス/アクセス制御の方法として最も適切なのはどれか。',
  '[{"key":"A","text":"Bedrockにはアクセス制御機能がないため、インターネット経由でしか呼び出せない"},{"key":"B","text":"IAMポリシーで操作権限を管理し、VPCエンドポイント経由でベッドロックをプライベートにアクセスすることでセキュアに利用できる"},{"key":"C","text":"EC2インスタンスからのみアクセス可能で、IAMは関係ない"},{"key":"D","text":"Bedrock APIは無料で公開されており、誰でもアクセスできる"}]'::jsonb,
  'B',
  'BedrockではIAMで呼び出し権限を細かく制御できる。またVPCエンドポイントを作成すればプライベートネットワーク経由でBedrockにアクセス可能になり、インターネットを経由せずに安全に利用できる【13†L13-L17】【13†L86-L90】。',
  'SC: SCでもVPCエンドポイントやIAM制御でAPIアクセスを厳密に制限する',
  ARRAY['bedrock','iam','vpc-endpoint'],
  'IAM+VPCエンドポイントで安全にアクセスできる点に注目する。'
);
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  1,
  'AWSで定義されるResponsible AIの6つの柱に含まれるものはどれか。',
  '[{"key":"A","text":"公平性・説明可能性・プライバシー・安全性・透明性・堅牢性"},{"key":"B","text":"公平性・説明可能性・プライバシー・安全性・説明可能性・堅牢性"},{"key":"C","text":"公平性・プライバシー・依存性・安全性・透明性・可用性"},{"key":"D","text":"プライバシー・安全性・アクセス制御・運用性・公平性・信頼性"}]'::jsonb,
  'A',
  'AWSでは責任あるAIの主要次元として「公平性（Fairness）」「説明可能性（Explainability）」「プライバシー＆セキュリティ（Privacy & Security）」「安全性（Safety）」「透明性（Transparency）」「堅牢性（Robustness/Veracity）」などを挙げている【15†L70-L78】【15†L98-L101】。',
  'SC: SC管理・監査でも「公平性・透明性・安全性」など概念的に対応する',
  ARRAY['responsible-ai','fairness','privacy'],
  'AWSのResponsible AIでは6次元が定義されている。列挙された要素をよく確認する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  1,
  'Amazon SageMaker Model Cardsの主な目的はどれか。',
  '[{"key":"A","text":"モデルのハイパーパラメータチューニングを自動化する"},{"key":"B","text":"モデルの特性や評価情報など重要事項をまとめて文書化し、ガバナンスや報告に活用できるようにする"},{"key":"C","text":"テストデータからモデルのバグを検出する"},{"key":"D","text":"リアルタイム推論の性能を監視する"}]'::jsonb,
  'B',
  'SageMaker Model Cardはモデルの意図する用途、リスク評価、訓練条件、性能評価結果などを1箇所にまとめ、ガバナンスや報告活動に活用するためのドキュメントを作成する機能である【17†L18-L22】。',
  'SC: SCでも監査証跡のための文書化（モデルカードに相当）を行う',
  ARRAY['responsible-ai','model-cards','governance'],
  'モデルカードは「モデルの情報を一元化して文書化する」ことを覚える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  2,
  '差分プライバシー（Differential Privacy）の概念として最も適切なのはどれか。',
  '[{"key":"A","text":"機械学習モデルを複数リージョンで分散学習する手法である"},{"key":"B","text":"データにランダムなノイズを加え、個々のレコードを直接識別できないようにすることで、集計結果や学習結果から個人情報が漏れない数学的保証を提供するフレームワークである"},{"key":"C","text":"全てのユーザに対して同じ仮想IPを割り当てる技術である"},{"key":"D","text":"ユーザの個人データを暗号化してモデルに入力する技術である"}]'::jsonb,
  'B',
  '差分プライバシーは「加えたノイズの量」を制御することで、統計結果や機械学習の出力から個別のデータが特定されないよう保証する枠組みである。プライバシー損失パラメータεを設定し、数学的に保護する。', 
  'SC: SCでもデータ匿名化や秘匿化技術で個人情報保護を行う',
  ARRAY['responsible-ai','differential-privacy','privacy'],
  '「個人情報が漏れないようにする手法」という点に注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  2,
  'フェデレーテッドラーニング（連合学習）の特徴として最も適切なのはどれか。',
  '[{"key":"A","text":"すべてのトレーニングデータを中央サーバに集約してから学習する手法である"},{"key":"B","text":"各クライアント（端末）で学習したモデルの重みのみをサーバで集約し、データは共有せずに学習することで、プライバシーを保護しつつ共同学習を行う手法である"},{"key":"C","text":"モデルを複数リージョンで同時に提供して、フォールトトレランスを確保する手法である"},{"key":"D","text":"学習中にグローバルな探索とローカルな探索を交互に行うアルゴリズムの一つである"}]'::jsonb,
  'B',
  'フェデレーテッドラーニングは、データを中央に移動させず、各端末で学習したモデル更新（重み）のみをサーバで集約する手法である。これによりユーザーデータをローカルに保持しつつ、モデルの共同訓練が可能となりプライバシーを強化する。',
  'SC: SCでもデータ分散配置＋暗号集約でプライバシー確保を目指す',
  ARRAY['responsible-ai','federated-learning','privacy'],
  '生データを動かさず、モデルの重みだけで共有する点を意識する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  2,
  '説明可能性ツール（SHAPやLIME）の目的はどれか。',
  '[{"key":"A","text":"ブラックボックスMLモデルの各予測に対して、特徴量が予測にどれだけ寄与したかを可視化し、モデルの振る舞いを解釈することによって透明性を高める"},{"key":"B","text":"データをランダムに削除してモデルの頑健性をテストする方法である"},{"key":"C","text":"モデルを暗号化し、外部に出力しないようにする技術である"},{"key":"D","text":"時系列データの統計的特徴量を抽出する前処理手法である"}]'::jsonb,
  'A',
  'SHAPやLIMEはブラックボックスモデルに対して、入力特徴ごとの重要度を算出して可視化することで、各予測結果がどのような要因で導かれたかを解釈しやすくするツールである。モデルへの透明性を高める用途で使われる【15†L159-L162】。',
  'SC: SCでも複雑な判定ロジックに説明や証跡を付与する手法が求められる',
  ARRAY['responsible-ai','explainability','shap','lime'],
  'どの機能を使って何を「説明」しているかに注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  2,
  'バイアスの種類に関する説明として最も適切なのはどれか。',
  '[{"key":"A","text":"表現バイアスは訓練データセットである属性が実世界より過剰または偏って現れる問題で、測定バイアスはデータ取得やラベル付けの誤りによる問題である"},{"key":"B","text":"測定バイアスは必ずデータ分布の歪みではなく評価値のエラーを指す"},{"key":"C","text":"集約バイアスとは複数モデルを平均化する際に生じる問題を指す"},{"key":"D","text":"表現バイアスはニューラルネットワーク構造によるバイアスを指す"}]'::jsonb,
  'A',
  '表現バイアスは訓練データのサンプルが実際の分布を反映せず偏っている場合に生じる。測定バイアスはラベル付けやセンサー計測などで誤った値が含まれる問題を指す。集約バイアス（集団内の違いを無視する偏り）などもある。',
  'SC: データ品質管理とモニタリングによってこれらのバイアスは検知・軽減される',
  ARRAY['responsible-ai','bias','fairness'],
  '表現バイアス＝データの偏り、測定バイアス＝計測誤りと覚える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  3,
  'AWS AI Service Cardsの主な目的はどれか。',
  '[{"key":"A","text":"各AIサービスの意図するユースケースや制約、責任ある設計、パフォーマンス最適化のベストプラクティスを1箇所にまとめ、透明性を高めるためのリソースである"},{"key":"B","text":"AWSサービスを購入する際の価格比較サイトである"},{"key":"C","text":"サービスごとのセキュリティ脆弱性を管理するツールである"},{"key":"D","text":"AIサービスの統計情報をリアルタイムで表示するダッシュボードである"}]'::jsonb,
  'A',
  'AI Service Cardは、対象となるAWS AIサービス・モデルの用途、制限事項、責任ある設計の配慮点、性能最適化のベストプラクティスを1箇所にまとめ、利用者に透明性を提供するドキュメントである【22†L50-L53】。',
  'SC: SCでもシステム文書や仕様書を整備し透明性を確保する',
  ARRAY['responsible-ai','ai-service-cards','transparency'],
  '「透明性」「用途・制限・ベストプラクティス」というキーワードに注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  3,
  '合成データを用いる主な利点はどれか。',
  '[{"key":"A","text":"学習データと同様の個人情報が全て含まれるため、実データと同等に高いパフォーマンスを得られる"},{"key":"B","text":"実データを直接用いないため、個人情報漏えいリスクを低減しつつ、データ不足な状況でも学習データを補うことができる"},{"key":"C","text":"生成過程でデータ品質が向上し、偏りが自動的に修正される"},{"key":"D","text":"合成データは著作権フリーであるため、商用利用時の法的リスクがなくなる"}]'::jsonb,
  'B',
  '合成データは実際の個人情報を含まないため、プライバシー保護の面で有利である。また、データが不足しているケースで訓練データを拡張できる。ただし、学習性能が実データと同等とは限らない。', 
  'SC: SCでは匿名化データやモックデータでも同様に個人特定リスクを下げる',
  ARRAY['responsible-ai','synthetic-data','privacy'],
  '実際の個人情報を直接使わない点に着目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  3,
  'NISTのAIリスクマネジメントフレームワーク（AI RMF）の主な目的として最も適切なのはどれか。',
  '[{"key":"A","text":"AIシステムに固有のリスクを認識・管理するためのガイドラインを提供し、AIシステムの信頼性と責任ある利用を促進すること"},{"key":"B","text":"NISTがAIアルゴリズムの性能を最適化するためのパラメータ調整ツールである"},{"key":"C","text":"AIの実装コードを脆弱性診断するためのセキュリティ製品である"},{"key":"D","text":"機械学習アルゴリズムの数学的収束性を保証する理論的フレームワークである"}]'::jsonb,
  'A',
  'NIST AI RMFは、AIシステムが持つ固有のリスク（偏り、変化、悪用リスクなど）を特定・管理するための枠組みを提供し、信頼性と責任ある利用を高めることを目的としている【24†L182-L190】。', 
  'SC: SCでもリスク管理（RMF）でテクノロジー固有の課題管理を行う',
  ARRAY['responsible-ai','nist','risk-management'],
  'AIのリスク管理ガイドラインである点を意識する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'responsible_ai',
  3,
  '生成AIのコンテンツに関する著作権・知的財産権の懸念として最も適切なのはどれか。',
  '[{"key":"A","text":"生成AIによる出力は必ずユーザーに帰属するので、著作権は心配ない"},{"key":"B","text":"生成AIが学習に用いた著作物が出力に含まれる場合があり、誰が出力物の権利を持つかや著作権侵害のリスクが問題となる"},{"key":"C","text":"生成AIは全ての入力を公開するため、学習データのライセンスは不要である"},{"key":"D","text":"AI生成コンテンツは既存法では完全に保護されており、追加規制は不要である"}]'::jsonb,
  'B',
  '生成AIの出力には学習データ中の著作物が含まれる可能性がある。利用前に、出力の帰属先や既存著作物の利用に関するライセンスを確認し、著作権侵害リスクやライセンス違反が生じないよう注意が必要である【26†L133-L142】。',
  'SC: SCでもデータ使用許諾や監査で知財・法令順守を確認する',
  ARRAY['responsible-ai','copyright','legal'],
  '出力物に学習素材が混入する可能性と、それによる著作権問題が焦点になる。'
);
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  1,
  '教師なし学習の代表的な手法として適切なのはどれか。',
  '[{"key":"A","text":"k-近傍法（KNN）"},{"key":"B","text":"主成分分析（PCA）"},{"key":"C","text":"決定木分類"},{"key":"D","text":"支持ベクトルマシン"}]'::jsonb,
  'B',
  'PCAは次元削減を行う教師なし学習の手法であり、クラスタリング前処理などに用いられる。他の選択肢は教師あり学習手法である。',
  'SC: データ準備/特徴抽出のステップで使用する手法',
  ARRAY['unsupervised','pca','clustering'],
  '特徴量を要約し低次元化する手法を思い出す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  1,
  '強化学習におけるエージェントの「報酬（Reward）」の役割はどれか。',
  '[{"key":"A","text":"環境の初期状態を定義するもの"},{"key":"B","text":"行動に対する評価値で、学習目標に対する達成度を示す"},{"key":"C","text":"未知の環境で行動をランダム化するパラメータである"},{"key":"D","text":"モデルのハイパーパラメータを指す"}]'::jsonb,
  'B',
  '報酬はエージェントの行動に対する評価値で、得点や罰として与えられる。報酬を最大化するように方策（Policy）が学習される。',
  'SC: 試行錯誤学習の評価に相当',
  ARRAY['reinforcement','agent','reward'],
  '行動の結果を評価する値である点に注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  2,
  '交差検証（Cross-validation）の目的として最も適切なのはどれか。',
  '[{"key":"A","text":"モデルのトレーニング時間を短縮するための技術である"},{"key":"B","text":"データを複数の分割にして繰り返し検証し、過学習のリスクを評価しつつモデルの汎化性能を推定する手法である"},{"key":"C","text":"特徴量選択の手法である"},{"key":"D","text":"ハイパーパラメータを自動で最適化するアルゴリズムである"}]'::jsonb,
  'B',
  '交差検証はデータをk分割し、異なる検証セットで繰り返し評価する。これにより過学習の兆候を早期に検出し、モデルの汎化性能をより厳密に評価できる。',
  'SC: モデルの検証計画でよく使われる手法',
  ARRAY['cross-validation','cv','generalization'],
  '複数の分割でモデルを評価し汎化性を検証する点を押さえる。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  2,
  'F1スコアは何の調和平均か、また適用場面の例として適切なのはどれか。',
  '[{"key":"A","text":"PrecisionとRecallの調和平均で、クラスが不均衡な場合の評価に用いられる"},{"key":"B","text":"AccuracyとRecallの調和平均で、すべてのクラスが同じ頻度の場合のみ使う"},{"key":"C","text":"PrecisionとAccuracyの平均で、クラスごとに同じ件数のデータがある場合に最適である"},{"key":"D","text":"再現率（Recall）と特異度（Specificity）の積であり、F値と呼ばれる"}]'::jsonb,
  'A',
  'F1スコアはPrecision（適合率）とRecall（再現率）の調和平均であり、特にクラス不均衡データで「偽陰性や偽陽性」をバランスよく評価したい場合に用いる。',
  'SC: 品質指標のバランスを取る指標の考え方と関連',
  ARRAY['f1-score','precision','recall'],
  '「PrecisionとRecallの平均値」を求める指標であることを確認する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  2,
  '混同行列（Confusion Matrix）の[True Positive, False Negative, False Positive, True Negative]に対応する要素を正しく選べ。',
  '[{"key":"A","text":"モデルが陽性と予測し、実際に陽性/陰性、モデルが陰性と予測し、実際に陽性/陰性の4通り"},{"key":"B","text":"入力特徴量と正解ラベルとの対応表"},{"key":"C","text":"訓練データの分割割合"},{"key":"D","text":"パラメータの初期値"}]'::jsonb,
  'A',
  '混同行列は[TP, FN, FP, TN]の4つの要素で、モデルの予測（陽性/陰性）と実際（陽性/陰性）の組み合わせを表現する。選択肢Aが正しい。',
  'SC: 訓練済みモデルの誤り分析で用いるツール',
  ARRAY['confusion-matrix','tp','fn','fp','tn'],
  'モデル予測と実際値の組み合わせ4パターンを理解する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  2,
  '正規化（Normalization）と標準化（Standardization）の違いおよび適用場面として最も適切なのはどれか。',
  '[{"key":"A","text":"正規化はデータを0～1の範囲に変換し、標準化は平均0・分散1に変換する。正規化はNNなど入力範囲を揃えたい場合、標準化は距離ベース手法で有効である"},{"key":"B","text":"正規化はデータを指数化し、標準化はデータをランダムにシャッフルする手法である"},{"key":"C","text":"正規化は変数間の相関を削除する手法で、標準化は異常値の影響を完全に排除する手法である"},{"key":"D","text":"両者は同義であり使い分けの必要はない"}]'::jsonb,
  'A',
  '正規化は特徴量を0～1などの固定範囲にスケーリングする。標準化は平均0・分散1になるよう変換する。ニューラルネットでは活性化範囲を揃えるため正規化、距離計算を伴う手法ではデータ分布を正規化するため標準化が有用である。',
  'SC: データ前処理/スケーリングはパイプライン設計で重要なステップ',
  ARRAY['normalization','standardization','scaling'],
  'スケーリング範囲と統計値変換の違いに注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  3,
  'アンサンブル学習（バギング・ブースティング・スタッキング）の特徴として最も適切なのはどれか。',
  '[{"key":"A","text":"バギングは並列学習で多様性を高め、ブースティングは逐次学習で誤りを重み付けする手法であり、スタッキングは複数モデルの予測をメタモデルで統合する手法である"},{"key":"B","text":"全てのアンサンブルは単一モデルと同じ挙動を示すため、性能向上は期待できない"},{"key":"C","text":"バギングは弱いモデルの集合、ブースティングは強い単一モデルの使用、スタッキングはデータ拡張技術である"},{"key":"D","text":"ブースティングでは各モデルが同じ重みで平均化される"}]'::jsonb,
  'A',
  'バギングは複数データサブセットで並列学習し多様性を確保する。ブースティングは誤分類に重点を置く逐次学習で精度を高める。スタッキングは複数モデル出力を上位メタモデルで学習・統合する手法である。',
  'SC: 複数手法の組み合わせはSCの多層防御戦略にも類似',
  ARRAY['ensemble','bagging','boosting','stacking'],
  '並列 vs 逐次 vs メタ学習という運用方法の違いに注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  3,
  '転移学習とドメイン適応（Domain Adaptation）の違いとして適切なのはどれか。',
  '[{"key":"A","text":"転移学習はモデルをあるタスクで訓練後、別のタスクに利用する手法であり、ドメイン適応は同じタスクでも訓練データと実運用データの分布差を補正する手法である"},{"key":"B","text":"ドメイン適応は教師なし学習の一種で、転移学習は教師あり学習の一種である"},{"key":"C","text":"両者は同義であり区別しない"},{"key":"D","text":"転移学習はデータを圧縮することで、ドメイン適応は特徴量を拡張する手法である"}]'::jsonb,
  'A',
  '転移学習では、既存タスクで学習済みモデルを別の関連タスクに再利用する。ドメイン適応はタスク自体は同じだが、訓練データと本番データの分布差（ドメインシフト）を補正することで性能を維持する手法である。',
  'SC: 学習済みモデルの再利用は資産活用／ドメイン差異はリスク要因管理と類似',
  ARRAY['transfer-learning','domain-adaptation','fine-tuning'],
  '「タスクを変えるか」「データ分布を合わせるか」の観点で考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'ml_basics',
  3,
  'MLの公平性指標Demographic ParityとEqual Opportunityのうち、次の説明に対応するものはどれか。',
  '[{"key":"A","text":"Demographic Parity：すべてのグループで予測が陽性となる割合が等しくなるべきという基準。Equal Opportunity：各グループの真のポジティブ率（TPR）が等しくなるべき基準である"},{"key":"B","text":"Demographic Parity：同じPrecisionを保証する基準。Equal Opportunity：同じAccuracyを保証する基準。"},{"key":"C","text":"Demographic Parity：予測が常に同じクラスになるよう強制する基準。Equal Opportunity：モデルの性能を保証する基準である"},{"key":"D","text":"Demographic ParityとEqual Opportunityはどちらもモデルの計算速度を評価する指標である"}]'::jsonb,
  'A',
  'Demographic Parity（人口均衡）は、各グループで「陽性予測率が等しくなる」ことを意味する。Equal Opportunity（機会均等）は、各グループで「実際に陽性であるうちモデルが正しく陽性と予測する率（TPR）が等しくなる」ことを要求する。',
  'SC: 説明可能性・公正性要件は運用上のガバナンス観点とも関連',
  ARRAY['fairness','demographic-parity','equal-opportunity'],
  '「予測結果の割合」と「真陽性の割合」のどちらを揃えるかに着目する。'
);
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  1,
  'Transformerアーキテクチャのコアコンポーネントとして重要なものはどれか。',
  '[{"key":"A","text":"畳み込み層（Convolutional Layer）"},{"key":"B","text":"注意機構（Self-Attention）"},{"key":"C","text":"再帰型ネットワーク（RNN）"},{"key":"D","text":"密結合層のみ"}]'::jsonb,
  'B',
  'TransformerではSelf-Attention（自己注意機構）を用いて系列データ間の関連を学習する。これはTransformerの特徴であり、他の選択肢は含まれていない。',
  'SC: モデルアーキテクチャ理解はシステム設計にも役立つ',
  ARRAY['transformer','attention','self-attention'],
  '自己注意(attention)がTransformerの鍵要素である。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  1,
  'Top-p（nucleus）サンプリングとTop-kサンプリングの主な違いはどれか。',
  '[{"key":"A","text":"Top-pは累積確率が上位pまでとなるようトークンを動的に選び、Top-kは確率上位k個の固定数でサンプルする方法である"},{"key":"B","text":"Top-pは必ずk=1で利用し、Top-kは確率に基づいて動的にサンプリングを行う"},{"key":"C","text":"両者は同じ手法であり、異なる名前を使う業界による呼称違いである"},{"key":"D","text":"Top-pはすべてのトークンから確率に応じて選び、Top-kは下位k個のトークンを除外する方法である"}]'::jsonb,
  'A',
  'Top-kでは予測確率が高い上位k個のトークンからランダム選択する。Top-pでは累積確率が閾値p（例えば0.9）になるまでトークンを含め、その動的な集合から選択する。',
  'SC: ランダム性制御の方法論はリスク評価でも類似する',
  ARRAY['sampling','top-p','top-k'],
  '固定数(k個)か累積確率(p)かの違いを把握する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  2,
  'Chain-of-Thought (CoT) プロンプティングの効果として期待できるものはどれか。',
  '[{"key":"A","text":"モデルに複雑な推論過程を出力させることで、論理的回答の精度や整合性が向上する"},{"key":"B","text":"モデルの生成速度を高速化する手法である"},{"key":"C","text":"入力を与えずに自己回帰で文章を生成させる技術である"},{"key":"D","text":"Transformerの学習率を最適化するアルゴリズムである"}]'::jsonb,
  'A',
  'Chain-of-Thoughtプロンプティングはモデルに計算過程や思考の説明を生成させる手法であり、その過程で内部推論が明示されるため、複雑な問題に対する回答の精度向上につながるとされる。',
  'SC: 複数ステップの検討プロセスは意思決定モデルに似る',
  ARRAY['prompting','chain-of-thought','reasoning'],
  '思考過程を含めたプロンプトで推論性能が改善する点を意識する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  2,
  '検索拡張生成（RAG）のアーキテクチャパターンに関する説明として適切なのはどれか。',
  '[{"key":"A","text":"外部データベースから関連情報を検索し、LLMへのプロンプトに含めることで知識を補完し生成品質を向上させる構成である"},{"key":"B","text":"ランダムにドメイン外データを生成プロセスに混ぜることで多様性を増す手法である"},{"key":"C","text":"全ての知識をモデルの重みとして暗黙的に保持するための訓練技術である"},{"key":"D","text":"LLMを使わずに固定回答を返す検索エンジンのことを指す"}]'::jsonb,
  'A',
  'RAG（Retrieval-Augmented Generation）は、クエリに関連する知識を検索エンジンやベクトルDBから取得し、その情報をLLMのプロンプトに組み込む方式である。外部知識の即時取り込みにより、LLMの正確性や最新性を補強する。',
  'SC: 外部データ参照付きシステムは企業のドキュメント検索と類似',
  ARRAY['rag','retrieval','knowledge-base'],
  '外部データの検索結果を使う点に注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  2,
  'LLMの評価指標BLEU・ROUGE・BERTScoreがそれぞれ主に何を評価するか。',
  '[{"key":"A","text":"BLEU：生成文と正解文のn-gram一致、ROUGE：要約性能（重複n-gram）、BERTScore：意味的類似度（ベクトルコサイン類似度）"},{"key":"B","text":"BLEU：単語多様性、ROUGE：モデルサイズ、BERTScore：GPUメモリ使用量"},{"key":"C","text":"BLEU・ROUGE・BERTScoreは全て同義で、モデルのトレーニング時間を測る指標である"},{"key":"D","text":"BLEU：精度、ROUGE：再現率、BERTScore：F1スコアに関係する指標である"}]'::jsonb,
  'A',
  'BLEUは翻訳・生成文のn-gram一致度（照合度）を評価する指標。ROUGEは要約品質で参照文とのn-gram重複を評価する。BERTScoreはBERT等で埋め込みを計算し、生成文と参照文の意味的類似度を評価する。',
  'SC: テキスト比較指標はログ解析や監査報告でも類似度計算に応用される',
  ARRAY['bleu','rouge','bertscore'],
  '一致度（BLEU/ROUGE）と意味的類似度（BERTScore）の違いに注目する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  2,
  'マルチモーダルモデルの特徴として適切なのはどれか。',
  '[{"key":"A","text":"テキスト以外のデータ（画像・音声など）を同時に入力して処理できるモデルである"},{"key":"B","text":"予測時の出力を必ず画像とテキストのペアで返すモデルを指す"},{"key":"C","text":"時系列データのみを扱う特化型モデルである"},{"key":"D","text":"複数の言語モデルを同時に呼び出すシステムのことを指す"}]'::jsonb,
  'A',
  'マルチモーダルモデルは、テキストだけでなく画像・音声など異なるモダリティの入力を同時に処理し、統合的に理解・生成が可能なモデルである。一般的に、テキストだけのモデルとは異なる能力を持つ。',
  'SC: 異なるデータソース統合はシステムインテグレーションにも通じる',
  ARRAY['multimodal','vision-language','audio-visual'],
  '「テキスト以外のデータも扱う」点を意識する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  2,
  'LLMのコンテキストウィンドウ管理戦略として最も適切なのはどれか。',
  '[{"key":"A","text":"入力が長くなりすぎないように、古い部分を要約して残すか省略して、重要な部分を維持する手法を使う"},{"key":"B","text":"すべての入力をそのまま渡し、トークン上限を無限に拡大する"},{"key":"C","text":"コンテキストは時系列のチャートで可視化するため、グラフ出力を利用する"},{"key":"D","text":"コンテキストウィンドウはモデルごとに固定されているので管理の必要がない"}]'::jsonb,
  'A',
  'コンテキストウィンドウの制約回避には、例えば長い文書をセグメント化して要約やチャンク化し、最新の重要情報を優先してモデルに渡す手法が用いられる。不要部分は省略してもよい。',
  'SC: 大量ログを要約する手法に似た考え方',
  ARRAY['context-window','truncation','summarization'],
  'ウィンドウを超えた古い情報の扱い（要約や削除）を考える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  3,
  'LoRA（Low-Rank Adaptation）に関する説明として適切なのはどれか。',
  '[{"key":"A","text":"モデルの重み行列に低ランク行列の追加を学習させ、元モデルの大部分を固定したまま少量のパラメータでファインチューニングする手法である"},{"key":"B","text":"低解像度画像の補完を行う画像生成手法である"},{"key":"C","text":"大規模言語モデルでトークン圧縮率を計算するアルゴリズムである"},{"key":"D","text":"クラスタリング結果を低ランク近似する教師なし学習手法である"}]'::jsonb,
  'A',
  'LoRAは既存大規模モデルの重み更新を低ランクの行列乗算で近似し、元モデルの重みを固定したまま少量の追加パラメータでファインチューニングを行う手法である。これによりストレージ・計算量を削減できる。',
  'SC: モデルパラメータの最適化手法は圧縮技術にも類似',
  ARRAY['lora','fine-tuning','transfer-learning'],
  '「低ランクで微調整」「元モデルの重みは固定」をキーワードにする。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  3,
  'エージェントAIの一般的なアーキテクチャパターンに含まれるものはどれか。',
  '[{"key":"A","text":"強化学習エージェントから生成されたアクションを実行する外部ツール（APIやDBなど）を含む構成"},{"key":"B","text":"マルチGPUを用いた分散学習を行う特化型モデルである"},{"key":"C","text":"複数のモデルを並列に稼働させるだけのシステムを指す"},{"key":"D","text":"エージェント内でバックプロパゲーションを繰り返す方式である"}]'::jsonb,
  'A',
  'エージェントAIは言語モデルに加え、ツール実行層（外部API呼び出しやDB検索など）を持つアーキテクチャであり、モデルが生成した指示を現実世界のアクションに変換する。これによりチャットボットが外部知識とやり取りできる。',
  'SC: マイクロサービス連携や外部API呼び出し設計に類似',
  ARRAY['agents','tools','api-calling'],
  'モデルが指示を出し、外部ツールを呼び出す構成を思い出す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'generative_ai',
  3,
  'AIコードアシスタントが引き起こしうるセキュリティリスクとして最も適切なのはどれか。',
  '[{"key":"A","text":"入力を一切検証せず任意のコードを生成・実行させた結果、悪意あるコードや依存関係の脆弱性が混入する可能性がある"},{"key":"B","text":"コードアシスタントは必ず安全なコードしか出力しないのでリスクはない"},{"key":"C","text":"自動コード生成はネットワークを暗号化し、インジェクション攻撃を防止する"},{"key":"D","text":"モデルが生成したコードは証明書で署名されているため安全である"}]'::jsonb,
  'A',
  'AIコードアシスタントは学習データのバイアスや脆弱な例を踏襲してコードを生成するリスクがある。入力検証なしに実行すると、マルウェア混入や既知脆弱依存性が導入される可能性がある。',
  'SC: SCでも自動化ツール出力の検証や承認を実施する',
  ARRAY['security','code-assistant','malicious-code'],
  'AI生成コードも必ずチェックし、脆弱性混入に注意する必要を考える。'
);
INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  1,
  'Amazon KendraとAmazon OpenSearch Serviceの主な使い分けとして適切なのはどれか。',
  '[{"key":"A","text":"Kendraは企業内ドキュメント検索向けに自然言語クエリ機能を提供し、OpenSearchはフリーテキストインデックス検索に優れる"},{"key":"B","text":"Kendraは画像処理専用で、OpenSearchは音声認識専用である"},{"key":"C","text":"Kendraは大規模データのバッチ処理ツール、OpenSearchは機械学習モデルの訓練サービスである"},{"key":"D","text":"両者は同じ機能を持ち、名前が異なるだけである"}]'::jsonb,
  'A',
  'Amazon Kendraはドキュメント検索に特化し、自然言語クエリに基づく関連情報検索を提供する。一方OpenSearch Serviceは一般的な全文検索エンジンであり、自由文検索に強い。',
  'SC: どちらも情報検索技術だが用途に応じた選択が必要',
  ARRAY['kendra','opensearch','enterprise-search'],
  'Kendra=自然言語検索、OpenSearch=汎用テキスト検索と覚える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  1,
  'Amazon Pollyの特徴として最も適切なのはどれか。',
  '[{"key":"A","text":"音声合成サービスであり、テキストを人間らしい音声に変換できる"},{"key":"B","text":"自然言語理解（NLU）サービスでテキストの意味解析を行う"},{"key":"C","text":"機械翻訳サービスで多言語間の翻訳を提供する"},{"key":"D","text":"画像認識サービスでテキストが書かれた画像から文字列を抽出する"}]'::jsonb,
  'A',
  'Amazon Pollyはテキストを合成音声に変換するサービスである。様々な声質・言語の音声出力が可能な文字音声変換（TTS）を提供する。',
  'SC: インターフェースに音声合成を追加するUX設計と関連',
  ARRAY['polly','tts','speech-synthesis'],
  'テキスト→音声というプロセスを思い出す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  1,
  'Amazon Personalizeの典型的なユースケースはどれか。',
  '[{"key":"A","text":"個人の嗜好や行動履歴に基づくレコメンデーション（推薦）エンジンの構築である"},{"key":"B","text":"リアルタイム翻訳サービスを提供する"},{"key":"C","text":"自然言語チャットボットの要約機能を強化する"},{"key":"D","text":"画像に含まれるテキストを抽出する"}]'::jsonb,
  'A',
  'Amazon Personalizeはユーザ行動（購買履歴・クリック等）を使ったレコメンデーションモデルを簡単に構築できるサービスである。ユーザへのパーソナライズした推薦に特化している。',
  'SC: 顧客/ユーザデータ分析でも同様にパーソナライズを利用',
  ARRAY['personalize','recommendation','user-behavior'],
  '「パーソナライズ=推薦システム」と覚える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  1,
  'Amazon Forecastの主な用途として適切なのはどれか。',
  '[{"key":"A","text":"時系列データに基づく需要予測や在庫管理に用いる予測分析サービスである"},{"key":"B","text":"任意の時刻に音声を合成するためのサービスである"},{"key":"C","text":"テキストデータからキーワードを抽出するサービスである"},{"key":"D","text":"映像データから物体を検出するサービスである"}]'::jsonb,
  'A',
  'Amazon Forecastは需要予測など時系列予測に特化したサービスである。過去の売上などの時系列データを入力して将来の値を予測する。',
  'SC: 需要予測は予算策定やリソース管理にも使われる',
  ARRAY['forecast','time-series','demand-forecasting'],
  '時系列データの予測サービスであることを思い出す。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  2,
  'AWS GlueとAmazon SageMaker Data Wranglerの使い分けとして最も適切なのはどれか。',
  '[{"key":"A","text":"Glueは大規模データのETL処理基盤であり、Data Wranglerは主にデータサイエンティスト向けのUIベースで前処理を行うツールである"},{"key":"B","text":"Glueはリアルタイム推論用、Data Wranglerはバッチ推論用である"},{"key":"C","text":"Glueは画像処理用サービス、Data Wranglerは音声処理用サービスである"},{"key":"D","text":"両者は同じサービスであり名称が異なるだけである"}]'::jsonb,
  'A',
  'AWS Glueは大規模なETL（Extract/Transform/Load）処理に使われるサーバレスデータ統合基盤。一方Data WranglerはSageMaker内のGUIツールで、データサイエンティストがコードを書かずにデータ前処理を行うのに適している。',
  'SC: 大規模処理基盤と開発者向けツールの使い分け概念',
  ARRAY['glue','data-wrangler','etl'],
  'Glue=ETL基盤、Data Wrangler=インタラクティブな前処理ツールと覚える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  2,
  'Amazon SageMakerの主要コンポーネントとしてStudio、Pipelines、Feature Storeはそれぞれ何に用いるか。',
  '[{"key":"A","text":"Studioは統合開発環境、PipelinesはMLワークフロー自動化、Feature Storeは特徴量（features）の保存と提供に用いる"},{"key":"B","text":"StudioはクラウドIDE、Pipelinesはデータベース、Feature Storeは機械学習モデルのインターフェースである"},{"key":"C","text":"Studioは音声認識、Pipelinesは翻訳、Feature StoreはEC2インスタンスを管理するサービスである"},{"key":"D","text":"これらはすべてS3の別名である"}]'::jsonb,
  'A',
  'StudioはJupyterベースの統合開発環境。Pipelinesはモデル訓練やデプロイなどMLライフサイクルのワークフロー自動化ツール。Feature Storeは特徴量のカタログ化・リアルタイム提供を行うストレージサービスである。',
  'SC: ML開発ライフサイクルで必要な機能群が連携するイメージ',
  ARRAY['sagemaker','studio','pipelines','feature-store'],
  'それぞれの役割（IDE、ワークフロー、特徴量DB）を押さえる。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  2,
  'Amazon Q DeveloperとAmazon Q Businessの違いはどれか。',
  '[{"key":"A","text":"Q Developerはエンジニア向けのプログラム可能な質問応答プラットフォーム、Q Businessはビジネス向けの自然言語アナリティクス用ソリューションである"},{"key":"B","text":"Q Developerは画像解析ツール、Q Businessは翻訳ツールである"},{"key":"C","text":"Q DeveloperはEC2ベース、Q BusinessはLambdaベースで動作する違いしかない"},{"key":"D","text":"両者は同じサービスを指し、呼称の違いのみである"}]'::jsonb,
  'A',
  'Amazon Q Developerはエンジニアや開発者向けにカスタムクエリ構築が可能な質問応答サービス。Q Businessはビジネスユーザ向けに用意されたナレッジ分析ソリューション（GUI中心）で、用途とユーザ層が異なる。',
  'SC: ツールの選定は対象ユーザや利用目的で決める視点と関連',
  ARRAY['amazon-q','q-developer','q-business'],
  'Developer=開発者向け、Business=エンドユーザ向けを区別する。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  3,
  'AWS InferentiaとAWS Trainiumの用途として適切なのはどれか。',
  '[{"key":"A","text":"Inferentiaは主に深層学習推論向けのカスタムチップ、Trainiumは訓練（トレーニング）向けのカスタムチップである"},{"key":"B","text":"Inferentiaは機械学習モデルのデータ前処理用、Trainiumは特徴量ストア用である"},{"key":"C","text":"Inferentiaは画像認識専用、Trainiumは音声認識専用である"},{"key":"D","text":"両者ともT2インスタンスの別名で、用途の違いはない"}]'::jsonb,
  'A',
  'Inferentiaは低レイテンシの推論処理に特化したカスタムASIC（Inferentiaインスタンス）。Trainiumは大規模モデルの訓練を高速化するための専用チップ（Trainiumインスタンス）である。',
  'SC: 推論系と訓練系を用途別に最適化する考え方',
  ARRAY['inferentia','trainium','hardware-acceleration'],
  'Inferentia=推論、Trainium=訓練を覚える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  3,
  'Amazon BedrockとAmazon SageMaker JumpStartの使い分けとして最も適切なのはどれか。',
  '[{"key":"A","text":"Bedrockはフルマネージドの生成AIモデルサービス、JumpStartはSageMakerで事前構築済みMLソリューション/モデルのカタログを提供する機能である"},{"key":"B","text":"BedrockはIoTデバイス向け推論エンジン、JumpStartはEC2サーバ上のMLラボである"},{"key":"C","text":"両者はAWSの認証プログラムであり、サービス内容ではない"},{"key":"D","text":"BedrockはBIツール、JumpStartは会計ソフトである"}]'::jsonb,
  'A',
  'Amazon Bedrockはフルマネージドで基盤モデルへのアクセスを提供する生成AIサービスである。SageMaker JumpStartはSageMaker内で既存のMLモデルやソリューションをカタログ形式で利用できる機能である。',
  'SC: サービスのタイプ（マネージド vs 開発ツール）で違いを把握する',
  ARRAY['bedrock','jumpstart','ml-service'],
  'Bedrock=基盤モデルAPI、JumpStart=モデルカタログ提供と覚える。'
);

INSERT INTO question_bank(module, category, difficulty, question, options, answer, explanation, synergy_hint, tags, hint)
VALUES (
  'AIF',
  'sdk',
  3,
  'Amazon Comprehend Medicalの特徴として最も適切なのはどれか。',
  '[{"key":"A","text":"医療・ヘルスケア関連の文書から医療用語や疾患・処方薬などを抽出・解析するNLPサービスである"},{"key":"B","text":"汎用テキストの要約を行うサービスであり、医療文書には特化していない"},{"key":"C","text":"医療画像から医療用語を検出するOCRサービスである"},{"key":"D","text":"医療データのプライバシー監査ツールである"}]'::jsonb,
  'A',
  'Comprehend Medicalは、医学論文やカルテテキストから病名、投薬、処置などの医療情報を抽出するNLPサービスである。医療用語辞書を用いて高度な医療情報解析を行う。',
  'SC: ドメイン特化型サービスは対象データ特有の処理が特徴',
  ARRAY['comprehend-medical','nlp','healthcare'],
  '医療文書専用の自然言語処理サービスである点を思い出す。'
);
