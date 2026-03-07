export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-black mb-3">お支払い完了！</h1>
        <p className="text-slate-400 mb-6">ありがとうございます。<br />開発を開始しました。完成しましたらメールでお知らせします。</p>
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 text-sm text-violet-300 mb-6">
          ⚡ 開発中 — 目安7日以内に納品します
        </div>
        <a href="/" className="block bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors">トップへ戻る</a>
      </div>
    </div>
  );
}
