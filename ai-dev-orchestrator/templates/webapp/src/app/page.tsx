// src/app/page.tsx — テンプレート初期ページ
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4">🤖 AI Dev Project</h1>
        <p className="text-gray-500">AI Dev Orchestratorによって自動生成されたプロジェクト</p>
        <p className="text-sm text-gray-400 mt-2">ai_memory/ のファイルを確認してください</p>
      </div>
    </main>
  )
}
