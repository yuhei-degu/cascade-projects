# 🎓 Certi-AI Hub

> SC（情報処理安全確保支援士）× AWS AIF（AI Practitioner）統合学習プラットフォーム
> 2026年度CBT対応 | ai-dev-orchestratorで自動開発

## セットアップ

```bash
npm install
cp .env.example .env.local  # Supabase・AnthropicのAPIキーを設定
# Supabase SQL Editor で supabase/migrations/001_initial.sql を実行
npm run dev   # → http://localhost:3000
```

## ページ構成

| URL | 内容 |
|-----|------|
| `/` | LP（プロンプトインジェクション体験Lab付き） |
| `/sc-module` | 支援士問題一覧 |
| `/aws-module` | AIF問題一覧 |
| `/common/exam` | CBT模擬試験エンジン |
| `/dashboard` | 学習ダッシュボード |

## Cursor / Claude Code への引き継ぎ

```
ai-memory/TASKS.md を開いて - [ ] のタスクを上から実装してください。
ARCHITECTURE.md のデータスキーマを必ず確認すること。
```

## AI共有メモリ（ai-memory/）

| ファイル | 内容 |
|---------|------|
| SPEC.md | プロダクト仕様（概要・機能・KPI） |
| ARCHITECTURE.md | DB設計・API設計・コンポーネント構成 |
| TASKS.md | 20タスク（TASK-001〜020） |
| PROGRESS.md | 進捗（5/20完了） |
| BUGS.md | バグトラッカー |
