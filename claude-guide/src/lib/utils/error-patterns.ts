// src/lib/utils/error-patterns.ts
import type { ErrorPattern } from "@/types"

export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /not found|認識されていません|is not recognized/i,
    category: "path",
    cause: "コマンドがパソコンに登録されていないか、インストールが完了していません",
    solution: "パソコンを再起動してから試してください。それでも出る場合は「PATH（パス）設定」が必要です。",
    guideUrl: "/learn/install/windows#path",
  },
  {
    pattern: /permission denied|アクセスが拒否|EACCES/i,
    category: "permission",
    cause: "操作に必要な権限がありません",
    solution: "PowerShellや黒い画面を「管理者として実行」で開き直してください。",
    guideUrl: "/learn/basics/admin",
  },
  {
    pattern: /ENOENT|no such file|ファイルが見つかりません/i,
    category: "path",
    cause: "指定したフォルダやファイルが存在しません",
    solution: "フォルダの場所（パス）を確認してください。全角スペースや全角文字が混じっていないか確認を。",
  },
  {
    pattern: /network|ECONNREFUSED|ETIMEDOUT|接続|connect/i,
    category: "network",
    cause: "インターネット接続に問題があります",
    solution: "Wi-Fiが繋がっているか確認してください。VPNを使っている場合は一時的にオフにしてみてください。",
  },
  {
    pattern: /api.?key|401|403|authentication|認証/i,
    category: "api_key",
    cause: "APIキー（合言葉）が設定されていないか、間違っています",
    solution: "APIキーの設定手順を確認してください。コピー時に前後のスペースが入っていることがあります。",
    guideUrl: "/learn/setup/apikey",
  },
  {
    pattern: /npm err|npm warn.*peer|install failed/i,
    category: "install",
    cause: "ソフトウェアのインストール中にエラーが発生しました",
    solution: "以下のコマンドを試してください: npm cache clean --force → npm install",
  },
]

export function analyzeError(errorText: string): ErrorPattern | null {
  return ERROR_PATTERNS.find((p) => p.pattern.test(errorText)) ?? null
}
