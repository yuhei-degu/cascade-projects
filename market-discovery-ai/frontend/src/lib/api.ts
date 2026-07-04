import type { RankingResponse, ThemeDetail, ThemeDetailResponse } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type Stage = "auto_develop" | "watch" | "rejected";
type ExpectedValue = "High" | "Medium" | "Low";

export type SourceBackedOpportunity = {
  id: string;
  title: string;
  segment: string;
  score: number;
  confidence: ExpectedValue;
  stage: Stage;
  whyNow: string;
  targetUser: string;
  firstCut: string;
  automationSlug: string;
  estimatedBuild: string;
  sources: { label: string; url: string; note: string }[];
  signals: string[];
  risks: string[];
  nextActions: string[];
  commercial: {
    buildPath: string;
    salesRoute: string;
    revenueModel: string;
    expectedValue: ExpectedValue;
    validationPlan: string;
  };
};

export type ScreeningRun = {
  date: string;
  label: string;
  summary: string;
  sourcesChecked: string[];
  newCandidates: SourceBackedOpportunity[];
  queuedSlugs: string[];
  skippedReason?: string;
};

const today = new Date().toISOString().slice(0, 10);

type BacklogSeed = {
  id: string;
  title: string;
  segment: string;
  score: number;
  confidence: ExpectedValue;
  stage: Stage;
  sourceKey: keyof typeof sourceCatalog;
  buyer: string;
  cut: string;
  route: string;
  revenue: string;
  risks: string[];
};

const sourceCatalog = {
  smeWhitePaper: {
    label: "2026年版 中小企業白書",
    url: "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html",
    note: "人手不足、省力化、AI活用、高付加価値化が中小企業の重要テーマ。",
  },
  tdbLabor: {
    label: "TDB 人手不足調査 2026年4月",
    url: "https://www.tdb.co.jp/report/economic/20260519-laborshortage202604/",
    note: "人手不足をDXで補う企業コメントと業種別の不足感が示されている。",
  },
  tdbEmployment: {
    label: "TDB 2026年度雇用動向調査",
    url: "https://www.tdb.co.jp/report/economic/20260323-employment2026/",
    note: "採用難とDX関連人材需要が続いている。",
  },
  jipdecAi: {
    label: "JIPDEC 企業IT利活用動向調査2026",
    url: "https://www.jipdec.or.jp/news/pressrelease/20260325.html",
    note: "会社標準のAI活用は準備・試行段階が多く、運用課題が残る。",
  },
  ipaSecurity: {
    label: "IPA 情報セキュリティ10大脅威2026",
    url: "https://www.ipa.go.jp/security/10threats/10threats2026.html",
    note: "2025年の重大事案を踏まえた組織向けセキュリティ脅威。",
  },
  metiSecurity: {
    label: "METI/IPA 中小企業セキュリティガイドライン4.0",
    url: "https://www.meti.go.jp/press/2025/03/20260327002/20260327002.html",
    note: "中小企業向けの情報セキュリティ対策ガイドライン改訂。",
  },
  haccp: {
    label: "厚労省 HACCPの考え方を取り入れた衛生管理",
    url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/shokuhin/haccp/01_00019.html",
    note: "小規模営業者向けに手引書、記録保存、衛生管理の考え方を示す。",
  },
  tourism: {
    label: "観光庁 インバウンド受入環境整備",
    url: "https://www.mlit.go.jp/kankocho/seisaku_seido/kihonkeikaku/inbound_kaifuku/ukeire/kankochi/shien.html",
    note: "多言語表示、ICT、AI/ICT連携、混雑緩和などを支援対象にしている。",
  },
  manufacturingDx: {
    label: "JILPT ものづくり産業DX調査2026",
    url: "https://www.jil.go.jp/institute/research/2026/267.html",
    note: "製造、生産管理、品質管理などでのデジタル技術活用を調査。",
  },
  coolWork: {
    label: "厚労省 COOL WORK 2026",
    url: "https://www.mhlw.go.jp/stf/coolwork_2026.html",
    note: "職場の熱中症防止対策を2026年5月から9月まで呼びかけ。",
  },
};

function businessIndex(item: SourceBackedOpportunity) {
  return item.score;
}

function toTheme(item: SourceBackedOpportunity, id: number): ThemeDetail {
  const demand = Math.min(98, item.score + 4);
  const monetization = Math.min(96, item.score + (item.commercial.expectedValue === "High" ? 2 : -4));
  const competition = item.stage === "auto_develop" ? 42 : 58;
  const difficulty = item.estimatedBuild.includes("2") ? 38 : 45;
  const evidence = Math.min(96, item.score + 1);
  const japanFit = Math.min(98, item.score + 5);

  return {
    id,
    title: item.title,
    category: item.segment,
    description: item.whyNow,
    top_keywords: item.signals.slice(0, 5),
    post_count: Math.round(demand * 2.2),
    comment_count_total: Math.round(demand * 8.8),
    post_growth_rate: Number((0.18 + item.score / 300).toFixed(2)),
    biz_models: [item.commercial.revenueModel, item.estimatedBuild],
    business_index: businessIndex(item),
    demand_score: demand,
    monetization_score: monetization,
    competition_score: competition,
    dev_difficulty_score: difficulty,
    evidence_strength: evidence,
    japanese_market_fit: japanFit,
    screening_status: item.stage,
    screening_reason: item.whyNow,
    score: null,
    keywords_list: null,
    updated_at: today,
    opportunity: item.whyNow,
    target_user: item.targetUser,
    willingness_to_pay: item.commercial.revenueModel,
    first_cut_goal: item.firstCut,
    recommended_project_name: item.title.replace(/[^A-Za-z0-9一-龠ぁ-んァ-ンー ]/g, ""),
    automation_slug: item.automationSlug,
    mvp_scope: [item.firstCut, item.commercial.buildPath, "自動テスト、レビュー、ベータ準備チェックまで通す"],
    risks: item.risks,
    evidence: item.sources.map((source) => `${source.label}: ${source.note}`),
    source_urls: item.sources.map((source) => source.url),
    source_types: item.sources.map((source) => source.label),
    collection_queries: item.signals,
    pass_reasons: item.signals,
    reject_reasons: item.risks,
    next_research_actions: item.nextActions,
  };
}

