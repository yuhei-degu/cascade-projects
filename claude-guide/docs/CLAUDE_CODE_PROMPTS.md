# Claude Code 開発プロンプト集
# このファイルをClaude Codeにそのまま貼り付けて使う

## ① 環境チェックページ実装
以下の仕様でNext.js App Router のページを実装してください。

ページ: /check
機能:
- 以下のチェック項目をUI上のボタンで確認できる
  - Node.js: `node --version` の出力を確認
  - npm: `npm --version`
  - Git: `git --version`
  - Claude Code: `claude --version`
- 各項目に ✅成功 / ❌失敗 / ⏳確認中 の3状態を表示
- 失敗した場合はインストールページへのリンクを表示
- ブラウザからコマンド実行はできないので、ユーザーに手動でコマンドを実行してもらい結果を入力してもらうUI

技術: Next.js 14 App Router + TypeScript + Tailwind CSS
UIスタイル: 白ベース・カード型・シンプル

---

## ② 翻訳辞書ページ実装
/translate ページを実装してください。

データ: src/content/translations/ui-dictionary.json
機能:
- 英語UIの一覧を表示
- 検索ボックスでリアルタイムフィルター（Fuse.jsを使用）
- 各カードに: 英語原文 / 日本語訳 / 説明 の3行表示
- コピーボタンで英語原文をクリップボードにコピー

---

## ③ 進捗管理機能実装
localStorage を使ったシンプルな進捗管理を実装してください。

仕様:
- ユーザーが「完了した」ボタンを押すとステップIDをlocalStorageに保存
- /progress ページでチェックリスト形式で表示
- 連続学習日数（ストリーク）を計算して表示
- Zustandで状態管理

型定義は src/types/index.ts を参照してください。

---

## ④ 学習ツリーページ実装
/learn ページを実装してください。

データ: src/lib/content/tree.ts の TREE 配列を使用
機能:
- 左サイドバーにTreeNav（src/components/layout/TreeNav.tsx）
- メインエリアに選択中のカテゴリの説明
- スマホ対応（サイドバーはハンバーガーメニュー）

---

## ⑤ 完了ページ実装
/start/complete ページを実装してください。

内容:
- 🎉 大きな祝福アニメーション（confettiなど）
- 「Claude Codeが使えるようになりました！」メッセージ
- 次にやること3つのリンク
  - プロジェクトを作ってみる → /learn/projects/webapp
  - プロンプト生成器を使う → /prompts
  - コミュニティに参加する（外部リンク）
