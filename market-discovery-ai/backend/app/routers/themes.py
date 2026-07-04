from __future__ import annotations

from datetime import date, datetime, timezone
from math import ceil
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import settings
from app.schemas.schemas import (
    BusinessScoreOut,
    CompetitionBreakdown,
    HealthResponse,
    IngestRequest,
    IngestResponse,
    MonetizationBreakdown,
    PaginationMeta,
    RankingResponse,
    ThemeDetail,
    ThemeDetailResponse,
    ThemeRankingItem,
)

router = APIRouter()

AUTO_DEVELOP_STATUS = "auto_develop"


def _score(
    demand: float,
    monetization: float,
    competition: float,
    difficulty: float,
    evidence_strength: float,
    japanese_market_fit: float,
) -> float:
    return round(
        demand * 0.32
        + monetization * 0.22
        + (100 - competition) * 0.14
        + (100 - difficulty) * 0.10
        + evidence_strength * 0.12
        + japanese_market_fit * 0.10,
        1,
    )


def _theme(
    *,
    id: int,
    title: str,
    category: str,
    description: str,
    keywords: list[str],
    biz_models: list[str],
    demand: float,
    monetization: float,
    competition: float,
    difficulty: float,
    evidence_strength: float,
    japanese_market_fit: float,
    screening_status: str,
    screening_reason: str,
    post_count: int,
    comment_count_total: int,
    growth: float,
    opportunity: str,
    target_user: str,
    willingness_to_pay: str,
    first_cut_goal: str,
    recommended_project_name: str,
    automation_slug: str,
    mvp_scope: list[str],
    risks: list[str],
    evidence: list[str],
    source_urls: list[str],
    source_types: list[str],
    collection_queries: list[str],
    pass_reasons: list[str],
    reject_reasons: list[str],
    next_research_actions: list[str],
) -> ThemeDetail:
    business_index = _score(demand, monetization, competition, difficulty, evidence_strength, japanese_market_fit)
    score = BusinessScoreOut(
        score_date=date.today(),
        demand_score=demand,
        monetization_score=monetization,
        competition_score=competition,
        dev_difficulty_score=difficulty,
        business_index=business_index,
        monetization_detail=MonetizationBreakdown(
            money_word_score=monetization,
            urgency_score=max(35, demand - 6),
            purchase_intent_score=min(96, monetization + 7),
            severity_score=max(35, demand - 2),
        ),
        competition_detail=CompetitionBreakdown(
            search_volume_score=min(98, demand + 4),
            app_exists_score=competition,
            ad_spend_score=max(15, competition - 10),
        ),
    )
    return ThemeDetail(
        id=id,
        title=title,
        category=category,
        description=description,
        top_keywords=keywords,
        post_count=post_count,
        comment_count_total=comment_count_total,
        post_growth_rate=growth,
        biz_models=biz_models,
        business_index=business_index,
        demand_score=demand,
        monetization_score=monetization,
        competition_score=competition,
        dev_difficulty_score=difficulty,
        evidence_strength=evidence_strength,
        japanese_market_fit=japanese_market_fit,
        screening_status=screening_status,
        screening_reason=screening_reason,
        score=score,
        keywords_list=[
            {"word": word, "tfidf_score": round(1.0 - index * 0.04, 3), "is_monetization": index < 3}
            for index, word in enumerate(keywords)
        ],
        updated_at=datetime.now(timezone.utc),
        opportunity=opportunity,
        target_user=target_user,
        willingness_to_pay=willingness_to_pay,
        first_cut_goal=first_cut_goal,
        recommended_project_name=recommended_project_name,
        automation_slug=automation_slug,
        mvp_scope=mvp_scope,
        risks=risks,
        evidence=evidence,
        source_urls=source_urls,
        source_types=source_types,
        collection_queries=collection_queries,
        pass_reasons=pass_reasons,
        reject_reasons=reject_reasons,
        next_research_actions=next_research_actions,
    )


