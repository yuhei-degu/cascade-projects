"use client"

import Link from "next/link"
import { ArrowRight, Brain, Code2, Lock, ShieldAlert, ShieldCheck } from "lucide-react"
import { SqlInjectionLab } from "@/components/lab/SqlInjectionLab"
import { PromptInjectionLab } from "@/components/lab/PromptInjectionLab"

const categories = [
  { key: "ai_threat", label: "AI脅威対策", icon: Brain, desc: "プロンプトインジェクション、データ汚染、モデル攻撃を確認します。" },
  { key: "threat", label: "脅威と攻撃手法", icon: ShieldAlert, desc: "SQLi、XSS、CSRF、マルウェア、フィッシングを整理します。" },
  { key: "coding", label: "セキュアコーディング", icon: Code2, desc: "入力検証、出力エスケープ、安全な実装パターンを学びます。" },
  { key: "crypto", label: "暗号・PKI", icon: Lock, desc: "公開鍵暗号、電子署名、TLS、証明書管理を押さえます。" },
  { key: "management", label: "セキュリティ管理", icon: ShieldCheck, desc: "ISMS、リスク管理、法制度、インシデント対応を確認します。" },
]

const difficulties = [
  { value: "", label: "全問", desc: "分野全体をざっと確認" },
  { value: "1", label: "基礎", desc: "用語と基本問題" },
  { value: "2", label: "標準", desc: "本試験レベル" },
  { value: "3", label: "難問", desc: "応用・ひっかけ対策" },
]

export default function ScModulePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-8 rounded-lg border border-sky-200 bg-sky-50 p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-700">Security Specialist</p>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">情報処理安全確保支援士 SC</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              脅威、暗号、セキュア設計、運用管理を試験形式で確認します。AI脅威も含めて、実務で使える判断軸に寄せて学べます。
            </p>
          </div>
          <Link href="/common/exam?module=SC&mode=exam" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-sky-700 px-5 text-sm font-bold text-white transition hover:bg-sky-800">
            SC模擬試験を開始
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950">難易度から始める</h2>
          <p className="text-xs font-medium text-slate-500">短時間の10問セット</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {difficulties.map((difficulty) => (
            <Link
              key={difficulty.value || "all"}
              href={`/common/exam?module=SC${difficulty.value ? `&difficulty=${difficulty.value}` : ""}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <div className="text-sm font-black text-slate-950">{difficulty.label}</div>
              <p className="mt-1 text-xs leading-5 text-slate-500">{difficulty.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-black text-slate-950">カテゴリから選ぶ</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <article key={category.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                    <Icon size={19} />
                  </div>
                  <h3 className="font-black text-slate-950">{category.label}</h3>
                </div>
                <p className="text-sm leading-6 text-slate-500">{category.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/common/exam?module=SC&category=${category.key}`} className="rounded-md bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">全問</Link>
                  <Link href={`/common/exam?module=SC&category=${category.key}&difficulty=1`} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">基礎</Link>
                  <Link href={`/common/exam?module=SC&category=${category.key}&difficulty=2`} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">標準</Link>
                  <Link href={`/common/exam?module=SC&category=${category.key}&difficulty=3`} className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">難問</Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mb-10 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-black text-amber-900">SC × AWS AIF の横断練習</h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">SCで学ぶ脅威や対策が、AWSのAI機能ではどう実装されるかを確認します。</p>
          </div>
          <Link href="/common/exam?module=MIXED" className="inline-flex h-10 items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-bold text-white transition hover:bg-amber-700">
            混合問題へ
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-700">Interactive Lab</p>
          <h2 className="text-xl font-black text-slate-950">攻撃の仕組みを触って理解する</h2>
          <p className="mt-2 text-sm text-slate-500">安全なデモで、対策がなぜ必要かを体感できます。</p>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-700">SQLインジェクション</h3>
            <SqlInjectionLab />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-700">プロンプトインジェクション</h3>
            <PromptInjectionLab />
          </div>
        </div>
      </section>
    </main>
  )
}
