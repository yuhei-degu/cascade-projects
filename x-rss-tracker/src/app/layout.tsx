import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "X RSS Tracker",
  description: "X重要人物アカウントのRSSトラッカー",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-white min-h-screen">
        {/* ナビゲーション */}
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-black text-lg">
              <span className="text-2xl">⚡</span>
              <span className="text-white">X RSS Tracker</span>
            </a>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                投稿一覧
              </a>
              <a
                href="/accounts"
                className="text-gray-400 hover:text-white transition-colors"
              >
                アカウント管理
              </a>
            </div>
          </div>
        </nav>

        {/* メインコンテンツ */}
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>

        {/* フッター */}
        <footer className="border-t border-gray-800 mt-16 py-8 text-center text-xs text-gray-600">
          X RSS Tracker — MVP | AIスコアリング機能は今後追加予定
        </footer>
      </body>
    </html>
  );
}
