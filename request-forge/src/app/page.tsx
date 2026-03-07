/**
 * トップページ — ランディング + 依頼ボタン
 */
import Link from "next/link";

const features = [
  { icon: "🤖", title: "AI自動審査", desc: "GeminiとGPT-4が同時審査。実現困難な依頼は即座にお断り" },
  { icon: "⚡", title: "Claude Codeで制作", desc: "最新AIを使った爆速開発。Webサイト・アプリ・自動化まで" },
  { icon: "✅", title: "確認してからお支払い", desc: "完成品を事前に確認。納得してからStripeで安全に決済" },
];

const examples = [
  { category: "Webサイト", title: "ポートフォリオサイトを作ってほしい", price: "¥10,000〜" },
  { category: "Webアプリ", title: "在庫管理ツールのダッシュボード", price: "¥30,000〜" },
  { category: "スクリプト", title: "Excelを自動整形するPythonスクリプト", price: "¥5,000〜" },
  { category: "修正対応", title: "既存サイトのバグ修正・機能追加", price: "¥5,000〜" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-black text-lg">
            ⚡ <span className="text-violet-400">Request</span>Forge
          </span>
          <Link href="/request/new"
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            依頼する →
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="pt-32 pb-20 px-4 text-center max-w-3xl mx-auto">
        <div className="inline-block bg-violet-500/10 text-violet-400 border border-violet-500/30 text-sm px-3 py-1 rounded-full mb-6">
          AI × Claude Code で爆速制作
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
          何でも<span className="text-violet-400">作成依頼</span>できる<br />制作サービス
        </h1>
        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          Webサイト・アプリ・スクリプト・修正依頼まで。<br />
          AIが審査して実現可能な依頼のみ受付。確認後にお支払い。
        </p>
        <Link href="/request/new"
          className="inline-flex items-center gap-2 gradient-brand text-white font-bold text-lg px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20">
          無料で依頼を出す →
        </Link>
        <p className="mt-4 text-gray-600 text-sm">審査まで無料・断られても料金なし</p>
      </section>

      {/* フロー説明 */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-12">ご利用の流れ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
            {[
              { step: "1", label: "依頼投稿", icon: "📝" },
              { step: "→", label: "", icon: "" },
              { step: "2", label: "AI審査", icon: "🤖" },
              { step: "→", label: "", icon: "" },
              { step: "3", label: "制作開始", icon: "⚡" },
            ].map((s, i) => (
              <div key={i} className={s.icon ? "bg-gray-800 rounded-xl p-4 text-center" : "text-center text-gray-600 text-2xl"}>
                {s.icon ? (<>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-xs text-gray-400">Step {s.step}</div>
                  <div className="font-semibold text-sm mt-1">{s.label}</div>
                </>) : s.step}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center mt-4">
            {[
              { step: "4", label: "確認", icon: "✅" },
              { step: "→", label: "", icon: "" },
              { step: "5", label: "決済", icon: "💳" },
              { step: "→", label: "", icon: "" },
              { step: "6", label: "納品", icon: "🎉" },
            ].map((s, i) => (
              <div key={i} className={s.icon ? "bg-gray-800 rounded-xl p-4 text-center" : "text-center text-gray-600 text-2xl"}>
                {s.icon ? (<>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-xs text-gray-400">Step {s.step}</div>
                  <div className="font-semibold text-sm mt-1">{s.label}</div>
                </>) : s.step}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-center text-2xl font-bold mb-10">なぜRequestForge？</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 依頼例 */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-10">こんな依頼が届いています</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {examples.map((e) => (
              <div key={e.title} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded">{e.category}</span>
                  <p className="mt-2 font-medium text-sm">{e.title}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-emerald-400 font-bold text-sm">{e.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-black mb-4">まずは依頼してみよう</h2>
        <p className="text-gray-400 mb-8">審査無料・断られても料金なし</p>
        <Link href="/request/new"
          className="inline-flex items-center gap-2 gradient-brand text-white font-bold text-lg px-10 py-4 rounded-xl hover:opacity-90 transition-opacity">
          依頼フォームへ →
        </Link>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-600 text-sm">
        © 2026 RequestForge
      </footer>
    </main>
  );
}
