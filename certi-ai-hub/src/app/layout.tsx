// src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header, Sidebar, SidebarProvider } from "../components/layout"
import { FeedbackWidget } from "../components/feedback/FeedbackWidget"

const inter = Inter({ subsets: ["latin"], display: "swap" })

const SITE_URL = "https://certi-ai-hub.vercel.app"
const SITE_NAME = "Certi-AI Hub"
const DESCRIPTION = "情報処理安全確保支援士（SC）とAWS Certified AI Practitioner（AIF）を同時に対策できる無料学習プラットフォーム。204問以上・カテゴリ別・難易度別・模擬試験対応。2026年度CBT方式対応。"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | SC × AIF 資格学習プラットフォーム`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "情報処理安全確保支援士", "セキスペ", "SC試験", "SC対策",
    "AWS Certified AI Practitioner", "AIF", "AIF対策", "AWS AI試験",
    "CBT模擬試験", "IT資格", "資格学習", "セキュリティ資格",
    "プロンプトインジェクション", "Bedrock", "生成AI", "機械学習",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | SC × AIF 資格学習プラットフォーム`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | SC × AIF 資格学習プラットフォーム`,
    description: DESCRIPTION,
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  } : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={inter.className}>
      <body>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <FeedbackWidget />
              <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
                <p className="font-bold text-gray-600 mb-1">🎓 Certi-AI Hub</p>
                <p>SC × AIF 統合学習プラットフォーム — 2026年度CBT対応</p>
              </footer>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