const latestOpportunities: SourceBackedOpportunity[] = [
  {
    id: "customer-harassment-response-kit-ai",
    title: "カスタマーハラスメント対応キットAI",
    segment: "小売・飲食・医療受付・コールセンター / HR・店舗運営",
    score: 93,
    confidence: "High",
    stage: "auto_develop",
    whyNow:
      "2026年10月1日からカスタマーハラスメント対策が義務化されるため、店舗・受付・現場管理者がすぐ使える初動スクリプト、記録、研修、掲示物の需要が強い。",
    targetUser: "5-200名規模の小売、飲食、宿泊、クリニック、コールセンターの経営者、総務、人事、店長。",
    firstCut:
      "業種と発生パターンを選ぶと、従業員を守る初動文面、上長エスカレーション、記録テンプレート、研修チェックリストを出すローカルMVP。",
    automationSlug: "customer-harassment-response-kit-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "厚生労働省 カスハラ対策",
        url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyoukintou/seisaku06/index.html",
        note: "2026年10月1日からの義務化資料とリーフレットが公開されている。",
      },
      {
        label: "2026年版 中小企業白書",
        url: "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html",
        note: "人手不足下での省力化・従業員の業務補完が政策テーマになっている。",
      },
    ],
    signals: ["法改正の期限が明確", "顧問社労士・商工会議所経由で売りやすい", "個人情報なしのテンプレートMVPで検証可能"],
    risks: ["違法性判断や労務紛争の助言に見せない", "実名や録音などの個人情報を扱わない", "業種別の言い回し調整が必要"],
    nextActions: ["社労士5名に初期テンプレートを見せる", "店長10名に初動文面の使いやすさを確認", "月額と初期設定費の支払い意思を聞く"],
    commercial: {
      buildPath: "静的HTMLから開始し、業種別テンプレート、記録、研修チェックを画面上で生成する。",
      salesRoute: "社労士、商工会議所、小売・外食団体、クリニック向け総務支援会社から紹介販売。",
      revenueModel: "月額4,980-19,800円、社労士経由の初期テンプレート設定50,000円。",
      expectedValue: "High",
      validationPlan: "5名の社労士と15名の店長に見せ、2社以上の有料テスト意思があれば継続。",
    },
  },
  {
    id: "supplier-security-evidence-binder-ai",
    title: "取引先向けセキュリティ証跡バインダーAI",
    segment: "B2B中小企業 / 情シス・総務・品質保証",
    score: 91,
    confidence: "High",
    stage: "auto_develop",
    whyNow:
      "IPAの2026年版10大脅威でランサムウェアが引き続き最上位級の脅威となり、サプライチェーン確認や取引先質問票への対応が中小企業にも広がっている。",
    targetUser: "大手企業に納品する中小メーカー、物流、IT保守、卸売の一人情シス、総務、品質保証担当。",
    firstCut:
      "20問の自己点検から、取引先に出せる証跡リスト、未整備文書、回答文案、30日改善計画を生成するローカルMVP。",
    automationSlug: "supplier-security-evidence-binder-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "IPA 情報セキュリティ10大脅威2026",
        url: "https://www.ipa.go.jp/security/10threats/10threats2026.html",
        note: "2025年の重大事案をもとに組織向け脅威を整理している。",
      },
      {
        label: "JIPDEC 企業IT利活用動向調査2026",
        url: "https://www.jipdec.or.jp/news/pressrelease/20260325.html",
        note: "企業のAI活用は準備段階が多く、データ・運用課題が残る。",
      },
    ],
    signals: ["取引先提出という支払い理由が明確", "IT支援会社が導入窓口になる", "監査証明ではなく準備ツールに絞れる"],
    risks: ["認証取得や安全保証の表現を避ける", "秘密情報や実ファイルを保存しない", "回答の正確性は専門家確認に渡す"],
    nextActions: ["匿名化した質問票10件を集める", "IT支援会社3社にパッケージ化可否を確認", "回答文案の修正時間を測る"],
    commercial: {
      buildPath: "自己点検フォーム、証跡チェックリスト、回答文案、改善計画の4画面で開始する。",
      salesRoute: "IT保守会社、サイバー保険代理店、地域金融機関、製造業団体、商工会議所。",
      revenueModel: "月額9,800-29,800円、または98,000円の証跡準備ワークショップ。",
      expectedValue: "High",
      validationPlan: "10件の質問票で初回回答作成時間を50%以上短縮できるか測る。",
    },
  },
  {
    id: "heatstroke-worksite-sop-ai",
    title: "職場熱中症SOP・朝礼カードAI",
    segment: "建設・物流・製造・清掃 / 安全衛生",
    score: 89,
    confidence: "High",
    stage: "auto_develop",
    whyNow:
      "厚労省は2026年もSTOP!熱中症クールワークキャンペーンを実施し、職場での熱中症防止対策の徹底を呼びかけている。",
    targetUser: "建設現場、倉庫、工場、農業、清掃会社の現場責任者、安全衛生担当、経営者。",
    firstCut:
      "現場種別、人数、作業時間、暑熱リスクを入力すると、朝礼文、症状別エスカレーション、緊急連絡カード、日次記録を出すMVP。",
    automationSlug: "heatstroke-worksite-sop-ai",
    estimatedBuild: "ローカルMVP 2時間",
    sources: [
      {
        label: "厚労省 COOL WORK 2026",
        url: "https://www.mhlw.go.jp/stf/coolwork_2026.html",
        note: "2026年5月から9月までの職場熱中症予防キャンペーンを実施。",
      },
      {
        label: "帝国データバンク 人手不足調査2026年4月",
        url: "https://www.tdb.co.jp/report/economic/20260519-laborshortage202604/",
        note: "建設やメンテナンス・警備・検査などで人手不足が強い。",
      },
    ],
    signals: ["季節性と義務対応の期限がある", "紙・スマホの現場出力が価値になる", "医療判断を避けて業務手順に絞れる"],
    risks: ["医療トリアージにしない", "天候APIや健康情報の保存は後回し", "季節商材なので通年価値が必要"],
    nextActions: ["現場責任者10名に朝礼カードを見せる", "安全衛生コンサル2名に表現を確認", "季節パック価格を検証"],
    commercial: {
      buildPath: "モバイル優先のカード生成画面と印刷用出力から作る。",
      salesRoute: "安全衛生コンサル、建設業協会、PPE販売店、社労士、労働安全衛生セミナー。",
      revenueModel: "1現場あたり季節パック19,800円、または月額4,980-12,800円。",
      expectedValue: "High",
      validationPlan: "夏前に10現場へ提示し、3件以上の有料試用意思を確認。",
    },
  },
  {
    id: "chemical-sds-risk-check-ai",
    title: "SDS・化学物質リスク点検AI",
    segment: "製造・塗装・清掃・印刷 / 安全衛生",
    score: 88,
    confidence: "High",
    stage: "auto_develop",
    whyNow:
      "化学物質管理者やリスクアセスメント対応は小規模事業場にも広がっており、SDS確認、保護具、記録、仕入先照会を整理する軽量ツール需要がある。",
    targetUser: "塗装、印刷、清掃、食品工場、整備、製造小規模事業者の安全担当、工場長、事務担当。",
    firstCut:
      "製品名、SDS有無、用途、数量、作業場所を入れると、未入手SDS依頼文、点検項目、保護具カード、記録チェックを出すMVP。",
    automationSlug: "chemical-sds-risk-check-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "厚労省 化学物質リスクアセスメントQ&A",
        url: "https://www.mhlw.go.jp/stf/newpage_11389.html",
        note: "リスクアセスメント関係の実務Q&Aを公開している。",
      },
      {
        label: "厚労省 職場の労働衛生対策",
        url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/anzen/anzeneisei02.html",
        note: "化学物質や熱中症など職場衛生対策の資料がまとまっている。",
      },
    ],
    signals: ["小規模現場に記録・確認の負担がある", "材料商社や安全コンサル経由で届く", "法的完了ではなく準備チェックに限定できる"],
    risks: ["化学分類の自動判定をしない", "法令適合保証をしない", "SDSアップロードや実データ保管は初期から外す"],
    nextActions: ["安全コンサル5名にチェック項目を確認", "小規模現場10件へ入力項目の負担を聞く", "材料商社の紹介導線を探る"],
    commercial: {
      buildPath: "手入力ベースの点検とテンプレート生成に限定し、SDS解析は後回しにする。",
      salesRoute: "安全衛生コンサル、化学品・塗料ディーラー、材料商社、製造業団体。",
      revenueModel: "月額9,800-29,800円、初期棚卸テンプレート設定80,000円。",
      expectedValue: "High",
      validationPlan: "架空データで5名の安全コンサルに見せ、販売可能な表現に修正。",
    },
  },
  {
    id: "price-transfer-negotiation-pack-ai",
    title: "価格転嫁交渉パックAI",
    segment: "中小企業 / 経理・営業・調達",
    score: 86,
    confidence: "High",
    stage: "auto_develop",
    whyNow:
      "中小企業庁は価格交渉促進月間とフォローアップ調査を継続しており、原価上昇を説明する文面・根拠整理・交渉記録の需要が続く。",
    targetUser: "製造、卸、建設、サービス業の経営者、営業責任者、経理、顧問税理士。",
    firstCut:
      "原価上昇メモと取引先情報から、価格改定依頼文、根拠整理表、交渉記録、次回フォロー文を生成するMVP。",
    automationSlug: "price-transfer-negotiation-pack-ai",
    estimatedBuild: "ローカルMVP 2時間",
    sources: [
      {
        label: "中小企業庁 価格交渉促進月間",
        url: "https://www.chusho.meti.go.jp/keiei/torihiki/follow-up/index.html",
        note: "価格交渉・価格転嫁のフォローアップ調査と指導を継続している。",
      },
      {
        label: "2026年版 中小企業白書",
        url: "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html",
        note: "高付加価値化と賃上げ・省力化が主要テーマ。",
      },
    ],
    signals: ["支払い意思がある経営課題", "税理士・商工会議所経由で届く", "交渉の下書きと記録なら低リスク"],
    risks: ["独禁法・下請法の最終判断にしない", "契約変更の自動実行をしない", "原価情報はローカル扱い"],
    nextActions: ["税理士5名に顧問先利用を聞く", "原価上昇メモの入力負荷を測る", "取引先別の文面差分を検証"],
    commercial: {
      buildPath: "CSVなしの手入力から始め、文面・根拠表・フォロー記録を出す。",
      salesRoute: "税理士、中小企業診断士、商工会議所、業界団体、地域金融機関。",
      revenueModel: "月額9,800円、または交渉準備パック49,800円。",
      expectedValue: "High",
      validationPlan: "10社の過去交渉メモで下書き時間を測り、2社の有料試用を確認。",
    },
  },
  {
    id: "payment-terms-compliance-pack-ai",
    title: "支払条件移行チェックAI",
    segment: "経理・調達 / 下請取引・支払条件",
    score: 84,
    confidence: "High",
    stage: "auto_develop",
    whyNow:
      "2026年の取引・支払条件見直しに向けて、古い支払方法、期日、確認文面を棚卸するニーズがある。",
    targetUser: "中小メーカー、卸、建設関連会社の経理、調達、顧問税理士、バックオフィスBPO。",
    firstCut:
      "支払条件を手入力またはCSVで入れ、見直し候補、相手先確認文、税理士確認チェックを出すMVP。",
    automationSlug: "payment-terms-compliance-pack-ai",
    estimatedBuild: "ローカルMVP 2時間",
    sources: [
      {
        label: "METI 支払条件適正化要請",
        url: "https://www.meti.go.jp/press/2025/11/20251111007/20251111007.html",
        note: "改正法と支払方法見直しに関するサプライチェーン対応を示している。",
      },
      {
        label: "中小企業庁 価格交渉促進月間",
        url: "https://www.chusho.meti.go.jp/keiei/torihiki/follow-up/index.html",
        note: "取引適正化と価格転嫁を政策的に追跡している。",
      },
    ],
    signals: ["期限のあるバックオフィス需要", "顧問税理士が売りやすい", "法的判断を外して棚卸に絞れる"],
    risks: ["法律判断や契約変更を自動化しない", "会計データ連携は後回し", "一過性需要になりやすい"],
    nextActions: ["支払条件サンプルを10件集める", "税理士にチェック観点を聞く", "CSV形式のばらつきを確認"],
    commercial: {
      buildPath: "手入力と簡単CSVの棚卸、確認文、専門家確認リストから開始。",
      salesRoute: "税理士、経理BPO、製造業団体、地域金融機関、商工会議所。",
      revenueModel: "移行パック49,800円、税理士向け月額9,800円。",
      expectedValue: "High",
      validationPlan: "10件の支払条件例でチェック漏れ削減と文面作成時間を測る。",
    },
  },
  {
    id: "bcp-drill-pack-ai",
    title: "中小企業BCP訓練パックAI",
    segment: "中小企業 / 災害・事業継続",
    score: 83,
    confidence: "High",
    stage: "auto_develop",
    whyNow:
      "商工会議所がAIを使ったBCP策定支援を開始しており、策定後の社内説明、訓練、取引先説明に絞ると売りやすい。",
    targetUser: "商工会議所会員、中小企業経営者、総務、保険代理店、BCP支援コンサル。",
    firstCut:
      "業種、人数、主要リスクを入力すると、30分訓練台本、従業員確認シート、取引先説明文を生成するMVP。",
    automationSlug: "bcp-drill-pack-ai",
    estimatedBuild: "ローカルMVP 2時間",
    sources: [
      {
        label: "日本商工会議所 BCP AI支援",
        url: "https://www.jcci.or.jp/news/news/2026/0123152456.html",
        note: "東京商工会議所が会員向けAI BCP支援を開始した。",
      },
      {
        label: "2026年版 中小企業白書",
        url: "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html",
        note: "中小企業の持続的成長とデジタル活用がテーマ。",
      },
    ],
    signals: ["商工会議所チャネルが具体的", "訓練・説明文なら初期MVPが軽い", "保険代理店にも紹介理由がある"],
    risks: ["安全保証やBCP完成保証にしない", "既存BCPサービスとの差別化が必要", "販売サイクルが団体経由で遅い"],
    nextActions: ["30分訓練台本のデモを作る", "保険代理店と商工会議所に配布可否を聞く", "月額か買い切りか検証"],
    commercial: {
      buildPath: "BCP策定代行ではなく訓練・説明・確認パックとして作る。",
      salesRoute: "商工会議所、保険代理店、地域金融機関、BCPコンサル。",
      revenueModel: "買い切り29,800円、または月額4,980円の訓練更新パック。",
      expectedValue: "High",
      validationPlan: "商工会議所・代理店7名に会員配布の販売導線を確認。",
    },
  },
  {
    id: "genai-adoption-policy-kit-ai",
    title: "中小企業生成AI導入ルール整備AI",
    segment: "中小企業 / AI導入・総務・情報管理",
    score: 81,
    confidence: "Medium",
    stage: "auto_develop",
    whyNow:
      "JIPDEC調査では会社標準としてのAI活用がまだ準備段階の企業が多く、社内ルール、禁止事項、FAQ、導入計画の需要が残る。",
    targetUser: "AI導入を検討する中小企業経営者、総務、情シス、士業・IT支援会社。",
    firstCut:
      "業種、利用目的、扱う情報を入力し、AI利用ルール、社員FAQ、30日導入計画、禁止事項チェックを生成するMVP。",
    automationSlug: "genai-adoption-policy-kit-ai",
    estimatedBuild: "ローカルMVP 2時間",
    sources: [
      {
        label: "JIPDEC AI活用調査2026",
        url: "https://www.jipdec.or.jp/news/pressrelease/20260325.html",
        note: "企業のAI活用は準備段階が多く、データ課題が導入後も続く。",
      },
      {
        label: "2026年版 中小企業白書",
        url: "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html",
        note: "AIが中小企業の省力化・業務補完に期待されている。",
      },
    ],
    signals: ["導入前の不安が多い", "士業・IT支援会社の伴走商材になる", "テンプレート生成で初期MVP化しやすい"],
    risks: ["汎用AI研修との差別化が必要", "情報管理助言を断定しない", "無料資料との競争が強い"],
    nextActions: ["士業・IT支援会社10名に導入前の質問を集める", "社内FAQのひな形を作る", "有料テンプレートの支払い意思を確認"],
    commercial: {
      buildPath: "AI導入規程、FAQ、30日計画、禁止事項カードを生成する静的MVP。",
      salesRoute: "IT支援会社、社労士、中小企業診断士、商工会議所、地域金融機関。",
      revenueModel: "導入キット39,800円、または支援会社向け月額9,800円。",
      expectedValue: "Medium",
      validationPlan: "支援会社10名に見せ、顧問先へ配れるテンプレートとしての需要を確認。",
    },
  },
  {
    id: "logistics-dispatch-exception-ai",
    title: "中小物流の配車例外・荷主連絡AI",
    segment: "物流・配送 / 配車・顧客連絡",
    score: 80,
    confidence: "Medium",
    stage: "watch",
    whyNow:
      "物流と現場人手不足は継続しており、最適化ではなく例外連絡と記録に絞れば中小運送会社でも導入しやすい。",
    targetUser: "車両5-50台の中小運送会社、配車担当、営業所長。",
    firstCut:
      "遅延や再配達などの例外メモから、荷主連絡文、翌日注意リスト、待機時間記録を出すMVP。",
    automationSlug: "logistics-dispatch-exception-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "帝国データバンク 人手不足調査2026年4月",
        url: "https://www.tdb.co.jp/report/economic/20260519-laborshortage202604/",
        note: "人手不足をDXで補う傾向が企業コメントとして示されている。",
      },
      {
        label: "2026年版 中小企業白書",
        url: "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html",
        note: "省力化と業務補完のニーズが強い。",
      },
    ],
    signals: ["現場の時間削減がわかりやすい", "運行最適化より低リスク", "物流コンサル・車両管理ベンダーに届く"],
    risks: ["運行判断や法令判断に入らない", "実車両データ連携は後回し", "現場に合う短文UIが必要"],
    nextActions: ["配車例外メモ10件でデモ生成", "配車担当5名に修正時間を測る", "荷主連絡文のトーンを調整"],
    commercial: {
      buildPath: "手入力の例外メモから荷主連絡文と記録を出す。CSV連携は後回し。",
      salesRoute: "物流コンサル、地域トラック協会、車両管理ベンダー、保険代理店。",
      revenueModel: "月額14,800-39,800円、営業所単位課金。",
      expectedValue: "Medium",
      validationPlan: "配車担当5名で文面修正時間の削減を確認してから自動開発へ昇格。",
    },
  },
  {
    id: "care-dx-readiness-pack-ai",
    title: "介護DX準備チェックAI",
    segment: "介護事業所 / DX準備・職員説明",
    score: 78,
    confidence: "Medium",
    stage: "watch",
    whyNow:
      "介護情報基盤などのDXが進む一方、小規模事業所は紙・電話・FAXの運用が残る。実データを扱わない準備チェックなら安全に検証できる。",
    targetUser: "小規模介護事業所、事務長、介護ICTベンダー、介護コンサル。",
    firstCut:
      "現在の紙・電話・FAX運用を棚卸し、職員説明、ベンダー質問、導入前チェックを出すMVP。",
    automationSlug: "care-dx-readiness-pack-ai",
    estimatedBuild: "ローカルMVP 2時間",
    sources: [
      {
        label: "厚労省 介護情報基盤の広報",
        url: "https://www.mhlw.go.jp/web_magazine/series/20260401.html",
        note: "介護情報基盤の順次開始に関する説明がある。",
      },
      {
        label: "帝国データバンク 人手不足調査2026年4月",
        url: "https://www.tdb.co.jp/report/economic/20260519-laborshortage202604/",
        note: "人手不足とDX補完の傾向が示されている。",
      },
    ],
    signals: ["介護現場の人手不足とDX準備が重なる", "実データなしで始められる", "ICTベンダー経由で届く"],
    risks: ["介護記録や個人情報を扱わない", "医療・介護判断に入らない", "制度詳細が変わりやすい"],
    nextActions: ["介護ICTベンダー3社に準備項目を確認", "事業所5件に紙運用棚卸の負担を聞く", "Watchから自動開発への昇格条件を決める"],
    commercial: {
      buildPath: "個人情報を入れない準備チェックと職員説明テンプレートに限定。",
      salesRoute: "介護ICTベンダー、自治体研修、介護コンサル、福祉団体。",
      revenueModel: "準備パック29,800円、またはコンサル同梱。",
      expectedValue: "Medium",
      validationPlan: "ICTベンダー3社が顧客向けに配れると判断したら自動開発へ昇格。",
    },
  },
  {
    id: "manufacturing-qa-ncr-ai",
    title: "町工場の不具合報告・是正処置メモAI",
    segment: "製造・品質管理 / 小規模工場",
    score: 77,
    confidence: "Medium",
    stage: "watch",
    whyNow:
      "高付加価値化と人手不足のなか、顧客向け不具合報告や是正処置メモの作成負担は残る。品質保証ではなく下書きに絞る必要がある。",
    targetUser: "金属加工、樹脂加工、部品製造の工場長、品質担当、経営者。",
    firstCut:
      "不具合内容、発生日、対象ロット、暫定対応を入れると、顧客報告ドラフト、5Why質問、再発防止チェックを出すMVP。",
    automationSlug: "manufacturing-qa-ncr-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "2026年版 中小企業白書",
        url: "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html",
        note: "中小企業の高付加価値化とデジタル活用がテーマ。",
      },
      {
        label: "帝国データバンク 人手不足調査2026年4月",
        url: "https://www.tdb.co.jp/report/economic/20260519-laborshortage202604/",
        note: "慢性的な人手不足へのDX補完需要が示されている。",
      },
    ],
    signals: ["品質担当の時間削減が明確", "品質コンサル経由で届く", "下書きなら低リスク化できる"],
    risks: ["品質保証や監査文書の代替にしない", "実製品情報の扱いに注意", "業種別テンプレートが必要"],
    nextActions: ["匿名の不具合報告5件で試作", "品質担当5名に修正時間を聞く", "既存製造候補との重複を整理"],
    commercial: {
      buildPath: "社内メモと顧客説明の下書きに限定し、保証・監査適合はしない。",
      salesRoute: "製造業向け税理士、品質コンサル、工業会、地域金融機関。",
      revenueModel: "月額9,800-29,800円、初期テンプレート設定50,000円。",
      expectedValue: "Medium",
      validationPlan: "5社の不具合報告例で下書き時間を測り、支払い意思を確認。",
    },
  },
  {
    id: "tourism-multilingual-ops-board",
    title: "地方観光施設の多言語案内ボードAI",
    segment: "観光・宿泊・飲食 / インバウンド対応",
    score: 76,
    confidence: "Medium",
    stage: "watch",
    whyNow:
      "観光庁はインバウンド受入環境整備を支援しているが、既存翻訳・FAQツールと重なるため、地域案内と混雑回避に絞る必要がある。",
    targetUser: "地方の観光協会、宿泊施設、飲食店、観光案内所。",
    firstCut:
      "日本語のお知らせを入力すると、英語・中国語の短文案内、QR向けFAQ、混雑時の代替案内を出すMVP。",
    automationSlug: "tourism-multilingual-ops-board",
    estimatedBuild: "ローカルMVP 2時間",
    sources: [
      {
        label: "観光庁 インバウンド受入環境整備",
        url: "https://www.mlit.go.jp/kankocho/seisaku_seido/kihonkeikaku/inbound_kaifuku/ukeire/kankochi/shien.html",
        note: "多言語表示、混雑緩和、キャッシュレスなどの支援がある。",
      },
      {
        label: "2026年版 中小企業白書",
        url: "https://www.meti.go.jp/press/2026/04/20260424005/20260424005.html",
        note: "人手不足下での省力化需要に合う。",
      },
    ],
    signals: ["政策支援と観光現場の負担がある", "初期MVPは軽い", "既存翻訳との差別化が必要"],
    risks: ["誤訳や営業情報の古さが信用毀損になる", "既存観光候補との重複", "翻訳品質の検証が必要"],
    nextActions: ["観光協会3件にお知らせ文をもらう", "翻訳確認フローを設計", "既存観光候補と統合するか判断"],
    commercial: {
      buildPath: "予約・決済なしの案内生成に限定し、人間確認前提の出力にする。",
      salesRoute: "観光協会、DMO、自治体実証、宿泊・飲食組合。",
      revenueModel: "月額4,980-19,800円、地域ライセンス。",
      expectedValue: "Medium",
      validationPlan: "観光協会3件に掲示文デモを見せ、地域単位の支払い意思を確認。",
    },
  },
];