DEMO_THEMES: list[ThemeDetail] = [
    _theme(
        id=1,
        title="中小企業セキュリティ診断・取引先説明パック",
        category="中小企業セキュリティ",
        description="最低限の対策を見える化し、取引先へ説明できる改善レポートを作る軽量SaaS。",
        keywords=["中小企業", "ランサムウェア", "取引先説明", "SCS評価", "セキュリティ", "チェックリスト"],
        biz_models=["月額SaaS", "診断レポート課金"],
        demand=94,
        monetization=86,
        competition=46,
        difficulty=42,
        evidence_strength=88,
        japanese_market_fit=96,
        screening_status="auto_develop",
        screening_reason="日本の中小企業課題、支払い理由、一次MVPの狭さが揃っているため最優先。",
        post_count=260,
        comment_count_total=1280,
        growth=0.42,
        opportunity="中小企業向けセキュリティ対策の説明責任が強まり、取引先提出や監査前の軽量チェックに需要がある。",
        target_user="一人情シス、総務兼IT担当、中小企業経営者、取引先からセキュリティ確認を受ける企業。",
        willingness_to_pay="月額5,000円から15,000円。取引先説明や監査対応に直結すると支払い理由が明確。",
        first_cut_goal="20問の自己診断から、リスク一覧、次の改善、取引先説明レポートを表示する。",
        recommended_project_name="SMB Security Helper",
        automation_slug="smb-security-helper",
        mvp_scope=["日本語の自己診断フォーム", "改善優先度スコア", "取引先に見せる説明レポート"],
        risks=["法的保証や認証取得をうたわない", "実企業の機密情報を保存しない", "専門家確認が必要な表現を分離する"],
        evidence=[
            "公的機関のセキュリティ注意喚起とガイドラインが継続して増えている。",
            "中小企業では専任担当不足により、説明資料作成とチェックリスト運用が詰まりやすい。",
            "取引先からのセキュリティ確認は収益・営業に直結しやすい。",
        ],
        source_urls=["https://www.ipa.go.jp/", "https://www.meti.go.jp/"],
        source_types=["公的機関", "業界課題", "既存業務の非効率"],
        collection_queries=["中小企業 セキュリティ チェックリスト", "取引先 セキュリティ 確認 中小企業", "ランサムウェア 中小企業 対策"],
        pass_reasons=["日本市場の痛みが強い", "支払い理由が明確", "ローカルMVPで検証可能"],
        reject_reasons=["監査保証サービスに広げると重い", "実データ保管を始めるとセキュリティ設計が必要"],
        next_research_actions=["実際の取引先確認項目を10社分の想定で収集", "競合SaaSの価格帯を比較", "無料チェックリストとの差別化を検証"],
    ),
    _theme(
        id=2,
        title="介護申し送り・記録サマリーAI",
        category="介護DX",
        description="申し送り、ヒヤリハット、家族共有メモを短時間で整理する日本語AIツール。",
        keywords=["介護人材不足", "申し送り", "記録", "家族共有", "ヒヤリハット", "シフト"],
        biz_models=["施設向け月額", "拠点課金"],
        demand=91,
        monetization=79,
        competition=48,
        difficulty=53,
        evidence_strength=82,
        japanese_market_fit=94,
        screening_status="auto_develop",
        screening_reason="人手不足と記録負担が強いが、個人情報と医療判断を避けたMVPに限定する必要がある。",
        post_count=232,
        comment_count_total=1095,
        growth=0.38,
        opportunity="介護現場の記録・申し送り負担は大きく、人手不足の中で時短ツールへの需要がある。",
        target_user="小規模介護施設、訪問介護事業所、現場リーダー、ケアマネ。",
        willingness_to_pay="1拠点月額8,000円から30,000円。残業削減と伝達漏れ防止に価値がある。",
        first_cut_goal="申し送りメモから、注意事項、家族共有、次シフト確認を自動整理する。",
        recommended_project_name="Care Handoff AI",
        automation_slug="care-handoff-ai",
        mvp_scope=["ダミー申し送りメモの貼り付け", "注意・緊急・家族共有・次シフトの分類", "個人情報を入れないデモデータ運用"],
        risks=["医療判断をしない", "実利用前に個人情報の保存方針が必要", "施設ごとの用語差に対応が必要"],
        evidence=[
            "介護人材不足と記録業務の負担は継続課題。",
            "申し送りの品質は事故防止と現場負担に直結する。",
            "生成AIで文章整理する価値が分かりやすい。",
        ],
        source_urls=["https://www.mhlw.go.jp/"],
        source_types=["公的統計", "現場業務の非効率", "人手不足"],
        collection_queries=["介護 申し送り 記録 負担", "介護 人材不足 DX", "ヒヤリハット 記録 AI"],
        pass_reasons=["日本市場の人手不足に合う", "UIだけで一次MVPを作れる", "利用者が価値を理解しやすい"],
        reject_reasons=["医療・介護判断まで踏み込むと危険", "実個人データを扱うには設計が重い"],
        next_research_actions=["介護記録ソフト競合を整理", "施設規模別の支払い可能額を仮説化", "個人情報なしのデモ入力例を増やす"],
    ),
    _theme(
        id=3,
        title="地方観光の多言語接客コンシェルジュAI",
        category="観光DX",
        description="地方の宿泊・飲食・観光事業者向けにFAQ、混雑分散、周辺提案をまとめる接客支援ツール。",
        keywords=["インバウンド", "地方誘客", "多言語FAQ", "観光DX", "混雑分散", "宿泊"],
        biz_models=["月額SaaS", "施設別プラン"],
        demand=88,
        monetization=76,
        competition=44,
        difficulty=48,
        evidence_strength=78,
        japanese_market_fit=92,
        screening_status="auto_develop",
        screening_reason="訪日需要と地方の人手不足に合う。予約・決済を外せば安全な一次MVPにできる。",
        post_count=205,
        comment_count_total=920,
        growth=0.36,
        opportunity="訪日観光と地方誘客の拡大に対して、現場の多言語対応と周辺提案の負担が増える。",
        target_user="地方ホテル、旅館、飲食店、観光協会、小規模ツアー事業者。",
        willingness_to_pay="月額6,000円から20,000円。人手不足でも外国語対応を増やせる価値がある。",
        first_cut_goal="施設情報と地域情報から、日本語FAQと周遊ルート案を生成する。",
        recommended_project_name="Local Tourism Concierge AI",
        automation_slug="local-tourism-concierge-ai",
        mvp_scope=["施設情報入力", "日本語FAQと英語FAQの生成", "混雑時の代替ルート案"],
        risks=["営業時間や料金は確認済み情報として扱う", "翻訳品質と文化差への配慮が必要", "地域情報の更新フローが必要"],
        evidence=[
            "訪日観光と地方誘客は政策・事業者双方の関心が高い。",
            "地方小規模事業者では多言語対応と人材確保が重い。",
            "予約・決済なしの情報整理MVPなら低リスクで始められる。",
        ],
        source_urls=["https://www.mlit.go.jp/kankocho/"],
        source_types=["公的計画", "業界需要", "現場接客負担"],
        collection_queries=["地方観光 インバウンド 多言語対応", "観光DX 人手不足", "旅館 FAQ 多言語"],
        pass_reasons=["日本市場と訪日需要に合う", "一次MVPが軽い", "横展開しやすい"],
        reject_reasons=["予約・決済まで入れると重い", "現地情報の誤りは信用毀損につながる"],
        next_research_actions=["地域別ユースケースを3つ作る", "既存翻訳/観光SaaSとの差別化を確認", "施設入力テンプレートを作る"],
    ),
    _theme(
        id=4,
        title="中小企業AI導入・社内FAQ整備アシスタント",
        category="AI導入支援",
        description="社内FAQ、利用ルール、30日導入計画を作るAI導入前の業務整理ツール。",
        keywords=["AI導入", "社内FAQ", "業務整理", "ガバナンス", "一人情シス"],
        biz_models=["月額SaaS", "テンプレート販売"],
        demand=86,
        monetization=73,
        competition=51,
        difficulty=39,
        evidence_strength=70,
        japanese_market_fit=88,
        screening_status="watch",
        screening_reason="需要は強いが競合と無料情報が多い。独自性が見えるまで候補維持。",
        post_count=244,
        comment_count_total=1010,
        growth=0.33,
        opportunity="AI導入したいが進め方が分からない中小企業に、業務棚卸しと社内説明を支援する。",
        target_user="50-299人規模の企業、総務、情シス、経営企画、部門長。",
        willingness_to_pay="月額5,000円から12,000円。導入前の整理と社内合意形成に価値がある。",
        first_cut_goal="業務メモからAI導入候補、リスク、社内FAQ、30日導入ロードマップを出す。",
        recommended_project_name="SMB AI Onboarding Kit",
        automation_slug="smb-ai-onboarding-kit",
        mvp_scope=["業務メモの貼り付け", "AI活用候補とリスク分類", "社内説明FAQと30日導入計画"],
        risks=["AI導入効果を過大に約束しない", "社内データや顧客データを入れないデモから開始", "ガバナンスと人間判断を明記する"],
        evidence=["中小企業のAI導入は関心が高いが進め方で詰まりやすい。", "社内説明と運用ルール作成は横展開しやすい。"],
        source_urls=["https://www.jipdec.or.jp/", "https://www.meti.go.jp/"],
        source_types=["業界調査", "AI導入課題", "社内運用"],
        collection_queries=["中小企業 AI導入 課題", "生成AI 社内ルール FAQ", "一人情シス AI活用"],
        pass_reasons=["需要は広い", "作りやすい", "AI Company OSとも相性が良い"],
        reject_reasons=["汎用すぎる", "無料テンプレートとの差別化が必要"],
        next_research_actions=["業種別に絞る", "無料テンプレートとの差分を設計", "社内FAQ生成のサンプルを作る"],
    ),
    _theme(
        id=5,
        title="建設・工事業向け現場書類AI",
        category="現場DX",
        description="安全日報、写真台帳、引き渡しチェックをまとめる現場書類の時短ツール。",
        keywords=["建設", "安全日報", "写真台帳", "引き渡し", "人手不足", "現場DX"],
        biz_models=["月額SaaS", "現場単位課金"],
        demand=87,
        monetization=78,
        competition=57,
        difficulty=58,
        evidence_strength=74,
        japanese_market_fit=86,
        screening_status="watch",
        screening_reason="痛みは強いが、写真・現場情報・法令表現が絡むため一次MVPは狭く切る必要がある。",
        post_count=190,
        comment_count_total=880,
        growth=0.27,
        opportunity="現場書類と顧客提出物の作成負担を減らす。",
        target_user="小規模建設会社、工務店、現場監督、協力会社。",
        willingness_to_pay="月額8,000円から25,000円。書類作成と提出前チェックの時短に支払い理由がある。",
        first_cut_goal="サンプル現場メモから、安全日報、未完了チェック、顧客提出チェックリストを出す。",
        recommended_project_name="Field Docs AI",
        automation_slug="field-docs-ai",
        mvp_scope=["現場メモ入力", "安全日報と未完了チェック生成", "写真台帳の項目テンプレート"],
        risks=["建設法規や安全基準の最終判断は人間が行う", "写真や図面など現場情報の扱い設計が必要", "競合SaaSとの差別化が必要"],
        evidence=["建設業でも人手不足と書類負担は継続課題。", "現場ごとの定型書類は生成AIの支援対象にしやすい。"],
        source_urls=["https://www.meti.go.jp/", "https://www.mlit.go.jp/"],
        source_types=["業界課題", "現場書類", "人手不足"],
        collection_queries=["建設 現場書類 AI", "安全日報 写真台帳 時短", "工務店 DX 人手不足"],
        pass_reasons=["現場の痛みが強い", "支払い理由がある"],
        reject_reasons=["競合が多い", "写真・図面対応まで広げると重い"],
        next_research_actions=["小規模工務店向けに絞る", "写真なしMVPで検証", "既存現場管理SaaSの価格を比較"],
    ),
]


