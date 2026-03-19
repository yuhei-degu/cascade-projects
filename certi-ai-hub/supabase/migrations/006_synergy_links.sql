-- 006_synergy_links.sql — SC×AIFシナジーリンク自動生成

-- 既存データをクリアして再投入（既存1件 + 新規追加）
DELETE FROM public.synergy_links WHERE description != 'SC: プロンプトインジェクション攻撃の理論 ↔ AWS: Bedrock Guardrailsによる実装';

INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('fe66c7a2-6a22-425b-b119-7d485b9ab93a', '29c195d4-a92d-4fc4-9831-036be7f5c31f', 'threat_countermeasure', 'SC: プロンプトインジェクション攻撃 ↔ AIF: Bedrock Guardrailsによる防御');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('29b237b8-2128-4618-9d6b-eaa300cb4ffd', '9822a729-6078-4b8f-b6f1-39e042283800', 'threat_countermeasure', 'SC: プロンプトインジェクション攻撃 ↔ AIF: Bedrock Guardrailsによる防御');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('0dbfac85-5860-44e9-b1ce-c6bfd8a03259', 'd6bade2f-8b00-4cf4-9445-d8d26a62d47f', 'threat_countermeasure', 'SC: プロンプトインジェクション攻撃 ↔ AIF: Bedrock Guardrailsによる防御');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('d2c9f2f3-eaa1-4af6-ace0-adab6981c8f9', '2ac86dd5-3ee0-4e72-8b5b-830d1c92a5e8', 'threat_countermeasure', 'SC: 学習データ汚染攻撃 ↔ AIF: バイアス検出・Responsible AI');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('7bc650ef-d9d9-4935-b8ac-01cbbf776a5e', '1e0b05a3-59dd-4852-9148-c1ec61f2a212', 'concept', 'SC/AIF共通: LLMファインチューニングの概念と手法');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('b84c8c4a-1283-4553-9684-7bf214dd9121', 'e9b3ca1b-7f16-4fbe-bb27-eca68adb1c04', 'implementation', 'SC: RAGへの攻撃リスク ↔ AIF: BedrockでのRAG実装');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('b63d500f-f74d-4fc5-9419-c8a27ab21058', '92854a33-13ff-449c-93ab-b4f7c1261365', 'implementation', 'SC: RAGへの攻撃リスク ↔ AIF: BedrockでのRAG実装');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('cfa12785-305a-4268-a9b0-75923952702a', '25d1976f-c582-4c57-8a3d-8bd46ba562f9', 'implementation', 'SC: AIエージェントの過剰自律リスク ↔ AIF: Bedrock Agentsの設計');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('4c7d0b70-988a-4a30-b78c-464d0467189e', '22ba7d68-947a-4226-b730-e1dd599d7b9d', 'implementation', 'SC: AIエージェントの過剰自律リスク ↔ AIF: Bedrock Agentsの設計');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('655dfca4-95f4-447d-8d56-23eef45df21d', '79d6f39a-5c51-44ac-b3a8-636500d6e9f7', 'implementation', 'SC: AIエージェントの過剰自律リスク ↔ AIF: Bedrock Agentsの設計');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('20278bf9-9a8b-453f-866a-f5425ec09711', 'eef5af1e-5ccc-42fa-b3bc-4ecdf7f69827', 'concept', 'SC: 敵対的攻撃への耐性 ↔ AIF: モデルの堅牢性（Responsible AI）');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('53292a0a-21fa-4618-829a-e56894a8d0c1', '392942d9-6ce3-4787-9559-868beefad531', 'threat_countermeasure', 'SC: モデルへのプライバシー攻撃 ↔ AIF: 差分プライバシー・連合学習');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('2788e5d4-9104-4bba-8877-4862ccb752d4', '8d943be6-55d4-4084-81d6-bdbef5978e6a', 'threat_countermeasure', 'SC: モデルへのプライバシー攻撃 ↔ AIF: 差分プライバシー・連合学習');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('7438fe57-04c8-4aa3-8081-f59b00dd1c08', '983992a7-1c3d-442b-ad7c-685076dab2f5', 'threat_countermeasure', 'SC: モデルへのプライバシー攻撃 ↔ AIF: 差分プライバシー・連合学習');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('ccec9253-663b-4fec-9dd1-ae3ca8bb303b', '32e497bb-996f-4ae3-9b3e-4dae81d761e5', 'implementation', 'SC: IAM・VPCによるアクセス制御 ↔ AIF: BedrockのIAM/VPCエンドポイント設計');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('a83907da-b9bf-4fe8-93dd-cb2a44489327', '093f5039-b13c-42d7-b885-cd932e047307', 'implementation', 'SC: IAM・VPCによるアクセス制御 ↔ AIF: BedrockのIAM/VPCエンドポイント設計');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('65017adc-81ac-4aa4-8be4-c2792a334520', 'c3533190-8895-4444-83fe-3642a859fa53', 'implementation', 'SC: IAM・VPCによるアクセス制御 ↔ AIF: BedrockのIAM/VPCエンドポイント設計');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('520ba6ad-37fc-4f5f-a7cb-11239ec4b629', 'd5e9e104-e111-4cc4-bb01-3e7ed5489f1f', 'concept', 'SC: ISMSリスク管理 ↔ AIF: NIST AI RMFによるAIリスク管理');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('15ad0bb5-24a5-42de-9928-dc82787f8b9b', 'cb9932e5-1fbc-4053-8e36-574342587b54', 'concept', 'SC: ISMSリスク管理 ↔ AIF: NIST AI RMFによるAIリスク管理');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('47dee7b4-6f6f-4d23-97df-4ea1f205292c', '0d24b081-89b8-474f-80f1-467248cbb4bc', 'concept', 'SC: セキュリティ監査の透明性 ↔ AIF: 説明可能なAI（SHAP/LIME）');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('5ff710af-7fcb-4b96-9c5b-a6fd29f7342d', '126f9334-21a0-4935-bd75-64e092e609d3', 'concept', 'SC: ソフトウェアサプライチェーン攻撃 ↔ AIF: Bedrock Marketplace利用管理');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('3272737b-8e1a-4ac3-9bf7-a31a17ee02f1', '8b9188fd-2ad0-40f2-9a94-6f66f2e3e775', 'concept', 'SC: ソフトウェアサプライチェーン攻撃 ↔ AIF: Bedrock Marketplace利用管理');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('6d6b7c67-f597-4b7b-8d0d-97144ca03dd5', 'a940f05a-825a-424f-9f61-e773c0c04a03', 'implementation', 'SC: 暗号化・KMSによる鍵管理 ↔ AIF: Bedrock/AWS KMSでの暗号化');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('d187bf1d-019e-428a-b66c-89ca399148d8', '1530a900-8146-415b-913f-0c2ca9d4bdba', 'implementation', 'SC: 監査ログ設計 ↔ AIF: CloudTrailによるAI APIの監査');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('77ab09af-faa8-41ed-b559-b277bd7391c5', '6a6c4e97-d80f-4555-9eaa-3de0572d3b1f', 'implementation', 'SC: 監査ログ設計 ↔ AIF: CloudTrailによるAI APIの監査');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('e26e91b2-771b-4d0a-b63d-c296bd75179b', 'af6b55d4-be58-4f60-ac73-03118449a10a', 'implementation', 'SC: 監査ログ設計 ↔ AIF: CloudTrailによるAI APIの監査');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('86c5d45b-7151-4ba8-99e2-cbc352a1ea84', '38d7c40c-64bf-4649-bd71-0f23f967284d', 'concept', 'SC: インシデント対応・フォレンジック ↔ AIF: ドリフト検知・継続監視');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('e33db893-d141-49b0-9186-bf7510d8bcbc', 'a63486fd-03c2-4744-a2fd-6bba709d871e', 'concept', 'SC: インシデント対応・フォレンジック ↔ AIF: ドリフト検知・継続監視');
INSERT INTO public.synergy_links(sc_question_id, aws_question_id, link_type, description)
VALUES ('26088a1c-4991-4c5e-96ea-f1995fa17f4f', 'ad1b2807-1ba8-4fe6-8545-6a71679e580a', 'concept', 'SC: ゼロトラスト・最小特権 ↔ AIF: BedrockのIAM最小権限設計');