const backlogSeeds: BacklogSeed[] = [
  {
    id: "haccp-record-helper-ai",
    title: "小規模飲食店HACCP記録AI",
    segment: "飲食店・惣菜・菓子製造 / 衛生記録",
    score: 87,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "haccp",
    buyer: "個店飲食店、惣菜店、菓子製造店、食品衛生責任者。",
    cut: "日次の衛生チェック、温度記録、改善メモ、週次振り返りを1画面で作るMVP。",
    route: "食品衛生協会、商工会議所、飲食店向けPOS/会計ベンダー、税理士。",
    revenue: "月額4,980-12,800円、または導入テンプレート29,800円。",
    risks: ["衛生適合の保証にしない", "実店舗名や従業員名を保存しない", "業態別手引きとの整合確認が必要"],
  },
  {
    id: "construction-daily-report-ai",
    title: "建設現場の日報・写真台帳AI",
    segment: "建設・工事 / 現場書類",
    score: 86,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "smeWhitePaper",
    buyer: "小規模建設会社、工務店、現場監督、施工管理補助。",
    cut: "作業メモから日報、写真台帳コメント、未完了チェック、施主向け報告文を生成するMVP。",
    route: "建設業協会、工務店支援会社、建設会計ベンダー、行政書士。",
    revenue: "月額9,800-29,800円、現場単位オプション。",
    risks: ["施工品質保証にしない", "現場写真アップロードは後回し", "元請け指定様式との差分が必要"],
  },
  {
    id: "manufacturing-skill-transfer-card-ai",
    title: "町工場の技能継承カードAI",
    segment: "製造・加工 / 技能継承",
    score: 85,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "manufacturingDx",
    buyer: "30-200名規模の製造業、工場長、ベテラン技能者、教育担当。",
    cut: "作業のコツ、注意点、失敗例を入力し、新人向け手順カードと確認クイズを作るMVP。",
    route: "工業会、製造業向けコンサル、地域金融機関、職業訓練機関。",
    revenue: "月額9,800-39,800円、初期カード作成支援80,000円。",
    risks: ["安全手順の正式代替にしない", "企業秘密の入力に注意", "現場用語の調整が必要"],
  },
  {
    id: "sme-security-guideline-check-ai",
    title: "中小企業セキュリティガイドライン4.0点検AI",
    segment: "中小企業 / 情報セキュリティ",
    score: 85,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "metiSecurity",
    buyer: "中小企業経営者、一人情シス、IT保守会社、中小企業診断士。",
    cut: "ガイドライン項目を簡易点検し、未対応リスト、社内説明、30日改善計画を生成するMVP。",
    route: "IT保守会社、商工会議所、中小企業診断士、サイバー保険代理店。",
    revenue: "月額9,800-29,800円、初回診断レポート49,800円。",
    risks: ["診断証明や安全保証にしない", "秘密情報を扱わない", "専門家確認の導線が必要"],
  },
  {
    id: "inbound-menu-faq-ai",
    title: "インバウンド向けメニューFAQ AI",
    segment: "飲食・観光 / 多言語接客",
    score: 84,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "tourism",
    buyer: "地方飲食店、宿泊施設、観光案内所、道の駅。",
    cut: "日本語メニューや注意事項から、英語FAQ、アレルギー注意文、混雑時案内を生成するMVP。",
    route: "観光協会、DMO、飲食店組合、宿泊組合、自治体実証。",
    revenue: "月額4,980-19,800円、地域一括ライセンス。",
    risks: ["翻訳の人間確認が必要", "アレルギー情報の断定を避ける", "予約・決済は接続しない"],
  },
  {
    id: "retail-shift-gap-cover-ai",
    title: "小売・飲食の欠員穴埋め連絡AI",
    segment: "小売・飲食 / シフト運営",
    score: 83,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "tdbLabor",
    buyer: "小売店長、飲食店長、エリアマネージャー、パート管理担当。",
    cut: "欠員条件から代替依頼文、優先連絡順、当日業務の削減案、引き継ぎメモを出すMVP。",
    route: "小売・外食団体、社労士、シフト管理ベンダー、FC本部。",
    revenue: "月額4,980-14,800円、店舗数課金。",
    risks: ["労務判断にしない", "個人連絡先を保存しない", "既存シフトツールとの差別化が必要"],
  },
  {
    id: "invoice-followup-ai",
    title: "請求・入金フォロー文面AI",
    segment: "中小企業 / 経理・売掛管理",
    score: 83,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "smeWhitePaper",
    buyer: "中小企業の経理、営業事務、税理士、バックオフィスBPO。",
    cut: "請求状況を入力し、丁寧な入金確認文、社内リマインド、回収状況メモを作るMVP。",
    route: "税理士、経理BPO、会計ソフト販売代理店、地域金融機関。",
    revenue: "月額4,980-19,800円、税理士向け複数社版。",
    risks: ["督促の法的判断にしない", "実取引情報はローカル扱い", "文面トーン調整が必要"],
  },
  {
    id: "hr-job-offer-appeal-ai",
    title: "中小企業の求人魅力化AI",
    segment: "採用・人材 / 求人票改善",
    score: 82,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "tdbEmployment",
    buyer: "採用難の中小企業、社労士、採用支援会社、地方企業の総務。",
    cut: "仕事内容、働き方、福利厚生から、求人票改善案、面接前説明、候補者FAQを作るMVP。",
    route: "社労士、採用支援会社、商工会議所、求人広告代理店。",
    revenue: "求人1件19,800円、月額9,800円。",
    risks: ["虚偽・誇大表現を避ける", "労働条件の法的確認が必要", "求人媒体連携は後回し"],
  },
  {
    id: "subcontract-change-order-ai",
    title: "下請け変更依頼・追加費用メモAI",
    segment: "建設・製造 / 取引適正化",
    score: 82,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "smeWhitePaper",
    buyer: "下請け工事会社、部品加工会社、営業責任者、経営者。",
    cut: "追加作業メモから、変更依頼文、根拠整理、見積メモ、交渉ログを作るMVP。",
    route: "中小企業診断士、建設業協会、工業会、税理士。",
    revenue: "1案件9,800円、月額19,800円。",
    risks: ["契約法務判断にしない", "証拠保全の助言にしない", "相手先別の表現調整が必要"],
  },
  {
    id: "ai-output-review-checklist-ai",
    title: "社内生成AI出力レビューAI",
    segment: "AI導入 / 品質・情報管理",
    score: 82,
    confidence: "High",
    stage: "auto_develop",
    sourceKey: "jipdecAi",
    buyer: "生成AIを試行導入中の中小企業、総務、情シス、IT支援会社。",
    cut: "AI出力の用途を選び、事実確認、個人情報、著作権、顧客提出前チェックを出すMVP。",
    route: "IT支援会社、社労士、中小企業診断士、AI研修会社。",
    revenue: "月額9,800-29,800円、導入研修同梱。",
    risks: ["法的判断をしない", "出力内容の真偽保証をしない", "業務別チェック項目が必要"],
  },
  {
    id: "facility-maintenance-ticket-ai",
    title: "設備保全チケット整理AI",
    segment: "製造・倉庫 / 設備保全",
    score: 81,
    confidence: "Medium",
    stage: "auto_develop",
    sourceKey: "tdbLabor",
    buyer: "工場、倉庫、設備保全担当、総務、外部保守会社。",
    cut: "故障メモから、優先度、業者連絡文、暫定対応メモ、再発チェックを作るMVP。",
    route: "設備保守会社、工場向けITベンダー、工業会。",
    revenue: "月額9,800-29,800円。",
    risks: ["安全判断にしない", "設備制御に接続しない", "現場写真連携は後回し"],
  },
  {
    id: "customer-complaint-root-cause-ai",
    title: "顧客クレーム原因整理AI",
    segment: "小売・製造・サービス / CS品質",
    score: 81,
    confidence: "Medium",
    stage: "auto_develop",
    sourceKey: "smeWhitePaper",
    buyer: "小売店、製造業品質担当、サービス業のCS責任者。",
    cut: "クレームメモから、分類、初回返信、原因仮説、再発防止チェックを作るMVP。",
    route: "品質コンサル、CS研修会社、商工会議所、業界団体。",
    revenue: "月額9,800-24,800円。",
    risks: ["責任判断や謝罪方針の断定を避ける", "個人情報を保存しない", "炎上リスクの表現確認が必要"],
  },
  {
    id: "training-manual-quiz-ai",
    title: "新人研修マニュアル・確認クイズAI",
    segment: "人材育成 / 現場教育",
    score: 80,
    confidence: "Medium",
    stage: "auto_develop",
    sourceKey: "tdbEmployment",
    buyer: "採用増の中小企業、店長、工場長、教育担当、FC本部。",
    cut: "手順メモから、短いマニュアル、初日チェック、確認クイズ、上長観察ポイントを作るMVP。",
    route: "社労士、研修会社、FC本部、業界団体。",
    revenue: "月額4,980-19,800円。",
    risks: ["安全教育の正式代替にしない", "業界固有ルール確認が必要", "汎用研修との差別化が必要"],
  },
  {
    id: "small-office-bcp-contact-card-ai",
    title: "小規模事業者の緊急連絡カードAI",
    segment: "BCP・総務 / 災害対応",
    score: 80,
    confidence: "Medium",
    stage: "auto_develop",
    sourceKey: "smeWhitePaper",
    buyer: "小規模企業、店舗、士業事務所、保険代理店。",
    cut: "従業員数と拠点情報から、緊急連絡カード、初動確認表、取引先連絡文を作るMVP。",
    route: "保険代理店、商工会議所、地域金融機関、BCPコンサル。",
    revenue: "買い切り19,800円、更新パック月額2,980円。",
    risks: ["安全保証にしない", "個人連絡先保存は避ける", "災害種類ごとの調整が必要"],
  },
  {
    id: "warehouse-picking-error-ai",
    title: "倉庫ピッキングミス振り返りAI",
    segment: "物流・倉庫 / 品質改善",
    score: 79,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "tdbLabor",
    buyer: "中小倉庫、EC物流、出荷責任者、現場リーダー。",
    cut: "ミス内容から、原因分類、朝礼共有、棚位置見直し案、再発防止チェックを作るMVP。",
    route: "物流コンサル、WMSベンダー、倉庫会社向け保険代理店。",
    revenue: "月額9,800-24,800円。",
    risks: ["WMS連携なしで価値が出るか検証が必要", "作業者責任追及に見せない", "現場入力負担が課題"],
  },
  {
    id: "elderly-heat-alert-call-script-ai",
    title: "高齢者見守り熱中症声かけAI",
    segment: "自治体・介護周辺 / 見守り運用",
    score: 79,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "coolWork",
    buyer: "地域包括支援、見守り事業者、介護周辺サービス、自治体委託先。",
    cut: "声かけ対象と状況から、電話スクリプト、注意喚起、記録メモを作るMVP。",
    route: "介護事業者、自治体委託事業者、地域包括支援センター。",
    revenue: "事業者向け月額9,800円、季節パック。",
    risks: ["医療判断にしない", "個人情報を扱う本番化は重い", "自治体調達が遅い"],
  },
  {
    id: "hotel-staff-handoff-ai",
    title: "宿泊施設スタッフ引き継ぎAI",
    segment: "宿泊・観光 / フロント運営",
    score: 78,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "tourism",
    buyer: "旅館、民宿、小規模ホテル、観光施設。",
    cut: "客室・問い合わせ・注意事項メモから、次シフト引き継ぎ、外国語注意文、対応漏れリストを作るMVP。",
    route: "宿泊組合、観光協会、ホテル向けPMS代理店。",
    revenue: "月額7,980-19,800円。",
    risks: ["宿泊者個人情報を扱わない", "PMS連携は後回し", "既存チャットツールとの差別化が必要"],
  },
  {
    id: "retail-inventory-deadstock-ai",
    title: "小売在庫・滞留品アクションAI",
    segment: "小売 / 在庫改善",
    score: 78,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "小規模小売店、EC併売店舗、店長、卸売。",
    cut: "在庫メモから、値下げ候補、販促文、セット販売案、仕入れ注意リストを出すMVP。",
    route: "POSベンダー、商店街、卸売業団体、EC支援会社。",
    revenue: "月額4,980-14,800円。",
    risks: ["売上予測保証にしない", "在庫CSV連携は後回し", "競合が多い"],
  },
  {
    id: "care-family-message-ai",
    title: "介護家族連絡文下書きAI",
    segment: "介護 / 家族連絡",
    score: 78,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "tdbLabor",
    buyer: "介護事業所、デイサービス、訪問介護、施設管理者。",
    cut: "個人情報を伏せた出来事メモから、家族向け説明文と次回確認事項を作るMVP。",
    route: "介護ICTベンダー、介護コンサル、福祉団体。",
    revenue: "月額9,800-19,800円。",
    risks: ["実個人情報を扱わない", "介護判断に入らない", "表現の責任確認が必要"],
  },
  {
    id: "sme-ai-vendor-comparison-ai",
    title: "中小企業AIツール比較メモAI",
    segment: "AI導入 / ベンダー選定",
    score: 77,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "jipdecAi",
    buyer: "AI導入検討中の中小企業、IT支援会社、商工会議所。",
    cut: "用途と制約から、比較項目、質問リスト、導入前リスクメモを作るMVP。",
    route: "IT支援会社、商工会議所、地域金融機関。",
    revenue: "買い切り19,800円、支援会社向け月額。",
    risks: ["特定ベンダー推奨の責任を避ける", "最新価格更新が必要", "汎用資料との差別化が必要"],
  },
  {
    id: "professional-service-meeting-minutes-ai",
    title: "士業面談メモ・次アクションAI",
    segment: "士業・コンサル / 顧客面談",
    score: 77,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "jipdecAi",
    buyer: "税理士、社労士、中小企業診断士、行政書士。",
    cut: "面談メモから、論点、次回宿題、顧客向け確認メール、内部タスクを作るMVP。",
    route: "士業コミュニティ、研修会社、クラウド会計代理店。",
    revenue: "月額9,800-29,800円。",
    risks: ["専門判断の代替にしない", "顧客秘密を扱う本番化は重い", "既存AIメモとの差別化が必要"],
  },
  {
    id: "maintenance-cleaning-route-note-ai",
    title: "清掃・メンテ巡回報告AI",
    segment: "清掃・設備点検 / 巡回報告",
    score: 76,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "tdbLabor",
    buyer: "清掃会社、設備点検会社、巡回スタッフ管理者。",
    cut: "巡回メモから、報告文、異常箇所、次回注意、顧客連絡文を作るMVP。",
    route: "清掃業団体、設備管理会社、保険代理店。",
    revenue: "月額7,980-19,800円。",
    risks: ["写真・位置情報連携は後回し", "安全判断にしない", "現場入力負担が課題"],
  },
  {
    id: "farm-worklog-weather-note-ai",
    title: "小規模農家の作業記録AI",
    segment: "農業 / 作業記録・出荷準備",
    score: 76,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "小規模農家、農業法人、JA支援担当。",
    cut: "作業メモから、作業記録、出荷前チェック、次回作業リマインドを作るMVP。",
    route: "JA、農業資材店、地域金融機関、農業支援会社。",
    revenue: "月額2,980-9,800円。",
    risks: ["農薬・安全判断をしない", "天候APIは後回し", "支払い単価が低い"],
  },
  {
    id: "dental-recall-message-ai",
    title: "歯科リコール案内文AI",
    segment: "歯科・クリニック / 予約案内",
    score: 75,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "tdbLabor",
    buyer: "歯科医院、クリニック受付、医療事務支援会社。",
    cut: "来院時期と案内目的から、個人情報なしのリコール案内文と受付FAQを作るMVP。",
    route: "医療事務支援会社、歯科向けシステム代理店。",
    revenue: "月額4,980-14,800円。",
    risks: ["医療判断をしない", "患者情報連携は後回し", "医療広告表現に注意"],
  },
  {
    id: "rental-equipment-return-check-ai",
    title: "レンタル機材返却チェックAI",
    segment: "物品賃貸・建機 / 返却点検",
    score: 75,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "建機レンタル、イベント機材レンタル、物品賃貸業。",
    cut: "返却時メモから、点検項目、修理見積メモ、顧客確認文を作るMVP。",
    route: "建機レンタル団体、保険代理店、業務ソフト販売店。",
    revenue: "月額9,800-24,800円。",
    risks: ["損害責任判断をしない", "写真判定は後回し", "業種別点検項目が必要"],
  },
  {
    id: "childcare-notice-draft-ai",
    title: "保育施設のお知らせ下書きAI",
    segment: "保育・教育 / 保護者連絡",
    score: 74,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "tdbLabor",
    buyer: "小規模保育園、学童、習い事教室、園長。",
    cut: "行事や注意事項から、保護者向けお知らせ、持ち物リスト、FAQを作るMVP。",
    route: "保育ICTベンダー、自治体研修、教育事業者団体。",
    revenue: "月額4,980-12,800円。",
    risks: ["児童個人情報を扱わない", "事故・健康判断に入らない", "公共性が高く表現確認が必要"],
  },
  {
    id: "wholesale-quote-comparison-ai",
    title: "卸売見積比較・仕入れメモAI",
    segment: "卸売・調達 / 仕入れ判断支援",
    score: 74,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "卸売業、飲食仕入れ担当、小規模メーカー調達。",
    cut: "見積条件を入力し、比較表、確認質問、社内稟議メモを作るMVP。",
    route: "会計事務所、卸売業団体、購買支援会社。",
    revenue: "月額7,980-19,800円。",
    risks: ["最終調達判断にしない", "価格データ更新が必要", "Excelで十分と思われる可能性"],
  },
  {
    id: "used-car-shop-customer-explain-ai",
    title: "中古車販売の説明・確認メモAI",
    segment: "自動車販売・整備 / 顧客説明",
    score: 73,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "中古車販売店、整備工場、営業担当。",
    cut: "車両状態メモから、顧客説明、確認事項、納車前チェックを作るMVP。",
    route: "整備業団体、自動車販売支援会社、保険代理店。",
    revenue: "月額9,800-19,800円。",
    risks: ["品質保証・瑕疵判断にしない", "法定説明との整合確認が必要", "車両データ入力が重い"],
  },
  {
    id: "local-event-risk-check-ai",
    title: "地域イベント運営リスクチェックAI",
    segment: "地域イベント / 運営準備",
    score: 73,
    confidence: "Medium",
    stage: "watch",
    sourceKey: "tourism",
    buyer: "商店街、観光協会、地域イベント主催者、自治体委託先。",
    cut: "イベント概要から、導線、混雑、熱中症、多言語案内、緊急連絡チェックを作るMVP。",
    route: "観光協会、商店街、イベント会社、保険代理店。",
    revenue: "イベント単位29,800円。",
    risks: ["安全保証にしない", "警備計画の代替にしない", "公共イベントは承認が必要"],
  },
  {
    id: "simple-carbon-report-ai",
    title: "中小企業の脱炭素報告メモAI",
    segment: "脱炭素・取引先提出 / 総務",
    score: 72,
    confidence: "Low",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "取引先から環境対応を求められる中小企業、総務、製造業。",
    cut: "電気代や取組メモから、取引先向け環境取組メモと未整備リストを作るMVP。",
    route: "地域金融機関、商工会議所、脱炭素コンサル。",
    revenue: "レポート単位19,800円。",
    risks: ["排出量算定保証にしない", "データ入力が重い", "専門コンサルとの差別化が必要"],
  },
  {
    id: "small-law-office-intake-ai",
    title: "法律事務所の相談受付整理AI",
    segment: "士業 / 受付・相談整理",
    score: 71,
    confidence: "Low",
    stage: "watch",
    sourceKey: "jipdecAi",
    buyer: "小規模法律事務所、行政書士事務所、相談受付担当。",
    cut: "相談メモから、事実関係、必要資料、次回確認事項を整理するMVP。",
    route: "士業コミュニティ、業務ソフト代理店。",
    revenue: "月額9,800-29,800円。",
    risks: ["法律助言に見せない", "守秘情報の扱いが重い", "専門領域ごとの調整が必要"],
  },
  {
    id: "beauty-salon-aftercare-ai",
    title: "美容室アフターケア案内AI",
    segment: "美容・サロン / 顧客対応",
    score: 70,
    confidence: "Low",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "美容室、ネイル、エステ、個人サロン。",
    cut: "施術メニューから、アフターケア案内、次回来店提案、注意事項を作るMVP。",
    route: "美容ディーラー、予約システム代理店、商工会。",
    revenue: "月額2,980-9,800円。",
    risks: ["医療・健康効果を断定しない", "単価が低い", "既存予約システムと競合"],
  },
  {
    id: "sports-club-member-notice-ai",
    title: "地域スポーツクラブ連絡AI",
    segment: "地域クラブ・習い事 / 会員連絡",
    score: 69,
    confidence: "Low",
    stage: "watch",
    sourceKey: "tdbLabor",
    buyer: "地域スポーツクラブ、習い事教室、スクール運営者。",
    cut: "休講・持ち物・大会案内から、会員向け連絡、FAQ、当日チェックを作るMVP。",
    route: "スクール管理システム代理店、地域団体。",
    revenue: "月額2,980-7,980円。",
    risks: ["支払い余地が小さい", "既存LINE運用との差別化が必要", "未成年情報を扱わない"],
  },
  {
    id: "parking-lot-claim-response-ai",
    title: "駐車場クレーム初動AI",
    segment: "不動産・駐車場 / 顧客対応",
    score: 69,
    confidence: "Low",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "月極駐車場運営、管理会社、不動産会社。",
    cut: "苦情メモから、初回返信、確認事項、現地確認チェックを出すMVP。",
    route: "不動産管理会社、保険代理店、管理ソフト代理店。",
    revenue: "月額4,980-12,800円。",
    risks: ["責任判断をしない", "事故・損害対応は専門家へ渡す", "市場が狭い"],
  },
  {
    id: "pet-grooming-notice-ai",
    title: "ペットサロン連絡メモAI",
    segment: "ペットサービス / 顧客連絡",
    score: 68,
    confidence: "Low",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "ペットサロン、トリミング店、動物病院周辺サービス。",
    cut: "施術メモから、飼い主向け説明、次回注意、予約提案を作るMVP。",
    route: "ペット業界団体、予約システム代理店。",
    revenue: "月額2,980-9,800円。",
    risks: ["医療判断にしない", "単価が低い", "既存予約/カルテと競合"],
  },
  {
    id: "micro-ec-return-reply-ai",
    title: "小規模EC返品返信AI",
    segment: "EC・小売 / 顧客返信",
    score: 68,
    confidence: "Low",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "小規模EC運営者、ハンドメイド販売、店舗EC。",
    cut: "返品理由から、返信文、確認事項、再発防止メモを作るMVP。",
    route: "EC支援会社、商工会、ネットショップ制作会社。",
    revenue: "月額2,980-9,800円。",
    risks: ["プラットフォーム既存機能と競合", "低単価", "消費者契約の判断にしない"],
  },
  {
    id: "local-newsletter-draft-ai",
    title: "地域事業者ニュースレターAI",
    segment: "販促 / 地域店舗",
    score: 67,
    confidence: "Low",
    stage: "watch",
    sourceKey: "smeWhitePaper",
    buyer: "地域店舗、商店街、士業、教室運営。",
    cut: "今月のお知らせから、ニュースレター、SNS文、次回来店案内を作るMVP。",
    route: "商店街、商工会、販促支援会社。",
    revenue: "月額2,980-9,800円。",
    risks: ["競合が多い", "支払い意思が弱い", "差別化が必要"],
  },
];

