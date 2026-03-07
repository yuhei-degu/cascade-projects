export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-black mb-3">お支払いが完了しました！</h1>
        <p className="text-gray-400 mb-6">
          ご注文ありがとうございます。<br />
          納品情報をご登録のメールアドレスにお送りします。<br />
          しばらくお待ちください。
        </p>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-sm text-emerald-400 mb-6">
          ✅ 決済確認済み — 間もなく納品メールが届きます
        </div>
        <a href="/" className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors">
          トップに戻る
        </a>
      </div>
    </div>
  );
}
