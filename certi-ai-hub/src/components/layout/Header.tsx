import Link from "next/link"

export default function Header() {
  return (
    <header className="h-14 bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur">
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl">
          <span className="text-2xl">🎓</span>
          <span>Certi-AI <span className="text-brand">Hub</span></span>
        </Link>

        {/* mobile nav: show on md and below; hide when sidebar is visible */}
        <nav className="flex md:hidden items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/sc-module" className="flex items-center gap-1 hover:text-sc transition-colors">
            🔒 SC
          </Link>
          <Link href="/aws-module" className="flex items-center gap-1 hover:text-aws transition-colors">
            ☁️ AIF
          </Link>
          <Link href="/common/exam" className="hover:text-brand transition-colors">
            📝 模擬試験
          </Link>
        </nav>

        <Link
          href="/dashboard"
          className="bg-brand text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors"
        >
          ダッシュボード
        </Link>
      </div>
    </header>
  )
}