function fromBacklogSeed(seed: BacklogSeed): SourceBackedOpportunity {
  const source = sourceCatalog[seed.sourceKey];
  const expectedValue = seed.confidence;
  return {
    id: seed.id,
    title: seed.title,
    segment: seed.segment,
    score: seed.score,
    confidence: seed.confidence,
    stage: seed.stage,
    whyNow: `${source.label}の需要シグナルを起点に、${seed.segment}で人手不足・記録負担・説明責任を減らす余地がある。`,
    targetUser: seed.buyer,
    firstCut: seed.cut,
    automationSlug: seed.id,
    estimatedBuild: seed.score >= 82 ? "ローカルMVP 2-3時間" : "ローカルMVP 1-2時間",
    sources: [source],
    signals: ["現在ソースで需要根拠あり", "買い手または紹介チャネルを仮定できる", "ローカルMVPで初回検証可能"],
    risks: seed.risks,
    nextActions: ["5-10件の実務メモを匿名化して集める", "想定チャネルの支払い意思を確認する", "MVPで作業時間削減を測る"],
    commercial: {
      buildPath: seed.cut,
      salesRoute: seed.route,
      revenueModel: seed.revenue,
      expectedValue,
      validationPlan: "想定買い手5-10件にデモを提示し、作業時間削減と有料試用意思を確認する。",
    },
  };
}