DEMO_THEMES.extend(
    [
        _theme(
            id=6,
            title="小規模EC商品ページ改善AI",
            category="EC運営DX",
            description="商品名、説明文、レビュー傾向から、売れにくい理由と改善案を日本語で出すEC担当者向けツール。",
            keywords=["小規模EC", "商品ページ", "レビュー分析", "購入不安", "売上改善"],
            biz_models=["月額SaaS", "改善レポート課金"],
            demand=84,
            monetization=75,
            competition=60,
            difficulty=35,
            evidence_strength=72,
            japanese_market_fit=86,
            screening_status="watch",
            screening_reason="需要はあるが競合も多い。日本語商品ページの改善と小規模EC向けに絞れば検証価値がある。",
            post_count=188,
            comment_count_total=820,
            growth=0.29,
            opportunity="小規模ECでは商品説明、レビュー対応、購入不安の解消に手が回りにくい。",
            target_user="楽天、BASE、Shopify、Amazonなどを運営する小規模事業者。",
            willingness_to_pay="月額3,000円から12,000円。商品改善が売上に直結すれば支払い理由がある。",
            first_cut_goal="商品情報を貼ると、改善スコア、修正文、購入不安の解消案を出す。",
            recommended_project_name="EC Copy Doctor AI",
            automation_slug="ec-copy-doctor-ai",
            mvp_scope=["商品情報入力", "購入不安の抽出", "改善コピー生成"],
            risks=["薬機法や景表法など表現リスクを避ける", "売上保証をしない", "競合が多いため対象を絞る"],
            evidence=["EC運営では商品説明とレビュー改善の負担が大きい。", "日本語の自然な改善案はAI支援と相性がよい。"],
            source_urls=["https://www.meti.go.jp/"],
            source_types=["EC運営課題", "中小企業DX"],
            collection_queries=["小規模EC 商品説明 改善 AI", "EC レビュー分析 購入不安", "Shopify 商品ページ 改善"],
            pass_reasons=["作りやすい", "日本語品質が差別化になる", "支払い理由が売上に近い"],
            reject_reasons=["競合が多い", "法規制表現に注意が必要"],
            next_research_actions=["競合の価格帯を調べる", "商品カテゴリを3つに絞る", "景表法リスクの禁止表現を整理する"],
        ),
        _theme(
            id=7,
            title="学習塾・習い事の保護者連絡AI",
            category="教育運営DX",
            description="授業メモや欠席連絡から、保護者向けの丁寧な連絡文と次回フォローを作る教室運営ツール。",
            keywords=["学習塾", "保護者連絡", "習い事", "授業メモ", "連絡文"],
            biz_models=["月額SaaS", "教室単位課金"],
            demand=82,
            monetization=70,
            competition=52,
            difficulty=34,
            evidence_strength=69,
            japanese_market_fit=91,
            screening_status="watch",
            screening_reason="日本語の丁寧な文面作成に価値が出やすい。まずは個人情報を入れないテンプレート生成で検証する。",
            post_count=176,
            comment_count_total=760,
            growth=0.25,
            opportunity="小規模教室は保護者対応、欠席連絡、授業報告の文面作成に時間を使っている。",
            target_user="個人塾、英会話教室、ピアノ教室、スポーツ教室の運営者。",
            willingness_to_pay="月額2,000円から8,000円。連絡品質と時短に支払い理由がある。",
            first_cut_goal="授業メモから、保護者連絡、次回宿題、講師向け注意点を生成する。",
            recommended_project_name="Lesson Message AI",
            automation_slug="lesson-message-ai",
            mvp_scope=["授業メモ入力", "保護者連絡文生成", "次回フォロー生成"],
            risks=["児童の個人情報を扱わない初期設計にする", "教育判断をAIに任せない", "文面の責任は人間確認にする"],
            evidence=["教育現場では保護者連絡の負担が大きい。", "日本語の丁寧表現生成はAIの強みが出やすい。"],
            source_urls=["https://www.mext.go.jp/"],
            source_types=["教育運営課題", "小規模事業者"],
            collection_queries=["学習塾 保護者連絡 時短", "習い事 連絡文 AI", "授業報告 テンプレート"],
            pass_reasons=["日本語品質が価値になる", "小さく作れる", "個人開発向き"],
            reject_reasons=["個人情報への注意が必要", "学校向けに広げると重くなる"],
            next_research_actions=["個人塾向けに絞る", "個人情報なしのサンプル入力を作る", "連絡文テンプレートを比較する"],
        ),
        _theme(
            id=8,
            title="補助金・助成金の下書き整理AI",
            category="士業・経営支援DX",
            description="事業内容メモから、補助金申請の下書き材料、確認不足、必要資料を整理する支援ツール。",
            keywords=["補助金", "助成金", "申請書", "下書き", "経営支援"],
            biz_models=["レポート課金", "月額SaaS"],
            demand=85,
            monetization=82,
            competition=63,
            difficulty=55,
            evidence_strength=76,
            japanese_market_fit=88,
            screening_status="watch",
            screening_reason="支払い意欲は高いが法務・制度誤認リスクがある。申請代行ではなく下書き整理に限定して検証する。",
            post_count=201,
            comment_count_total=930,
            growth=0.31,
            opportunity="補助金申請は情報整理と文章化の負担が大きく、士業や事業者の下準備に需要がある。",
            target_user="小規模事業者、商工会議所相談員、士業補助者。",
            willingness_to_pay="1件3,000円から20,000円。採択保証ではなく準備工数削減に価値を置く。",
            first_cut_goal="事業メモから、申請ストーリー、必要資料、確認質問を出す。",
            recommended_project_name="Grant Draft Organizer AI",
            automation_slug="grant-draft-organizer-ai",
            mvp_scope=["事業メモ入力", "申請ストーリー整理", "不足資料チェック"],
            risks=["採択保証をしない", "制度の最新性確認が必要", "法務・行政書士領域の表現に注意する"],
            evidence=["補助金申請は下書きと資料整理に時間がかかる。", "最終申請ではなく準備支援ならMVP化しやすい。"],
            source_urls=["https://www.chusho.meti.go.jp/"],
            source_types=["補助金情報", "中小企業支援"],
            collection_queries=["補助金 申請書 下書き AI", "助成金 必要書類 整理", "小規模事業者 補助金 準備"],
            pass_reasons=["支払い意欲が高い", "下書き支援に絞れば作れる"],
            reject_reasons=["制度誤認リスクがある", "法務表現に注意が必要"],
            next_research_actions=["対象補助金を1つに絞る", "禁止表現を整理する", "専門家確認が必要な箇所を明示する"],
        ),
    ]
)


