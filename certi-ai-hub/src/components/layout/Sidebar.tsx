import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 hidden md:flex flex-col p-4 space-y-4">
      <Link href="/" className="flex items-center gap-2 font-black text-xl mb-4">
        <span className="text-2xl">🎓</span>
        <span>Certi-AI <span className="text-brand">Hub</span></span>
      </Link>

      <nav className="flex-1 flex flex-col gap-2">
        <Link
          href="/sc-module"
          className="block py-2 px-3 rounded hover:bg-sc-light text-sc font-medium"
        >
          🔒 SC（支援士）
        </Link>
        <Link
          href="/aws-module"
          className="block py-2 px-3 rounded hover:bg-aws-light text-aws font-medium"
        >
          ☁️ AIF（AWS）
        </Link>
        <Link
          href="/common/exam"
          className="block py-2 px-3 rounded hover:bg-brand-light font-medium"
        >
          📝 模擬試験
        </Link>
      </nav>

      <div>
        <Link
          href="/dashboard"
          className="block py-2 px-3 rounded bg-brand text-white text-center font-semibold hover:bg-brand-dark transition-colors"
        >
          ダッシュボード
        </Link>
      </div>
    </aside>
  )
}