const weeklyRefresh20260608: SourceBackedOpportunity[] = [
  {
    id: "shipper-logistics-compliance-file-ai",
    title: "物流効率化法の荷主向け計画・定期報告ファイル作成支援",
    segment: "物流・SCM / 荷主コンプライアンス",
    score: 88,
    confidence: "High",
    stage: "auto_develop",
    whyNow: "2026年4月から一定規模以上の荷主・物流事業者に中長期計画や定期報告の作成提出が義務付けられ、現場データと社内説明をまとめる負担が増える。",
    targetUser: "製造業、卸売業、小売業、フランチャイズ本部の物流・SCM・総務・経営企画担当と、荷主を支援する物流コンサル。",
    firstCut: "荷待ち・荷役時間の棚卸し、取組状況チェック、未整備項目、計画書/定期報告の下書きアウトライン、社内ヒアリング票を生成するローカルMVP。",
    automationSlug: "shipper-logistics-compliance-file-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "MLIT logistics efficiency law page",
        url: "https://www.mlit.go.jp/seisakutokatsu/freight/seisakutokatsu_freight_mn1_000034.html",
        note: "2026年4月から特定事業者に中長期計画や定期報告等の作成提出が義務付けられる。",
      },
      {
        label: "Logistics efficiency law portal examples",
        url: "https://www.revised-logistics-act-portal.mlit.go.jp/information/details/post_18.html",
        note: "製造業、卸売業、小売業、連鎖化事業者向けの計画書・定期報告書の記載例が公開された。",
      },
      {
        label: "TDB labor shortage survey April 2026",
        url: "https://www.tdb.co.jp/report/economic/20260519-laborshortage202604/",
        note: "運輸・倉庫を含む複数業種で人手不足が高水準。",
      },
    ],
    signals: ["2026年4月の制度開始", "荷主・物流部門の横断整理", "コンサル経由で売りやすい"],
    risks: ["法令適合の保証にしない", "電子届出代行はしない", "大企業向けに寄りすぎない"],
    nextActions: ["荷主10社に既存資料で入力できるか確認", "物流コンサル3社に同梱販売可否を聞く", "CLO向け説明資料の必要項目を確認"],
    commercial: {
      buildPath: "静的ローカルUIでチェック、下書き、ヒアリング票を生成する。",
      salesRoute: "物流コンサル、運送会社の荷主営業、商工会議所、製造/卸売/小売団体。",
      revenueModel: "月額29,800-98,000円、または初期レポート作成支援198,000円。",
      expectedValue: "High",
      validationPlan: "10社の物流担当に初回報告準備が2時間以内に短縮できるか確認する。",
    },
  },
  {
    id: "freelance-order-terms-compliance-ai",
    title: "フリーランス発注条件・支払期日チェック支援",
    segment: "取引適正化 / 外注管理",
    score: 86,
    confidence: "High",
    stage: "auto_develop",
    whyNow: "フリーランス・事業者間取引適正化等法の運用が進み、外注を使う中小企業が取引条件明示、支払期日、解除条件を小さなバックオフィスで整える必要がある。",
    targetUser: "フリーランスに発注する制作会社、広告代理店、EC運営会社、士業事務所、スタートアップの総務・PM・経営者。",
    firstCut: "発注内容、納期、検収、報酬、支払期日、解除条件から、明示事項チェック、抜け漏れ、支払予定表、発注書ドラフトを出すローカルMVP。",
    automationSlug: "freelance-order-terms-compliance-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "SME Agency freelance transaction law page",
        url: "https://www.chusho.meti.go.jp/keiei/torihiki/law_freelance.html",
        note: "2024年11月1日に施行され、申出窓口や主要資料が公開されている。",
      },
      {
        label: "JFTC freelance law Q&A",
        url: "https://www.jftc.go.jp/fllaw_limited/fllaw_qa.html",
        note: "取引条件明示、支払期日、禁止行為などのQ&Aがある。",
      },
      {
        label: "METI price negotiation follow-up survey",
        url: "https://www.meti.go.jp/press/2025/11/20251128002/20251128002.html",
        note: "30万社への取引状況調査で支払手段・支払期日等も調査対象。",
      },
    ],
    signals: ["法令運用の具体化", "制作/広告/IT外注で対象が広い", "社労士・士業経由で売れる"],
    risks: ["法的助言にしない", "紛争仲裁をしない", "実名契約を保存しない"],
    nextActions: ["制作会社PM10人に発注書作成フローを試してもらう", "社労士/行政書士3人に表現を確認", "60日支払警告のテストケースを作る"],
    commercial: {
      buildPath: "テンプレート生成とチェックリストに限定する。",
      salesRoute: "社労士、行政書士、税理士、制作会社コミュニティ、商工会議所。",
      revenueModel: "月額9,800-29,800円、初期整備パック98,000円。",
      expectedValue: "High",
      validationPlan: "発注PMに既存案件を入力してもらい、抜け漏れ検出と時間短縮を測る。",
    },
  },
  {
    id: "foreign-worker-onboarding-renewal-ai",
    title: "外国人雇用オンボーディング・届出/更新チェック支援",
    segment: "人材・雇用管理 / 外国人雇用",
    score: 84,
    confidence: "High",
    stage: "auto_develop",
    whyNow: "外国人労働者数が過去最多となり、雇入れ・離職届出、在留資格/期間確認、初日説明、更新リマインドを小規模な現場管理者が担っている。",
    targetUser: "外食、宿泊、製造、建設、清掃、介護周辺事業者の総務・店長・工場長、登録支援機関、社労士。",
    firstCut: "在留資格・雇用形態・入社日・更新期限のサンプル入力から、必要確認リスト、やさしい日本語/英語の初日説明カード、届出/更新リマインド表を生成する。",
    automationSlug: "foreign-worker-onboarding-renewal-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "MHLW foreign employment status report",
        url: "https://www.mhlw.go.jp/stf/newpage_68794.html",
        note: "2025年10月末時点の外国人労働者は約257万人で過去最多。雇入れ・離職時の届出義務も説明。",
      },
      {
        label: "MHLW foreign employment policy page",
        url: "https://www.mhlw.go.jp/seisakunitsuite/bunya/koyou_roudou/koyou/gaikokujin/index.html",
        note: "外国人雇用の事業主向け情報が集約されている。",
      },
      {
        label: "MOJ/ISA employment-for-skill-development overview",
        url: "https://www.moj.go.jp/isa/content/001423904",
        note: "育成就労制度の2027年施行に向けた準備タイムラインが示されている。",
      },
    ],
    signals: ["外国人雇用が過去最多", "届出と更新管理の実務負担", "支援機関チャネルがある"],
    risks: ["入管・法務判断にしない", "実個人情報を保存しない", "翻訳保証をしない"],
    nextActions: ["外国人雇用事業者8社に初日説明カードを見せる", "登録支援機関3社に販売余地を聞く", "個人情報なしのデモデータを固定する"],
    commercial: {
      buildPath: "雇用管理準備ツールに限定し、申請代行や資格判定をしない。",
      salesRoute: "社労士、登録支援機関、商工会議所、業界団体、研修支援会社。",
      revenueModel: "月額9,800-24,800円、1事業所整備パック80,000円。",
      expectedValue: "High",
      validationPlan: "雇用現場と支援機関に、更新管理が有料化できる痛みか確認する。",
    },
  },
  {
    id: "vacant-home-intake-action-pack-ai",
    title: "空き家相談・所有者初回アクション整理支援",
    segment: "不動産・地域課題 / 空き家相談",
    score: 82,
    confidence: "Medium",
    stage: "auto_develop",
    whyNow: "空き家対策の法令・支援情報が更新され、不動産会社や自治体窓口は所有者ヒアリング、必要書類、専門家連携、次アクション整理に時間を取られる。",
    targetUser: "空き家相談を受ける宅建業者、自治体連携の不動産団体、地域金融機関、司法書士/行政書士と連携する管理会社。",
    firstCut: "所有者状況、建物状態、所在地、希望を入力し、初回ヒアリング票、必要書類、次アクション、専門家連携メモ、所有者向け説明文を生成する。",
    automationSlug: "vacant-home-intake-action-pack-ai",
    estimatedBuild: "ローカルMVP 2-3時間",
    sources: [
      {
        label: "MLIT vacant house law information",
        url: "https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk3_000035.html",
        note: "空家等対策法関連情報が2026年4月に更新され、法令・指針・ガイドラインがまとまっている。",
      },
      {
        label: "Zentaku real estate DX support tool release",
        url: "https://www.zentaku.or.jp/news/13971/",
        note: "物件調査の聞き漏れ、書類不足、確認後回しを現場の痛みとして説明している。",
      },
      {
        label: "MLIT vacant house management guideline",
        url: "https://www.mlit.go.jp/tochi_fudousan_kensetsugyo/const/content/001750009.pdf",
        note: "不動産業者による空き家管理受託のガイドライン。",
      },
    ],
    signals: ["空き家政策の継続更新", "相談初回の情報整理が重い", "宅建/自治体/金融機関チャネルがある"],
    risks: ["査定や法的判断にしない", "個人/物件情報を保存しない", "自治体ごとの運用差がある"],
    nextActions: ["宅建業者5社に相談票を見せる", "自治体/金融機関パートナー3者に紹介導線を聞く", "既存DX調査ツールとの差別化を確認"],
    commercial: {
      buildPath: "相談整理と業務チェックに限定する。",
      salesRoute: "宅建協会、自治体空き家相談委託先、地域金融機関、不動産管理会社、相続/登記専門家。",
      revenueModel: "月額9,800-39,800円、相談会運用パック50,000円。",
      expectedValue: "Medium",
      validationPlan: "相談1件あたりのヒアリング短縮と紹介率改善が見込めるか確認する。",
    },
  },
];