def _practical_theme(
    id: int,
    title: str,
    category: str,
    description: str,
    keywords: list[str],
    project: str,
    slug: str,
    status: str,
    metrics: tuple[float, float, float, float, float, float],
    target_user: str,
    first_cut_goal: str,
    willingness_to_pay: str,
) -> ThemeDetail:
    demand, monetization, competition, difficulty, evidence_strength, japanese_market_fit = metrics
    return _theme(
        id=id,
        title=title,
        category=category,
        description=description,
        keywords=keywords,
        biz_models=["月額SaaS", "テンプレート課金", "初期設定サポート"],
        demand=demand,
        monetization=monetization,
        competition=competition,
        difficulty=difficulty,
        evidence_strength=evidence_strength,
        japanese_market_fit=japanese_market_fit,
        screening_status=status,
        screening_reason=(
            "日本の小規模事業者がすぐ困っている作業で、ローカルMVPに切り出しやすい。一次完成品を作って検証する価値が高い。"
            if status == "auto_develop"
            else "需要はあるが、競合・導入経路・法務リスクの確認をもう一段行ってから自動開発に回す。"
        ),
        post_count=round(demand * 2.2 + id),
        comment_count_total=round(demand * 9.5 + monetization * 2),
        growth=round(0.18 + (demand - 70) / 180, 2),
        opportunity=description,
        target_user=target_user,
        willingness_to_pay=willingness_to_pay,
        first_cut_goal=first_cut_goal,
        recommended_project_name=project,
        automation_slug=slug,
        mvp_scope=[
            "サンプル入力から結果が出るローカルMVP",
            "日本語UIで、初心者でも迷わない1画面",
            "CSVまたはMarkdownで出力できる確認用レポート",
        ],
        risks=[
            "法務・医療・税務などの最終判断をAIに任せない",
            "個人情報や実データは初期MVPでは保存しない",
            "既存SaaSの単なる劣化コピーにならないよう対象業務を絞る",
        ],
        evidence=[
            "日本企業の人手不足、紙・Excel・メール運用、説明資料作成の非効率に直結する",
            "個人開発でも最初のMVPを作りやすく、ユーザーインタビューで検証しやすい",
        ],
        source_urls=["https://www.meti.go.jp/", "https://www.soumu.go.jp/"],
        source_types=["業務課題", "中小企業DX", "現場オペレーション"],
        collection_queries=[f"{keyword} AI 自動化 日本" for keyword in keywords[:4]],
        pass_reasons=["痛みが具体的", "日本語UIの価値が出る", "小さく作って検証できる"],
        reject_reasons=["責任範囲が広すぎる場合", "実データ保存が先に必要な場合", "販売先が曖昧な場合"],
        next_research_actions=["想定ユーザーを1業種に絞る", "既存代替手段を3つ比較する", "初回課金できる場面を決める"],
    )


