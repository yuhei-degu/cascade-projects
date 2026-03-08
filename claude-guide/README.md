# ⚡ Claude Code 超入門ガイド

> IT未経験・英語苦手でも「このサイトだけ」でAI開発できる、完全日本語の学習プラットフォーム

## セットアップ

```bash
npm install
cp .env.example .env   # 環境変数を設定
npm run db:migrate     # DBマイグレーション
npm run dev            # http://localhost:3000
```

## ページ構成

| URL | 内容 |
|-----|------|
| `/` | LP（ランディングページ） |
| `/start` | 🔰 初心者一本道モード |
| `/learn` | 📚 ツリーナビゲーション |
| `/check` | 🔍 環境診断 |
| `/error` | 🆘 エラー診断 |
| `/translate` | 🌐 英語UI翻訳辞書 |
| `/prompts` | 🚀 プロンプト生成器 |
| `/progress` | 📊 進捗管理 |

## Claude Code用開発プロンプト

`docs/CLAUDE_CODE_PROMPTS.md` に残機能のプロンプトをまとめています。
