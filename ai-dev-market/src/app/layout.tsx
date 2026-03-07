import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "AI Dev Market — AIで作る小規模開発サービス",
  description: "スクリプト・Webツール・自動化など¥10,000〜¥30,000の小規模開発をAIで高速納品",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>{children}</body>
    </html>
  );
}
