import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./tailwind.generated.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Market Discovery AI | 最新需要から自動開発へ",
  description: "日本市場の需要シグナルを拾い、候補をスコア化してAI Company OSの自動開発ラインへ渡すダッシュボード。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-[#f7f4ee] antialiased`}>{children}</body>
    </html>
  );
}
