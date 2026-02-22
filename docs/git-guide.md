# 📸 Git 操作ガイド — 過去に戻る方法

**「Gitはゲームのセーブデータ」** — コードの状態を何度でも保存・復元できる。

---

## 🔰 基本の流れ（毎回の作業）

```powershell
# 1. どのファイルが変わったか確認
git status

# 2. 変更を「ステージング」（セーブ予定に追加）
git add .              # 全ファイルを追加
git add index.html     # 特定ファイルだけ追加

# 3. コミット（セーブ実行）
git commit -m "💄 照準器の色を変更できるようにした"

# 4. 履歴を確認
git log --oneline
```

---

## ⏪ 過去の状態に戻す方法

### 方法①：コミット履歴を確認する
```powershell
git log --oneline
# 表示例:
# a3f2c1d 💄 照準器の色を変更
# 9b1e4f2 ✨ サイズ調整スライダーを追加
# 0ea4ec5 🎉 initial commit
```

### 方法②：特定ファイルだけ昔に戻す（最も安全）
```powershell
git checkout 9b1e4f2 -- src/index.html
git add .
git commit -m "⏪ index.htmlを一つ前の状態に戻した"
```

### 方法③：ブランチで安全に確認してから戻す
```powershell
git checkout -b rollback-test 9b1e4f2  # 試し戻しブランチ作成
# 確認後、元に戻すには
git checkout master
git branch -D rollback-test
```

### 方法④：完全に指定コミットに戻す（⚠️ 以降の変更が消える）
```powershell
git reset --hard 9b1e4f2
```

---

## 🌿 ブランチ（実験的な変更に使う）

```powershell
git checkout -b feature/新しい照準器タイプ   # 新機能用ブランチ作成
# ...作業...
git checkout master
git merge feature/新しい照準器タイプ         # masterに合流
```

---

## 📌 コミットメッセージ絵文字ルール

| 絵文字 | 意味 |
|--------|------|
| 🎉 | 最初のコミット |
| ✨ | 新機能追加 |
| 💄 | UIの見た目変更 |
| 🐛 | バグ修正 |
| 📝 | ドキュメント更新 |
| ♻️ | リファクタリング |
| ⏪ | 元に戻した |

---

## 🌐 GitHubに上げる手順（将来）

```powershell
git remote add origin https://github.com/yuuve/my-projects.git
git push -u origin master
# 以降は毎回: git push
```

---

## ⚡ よく使うコマンド一覧

| コマンド | 意味 |
|---------|------|
| `git status` | 変更ファイルを確認 |
| `git add .` | 全変更をステージング |
| `git commit -m "メッセージ"` | コミット（セーブ） |
| `git log --oneline` | 履歴一覧 |
| `git diff` | 変更の詳細表示 |
| `git checkout -b 名前` | 新ブランチ作成 |
