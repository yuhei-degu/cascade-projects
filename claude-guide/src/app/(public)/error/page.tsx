// src/app/(public)/error/page.tsx
import { ErrorChecker } from "@/components/learn/ErrorChecker"

export default function ErrorPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🆘</div>
        <h1 className="text-3xl font-black mb-3">エラー診断ツール</h1>
        <p className="text-gray-500">
          エラーメッセージをそのままコピーして貼り付けてください。<br />
          原因と解決方法を自動で教えます。
        </p>
      </div>
      <ErrorChecker />
    </main>
  )
}
