# 🌐 GitHub Pages 公開マニュアル

education-site を実際にネットに公開してリンクを友人に送る手順。

---

## 前提
- GitHubアカウント作成済み
- Git インストール済み

---

## Step 1: GitHubで新しいリポジトリを作る

1. https://github.com/new を開く
2. Repository name: `ai-dev-start`（好きな名前でOK）
3. Public にチェック（Privateだと公開できない）
4. 「Create repository」をクリック

---

## Step 2: 公開用フォルダを作ってGitHubに上げる

PowerShellで実行：

```powershell
# 公開用フォルダを作る
New-Item -ItemType Directory C:\Users\yuuve\Documents\ai-dev-start
cd C:\Users\yuuve\Documents\ai-dev-start

# index.html を教育サイトからコピー
Copy-Item "C:\Users\yuuve\CascadeProjects\education-site\src\index.html" .

# Gitで管理開始
git init
git add .
git commit -m "🎉 initial commit: AI入門サイト"

# GitHubと接続してアップロード
git remote add origin https://github.com/yuuve/ai-dev-start.git
git branch -M main
git push -u origin main
```

---

## Step 3: GitHub Pages を有効にする

1. GitHubのリポジトリページを開く
2. 上部タブ「Settings」をクリック
3. 左メニュー「Pages」をクリック
4. Source: **Deploy from a branch**
5. Branch: **main** / **/ (root)**
6. 「Save」をクリック

---

## Step 4: URLを確認して共有する

数分後に以下のURLでアクセスできる：

```
https://yuuve.github.io/ai-dev-start/
```

このURLを友人にLINEやメールで送るだけ！

---

## 更新方法（内容を変えた後）

```powershell
cd C:\Users\yuuve\Documents\ai-dev-start

# index.html を最新版で上書き
Copy-Item "C:\Users\yuuve\CascadeProjects\education-site\src\index.html" . -Force

git add .
git commit -m "📝 内容を更新"
git push
```

数分後に自動でサイトに反映される。
