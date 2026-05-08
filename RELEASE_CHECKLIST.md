# RELEASE_CHECKLIST

## Build / Quality

- [ ] build が通る
- [ ] lint が通る
- [ ] 型チェックが通る
- [ ] 主要テストが通る

## Env

- [ ] local / preview / production の env が分かれている
- [ ] secret が公開されていない
- [ ] `NEXT_PUBLIC_` の値が公開前提で問題ない

## DB / Supabase

- [ ] migration 適用順を確認した
- [ ] RLS が有効
- [ ] policy を select / insert / update / delete ごとに確認した
- [ ] backup / rollback 方針を確認した

## Stripe

- [ ] test / live mode が分離されている
- [ ] webhook secret が設定されている
- [ ] webhook 署名検証がある
- [ ] 二重処理対策がある

## 認証

- [ ] 未ログイン時の redirect が正しい
- [ ] 他ユーザーのデータにアクセスできない
- [ ] API / Server Action 側で認可している

## UI

- [ ] スマホ表示を確認した
- [ ] 空状態がある
- [ ] ローディング状態がある
- [ ] エラー表示がある

## Rollback

- [ ] 直前 deploy に戻す方法を確認した
- [ ] DB 変更が rollback 可能か確認した
- [ ] 外部サービス設定の戻し方を確認した
