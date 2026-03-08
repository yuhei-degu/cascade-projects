// src/lib/utils/prompt-templates.ts
import type { PromptTemplate } from "@/types"

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "stock-app",
    label: "株分析アプリ",
    icon: "📈",
    description: "銘柄コードを入力すると株価チャートを表示するアプリ",
    template: `日本株の分析アプリを作ってください。

【機能】
- 銘柄コード（例: 7203 トヨタ）を入力すると株価チャートを表示
- 過去1年・3ヶ月・1ヶ月のチャートを切り替えられる
- 現在株価・前日比・52週高値/安値を表示

【技術スタック】
- Next.js 14 + TypeScript
- Tailwind CSS
- Recharts（グラフ表示）
- Yahoo Finance API（株価取得）

【重要】
- UIは完全日本語
- 初心者でも使いやすいシンプルなデザイン
- まずMVPとして最小限の機能から実装してください`,
    questions: ["どの銘柄を分析したいですか？", "スマホでも使えるようにしますか？"],
  },
  {
    id: "webapp",
    label: "Webサイト・アプリ",
    icon: "🌐",
    description: "ビジネス向けWebサイトやWebアプリを作る",
    template: `次のWebアプリを作ってください。

【アプリ概要】
{{DESCRIPTION}}

【必須機能】
{{FEATURES}}

【技術スタック】
- Next.js 14 + TypeScript
- Tailwind CSS
- Supabase（データ保存）

【デザイン】
- シンプルで日本語UI
- スマホ対応
- Appleのようなクリーンなデザイン

まず最小限の機能（MVP）から実装してください。`,
    questions: ["何のためのアプリですか？", "どんな機能が必要ですか？"],
  },
  {
    id: "automation",
    label: "自動化ツール",
    icon: "🤖",
    description: "毎日の繰り返し作業を自動化する",
    template: `以下の作業を自動化するPythonスクリプトを作ってください。

【自動化したい作業】
{{TASK}}

【要件】
- 実行は1コマンドで完了する
- エラーが起きたら日本語でわかりやすく表示する
- 処理結果をログファイルに保存する
- コメントは日本語で書く

まず最小限の動くバージョンから作ってください。`,
    questions: ["どんな作業を自動化したいですか？", "毎日・毎週のどちらで実行しますか？"],
  },
  {
    id: "line-bot",
    label: "LINEボット",
    icon: "💬",
    description: "LINEで自動返答するボットを作る",
    template: `LINEで自動返答するボットを作ってください。

【ボットの機能】
{{FEATURES}}

【技術スタック】
- Python + FastAPI
- LINE Messaging API
- ngrok（ローカル開発用）

【要件】
- セットアップ手順をREADME.mdに日本語で書く
- エラーハンドリングを丁寧に実装する

まず「おはよう」と送ると「おはようございます！」と返すだけの最小版から作ってください。`,
    questions: ["ボットに何をさせたいですか？"],
  },
]
