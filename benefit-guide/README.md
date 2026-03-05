# benefit-guide

傷病手当×失業保険 完全ロードマップ — SEO記事＋収益化LP

## ファイル構成

```
benefit-guide/
├── src/
│   ├── index.html      # LP（収益化フロント）
│   └── article.html    # SEOメイン記事（約4,500文字）
├── prompts/
│   └── claude-code-prompts.md  # Cursor/Claude Code投げ込み用プロンプト集
└── README.md
```

## 各ファイルの役割

| ファイル | 役割 | 収益化 |
|---------|------|--------|
| index.html | LP・メルマガ登録・アフィリエイトリンク | 直接収益 |
| article.html | SEO流入・信頼獲得・PDF誘導 | 間接収益 |

## 収益化の想定フロー

```
Google検索
  ↓ article.html（SEO流入）
  ↓ PDF・メルマガ登録CTA
  ↓ index.html（LP）
  ↓ アフィリエイトリンク（転職・FP・心療内科）
  ↓ 有料note / メール講座
```

## GitHub Pages で公開する方法

```powershell
# GitHubで新しいリポジトリを作成後
cd C:\Users\yuuve\Documents\benefit-guide-public
copy C:\Users\yuuve\CascadeProjects\benefit-guide\src\index.html .
copy C:\Users\yuuve\CascadeProjects\benefit-guide\src\article.html .
git init
git add .
git commit -m "🎉 initial publish"
git remote add origin https://github.com/yuuve/benefit-guide.git
git push -u origin main
# Settings → Pages → main branch → root
# → https://yuuve.github.io/benefit-guide/
```

## Claude Code プロンプトの使い方

`prompts/claude-code-prompts.md` の各プロンプトをそのまま
Cursor または Claude.ai のチャットに貼り付けるだけ。

- プロンプト①: SEOロング記事の生成・リライト
- プロンプト②: LPの改善（A/Bテスト・固定CTA）
- プロンプト③: PDF配布用チェックリスト
- プロンプト④: 7日間メール講座コンテンツ
- プロンプト⑤: SEO内部リンク設計

## 注意事項

本プロジェクトは公的制度の情報提供を目的としています。
不正受給を助長するコンテンツは一切含みません。
