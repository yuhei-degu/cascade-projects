/** レイアウト・グローバルCSS設定 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Stock Analyzer | AI割安株スクリーナー",
  description: "AI関連企業の技術力・成長性・収益性を統合スコアリングして割安株を発見するツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className={`${inter.className} bg-gray-950 antialiased`}>{children}</body>
    </html>
  );
}
