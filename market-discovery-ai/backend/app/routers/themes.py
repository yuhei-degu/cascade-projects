"""
⑮ ランキングAPI実装 / ⑩ API設計

GET /api/v1/themes           — テーマランキング
GET /api/v1/themes/{id}      — テーマ詳細
GET /api/v1/categories       — カテゴリ一覧
POST /api/v1/ingest          — 手動テキストインポート
POST /api/v1/collect         — 全ソースからデータ収集トリガー
POST /api/v1/analyze         — 再解析トリガー
GET /api/v1/brief            — デイリーAI開発アイデア（Claude生成）
GET /api/v1/health           — ヘルスチェック
"""
import json
from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.models.models import BusinessScore, Keyword, Theme
from app.schemas.schemas import (
    BusinessScoreOut, CompetitionBreakdown, HealthResponse,
    IngestRequest, IngestResponse, MonetizationBreakdown,
    PaginationMeta, RankingResponse, ThemeDetail, ThemeDetailResponse, ThemeRankingItem,
)

router = APIRouter()
logger = structlog.get_logger()

CATEGORIES = list({
    "健康・医療", "金融・投資", "副業・収入", "転職・キャリア",
    "恋愛・人間関係", "育児・教育", "テクノロジー", "法律・税務",
    "不動産・住宅", "旅行・移住", "ダイエット・美容", "メンタルヘルス",
    "ペット", "食・料理", "その他",
})


@router.get(
    "/themes",
    response_model=RankingResponse,
    summary="ビジネステーマランキング取得",
    description=(
        "総合ビジネス指数 (需要×収益化×競合×開発難易度) の高い順にテーマを返す。"
        "カテゴリ・競合強度上限・最低指数でフィルタリング可能。"
    ),
)
async def get_theme_ranking(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = Query(default=None, description="カテゴリフィルター"),
    max_competition: Optional[float] = Query(
        default=None, ge=0, le=100,
        description="競合強度上限（例: 50 → 競合スコア50以下のみ表示）"
    ),
    min_business_index: Optional[float] = Query(
        default=None, ge=0, le=100, description="最低ビジネス指数"
    ),
    db: AsyncSession = Depends(get_db),
) -> RankingResponse:
    logger.info("Fetching ranking", category=category, max_competition=max_competition)

    stmt = (
        select(Theme, BusinessScore)
        .join(BusinessScore, BusinessScore.theme_id == Theme.id, isouter=True)
        .where(Theme.is_active == True)
        .order_by(desc(BusinessScore.business_index))
    )

    if category:
        stmt = stmt.where(Theme.category == category)
    if max_competition is not None:
        stmt = stmt.where(BusinessScore.competition_score <= max_competition)
    if min_business_index is not None:
        stmt = stmt.where(BusinessScore.business_index >= min_business_index)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(stmt)).all()

    items: list[ThemeRankingItem] = []
    for theme, score in rows:
        item = ThemeRankingItem(
            id=theme.id,
            title=theme.title,
            category=theme.category,
            description=theme.description,
            top_keywords=theme.top_keywords,
            post_count=theme.post_count,
            comment_count_total=theme.comment_count_total,
            post_growth_rate=theme.post_growth_rate,
            biz_models=theme.biz_models,
            business_index=score.business_index if score else None,
            demand_score=score.demand_score if score else None,
            monetization_score=score.monetization_score if score else None,
            competition_score=score.competition_score if score else None,
            dev_difficulty_score=score.dev_difficulty_score if score else None,
        )
        items.append(item)

    filters_applied = {}
    if category: filters_applied["category"] = category
    if max_competition is not None: filters_applied["max_competition"] = max_competition
    if min_business_index is not None: filters_applied["min_business_index"] = min_business_index

    from datetime import date
    return RankingResponse(
        data=items,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page,
        ),
        score_date=date.today(),
        filters_applied=filters_applied,
    )


