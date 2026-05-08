# SECURITY

## 扱うデータ

- 例: メールアドレス
- 例: ユーザー作成コンテンツ
- 例: 決済状態

## リスク

- 他ユーザーのデータ閲覧
- API key 漏洩
- RLS 設定漏れ
- ログへの個人情報出力

## RLS

- 対象テーブル:
- policy:
- 未確認:

## 認証

- Auth provider:
- 保護が必要な画面:
- 保護が必要な API:

## API キー

- client に出してよい値:
- server のみ:
- Vercel に設定する値:

## ログ

- 出してよい情報:
- 出してはいけない情報:

## リリース前確認

- [ ] RLS が有効
- [ ] secret が client bundle に出ていない
- [ ] API route / Server Action に認可がある
- [ ] LLM に不要な個人情報を渡していない
- [ ] 決済 webhook の署名検証がある