const collectedOpportunities = [...weeklyRefresh20260608, ...latestOpportunities, ...backlogSeeds.map(fromBacklogSeed)]
  .sort((a, b) => b.score - a.score);

const themes = collectedOpportunities.map(toTheme);

const screeningHistory: ScreeningRun[] = [
  {
    date: "2026-06-08",
    label: "Weekly primary-source refresh",
    summary:
      "Screened 11 Japanese SME and vertical-workflow ideas from ministries, regulators, industry associations, and current surveys. Retained four queue-facing local MVP candidates and held duplicates/high-risk ideas in Watch or Rejected.",
    sourcesChecked: [
      "SME Agency 2026 White Paper",
      "TDB labor-shortage survey April 2026",
      "MLIT logistics efficiency law",
      "SME Agency/JFTC freelance transaction law materials",
      "MHLW foreign employment status report",
      "MOJ/ISA育成就労 overview",
      "MLIT vacant-house policy",
      "Zentaku property-investigation workflow signal",
      "MHLW customer-harassment obligation materials",
      "METI price negotiation follow-up survey",
    ],
    newCandidates: weeklyRefresh20260608,
    queuedSlugs: [],
    skippedReason:
      "No queue rows added because ai-dev-orchestrator has a large review-fix backlog and recent market-candidate work has loop-capped.",
  },
  {
    date: "2026-06-07",
    label: "最新需要の大量スクリーニング",
    summary:
      "官公庁・業界団体・調査会社の2026年公開資料を横断し、49件を採点。スコア80点以上を中心に自動開発候補へ、制度・個人情報・単価・競合リスクが強いものはWatchへ分けた。",
    sourcesChecked: [
      "厚生労働省 カスタマーハラスメント対策",
      "IPA 情報セキュリティ10大脅威2026",
      "JIPDEC 企業IT利活用動向調査2026",
      "2026年版 中小企業白書",
      "中小企業庁 価格交渉促進月間",
      "厚労省 COOL WORK 2026",
      "日本商工会議所 BCP AI支援",
      "帝国データバンク 人手不足調査2026年4月",
    ],
    newCandidates: collectedOpportunities,
    queuedSlugs: collectedOpportunities.filter((item) => item.stage === "auto_develop" && item.score >= 81).map((item) => item.automationSlug),
    skippedReason:
      "実際の投入はAI Company OSの空き枠・レビュー滞留・リソースガードを確認して順次行う。候補はスコア順に自動開発へ渡す。",
  },
  {
    date: "2026-06-01",
    label: "週次候補プール更新",
    summary:
      "カスハラ、取引先セキュリティ、熱中症、化学物質、支払条件の候補を自動開発候補として残した。レビュー滞留があったため、投入はヘッドルーム確認後に限定。",
    sourcesChecked: ["厚労省", "IPA", "METI", "中小企業庁", "JIPDEC"],
    newCandidates: latestOpportunities.slice(0, 6),
    queuedSlugs: [],
    skippedReason: "レビュー・統合待ちが多い場合は新規投入よりレビュー/昇格を優先する。",
  },
];

