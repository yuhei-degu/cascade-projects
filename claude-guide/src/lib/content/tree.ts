// src/lib/content/tree.ts
import type { TreeNode } from "@/types"

export const TREE: TreeNode[] = [
  {
    id: "install", label: "📦 インストール", children: [
      { id: "install-windows", label: "🪟 Windows版", href: "/learn/install/windows" },
      { id: "install-mac",     label: "🍎 Mac版",     href: "/learn/install/mac" },
      { id: "install-linux",   label: "🐧 Linux版",   href: "/learn/install/linux" },
    ],
  },
  {
    id: "setup", label: "⚙️ 初期設定", children: [
      { id: "setup-apikey",  label: "🔑 APIキーの取得", href: "/learn/setup/apikey" },
      { id: "setup-env",     label: "🔧 APIキーの設定", href: "/learn/setup/env" },
      { id: "setup-test",    label: "✅ 動作テスト",    href: "/learn/setup/test" },
    ],
  },
  {
    id: "basics", label: "🎮 基本操作", children: [
      { id: "basics-ui",       label: "🖥️ 画面の見方",   href: "/learn/basics/ui" },
      { id: "basics-command",  label: "⌨️ 命令の送り方", href: "/learn/basics/command" },
      { id: "basics-file",     label: "📁 ファイルの扱い", href: "/learn/basics/file" },
    ],
  },
  {
    id: "cli", label: "💻 コマンド操作", children: [
      { id: "cli-open",     label: "⬛ 黒い画面の開き方", href: "/learn/cli/open" },
      { id: "cli-commands", label: "📋 よく使うコマンド",  href: "/learn/cli/commands" },
      { id: "cli-path",     label: "📍 パスの指定方法",   href: "/learn/cli/path" },
    ],
  },
  {
    id: "projects", label: "🚀 プロジェクト作成", children: [
      { id: "proj-webapp",     label: "🌐 Webアプリを作る",    href: "/learn/projects/webapp" },
      { id: "proj-python",     label: "🐍 Pythonツール",       href: "/learn/projects/python" },
      { id: "proj-ai-video",   label: "🎬 AI動画生成ツール",   href: "/learn/projects/ai-video" },
      { id: "proj-stock",      label: "📈 株分析アプリ",       href: "/learn/projects/stock" },
      { id: "proj-automation", label: "🤖 自動化ツール",       href: "/learn/projects/automation" },
    ],
  },
  {
    id: "trouble", label: "🆘 困ったとき", children: [
      { id: "trouble-errors", label: "⚠️ よくあるエラー集",  href: "/learn/trouble/errors" },
      { id: "trouble-check",  label: "🔍 エラー診断ツール",  href: "/error" },
      { id: "trouble-ai",     label: "🤖 AIに質問する",      href: "/learn/trouble/ai" },
    ],
  },
]
