// src/app/(public)/page.tsx
import Link from "next/link"

const FEATURES = [
  { icon: "🗾", title: "完全日本語", desc: "英語UIも全て日本語で説明。英語が苦手でも安心" },
  { icon: "🎯", title: "一本道モード", desc: "「次へ」を押すだけ。何をすべきか迷わない" },
  { icon: "🤖", title: "AI即答サポート", desc: "詰まったら即AIに質問。エラーも自動診断" },
  { icon: "📋", title: "コピペで完了", desc: "コマンドはワンクリックでコピー。打ち間違いゼロ" },
  { icon: "📊", title: "進捗管理", desc: "どこまで進んだか自動で保存。続きから再開できる" },
  { icon: "🚀", title: "プロンプト生成", desc: "作りたいものを選ぶだけでClaude Codeへの指示文を生成" },
]

const PERSONAS = [
  { emoji: "👩‍⚕️", name: "田中さん（看護師）", quote: "英語が全く読めなくて毎回挫折してました。このサイトで初めて動くものが作れました！" },
  { emoji: "👨‍🏫", name: "鈴木さん（教師）", quote: "専門用語だらけで諦めていたのが、わかりやすい説明のおかげで1日でインストールできました" },
  { emoji: "👩‍💼", name: "佐藤さん（事務）", quote: "エラーが出るたびに詰まっていましたが、診断ツールで全部解決できてびっくりしました" },
]

export default function HomePage() {
  return (
    <main>
      {/* ヒーロー */}
      <section className="bg-gradient-to-b from-violet-50 to-white pt-20 pb-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-2 rounded-full mb-8">
            ✨ IT未経験・英語苦手でも大丈夫
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6">
            このサイトだけで<br />
            <span className="text-violet-600">誰でもAI開発</span>できる
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            看護師・教師・事務員など、IT未経験の方でも<br className="hidden sm:block" />
            Claude Codeでアプリが作れるようになる<br className="hidden sm:block" />
            完全日本語の学習プラットフォーム
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-violet-200"
            >
              🔰 初心者モードで始める（無料）
            </Link>
            <Link
              href="/learn"
              className="bg-white border-2 border-gray-200 hover:border-violet-300 text-gray-700 font-bold text-lg px-8 py-4 rounded-2xl transition-colors"
            >
              📚 学習ツリーを見る
            </Link>
          </div>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-12">なぜ挫折しないのか</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 声 */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">IT未経験の方の声</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PERSONAS.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-4xl mb-4 text-center">{p.emoji}</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">「{p.quote}」</p>
                <p className="text-xs font-semibold text-gray-400 text-right">— {p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-3xl font-black mb-4">今日から始めましょう</h2>
        <p className="text-gray-500 mb-8">まず環境チェックから。5分で今の状態がわかります。</p>
        <Link
          href="/start"
          className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-bold text-xl px-10 py-5 rounded-2xl transition-colors shadow-xl shadow-violet-100"
        >
          ⚡ 無料でスタート →
        </Link>
      </section>
    </main>
  )
}