function applyRankingFilters(themesToFilter: ThemeDetail[], params?: {
  category?: string;
  max_competition?: number;
  min_business_index?: number;
}) {
  return themesToFilter.filter((theme) => {
    if (params?.category && theme.category !== params.category) return false;
    if (params?.max_competition !== undefined && (theme.competition_score ?? 100) > params.max_competition) return false;
    if (params?.min_business_index !== undefined && (theme.business_index ?? 0) < params.min_business_index) return false;
    return true;
  });
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchRanking(params?: {
  page?: number;
  per_page?: number;
  category?: string;
  max_competition?: number;
  min_business_index?: number;
}): Promise<RankingResponse> {
  const page = params?.page ?? 1;
  const perPage = params?.per_page ?? 20;
  const filtered = applyRankingFilters(themes, params).sort((a, b) => (b.business_index ?? 0) - (a.business_index ?? 0));
  const start = (page - 1) * perPage;
  const data = filtered.slice(start, start + perPage);

  return {
    data,
    meta: {
      total: filtered.length,
      page,
      per_page: perPage,
      total_pages: Math.max(1, Math.ceil(filtered.length / perPage)),
    },
    score_date: today,
    filters_applied: params ?? {},
  };
}

export async function fetchThemeDetail(id: number): Promise<ThemeDetailResponse> {
  const theme = themes.find((item) => item.id === id);
  if (!theme) {
    throw new Error(`Theme not found: ${id}`);
  }
  return { data: theme };
}

export async function fetchCategories(): Promise<{ categories: string[] }> {
  return { categories: Array.from(new Set(themes.map((theme) => theme.category))).sort() };
}

export async function fetchNextProjects(): Promise<{
  projects: {
    rank: number;
    project_name: string;
    slug: string;
    title: string;
    business_index: number;
    first_cut_goal: string;
    screening_reason?: string;
  }[];
}> {
  return {
    projects: themes
      .filter((theme) => theme.screening_status === "auto_develop")
      .sort((a, b) => (b.business_index ?? 0) - (a.business_index ?? 0))
      .slice(0, 8)
      .map((theme, index) => ({
        rank: index + 1,
        project_name: theme.recommended_project_name ?? theme.title,
        slug: theme.automation_slug ?? String(theme.id),
        title: theme.title,
        business_index: theme.business_index ?? 0,
        first_cut_goal: theme.first_cut_goal ?? "",
        screening_reason: theme.screening_reason ?? "",
      })),
  };
}

export async function fetchSourceBackedOpportunities(): Promise<{
  generated_at: string;
  total: number;
  opportunities: SourceBackedOpportunity[];
}> {
  return {
    generated_at: new Date().toISOString(),
    total: collectedOpportunities.length,
    opportunities: collectedOpportunities,
  };
}

export async function fetchScreeningHistory(): Promise<{
  generated_at: string;
  runs: ScreeningRun[];
}> {
  return {
    generated_at: new Date().toISOString(),
    runs: screeningHistory,
  };
}

export async function ingestTexts(texts: string[], source = "manual"): Promise<unknown> {
  return apiFetch("/ingest", { method: "POST", body: JSON.stringify({ texts, source }) });
}