DEMO_THEMES.extend(
    [
        _practical_theme(9, "社内問い合わせ一次対応AI", "社内業務DX", "総務・情シス・人事に集中する同じ質問を、社内ルールとFAQから一次回答する小規模会社向けAI。", ["社内FAQ", "情シス問い合わせ", "総務問い合わせ", "人事FAQ"], "Internal Helpdesk AI", "internal-helpdesk-ai", "auto_develop", (90, 82, 55, 44, 78, 94), "総務・情シス担当が少ない中小企業、バックオフィス担当者、一人情シス", "社内ルールを貼ると、質問への回答、参照元、担当者へ回す条件を1画面で出す。", "月額5,000〜20,000円。問い合わせ削減と新人対応に価値が出る。"),
        _practical_theme(10, "BtoB営業 商談メモから提案書AI", "営業DX", "商談メモを貼るだけで、顧客課題、提案骨子、次回アクション、メール文面まで整理する営業支援AI。", ["商談メモ", "提案書", "営業DX", "フォローアップ"], "Sales Proposal Copilot JP", "sales-proposal-copilot-jp", "auto_develop", (88, 84, 62, 42, 74, 91), "中小BtoB企業の営業担当、営業マネージャー、個人営業代行", "商談メモから提案書アウトライン、次回メール、失注リスクを生成する。", "月額3,000〜15,000円。提案準備の時短が明確。"),
        _practical_theme(11, "不動産内見メモ・追客AI", "不動産DX", "内見時の会話メモから、顧客の希望条件、懸念、次に送る物件、追客メールを整理する。", ["不動産内見", "追客", "営業メモ", "物件提案"], "Real Estate Followup AI", "real-estate-followup-ai", "watch", (82, 78, 58, 46, 68, 88), "賃貸仲介、不動産営業、小規模不動産会社", "内見メモから追客文面と次に確認すべき条件を出す。", "月額3,000〜12,000円。営業機会損失を減らせる。"),
        _practical_theme(12, "飲食店シフト穴埋め連絡AI", "店舗運営DX", "急な欠勤や人手不足時に、候補者、連絡文、優先順位、店長判断メモを作る店舗向け支援AI。", ["飲食店シフト", "欠勤対応", "店長業務", "アルバイト連絡"], "Shift Rescue AI", "shift-rescue-ai", "watch", (83, 72, 50, 38, 65, 90), "飲食店店長、小規模店舗、アルバイト管理担当", "欠勤条件を入れると、連絡順、文面、注意点を出す。", "月額1,000〜6,000円。店舗単位で低価格導入しやすい。"),
        _practical_theme(13, "製造業 作業手順書AI", "製造業DX", "熟練者のメモや動画台本から、新人向けの作業手順、注意点、チェックリストを作る。", ["作業手順書", "製造業", "技能継承", "新人教育"], "Factory Procedure AI", "factory-procedure-ai", "auto_develop", (89, 86, 57, 54, 78, 93), "町工場、製造業の現場リーダー、品質管理担当", "作業メモから新人向け手順書と危険ポイントを生成する。", "月額10,000〜30,000円。技能継承と教育コスト削減に直結。"),
        _practical_theme(14, "士業 面談メモから提案書AI", "士業DX", "相談メモから、論点整理、次回確認事項、提案書たたき台を作る。ただし最終判断は専門家が行う。", ["士業", "面談メモ", "提案書", "顧問契約"], "Professional Service Brief AI", "professional-service-brief-ai", "watch", (81, 83, 63, 52, 72, 87), "行政書士、社労士、税理士、コンサル、小規模士業事務所", "面談メモから論点、必要資料、提案書骨子を出す。", "月額5,000〜25,000円。面談後の整理に価値がある。"),
        _practical_theme(15, "採用面接メモ・候補者比較AI", "採用DX", "面接メモを基準に沿って整理し、候補者比較、懸念点、次回質問を作る採用担当向けAI。", ["採用面接", "候補者比較", "面接メモ", "評価基準"], "Hiring Notes AI", "hiring-notes-ai", "watch", (80, 74, 55, 43, 66, 86), "中小企業の採用担当、経営者、現場面接官", "面接メモから評価表、次回質問、採用リスクを出す。", "月額3,000〜15,000円。採用判断の抜け漏れ防止に価値。"),
        _practical_theme(16, "クリニック電話メモ整理AI", "医療事務DX", "電話内容を診断せず、予約・持ち物・折り返し・事務連絡として整理するクリニック向けAI。", ["クリニック電話", "医療事務", "予約メモ", "折り返し"], "Clinic Call Memo AI", "clinic-call-memo-ai", "watch", (84, 80, 58, 56, 70, 88), "小規模クリニック、医療事務、受付担当", "電話メモから予約確認、折り返し、事務タスクを分類する。", "月額5,000〜20,000円。医療判断を避けた事務特化なら現実的。"),
        _practical_theme(17, "自治会・町内会 文書作成AI", "地域運営DX", "回覧板、イベント案内、会計報告の説明文などを、高齢者にも読みやすい日本語で作る。", ["自治会", "町内会", "回覧板", "地域文書"], "Community Notice AI", "community-notice-ai", "watch", (76, 55, 35, 28, 61, 93), "自治会役員、町内会、地域団体、PTA", "伝えたい内容から、回覧文、LINE文、掲示文を作る。", "買い切り1,000〜3,000円、または地域団体向け低額プラン。"),
        _practical_theme(18, "請求・入金消込チェックAI", "経理DX", "請求一覧と入金メモを突き合わせ、未入金、金額違い、確認メール文を出す小規模経理向けAI。", ["入金消込", "請求管理", "経理", "未入金"], "Payment Reconcile AI", "payment-reconcile-ai", "auto_develop", (87, 88, 61, 49, 75, 90), "小規模事業者、経理担当、フリーランス、バックオフィス代行", "CSV貼り付けから未入金候補と確認文面を出す。", "月額3,000〜20,000円。金額に直結するため支払い意欲が高い。"),
        _practical_theme(19, "店舗口コミ返信AI", "店舗運営DX", "Googleマップ等の口コミに対し、炎上を避け、店の温度感に合う返信案を作る。", ["口コミ返信", "Googleマップ", "店舗集客", "レビュー対応"], "Review Reply AI JP", "review-reply-ai-jp", "watch", (82, 70, 68, 30, 70, 89), "飲食店、美容室、整体、宿泊施設、小規模店舗", "口コミ文から、丁寧・親しみ・謝罪の3案を作る。", "月額1,000〜8,000円。低単価だが導入しやすい。"),
        _practical_theme(20, "日本語LP改善AI", "マーケティングDX", "LP文面を見て、誰向けか、CTA、信頼材料、不安解消、ファーストビューを改善する。", ["LP改善", "CTA", "日本語コピー", "個人開発"], "JP Landing Page Doctor", "jp-landing-page-doctor", "auto_develop", (85, 81, 64, 36, 74, 88), "個人開発者、小規模SaaS、店舗、講座販売者", "LPの文面を貼ると、改善点、修正文、CTA候補を出す。", "買い切り1,980円〜、月額3,000〜10,000円。"),
        _practical_theme(21, "小規模物流 配車メモAI", "物流DX", "配送先、時間、車両、注意点をメモから整理し、配車確認表と連絡文を作る。", ["配車", "物流", "配送メモ", "ドライバー連絡"], "Dispatch Memo AI", "dispatch-memo-ai", "watch", (81, 79, 52, 57, 66, 86), "小規模運送会社、配送管理者、地域物流", "配送メモから配車表とドライバー連絡文を作る。", "月額5,000〜25,000円。現場時短に直結。"),
        _practical_theme(22, "問い合わせ分類・FAQ改善AI", "カスタマーサポートDX", "問い合わせ文を分類し、回答テンプレート、FAQに追加すべき項目、改善優先度を出す。", ["問い合わせ分類", "FAQ改善", "カスタマーサポート", "テンプレート返信"], "Support Triage AI", "support-triage-ai", "auto_develop", (86, 80, 57, 38, 73, 89), "個人開発SaaS、小規模EC、スクール、店舗問い合わせ担当", "問い合わせログから分類、返信案、FAQ候補を生成する。", "月額3,000〜15,000円。問い合わせ削減に価値がある。"),
        _practical_theme(23, "研修動画 台本・確認テストAI", "教育コンテンツDX", "社内研修のメモから、短い動画台本、字幕案、理解度チェック問題を作る。", ["研修動画", "台本", "確認テスト", "社内教育"], "Training Script AI", "training-script-ai", "watch", (79, 73, 50, 39, 65, 84), "中小企業の教育担当、店舗本部、講座販売者", "研修メモから3分動画台本と5問テストを出す。", "月額3,000〜12,000円。動画自動制作とも接続しやすい。"),
        _practical_theme(24, "議事録から決定事項・宿題抽出AI", "会議DX", "会議メモから、決定事項、担当者、期限、未決事項だけを抽出し、次回確認リストを作る。", ["議事録", "決定事項", "宿題管理", "会議効率化"], "Meeting Action Extractor JP", "meeting-action-extractor-jp", "watch", (83, 72, 70, 32, 76, 88), "中小企業、個人事業、プロジェクト管理者、自治体・団体", "会議メモから決定事項と宿題だけを1画面で出す。", "月額2,000〜10,000円。競合は多いが用途を絞れば使える。"),
    ]
)


