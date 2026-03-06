import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Market Discovery AI | 収益化テーマ発掘エンジン",
  description: "Q&A投稿を解析して「需要高・低競合・収益化可能」な市場テーマを発見するAIツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className={`${inter.className} bg-gray-950 antialiased`}>{children}</body>
    </html>
  );
}
