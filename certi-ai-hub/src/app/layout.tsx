// src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header, Sidebar, SidebarProvider } from "../components/layout"
import { FeedbackWidget } from "../components/feedback/FeedbackWidget"

const inter = Inter({ subsets: ["latin"], display: "swap" })

const SITE_URL = "https://cascade-projects-lvq1.vercel.app"
const SITE_NAME = "AIセキュリティエンジニア養成所"
const DESCRIPTION = "資格で終わらない、AI時代に通用する実務力を。セキスペ（SC）・AWS AIF対策をしながら、実際のAI駆動開発で役立つセキュリティ設計力・クラウドAI活用力を鍛える学習プラットフォーム。AI開発者・エンジニア向け。"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 資格で終わらない、AI時代の実務力を`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "AIセキュリティエンジニア", "情報処理安全確保支援士", "セキスペ", "SC試験", "SC対策",
    "AWS Certified AI Practitioner", "AIF", "AIF対策", "AWS AI試験",
    "AI駆動開発", "AI開発セキュリティ", "セキュリティ設計", "LLMセキュリティ",
    "プロンプトインジェクション", "Bedrock", "生成AI", "CBT模擬試験",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 資格で終わらない、AI時代の実務力を`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | 資格で終わらない、AI時代の実務力を`,
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
                <p className="font-bold text-gray-600 mb-1">🛡️ AIセキュリティエンジニア養成所</p>
                <p>資格で終わらない、AI時代に通用する実務力を</p>
              </footer>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