def _ranking_item(theme: ThemeDetail) -> ThemeRankingItem:
    return ThemeRankingItem(
        **theme.model_dump(
            exclude={
                "score",
                "keywords_list",
                "updated_at",
                "opportunity",
                "target_user",
                "willingness_to_pay",
                "first_cut_goal",
                "recommended_project_name",
                "automation_slug",
                "mvp_scope",
                "risks",
                "evidence",
                "source_urls",
                "source_types",
                "collection_queries",
                "pass_reasons",
                "reject_reasons",
                "next_research_actions",
            }
        )
    )


def _ranked_themes() -> list[ThemeDetail]:
    status_weight = {"auto_develop": 2, "watch": 1, "reject": 0}
    return sorted(
        DEMO_THEMES,
        key=lambda theme: (status_weight.get(theme.screening_status, 0), theme.business_index or 0),
        reverse=True,
    )


def _mvp_queue_themes(limit: int = 3) -> list[ThemeDetail]:
    return [theme for theme in _ranked_themes() if theme.screening_status == AUTO_DEVELOP_STATUS][:limit]


@router.get("/themes", response_model=RankingResponse)
async def get_theme_ranking(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = None,
    max_competition: Optional[float] = Query(default=None, ge=0, le=100),
    min_business_index: Optional[float] = Query(default=None, ge=0, le=100),
) -> RankingResponse:
    themes = _ranked_themes()
    if category:
        themes = [theme for theme in themes if theme.category == category]
    if max_competition is not None:
        themes = [theme for theme in themes if (theme.competition_score or 0) <= max_competition]
    if min_business_index is not None:
        themes = [theme for theme in themes if (theme.business_index or 0) >= min_business_index]

    total = len(themes)
    start = (page - 1) * per_page
    items = [_ranking_item(theme) for theme in themes[start : start + per_page]]
    filters = {
        key: value
        for key, value in {
            "category": category,
            "max_competition": max_competition,
            "min_business_index": min_business_index,
        }.items()
        if value is not None and value != ""
    }
    return RankingResponse(
        data=items,
        meta=PaginationMeta(total=total, page=page, per_page=per_page, total_pages=max(1, ceil(total / per_page))),
        score_date=date.today(),
        filters_applied=filters,
    )


