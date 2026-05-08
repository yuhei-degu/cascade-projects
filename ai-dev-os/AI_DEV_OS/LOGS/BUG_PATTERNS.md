# BUG_PATTERNS

再発しやすいバグのパターンを記録します。

## 記入例

### 日付

2026-05-09

### 症状

例: ログイン済みユーザーが他ユーザーのデータを一覧で見られる。

### 原因

例: query に `user_id` 条件がなく、RLS policy も未設定だった。

### 修正

例: RLS を有効化し、select policy を `auth.uid() = user_id` にした。

### 再発防止

例: ユーザーデータ table 作成時は SECURITY.md に RLS 確認項目を追加する。
