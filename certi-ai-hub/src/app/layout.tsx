import type { Metadata } from "next"
import "./globals.css"
import { Header, Sidebar, SidebarProvider } from "../components/layout"
import { FeedbackWidget } from "../components/feedback/FeedbackWidget"

const SITE_URL = "https://cascade-projects-lvq1.vercel.app"
const SITE_NAME = "Certi-AI Hub"
const DESCRIPTION = "情報処理安全確保支援士と AWS Certified AI Practitioner を横断して学ぶ、AI時代の資格学習ハブ。"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | SC と AWS AIF を横断して学ぶ`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "情報処理安全確保支援士",
    "SC試験",
    "SC対策",
    "AWS Certified AI Practitioner",
    "AIF",
    "AIF対策",
    "AWS AI試験",
    "AIセキュリティ",
    "LLMセキュリティ",
    "プロンプトインジェクション",
    "Amazon Bedrock",
    "生成AI",
    "CBT模擬試験",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | SC と AWS AIF を横断して学ぶ`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | SC と AWS AIF を横断して学ぶ`,
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
    <html lang="ja">
      <body>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <FeedbackWidget />
              <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
                <p className="mb-1 font-bold text-slate-700">Certi-AI Hub</p>
                <p>SC と AWS AIF を横断して学ぶ、AI時代の資格学習ハブ。</p>
              </footer>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}