@router.get("/themes/{theme_id}", response_model=ThemeDetailResponse)
async def get_theme_detail(theme_id: int) -> ThemeDetailResponse:
    theme = next((item for item in DEMO_THEMES if item.id == theme_id), None)
    if theme is None:
        raise HTTPException(status_code=404, detail=f"Theme {theme_id} not found")
    return ThemeDetailResponse(data=theme)


@router.get("/categories")
async def get_categories() -> dict:
    return {"categories": sorted({theme.category for theme in DEMO_THEMES})}


@router.get("/next-projects")
async def get_next_projects(limit: int = Query(default=3, ge=1, le=5)) -> dict:
    candidates = _mvp_queue_themes(limit)
    return {
        "date": str(date.today()),
        "selection_rule": "auto_develop only; Japanese demand; evidence strength; reversible first-cut MVP; no regulated production data.",
        "projects": [
            {
                "rank": index + 1,
                "project_name": theme.recommended_project_name,
                "slug": theme.automation_slug,
                "title": theme.title,
                "business_index": theme.business_index,
                "screening_reason": theme.screening_reason,
                "first_cut_goal": theme.first_cut_goal,
                "mvp_scope": theme.mvp_scope,
                "evidence": theme.evidence,
                "source_urls": theme.source_urls,
            }
            for index, theme in enumerate(candidates)
        ],
    }


@router.get("/source-backed-opportunities")
async def get_source_backed_opportunities() -> dict:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total": 4,
        "opportunities": [
            {
                "id": "smb-security-helper",
                "title": "中小企業セキュリティ説明パック",
                "segment": "中小企業 / 一人情シス / 取引先対応",
                "score": 92,
                "confidence": "高",
                "stage": "自動開発へ投入",
                "whyNow": "ランサムウェア、サプライチェーン、AI利用リスクが同時に強まり、専門担当者がいない会社ほど説明資料と最小対策チェックが必要。",
                "targetUser": "小規模企業の経営者、総務兼IT担当、取引先からセキュリティ確認を受ける会社。",
                "firstCut": "20問診断、優先対応3件、取引先へ出せる説明文、社内向けチェックリストを1画面で出す。",
                "automationSlug": "smb-security-helper",
                "estimatedBuild": "ローカルMVP 1-2時間",
                "sources": [
                    {"label": "IPA 情報セキュリティ10大脅威2026", "url": "https://www.ipa.go.jp/security/10threats/10threats2026.html", "note": "企業が優先すべき脅威の把握に使える。"},
                    {"label": "2026年版 中小企業白書", "url": "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html", "note": "人手不足とAI・デジタル化による労働投入量最適化が重要テーマ。"},
                ],
                "signals": ["支払い理由が明確", "日本語説明資料の需要", "既存MVPと相性がよい"],
                "risks": ["監査保証や法的保証に見える表現は禁止", "実データ保存は後回し"],
                "nextActions": ["自己診断の質問を日本語で40問へ増やす", "取引先説明PDFの下書きを出す", "AI Company OSで初回MVPを優先度高にする"],
            },
            {
                "id": "care-handoff-ai",
                "title": "介護申し送り・家族共有AI",
                "segment": "介護施設 / 訪問介護 / 家族連絡",
                "score": 89,
                "confidence": "高",
                "stage": "自動開発へ投入",
                "whyNow": "介護人材不足が続き、記録・申し送り・家族共有の時間を削る価値が大きい。スマホで片手入力できるUIが鍵。",
                "targetUser": "小規模介護施設、訪問介護事業所、現場リーダー、家族連絡に時間を取られている担当者。",
                "firstCut": "音声メモ風の短文入力から、注意事項、家族共有文、次シフト確認事項を生成するスマホ画面。",
                "automationSlug": "care-handoff-ai",
                "estimatedBuild": "ローカルMVP 2-3時間",
                "sources": [
                    {"label": "厚労省 介護人材確保に向けた取組", "url": "https://www.mhlw.go.jp/stf/newpage_02977.html", "note": "介護人材の量と質の確保が継続課題。"},
                    {"label": "2026年版 中小企業白書", "url": "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html", "note": "人手不足下の労働投入量最適化が重要。"},
                ],
                "signals": ["現場の時間削減がわかりやすい", "日本語UIで差が出る", "ユーザー検証しやすい"],
                "risks": ["医療判断をしない", "個人情報の扱いはデモ段階では保存しない"],
                "nextActions": ["片手入力UIへ寄せる", "定型ボタンと音声入力前提の導線を作る", "家族共有文は敬語で短く出す"],
            },
            {
                "id": "local-tourism-concierge-ai",
                "title": "地方観光の多言語・混雑案内コンシェルジュ",
                "segment": "地方観光 / 宿泊 / 飲食 / 案内所",
                "score": 86,
                "confidence": "中",
                "stage": "自動開発へ投入",
                "whyNow": "インバウンド対応、混雑緩和、多言語表示、キャッシュレス対応の整備が政策面でも進む。小規模事業者は運用負担が重い。",
                "targetUser": "地方の宿、飲食店、観光協会、小規模ツアー事業者。",
                "firstCut": "施設情報を入れると、日本語・英語のFAQ、混雑時案内、周辺ルート提案を出す。",
                "automationSlug": "local-tourism-concierge-ai",
                "estimatedBuild": "ローカルMVP 2時間",
                "sources": [
                    {"label": "観光庁 インバウンド対応支援", "url": "https://www.mlit.go.jp/kankocho/seisaku_seido/kihonkeikaku/inbound_kaifuku/ukeire/kankochi/shien.html", "note": "ICT、多言語、混雑緩和、キャッシュレスなどを推進。"},
                    {"label": "2026年版 中小企業白書", "url": "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html", "note": "人手不足と高付加価値化への対応。"},
                ],
                "signals": ["地方事業者向けに絞れる", "予約・決済なしなら初回MVPが軽い", "日本語から多言語化の価値がわかりやすい"],
                "risks": ["現地情報の誤りが信頼低下につながる", "翻訳品質と文化差への配慮が必要"],
                "nextActions": ["施設入力テンプレートを作る", "混雑時の案内文テンプレートを追加", "多言語FAQをまず英語だけで検証"],
            },
            {
                "id": "manufacturing-skill-transfer-ai",
                "title": "町工場の技能継承・作業手順書AI",
                "segment": "製造業 / 町工場 / 教育",
                "score": 84,
                "confidence": "中",
                "stage": "自動開発へ投入",
                "whyNow": "ものづくり現場ではDXと人材育成が同時課題。熟練者の暗黙知を手順化するツールは小さく始めやすい。",
                "targetUser": "従業員30人前後の製造業、現場リーダー、教育担当、技能継承に困る町工場。",
                "firstCut": "作業メモを入力すると、新人向け手順、危険ポイント、確認チェックリスト、写真撮影指示を生成する。",
                "automationSlug": "manufacturing-skill-transfer-ai",
                "estimatedBuild": "ローカルMVP 2-3時間",
                "sources": [
                    {"label": "JILPT ものづくり産業におけるDXと人材育成調査", "url": "https://www.jil.go.jp/institute/research/2026/267.html", "note": "製造業のDXと人材育成を調査対象にしている。"},
                    {"label": "経産省 産業界のDX", "url": "https://www.meti.go.jp/policy/it_policy/dx/dx.html?ob=0", "note": "中堅・中小企業向けDX推進の文脈。"},
                ],
                "signals": ["手順書生成はMVPが軽い", "現場写真との相性がよい", "教育時間削減を訴求しやすい"],
                "risks": ["安全手順の誤生成は危険", "最終確認者を必ず人間にする"],
                "nextActions": ["安全注意を強調するUIを作る", "チェックリスト出力を固定化", "写真添付欄は後回しでプレースホルダ化"],
            },
        ],
    }


