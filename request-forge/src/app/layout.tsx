import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RequestForge — 何でも作成依頼サービス",
  description: "Webサイト・アプリ・スクリプトなど、プログラム制作をAIサポートで迅速に対応",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}>{children}</body>
    </html>
  );
}