@router.get(
    "/themes/{theme_id}",
    response_model=ThemeDetailResponse,
    summary="テーマ詳細取得",
)
async def get_theme_detail(
    theme_id: int,
    db: AsyncSession = Depends(get_db),
) -> ThemeDetailResponse:
    stmt = select(Theme).where(Theme.id == theme_id, Theme.is_active == True)
    result = await db.execute(stmt)
    theme = result.scalar_one_or_none()
    if theme is None:
        raise HTTPException(status_code=404, detail=f"Theme {theme_id} not found")

    score_stmt = select(BusinessScore).where(BusinessScore.theme_id == theme_id)
    score = (await db.execute(score_stmt)).scalar_one_or_none()

    kw_stmt = select(Keyword).where(Keyword.theme_id == theme_id).order_by(
        desc(Keyword.tfidf_score)
    ).limit(30)
    keywords = (await db.execute(kw_stmt)).scalars().all()

    score_out: Optional[BusinessScoreOut] = None
    if score:
        score_out = BusinessScoreOut(
            score_date=score.score_date,
            demand_score=score.demand_score,
            monetization_score=score.monetization_score,
            competition_score=score.competition_score,
            dev_difficulty_score=score.dev_difficulty_score,
            business_index=score.business_index,
            model_version=score.model_version,
            monetization_detail=MonetizationBreakdown(
                money_word_score=score.money_word_score,
                urgency_score=score.urgency_score,
                purchase_intent_score=score.purchase_intent_score,
                severity_score=score.severity_score,
            ),
            competition_detail=CompetitionBreakdown(
                search_volume_score=score.search_volume_score,
                app_exists_score=score.app_exists_score,
                ad_spend_score=score.ad_spend_score,
            ),
        )

    detail = ThemeDetail(
        id=theme.id,
        title=theme.title,
        category=theme.category,
        description=theme.description,
        top_keywords=theme.top_keywords,
        post_count=theme.post_count,
        comment_count_total=theme.comment_count_total,
        post_growth_rate=theme.post_growth_rate,
        biz_models=theme.biz_models,
        score=score_out,
        keywords_list=[
            {"word": k.word, "tfidf_score": k.tfidf_score, "is_monetization": k.is_monetization}
            for k in keywords
        ],
        updated_at=theme.updated_at,
    )
    return ThemeDetailResponse(data=detail)


