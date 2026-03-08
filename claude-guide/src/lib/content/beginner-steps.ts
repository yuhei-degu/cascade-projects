// src/lib/content/beginner-steps.ts
// 一本道モードの全ステップ定義

export interface BeginnerStep {
  id: string
  step: number
  title: string
  why: string
  commands?: { label: string; cmd: string; expected?: string }[]
  guideUrl: string
  commonErrors: { error: string; solution: string }[]
  nextLabel?: string
}

export const BEGINNER_STEPS_WINDOWS: BeginnerStep[] = [
  {
    id: "env-check",
    step: 1,
    title: "パソコンの環境を確認する",
    why: "まずあなたのパソコンに何が入っていて、何が足りないかを確認します。足りないものだけインストールするので、無駄がありません。",
    guideUrl: "/check",
    commands: [],
    commonErrors: [],
    nextLabel: "環境チェックをする",
  },
  {
    id: "install-node",
    step: 2,
    title: "Node.js（ノードJS）をインストールする",
    why: "Claude Codeを動かすための「土台」です。Excelを動かすためにWindowsが必要なように、Claude Codeを動かすためにNode.jsが必要です。",
    guideUrl: "/learn/install/windows#node",
    commands: [
      { label: "インストール確認コマンド", cmd: "node --version", expected: "v20.x.x のような表示が出ればOK" },
    ],
    commonErrors: [
      { error: "'node' は内部コマンドまたは外部コマンドとして認識されていません", solution: "パソコンを再起動してから試してください" },
    ],
  },
  {
    id: "install-claude",
    step: 3,
    title: "Claude Code（クロードコード）をインストールする",
    why: "これがAIアシスタントの本体です。ここまでくれば、あとはAIに話しかけるだけでアプリが作れます。",
    guideUrl: "/learn/install/windows#claude",
    commands: [
      { label: "インストールコマンド（コピーして貼り付け）", cmd: "npm install -g @anthropic-ai/claude-code" },
      { label: "インストール確認", cmd: "claude --version", expected: "バージョン番号が表示されればOK" },
    ],
    commonErrors: [
      { error: "npm: command not found", solution: "STEP 2に戻り、Node.jsをインストールしてください" },
      { error: "permission denied / アクセスが拒否", solution: "黒い画面（PowerShell）を「管理者として実行」で開き直してください" },
    ],
  },
  {
    id: "setup-apikey",
    step: 4,
    title: "APIキー（合言葉）を設定する",
    why: "ClaudeはAnthropicというAI会社のサービスです。使うには「あなたのアカウントです」と証明する合言葉（APIキー）が必要です。",
    guideUrl: "/learn/setup/apikey",
    commands: [
      { label: "APIキーを設定するコマンド", cmd: "claude config set apiKey YOUR_API_KEY_HERE" },
    ],
    commonErrors: [
      { error: "Invalid API Key / 認証エラー", solution: "APIキーをコピーし直してください。前後にスペースが入ることがあります" },
    ],
  },
  {
    id: "first-project",
    step: 5,
    title: "最初のプロジェクトを作ってみる",
    why: "いよいよAIに命令してアプリを作ります！最初は「Hello World」という小さなプログラムで動作確認します。",
    guideUrl: "/learn/projects/webapp",
    commands: [
      { label: "フォルダを作る", cmd: "mkdir my-first-app && cd my-first-app" },
      { label: "Claude Codeを起動する", cmd: "claude" },
    ],
    commonErrors: [],
    nextLabel: "🎉 完了！",
  },
]
