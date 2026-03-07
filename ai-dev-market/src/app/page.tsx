/**
 * 5. UI設計 — トップページ（LP）
 */
import Link from "next/link";

const EXAMPLES = [
  { icon: "📊", cat: "スクリプト", title: "Excelを自動整形するPythonスクリプト", price: "¥10,000" },
  { icon: "🔧", cat: "Webツール", title: "消費税・割引計算ツール", price: "¥15,000" },
  { icon: "🤖", cat: "API連携", title: "LINE → Slack 通知ボット", price: "¥20,000" },
  { icon: "📈", cat: "ダッシュボード", title: "売上集計ダッシュボード（Sheets連携）", price: "¥25,000" },
];

const STEPS = [
  { n:"1", icon:"📝", t:"依頼投稿", d:"何を作りたいか書くだけ" },
  { n:"→", icon:"", t:"", d:"" },
  { n:"2", icon:"🤖", t:"AI審査", d:"GPT+Geminiが即座に評価" },
  { n:"→", icon:"", t:"", d:"" },
  { n:"3", icon:"⚡", t:"試作提示", d:"実現可能なら即プロトタイプ提示" },
  { n:"→", icon:"", t:"", d:"" },
  { n:"4", icon:"💳", t:"決済・開発", d:"OKなら前払いで開発開始" },
  { n:"→", icon:"", t:"", d:"" },
  { n:"5", icon:"🎉", t:"納品", d:"完成品をお届け" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-black text-lg">⚡ <span className="text-violet-400">AI</span> Dev Market</span>
          <Link href="/request/new" className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            無料で依頼する →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm px-3 py-1 rounded-full mb-6">
          🤖 AI × 個人開発で最速納品
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">
          小規模プログラム開発<br />
          <span className="text-violet-400">¥10,000〜¥30,000</span>で承ります
        </h1>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          スクリプト・Webツール・API連携・自動化など<br />
          <strong className="text-slate-300">AIで確実に作れる規模</strong>の依頼のみ受付。<br />
          試作プロトタイプを先に確認してからお支払い。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/request/new" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20">
            今すぐ依頼する →
          </Link>
          <a href="#examples" className="inline-flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-semibold px-8 py-4 rounded-xl hover:bg-slate-700 transition-colors">
            依頼例を見る
          </a>
        </div>
        <p className="mt-4 text-slate-600 text-sm">審査・プロトタイプ確認まで完全無料 / 断られても料金なし</p>
      </section>

      {/* 流れ */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-10">ご利用の流れ</h2>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 items-center">
            {STEPS.map((s, i) => (
              <div key={i} className={s.icon ? "bg-slate-800 border border-slate-700 rounded-xl p-3 text-center" : "text-center text-slate-600 text-xl hidden sm:block"}>
                {s.icon ? (<>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xs text-slate-400 font-semibold">{s.t}</div>
                  <div className="text-xs text-slate-600 mt-0.5 hidden sm:block">{s.d}</div>
                </>) : "→"}
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm mt-6">
            ※ <strong className="text-amber-400">AI自動審査</strong>で対応可能な依頼のみ受付。C判定は丁寧にお断りします。
          </p>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-5">
          {[
            { icon:"🎯", t:"試作先出し戦略", d:"AIが即座に骨格を生成。「この方向で作れます」を先に見せることで認識ズレを防止" },
            { icon:"⚡", t:"AI活用で高速納品", d:"Claude/GPT-4/Geminiをフル活用。1〜4日で高品質な成果物をお届け" },
            { icon:"💰", t:"確認後にお支払い", d:"プロトタイプ確認後に前払い。試作がイメージと違えば無料キャンセル可能" },
          ].map(f => (
            <div key={f.t} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2">{f.t}</h3>
              <p className="text-slate-400 text-sm">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 依頼例 */}
      <section id="examples" className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-10">こんな依頼が得意です</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {EXAMPLES.map(e => (
              <div key={e.title} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{e.icon}</span>
                    <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded">{e.cat}</span>
                  </div>
                  <p className="text-sm font-medium">{e.title}</p>
                </div>
                <div className="text-emerald-400 font-bold text-sm flex-shrink-0">{e.price}〜</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-black mb-3">まずは無料で試してみよう</h2>
        <p className="text-slate-400 mb-8">審査・試作確認まで完全無料</p>
        <Link href="/request/new" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xl px-10 py-5 rounded-xl hover:opacity-90 transition-opacity">
          依頼フォームへ →
        </Link>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
        © 2026 AI Dev Market — 個人開発副業サービス
      </footer>
    </main>
  );
}
