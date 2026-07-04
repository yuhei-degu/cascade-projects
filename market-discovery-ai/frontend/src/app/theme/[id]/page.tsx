import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchThemeDetail } from "@/lib/api";
import {
  getCompetitionColor,
  getCompetitionLabel,
  getCompetitionText,
  getScoreBarColor,
  getScreeningStatusClass,
  getScreeningStatusText,
} from "@/types";

interface Props {
  params: { id: string };
}

export default async function ThemeDetailPage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  let result;
  try {
    result = await fetchThemeDetail(id);
  } catch {
    notFound();
  }

  const theme = result.data;
  const competitionLabel = getCompetitionLabel(theme.competition_score);

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-stone-950">
      <div className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        <Link href="/" className="text-sm font-semibold text-teal-700 hover:text-teal-600">
          ランキングへ戻る
        </Link>

        <header className="mt-5 rounded-lg border border-stone-200 bg-[#fffdfa] p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getScreeningStatusClass(theme.screening_status)}`}>
              {getScreeningStatusText(theme.screening_status)}
            </span>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">
              {theme.category}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">{theme.title}</h1>
          {theme.description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600 md:text-base">{theme.description}</p> : null}
        </header>

        <section className="grid gap-5 py-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <Panel title="スクリーニング判定">
              <p className="text-sm leading-7 text-stone-700">{theme.screening_reason ?? "判定理由は未設定です。"}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <List title="通す理由" items={theme.pass_reasons ?? []} />
                <List title="注意する理由" items={theme.reject_reasons ?? []} />
              </div>
            </Panel>

            <Panel title="なぜ今やるか">
              <p className="text-sm leading-7 text-stone-700">{theme.opportunity ?? "市場メモはまだありません。"}</p>
            </Panel>

            <Panel title="想定ユーザー">
              <p className="text-sm leading-7 text-stone-700">{theme.target_user ?? "未設定"}</p>
            </Panel>

            <Panel title="収益仮説">
              <p className="text-sm leading-7 text-stone-700">{theme.willingness_to_pay ?? "未設定"}</p>
            </Panel>

            <Panel title="最初のMVP">
              <p className="text-sm leading-7 text-stone-700">{theme.first_cut_goal ?? "未設定"}</p>
            </Panel>

            <Panel title="MVP範囲">
              <SimpleList items={theme.mvp_scope ?? []} />
            </Panel>

            <Panel title="根拠">
              <SimpleList items={theme.evidence ?? []} />
            </Panel>

            <Panel title="次に集める情報">
              <SimpleList items={theme.next_research_actions ?? []} />
            </Panel>

            <Panel title="リスク">
              <SimpleList items={theme.risks ?? []} />
            </Panel>
          </div>

          <aside className="space-y-5">
            <Panel title="総合スコア">
              <div className="text-5xl font-black tabular-nums text-emerald-700">{theme.business_index?.toFixed(1) ?? "-"}</div>
              <div className="mt-5 space-y-3">
                <Metric label="需要" score={theme.demand_score} />
                <Metric label="収益化" score={theme.monetization_score} />
                <Metric label="根拠の強さ" score={theme.evidence_strength ?? null} />
                <Metric label="日本市場適合" score={theme.japanese_market_fit ?? null} />
                <Metric label="競合の少なさ" score={theme.competition_score} inverse />
                <Metric label="作りやすさ" score={theme.dev_difficulty_score} inverse />
              </div>
            </Panel>

            <Panel title="競合">
              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getCompetitionColor(competitionLabel)}`}>
                {getCompetitionText(competitionLabel)}
              </span>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                競合が少ないほど、個人開発の初期MVPでも検証しやすい候補として扱います。
              </p>
            </Panel>

            <Panel title="情報源">
              <SimpleList items={theme.source_types ?? []} />
            </Panel>

            <Panel title="自動開発名">
              <div className="text-sm font-semibold text-stone-950">{theme.recommended_project_name ?? "-"}</div>
              <div className="mt-1 text-xs text-stone-500">{theme.automation_slug ?? "-"}</div>
            </Panel>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-[#fffdfa] p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">{title}</h2>
      {children}
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <h3 className="text-xs font-semibold text-stone-500">{title}</h3>
      <SimpleList items={items} />
    </div>
  );
}

function SimpleList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-stone-500">未設定</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm leading-6 text-stone-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Metric({ label, score, inverse = false }: { label: string; score: number | null; inverse?: boolean }) {
  const shown = inverse && score !== null ? 100 - score : score;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-stone-500">
        <span>{label}</span>
        <span>{shown?.toFixed(0) ?? "-"}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200">
        <div className={`h-full rounded-full ${getScoreBarColor(shown)}`} style={{ width: `${shown ?? 0}%` }} />
      </div>
    </div>
  );
}