@router.get("/categories", summary="カテゴリ一覧取得")
async def get_categories() -> dict:
    return {"categories": sorted(CATEGORIES)}


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="テキスト手動インポート",
)
async def ingest_texts(
    body: IngestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> IngestResponse:
    from app.services.collector.crawler import ManualTextImporter
    importer = ManualTextImporter(db)
    posts = await importer.import_texts(body.texts, body.source, body.category_hint)
    background_tasks.add_task(_run_pipeline_bg)
    return IngestResponse(
        accepted=len(posts),
        message=f"{len(posts)}件のテキストを受け付けました。バックグラウンドで解析中です。",
    )


@router.post(
    "/collect",
    status_code=202,
    summary="全ソースからデータ収集トリガー",
    description="Yahoo知恵袋・Zenn・GitHub から即座にデータ収集してスコアリングまで実行する。",
)
async def trigger_collect(background_tasks: BackgroundTasks) -> dict:
    """手動で全パイプライン（収集 → 集約 → スコアリング）を起動する。"""
    from app.services.scheduler import run_full_pipeline
    background_tasks.add_task(run_full_pipeline)
    return {
        "status": "started",
        "message": "データ収集を開始しました。1〜3分後に /api/v1/themes でランキングが確認できます。",
        "sources": ["Yahoo知恵袋", "Zenn.dev", "GitHub Trending"],
    }


@router.post("/analyze", summary="全テーマ再解析トリガー", status_code=202)
async def trigger_analyze(background_tasks: BackgroundTasks) -> dict:
    background_tasks.add_task(_run_pipeline_bg)
    return {"status": "started", "message": "スコア再計算を開始しました"}


@router.get(
    "/brief",
    summary="デイリーAI開発アイデア",
    description=(
        "今日のトップテーマを Claude AI が分析し、"
        "個人開発者が 1〜3 日で作れる具体的なアプリアイデアを TOP5 提案する。"
        "ANTHROPIC_API_KEY が必要。"
    ),
)
async def get_daily_brief(db: AsyncSession = Depends(get_db)) -> dict:
    from datetime import date

    # トップテーマを取得（スコア付きのもの優先）
    stmt = (
        select(Theme, BusinessScore)
        .join(BusinessScore, BusinessScore.theme_id == Theme.id)
        .where(Theme.is_active == True)
        .order_by(desc(BusinessScore.business_index))
        .limit(12)
    )
    rows = (await db.execute(stmt)).all()

    if not rows:
        return {
            "status": "no_data",
            "message": (
                "データがまだありません。"
                "POST /api/v1/collect を呼び出してデータ収集を実行してください。"
            ),
            "ideas": [],
        }

    # Claude API キー未設定の場合はランキングのみ返す
    if not settings.ANTHROPIC_API_KEY:
        return {
            "status": "no_api_key",
            "message": ".env に ANTHROPIC_API_KEY を追加すると AI アイデア提案が使えます。",
            "raw_themes": [
                {
                    "rank": i + 1,
                    "title": t.title,
                    "category": t.category,
                    "keywords": (t.top_keywords or [])[:5],
                    "business_index": round(s.business_index, 1),
                    "demand_score": round(s.demand_score, 1),
                    "competition_score": round(s.competition_score, 1),
                }
                for i, (t, s) in enumerate(rows)
            ],
        }

    # テーマデータをプロンプト用に整形
    themes_text = "\n".join([
        f"{i + 1}. [{t.category}] {t.title} | "
        f"需要:{s.demand_score:.0f} 収益化:{s.monetization_score:.0f} "
        f"競合:{s.competition_score:.0f} BI:{s.business_index:.0f} | "
        f"キーワード: {', '.join((t.top_keywords or [])[:5])}"
        for i, (t, s) in enumerate(rows)
    ])

    prompt = f"""あなたは個人開発者向けのビジネスアイデアアドバイザーです。
以下は今日の市場需要データ（Yahoo知恵袋・Zenn.dev・GitHub Trending から収集）です。

=== 需要データ ({date.today()}) ===
{themes_text}

上記データをもとに、**個人開発者が 1〜3 日で作れるアプリ**のアイデアを 5 つ提案してください。

重要な条件:
- 他の開発者が作っていなそうなニッチなアイデアを優先する
- 日本語ユーザー向けで日本市場の需要に根ざしている
- 収益化の道筋が具体的（月額課金・買い切り・広告など）
- 技術的に 1〜3 人で現実的に作れる規模
- BI スコアが高く競合スコアが低いテーマを特に参考にする

必ず以下の JSON 配列形式のみで返してください（説明文・前置き不要）:
[
  {{
    "rank": 1,
    "app_name": "アプリ名",
    "tagline": "一行キャッチコピー",
    "target_user": "ターゲットユーザー（具体的に）",
    "core_problem": "解決する具体的な問題",
    "unique_angle": "既存サービスとの差別化ポイント",
    "key_features": ["機能1", "機能2", "機能3"],
    "monetization": "収益化方法と想定月収",
    "tech_stack": "推奨技術スタック",
    "estimated_hours": "開発時間の目安",
    "demand_basis": "このアイデアの需要データの根拠"
  }}
]"""

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}],
        )

        text = message.content[0].text.strip()
        # JSON 部分を抽出（```json ... ``` で囲まれることがある）
        start = text.find("[")
        end = text.rfind("]") + 1
        if start == -1 or end == 0:
            raise ValueError("JSON array not found in response")

        ideas = json.loads(text[start:end])

        return {
            "status": "ok",
            "date": str(date.today()),
            "ideas": ideas,
            "data_sources": ["Yahoo知恵袋", "Zenn.dev", "GitHub Trending"],
            "themes_analyzed": len(rows),
        }

    except json.JSONDecodeError as e:
        logger.error("Brief JSON parse failed", error=str(e))
        return {"status": "parse_error", "error": str(e), "raw_response": text}
    except Exception as e:
        logger.error("Brief generation failed", error=str(e))
        return {"status": "error", "error": str(e)}


@router.get("/health", response_model=HealthResponse, summary="ヘルスチェック")
async def health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    db_status = "connected"
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"
    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        version=settings.APP_VERSION,
        database=db_status,
        timestamp=datetime.now(timezone.utc),
    )


async def _run_pipeline_bg() -> None:
    """バックグラウンド解析パイプライン（集約 → スコア計算のみ）"""
    from app.db.session import AsyncSessionLocal
    from app.services.scoring.business_scorer import BusinessScoreCalculator, ThemeAggregator
    async with AsyncSessionLocal() as db:
        try:
            agg = ThemeAggregator(db)
            themes = await agg.aggregate_unprocessed()
            scorer = BusinessScoreCalculator(db)
            for theme in themes:
                await scorer.compute_and_save(theme)
            await db.commit()
            logger.info("Pipeline completed", themes_updated=len(themes))
        except Exception as e:
            await db.rollback()
            logger.error("Pipeline failed", error=str(e))