@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_texts(body: IngestRequest) -> IngestResponse:
    joined = " ".join(body.texts)
    raw_words = [word.strip(".,!?;:()[]{}「」『』、。").lower() for word in joined.replace("　", " ").split()]
    keywords = [word for word in dict.fromkeys(raw_words) if len(word) >= 2][:8] or ["市場メモ", "仮説"]
    suggested = ThemeRankingItem(
        id=999,
        title=f"手動シグナル: {keywords[0]}",
        category=body.category_hint or "手動調査",
        description="手動投入メモから作った仮説です。需要、競合、支払い理由を確認してから開発候補へ進めます。",
        top_keywords=keywords,
        post_count=len(body.texts),
        comment_count_total=0,
        post_growth_rate=0.0,
        biz_models=["検証待ち"],
        demand_score=55,
        monetization_score=45,
        competition_score=50,
        dev_difficulty_score=40,
        evidence_strength=35,
        japanese_market_fit=50,
        screening_status="watch",
        screening_reason="手動メモだけなので、追加情報源で裏取りが必要。",
        business_index=_score(55, 45, 50, 40, 35, 50),
    )
    return IngestResponse(accepted=len(body.texts), message="手動メモを受け付け、仮説候補を作成しました。", suggested_theme=suggested)


@router.get("/brief")
async def get_daily_brief() -> dict:
    top = _mvp_queue_themes()
    return {
        "status": "ok",
        "date": str(date.today()),
        "summary": "今日の優先候補は、自動開発へ投入できる高スコア候補だけに限定しています。",
        "screening_rule": [
            "日本市場の痛みが強い",
            "支払い理由が説明できる",
            "一次MVPがローカルで作れる",
            "本番DB、決済、個人情報なしで検証できる",
            "Watchや除外候補はMVPキューに混ぜない",
            "競合が多すぎるものはwatchへ落とす",
        ],
        "ideas": [
            {
                "rank": index + 1,
                "project_name": theme.recommended_project_name,
                "slug": theme.automation_slug,
                "app_name": theme.title,
                "business_index": theme.business_index,
                "screening_status": theme.screening_status,
                "screening_reason": theme.screening_reason,
                "first_cut_goal": theme.first_cut_goal,
                "mvp_scope": theme.mvp_scope,
                "next_research_actions": theme.next_research_actions,
            }
            for index, theme in enumerate(top)
        ],
    }


@router.get("/intelligence-brief")
async def get_intelligence_brief() -> dict:
    return {
        "date": str(date.today()),
        "collection_sources": [
            {"name": "公的機関", "examples": ["METI", "IPA", "MHLW", "観光庁", "MLIT"], "use": "法規制、補助金、政策、統計の裏取り"},
            {"name": "業界団体・白書", "examples": ["中小企業白書", "業界レポート"], "use": "市場構造、人手不足、導入率の確認"},
            {"name": "検索・競合観察", "examples": ["競合LP", "価格表", "レビュー"], "use": "既存解決策、価格、差別化余地の確認"},
            {"name": "現場業務メモ", "examples": ["申し送り", "日報", "チェックリスト"], "use": "MVP入力画面と価値の具体化"},
        ],
        "screening_rules": [
            "日本語UIで価値が出るか",
            "人手不足、法対応、説明責任、記録負担のどれかに直結するか",
            "月額課金またはレポート課金の理由があるか",
            "一次完成品を1画面で見せられるか",
            "個人情報、医療判断、法的保証、決済、本番DBなしで検証できるか",
        ],
        "current_top_candidates": [
            {
                "name": theme.title,
                "score": theme.business_index,
                "status": theme.screening_status,
                "reason": theme.screening_reason,
                "next_research_actions": theme.next_research_actions,
            }
            for theme in _ranked_themes()
        ],
    }


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", version=settings.APP_VERSION, timestamp=datetime.now(timezone.utc))
